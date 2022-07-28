// eslint-disable-next-line @typescript-eslint/triple-slash-reference
///<reference path="./proskomma.d.ts"/>

import { ConfigTaskOutput } from './convertConfig';
import { TaskOutput, Task, Promisable } from './Task';
import { readFile, readFileSync, writeFile, writeFileSync } from 'fs';
import path from 'path';
import { SABProskomma } from '../sab-proskomma';
import { freeze } from 'proskomma-freeze';
import { queries, postQueries } from 'proskomma-tools';

export async function convertBooks(
    dataDir: string,
    configData: ConfigTaskOutput
): Promise<BooksTaskOutput> {
    /**book collections from config*/
    const collections = configData.data.bookCollections;
    /**map of docSets and promised frozen archives*/
    const freezer = new Map<string, Promise<string>>();
    /**array of catalog query promises*/
    const catalogEntries: Promise<any>[] = [];

    const usedLangs = new Set<string>();
    //loop through collections
    for (const collection of collections!) {
        const pk = new SABProskomma();
        const lang = collection.languageCode;
        if (usedLangs.has(lang)) {
            console.warn(`Language ${lang} already used in another collection. Proceeding anyway.`);
        }
        usedLangs.add(lang);
        const abbr = collection.collectionAbbreviation;
        const docSet = lang + '_' + abbr;
        console.log('converting collection: '+collection.id+' to docSet: ' + docSet);
        /**array of promises of Proskomma mutations*/
        const docs: Promise<void>[] = [];
        //loop through books in collection
        for (const book of collection.books) {
            docs.push(
                new Promise<void>((resolve) => {
                    //read usfm file
                    readFile(
                        path.join(dataDir, 'books', collection.id, book.file),
                        'utf8',
                        (err, content) => {
                            if (err) throw err;
                            //push promise to docs
                            docs.push(
                                pk.gqlQuery(
                                    `
                        mutation {
                            addDocument(
                                selectors: [
                                    {key: "lang", value: "${lang}"}, 
                                    {key: "abbr", value: "${abbr}"}
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
                                        if (!r.data?.addDocument) {
                                            console.log(JSON.stringify(r));
                                        }
                                        resolve();
                                    }
                                )
                            );
                        }
                    );
                })
            );
        }
        console.time('convertBooks');
        //wait for documents to finish being added
        await Promise.all(docs);
        console.timeEnd('convertBooks');
        //start freezing process
        freezer.set(docSet.replace('- ', '_'), freeze(pk));
        //start catalog generation process
        catalogEntries.push(pk.gqlQuery(queries.catalogQuery({ cv: true })));
    }
    //write catalog
    const entries = await Promise.all(catalogEntries);

    writeFile(
        path.join('src', 'lib', 'data', 'catalog.js'),
        `export const catalog = ${JSON.stringify(
            entries.map(
                (entry) =>
                    postQueries.parseChapterVerseMapInDocSets({
                        docSets: entry.data.docSets
                    })[0]
            )
        )};`,
        () => null
    );
    console.time('freeze');
    //write frozen archives for import
    const vals = await Promise.all(freezer.values());
    //write frozen archives
    const files = [];
    let i = 0;
    for (const k of freezer.keys()) {
        files.push({
            path: path.join('src', 'lib', 'data', 'book-collections', k + '.js'),
            content: `const ${k} = '${vals[i]}';\nexport { ${k} };`
        });
        // writeFileSync(
        //     path.join('src', 'lib', 'data', 'book-collections', k + '.js'),
        //     `const ${k} = '${vals[i]}';\nexport { ${k} };`
        // );
        i++;
    }
    console.log('writing index');
    //write index file
    writeFileSync(
        path.join('src', 'lib', 'data', 'book-collections', 'index.js'),
        `${(() => {
            let s = '';
            for (const k of freezer.keys()) {
                console.log('collection: '+k)
                //import collection
                s += 'import { ' + k + ' } from ' + "'./" + k + "';\n";
            }
            return s;
        })()}\nexport const collections = [${(() => {
            //export collections as array
            let s = '';
            let i = 0;
            for (const k of freezer.keys()) {
                console.log('const: '+k)
                s += k + (i + 1 < freezer.size ? ', ' : '');
                i++;
            }
            return s;
        })()}];`
    );
    console.log('after index');
    console.timeEnd('freeze');
    return {
        files,
        taskName: 'ConvertBooks'
    };
}
export interface BooksTaskOutput extends TaskOutput {
    taskName: 'ConvertBooks';
}
export class ConvertBooks extends Task {
    public triggerFiles: string[] = ['books', 'appdef.xml'];
    public static lastBookCollections: ConfigTaskOutput['data']['bookCollections'];
    constructor(dataDir: string) {
        super(dataDir);
    }
    public run(
        outputs: Map<string, TaskOutput>,
        modifiedPaths: string[]
    ): Promisable<BooksTaskOutput> {
        // TODO: Once books are exported, convert them here
        // Currently does nothing
        const config = outputs.get('ConvertConfig') as ConfigTaskOutput;
        if (
            !modifiedPaths.some((p) => p.startsWith('books')) &&
            deepCompareObjects(
                ConvertBooks.lastBookCollections,
                config.data.bookCollections,
                new Set(['id', 'books', 'collectionAbbreviation', 'languageCode'])
            )
        ) {
            return {
                taskName: 'ConvertBooks',
                files: []
            };
        }

        const ret = convertBooks(this.dataDir, config);
        ConvertBooks.lastBookCollections = config.data.bookCollections;
        return ret;
    }
}
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
