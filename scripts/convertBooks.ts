// eslint-disable-next-line @typescript-eslint/triple-slash-reference
///<reference path="./proskomma.d.ts"/>

import { ConfigTaskOutput } from './convertConfig';
import { TaskOutput, Task, Promisable } from './Task';
import { readFile, writeFile, writeFileSync, mkdirSync, existsSync } from 'fs';
import path from 'path';
import { SABProskomma } from '../sab-proskomma';
import { queries, postQueries, freeze } from '../sab-proskomma-tools';

/**
 * Loops through bookCollections property of configData.
 * Each collection and all associated books are imported into a SABProskomma instance.
 * Each SABProskomma instance is then compressed using proskomma-freeze and written
 * to an associated pkf (ProsKomma Freeze) file to be thawed later in src/routes/data/proskomma.js
 */

export async function convertBooks(
    dataDir: string,
    configData: ConfigTaskOutput,
    verbose: number
): Promise<BooksTaskOutput> {
    /**book collections from config*/
    const collections = configData.data.bookCollections;
    /**map of docSets and frozen archives*/
    const freezer = new Map<string, any>();
    /**array of catalog query promises*/
    const catalogEntries: Promise<any>[] = [];

    const usedLangs = new Set<string>();
    //loop through collections
    for (const collection of collections!) {
        const pk = new SABProskomma();
        const lang = collection.languageCode;
        if (verbose && usedLangs.has(lang)) {
            console.warn(`Language ${lang} already used in another collection. Proceeding anyway.`);
        }
        usedLangs.add(lang);
        const bcid = collection.id;
        const docSet = lang + '_' + bcid;
        if (verbose)
            console.log('converting collection: ' + collection.id + ' to docSet: ' + docSet);
        /**array of promises of Proskomma mutations*/
        const docs: Promise<void>[] = [];
        //loop through books in collection
        for (const book of collection.books) {
            //push new Proskomma mutation to docs array
            docs.push(
                new Promise<void>((resolve) => {
                    //read usfm file
                    readFile(
                        path.join(dataDir, 'books', collection.id, book.file),
                        'utf8',
                        (err, content) => {
                            if (err) throw err;
                            //query Proskomma with a mutation to add a document
                            //more efficient than original pk.addDocument call
                            //as it can be run asynchronously
                            pk.gqlQuery(
                                `
                                mutation {
                                    addDocument(
                                        selectors: [
                                            {key: "lang", value: "${lang}"}, 
                                            {key: "abbr", value: "${bcid}"}
                                        ], 
                                        contentType: "${book.file.split('.').pop()}", 
                                        content: """${content}""",
                                        tags: [
                                            "sections:${book.section}",
                                            "testament:${book.testament}"
                                        ]
                                    )
                                }`,
                                (r: any) => {
                                    //log if document added successfully
                                    if (verbose)
                                        console.log(
                                            (r.data?.addDocument ? '' : 'failed: ') +
                                                docSet +
                                                ' <- ' +
                                                book.name +
                                                ': ' +
                                                path.join(
                                                    dataDir,
                                                    'books',
                                                    collection.id,
                                                    book.file
                                                )
                                        );
                                    //if the document is not added successfully, the response returned by Proskomma includes an error message
                                    if (!r.data?.addDocument) {
                                        console.log(JSON.stringify(r));
                                    }
                                    resolve();
                                }
                            );
                        }
                    );
                })
            );
        }
        if (verbose) console.time('convert ' + collection.id);
        //wait for documents to finish being added to Proskomma
        await Promise.all(docs);
        if (verbose) console.timeEnd('convert ' + collection.id);
        //start freezing process and map promise to docSet name
        const frozen = freeze(pk);
        freezer.set(docSet, frozen[docSet]);
        //start catalog generation process
        catalogEntries.push(pk.gqlQuery(queries.catalogQuery({ cv: true })));
    }
    //write catalog entries
    const entries = await Promise.all(catalogEntries);
    writeFileSync(
        path.join('src', 'lib', 'data', 'catalog.js'),
        `export const catalog = ${JSON.stringify(
            entries.map(
                (entry) =>
                    postQueries.parseChapterVerseMapInDocSets({
                        docSets: entry.data.docSets
                    })[0]
            )
        )};`
    );
    if (verbose) console.time('freeze');
    if (!existsSync(path.join('static', 'collections'))) {
        if (verbose) console.log('creating: ' + path.join('static', 'collections'));
        mkdirSync(path.join('static', 'collections'));
    }
    //write frozen archives for import
    //const vals = await Promise.all(freezer.values());
    //write frozen archives
    const files: any[] = [];

    //push files to be written to files array
    freezer.forEach((value, key) =>
        files.push({
            path: path.join('static', 'collections', key + '.pkf'),
            content: value
        })
    );

    //write index file
    writeFileSync(
        path.join('static', 'collections', 'index.js'),
        `export const collections = [${(() => {
            //export collection names as array
            let s = '';
            let i = 0;
            for (const k of freezer.keys()) {
                s += "'" + k + "'" + (i + 1 < freezer.size ? ', ' : '');
                i++;
            }
            return s;
        })()}];`
    );
    if (verbose) console.timeEnd('freeze');
    return {
        files,
        taskName: 'ConvertBooks'
    };
}

export interface BooksTaskOutput extends TaskOutput {
    taskName: 'ConvertBooks';
}
/**
 * Internally calls convertBooks, which
 * loops through bookCollections property of configData.
 * Each collection and all associated books are imported into a SABProskomma instance.
 * Each SABProskomma instance is then compressed using proskomma-freeze and written
 * to an associated pkf (ProsKomma Freeze) file to be thawed later in src/routes/data/proskomma.js
 */
export class ConvertBooks extends Task {
    public triggerFiles: string[] = ['books', 'appdef.xml'];
    public static lastBookCollections: ConfigTaskOutput['data']['bookCollections'];
    constructor(dataDir: string) {
        super(dataDir);
    }
    public run(
        verbose: number,
        outputs: Map<string, TaskOutput>,
        modifiedPaths: string[]
    ): Promisable<BooksTaskOutput> {
        const config = outputs.get('ConvertConfig') as ConfigTaskOutput;
        // runs step only if necessary, as the step is fairly expensive
        if (
            !modifiedPaths.some((p) => p.startsWith('books')) &&
            deepCompareObjects(
                ConvertBooks.lastBookCollections,
                config.data.bookCollections,
                new Set(['id', 'books', 'languageCode'])
            )
        ) {
            return {
                taskName: 'ConvertBooks',
                files: []
            };
        }

        const ret = convertBooks(this.dataDir, config, verbose);
        ConvertBooks.lastBookCollections = config.data.bookCollections;
        return ret;
    }
}
/**
 * recursively deep-compares two objects based on properties passed in include.
 */
function deepCompareObjects(obj1: any, obj2: any, include: Set<string> = new Set()): boolean {
    if (typeof obj1 !== typeof obj2) return false;
    if (typeof obj1 === 'object') {
        if (Array.isArray(obj1)) {
            if (obj1.length !== obj2.length) return false;
            for (let i = 0; i < obj1.length; i++) {
                if (!deepCompareObjects(obj1[i], obj2[i])) return false;
            }
        } else {
            for (const k in obj1) {
                if (include.has(k)) {
                    if (!deepCompareObjects(obj1[k], obj2[k])) return false;
                }
            }
        }
    } else {
        return obj1 === obj2;
    }
    return true;
}
