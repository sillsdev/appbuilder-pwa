// eslint-disable-next-line @typescript-eslint/triple-slash-reference
///<reference path="./proskomma.d.ts"/>

import type { ConfigData, BookData } from '$config';
import type { ConfigTaskOutput } from './convertConfig';
import { TaskOutput, Task, Promisable } from './Task';
import * as fs from 'fs';
import path, { basename, extname } from 'path';
import { SABProskomma } from '../src/lib/sab-proskomma';
import { queries, postQueries, freeze } from '../sab-proskomma-tools';
import { convertMarkdownsToMilestones } from './convertMarkdown';
import { verifyGlossaryEntries } from './verifyGlossaryEntries';
import { hasAudioExtension, hasImageExtension } from './stringUtils';

/**
 * Loops through bookCollections property of configData.
 * Each collection and all associated books are imported into a SABProskomma instance.
 * Each SABProskomma instance is then compressed using proskomma-freeze and written
 * to an associated pkf (ProsKomma Freeze) file to be thawed later in src/routes/data/proskomma.js
 */

function replaceVideoTags(text: string, _bcId: string, _bookId: string): string {
    return text.replace(/\\video (.*)/g, '\\zvideo-s |id="$1"\\*\\zvideo-e\\*');
}

// This is the start of supporting story books, but it still fails if there is no chapter.
function replacePageTags(text: string, _bcId: string, _bookId: string): string {
    return text.replace(/\\page (.*)/g, '\\zpage-s |id="$1"\\*\\zpage-e\\*');
}
function loadGlossary(collection: any, dataDir: string): string[] {
    const glossary: string[] = [];
    for (const book of collection.books) {
        if (book.type && book.type === 'glossary') {
            let glossaryBook = path.join(dataDir, 'books', collection.id, book.file);
            if (!fs.existsSync(glossaryBook)) {
                const extension = extname(book.file);
                const filename = basename(book.file, extension);
                glossaryBook = path.join(dataDir, 'books', collection.id, filename + '-000.sfm');
                //process.stdout.write('Replacing filename: ' + glossaryBook);
            }
            const glossaryContent = fs.readFileSync(glossaryBook, 'utf8');
            // Regular expression pattern
            const regex = /\\k\s*([^\\]+)\s*\\k\*/g;
            let match;
            // Loop through all matches
            while ((match = regex.exec(glossaryContent)) !== null) {
                // match[1] contains the text between \k and \k*
                glossary.push(match[1]);
            }
        }
    }
    return glossary;
}
function removeStrongNumberReferences(text: string, _bcId: string, _bookId: string): string {
    //remove strong number references
    // \v 1  \w In|strong="H0430"\w* \w the|strong="H0853"\w* \w beginning|strong="H7225"\w*, (Gen 1:1 WEBBE)
    // \v 4  \wj  \+w Blessed|strong="G3107"\+w* \+w are|strong="G3107"\+w* \+w those|strong="G3588"\+w* \+w who|strong="G3588"\+w* \+w mourn|strong="G3996"\+w*,\wj*  (Matt 5:4 WEBBE)
    return text.replace(/(\\\+?w) ([^|]*)\|strong="[^"]*"\1\*/g, '$2');
}

function removeMissingVerses(text: string, _bcId: string, _bookId: string): string {
    // Regular expression to match the pattern:
    // \v (any number of digits) followed by any number of such patterns
    const regex = /(\\v\s\d+\s*)+/g;

    // Replace matches with the last occurrence
    return text.replace(regex, (match) => {
        // Split the matched string by \v and filter out empty parts
        const parts = match
            .trim()
            .split(/\\v\s*/)
            .filter(Boolean);

        // If there are multiple parts, return only the last one with \v prepended
        if (parts.length > 1) {
            return `\\v ${parts.pop()} `;
        }

        // If only one part or none, return the match unchanged
        return match;
    });
}

function removeMissingFigures(text: string, _bcId: string, _bookId: string): string {
    // Regular expression to match \fig markers
    const figRegex = /\\fig\s(.*?)\\fig\*/g;

    // Replace each \fig marker with the appropriate action
    return text.replace(figRegex, (match, figContent) => {
        // Split the content of the \fig marker by pipe (|)
        const parts = figContent.split('|');

        // Extract the image source from the first part
        let imageSource;
        if (parts.length < 2) {
            // \fig filename.jpg\fig*
            imageSource = figContent;
        } else if (parts[1].includes('src="')) {
            // \fig Caption|src="filename.jpg"\fig*
            imageSource = parts[1].match(/src="([^"]+)"/)[1];
        } else {
            // \fig Caption|filename.jpg\fig*
            imageSource = parts[1];
        }

        // Check if the image source is missing
        if (isImageMissing(imageSource)) {
            // Image is missing, return an empty string to strip the \fig marker
            return '';
        } else {
            // Image is present, return the original \fig marker
            return match;
        }
    });
}

// Function to check if an image is missing
function isImageMissing(imageSource: string): boolean {
    // Your logic to determine if the image is missing
    // For example, you can use AJAX request to check if the image exists
    // Here, I'm assuming a simple check by presence of src attribute
    return !fs.existsSync(path.join('data', 'illustrations', imageSource));
}

const filterFunctions: ((text: string, bcId: string, bookId: string) => string)[] = [
    removeStrongNumberReferences,
    replaceVideoTags,
    replacePageTags,
    convertMarkdownsToMilestones,
    removeMissingFigures
];

function applyFilters(text: string, bcId: string, bookId: string): string {
    let filteredText = text;
    for (const filterFn of filterFunctions) {
        filteredText = filterFn(filteredText, bcId, bookId);
    }
    return filteredText;
}

//make final transformations to catalog entry before writing to file
// 1. compress the chapter/verse map, if it exists
// 2. add quizzes to entry, if defined for docset
function transformCatalogEntry(entry: any, quizzes: any): any {
    const ds = postQueries.parseChapterVerseMapInDocSets({
        docSets: [entry.data.docSets[0]]
    })[0];
    ds.quizzes = quizzes[ds.id];
    return ds;
}

type ConvertBookContext = {
    dataDir: string;
    configData: ConfigData;
    verbose: number;
    lang: string;
    docSet: string;
    bcId: string;
};

const unsupportedBookTypes = ['story', 'songs', 'audio-only', 'bloom-player', 'quiz', 'undefined'];
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
    /**quizzes by book collection*/
    const quizzes: any = {};
    /**array of files to be written*/
    const files: any[] = [];

    // copy book-related folder resources
    ['quiz', 'songs'].forEach((folder) => {
        const folderSrcDir = path.join(dataDir, folder);
        const folderDstDir = path.join('static', folder);
        if (fs.existsSync(folderSrcDir)) {
            fs.cpSync(folderSrcDir, folderDstDir, { recursive: true });
        } else {
            if (fs.existsSync(folderDstDir)) {
                fs.rmSync(folderDstDir, { recursive: true, force: true });
            }
        }
    });

    const usedLangs = new Set<string>();
    //loop through collections
    for (const collection of collections!) {
        const pk = new SABProskomma();
        const context: ConvertBookContext = {
            dataDir,
            configData: configData.data,
            verbose,
            lang: collection.languageCode,
            docSet: collection.languageCode + '_' + collection.id,
            bcId: collection.id
        };
        let bcGlossary: string[] = [];
        if (verbose && usedLangs.has(context.lang)) {
            console.warn(
                `Language ${context.lang} already used in another collection. Proceeding anyway.`
            );
        }
        usedLangs.add(context.lang);
        process.stdout.write(`  ${context.bcId}:`);
        if (verbose)
            console.log(
                'converting collection: ' + collection.id + ' to docSet: ' + context.docSet
            );
        /**array of promises of Proskomma mutations*/
        const inputFiles = await fs.promises.readdir(
            path.join(context.dataDir, 'books', context.bcId)
        );
        const docs: Promise<void>[] = [];
        //loop through books in collection
        const ignoredBooks = [];
        // If the collection has a glossary, load it
        if (configData.data.traits['has-glossary']) {
            bcGlossary = loadGlossary(collection, dataDir);
        }
        //add empty array of quizzes for book collection
        quizzes[context.bcId] = [];
        for (const book of collection.books) {
            let bookConverted = false;
            switch (book.type) {
                case 'story':
                case 'songs':
                case 'audio-only':
                case 'bloom-player':
                case 'undefined':
                    break;
                case 'quiz':
                    bookConverted = true;
                    quizzes[context.bcId].push({ id: book.id, name: book.name });
                    files.push({
                        path: path.join(
                            'static',
                            'collections',
                            context.bcId,
                            'quizzes',
                            book.id + '.json'
                        ),
                        content: JSON.stringify(convertQuizBook(context, book), null, 2)
                    });
                    process.stdout.write(` ${book.id}`);
                    break;
                default:
                    bookConverted = true;
                    convertScriptureBook(pk, context, book, bcGlossary, docs, inputFiles);
                    break;
            }
            if (!bookConverted) {
                // report which books were ignored at the end
                ignoredBooks.push(book.id);
                continue;
            }
        }
        if (verbose) console.time('convert ' + collection.id);
        //wait for documents to finish being added to Proskomma
        await Promise.all(docs);
        if (ignoredBooks.length > 0) {
            process.stdout.write(` -- Not Supported: ${ignoredBooks.join(' ')}`);
        }
        process.stdout.write('\n');
        if (verbose) console.timeEnd('convert ' + collection.id);
        //start freezing process and map promise to docSet name
        const frozen = freeze(pk);
        freezer.set(context.docSet, frozen[context.docSet]);
        //start catalog generation process
        catalogEntries.push(pk.gqlQuery(queries.catalogQuery({ cv: true })));

        //check if folder exists for collection
        const collPath = path.join('static', 'collections', context.bcId);
        if (!fs.existsSync(collPath)) {
            if (verbose) console.log('creating: ' + collPath);
            fs.mkdirSync(collPath, { recursive: true });
        }
        //add quizzes path if necessary
        if (quizzes[context.bcId].length > 0) {
            const qPath = path.join('static', 'collections', context.bcId, 'quizzes');
            if (!fs.existsSync(qPath)) {
                if (verbose) console.log('creating: ' + qPath);
                fs.mkdirSync(qPath, { recursive: true });
            }
        }
    }
    //write catalog entries
    const entries = await Promise.all(catalogEntries);
    const catalogPath = path.join('static', 'collections', 'catalog');
    if (!fs.existsSync(catalogPath)) {
        if (verbose) console.log('creating: ' + catalogPath);
        fs.mkdirSync(catalogPath, { recursive: true });
    }
    entries.forEach((entry) => {
        fs.writeFileSync(
            path.join(catalogPath, entry.data.docSets[0].id + '.json'),
            JSON.stringify(transformCatalogEntry(entry, quizzes))
        );
    });
    if (verbose) console.time('freeze');
    //write frozen archives for import
    //const vals = await Promise.all(freezer.values());
    //write frozen archives

    //push files to be written to files array
    freezer.forEach((value, key) =>
        files.push({
            path: path.join('static', 'collections', key + '.pkf'),
            content: value
        })
    );

    //write index file
    fs.writeFileSync(
        path.join('static', 'collections', 'index.json'),
        `[${(() => {
            //export collection names as array
            let s = '';
            let i = 0;
            for (const k of freezer.keys()) {
                s += '"' + k + '"' + (i + 1 < freezer.size ? ', ' : '');
                i++;
            }
            return s;
        })()}]`
    );
    if (verbose) console.timeEnd('freeze');
    return {
        files,
        taskName: 'ConvertBooks'
    };
}

export type QuizExplanation = {
    text?: string;
    audio?: string;
};

export type QuizAnswer = {
    //\aw or \ar
    correct: boolean;
    text?: string;
    image?: string;
    audio?: string;
    explanation?: QuizExplanation;
};

export type QuizQuestion = {
    //\qu
    text: string;
    image?: string;
    audio?: string;
    columns?: number; //\ac
    explanation?: QuizExplanation;
    answers: QuizAnswer[];
};

export type Quiz = {
    id: string; //\id
    name?: string; //\qn
    shortName?: string; //\qs
    rightAnswerAudio?: string[]; //\ra
    wrongAnswerAudio?: string[]; //\wa
    questions: QuizQuestion[];
    scoreMessageBefore?: string; //\sb
    scoreMessageAfter?: string; //\sa
    commentary?: {
        //\sc
        rangeMin: number;
        rangeMax?: number;
        message: string;
    }[];
    passScore?: number; //\pm
};

function convertQuizBook(context: ConvertBookContext, book: BookData): Quiz {
    if (context.verbose) {
        console.log('Converting QuizBook:', book.id);
    }
    const quizSFM = fs.readFileSync(
        path.join(context.dataDir, 'books', context.bcId, book.file),
        'utf8'
    );
    const quiz: Quiz = {
        id: quizSFM.match(/\\id ([^\\\r\n]+)/i)![1],
        name: quizSFM.match(/\\qn ([^\\\r\n]+)/i)?.at(1),
        shortName: quizSFM.match(/\\qs ([^\\\r\n]+)/i)?.at(1),
        rightAnswerAudio: quizSFM.match(/\\ra ([^\\\r\n]+)/gi)?.map((m) => {
            return m.match(/\\ra ([^\\\r\n]+)/i)![1];
        }),
        wrongAnswerAudio: quizSFM.match(/\\wa ([^\\\r\n]+)/gi)?.map((m) => {
            return m.match(/\\wa ([^\\\r\n]+)/i)![1];
        }),
        questions: [], //questions handled below
        scoreMessageBefore: quizSFM.match(/\\sb ([^\\\r\n]+)/i)?.at(1),
        scoreMessageAfter: quizSFM.match(/\\sa ([^\\\r\n]+)/i)?.at(1),
        commentary: quizSFM.match(/\\sc ([0-9]+)( *- *[0-9]+)? ([^\\\r\n]+)/gi)?.map((m) => {
            const parsed = m.match(/([0-9]+)( *- *[0-9]+)? ([^\\\r\n]+)/i)!;
            return {
                rangeMin: parseInt(parsed[1]),
                rangeMax: parsed[2] ? parseInt(parsed[2].replace('-', '')) : parseInt(parsed[1]),
                message: parsed[3]
            };
        }),
        passScore: quizSFM.match(/\\pm ([0-9]+)/i)?.at(1)
            ? parseInt(quizSFM.match(/\\pm ([0-9]+)/i)![1])
            : undefined
    };
    let aCount = 0;
    let question: QuizQuestion = { text: '', answers: [] };
    let answer: QuizAnswer = { correct: false };
    quizSFM.match(/\\(qu|aw|ar|ae|ac) ([^\\\r\n]+)/gi)?.forEach((m) => {
        const parsed = m.match(/\\(qu|aw|ar|ae|ac) ([^\\\r\n]+)/i)!;
        switch (parsed[1]) {
            case 'qu':
                if (aCount > 0) {
                    quiz.questions.push(question);
                    question = { text: '', answers: [] };
                    aCount = 0;
                }
                if (hasImageExtension(parsed[2])) {
                    question.image = parsed[2];
                } else if (hasAudioExtension(parsed[2])) {
                    question.audio = parsed[2];
                } else {
                    question.text = parsed[2];
                }
                break;
            case 'ar':
                if (!hasAudioExtension(parsed[2])) {
                    answer.correct = true;
                }
            /**es-lint-ignore-no-fallthrough */
            case 'aw':
                //answer can have either an image, or text with optional audio
                if (hasImageExtension(parsed[2])) {
                    answer.image = parsed[2];
                    question.answers.push(answer);
                    answer = { correct: false };
                    aCount++;
                } else if (hasAudioExtension(parsed[2])) {
                    question.answers[aCount - 1].audio = parsed[2];
                } else {
                    answer.text = parsed[2];
                    question.answers.push(answer);
                    answer = { correct: false };
                    aCount++;
                }
                break;
            case 'ac':
                question.columns = parseInt(parsed[2]);
                break;
            case 'ae':
                {
                    const isAudio = hasAudioExtension(parsed[2]);
                    const hasExplanationsInAnswers = isAudio
                        ? question.answers.some((answer) => answer.explanation?.audio !== undefined)
                        : question.answers.some((answer) => answer.explanation?.text != undefined);

                    if (aCount == 0) {
                        // Question-level explanation
                        question.explanation = updateExplanation(question.explanation, parsed[2]);
                    } else {
                        if (aCount == 1 || hasExplanationsInAnswers) {
                            // Answer-specific explanation
                            question.answers[aCount - 1].explanation = updateExplanation(
                                question.answers[aCount - 1].explanation,
                                parsed[2]
                            );
                        } else {
                            // Question-level explanation (same for all answers)
                            question.explanation = updateExplanation(
                                question.explanation,
                                parsed[2]
                            );
                        }
                    }
                }
                break;
        }
    });
    quiz.questions.push(question);
    return quiz;
}

function updateExplanation(
    explanation: QuizExplanation | undefined,
    text: string
): QuizExplanation {
    if (!explanation) {
        explanation = {};
    }
    if (hasAudioExtension(text)) {
        explanation.audio = text;
    } else {
        explanation.text = text;
    }
    return explanation;
}

function convertScriptureBook(
    pk: SABProskomma,
    context: ConvertBookContext,
    book: BookData,
    bcGlossary: string[],
    docs: Promise<void>[],
    files: string[]
) {
    function processBookContent(resolve: () => void, err: any, content: string) {
        //process.stdout.write(`processBookContent: bookId:${book.id}, error:${err}\n`);
        if (err) throw err;
        content = applyFilters(content, context.bcId, book.id);
        if (context.configData.traits['has-glossary']) {
            content = verifyGlossaryEntries(content, bcGlossary);
        }
        if (context.configData.mainFeatures['hide-empty-verses'] === true) {
            content = removeMissingVerses(content, context.bcId, book.id);
        }
        //query Proskomma with a mutation to add a document
        //more efficient than original pk.addDocument call
        //as it can be run asynchronously
        //process.stdout.write(`Adding: ${book.file}\n${content}\n`);
        pk.gqlQuery(
            `mutation {
                addDocument(
                    selectors: [
                        {key: "lang", value: "${context.lang}"}, 
                        {key: "abbr", value: "${context.bcId}"}
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
                if (context.verbose)
                    console.log(
                        (r.data?.addDocument ? '' : 'failed: ') +
                            context.docSet +
                            ' <- ' +
                            book.name +
                            ': ' +
                            path.join(context.dataDir, 'books', context.bcId, book.file)
                    );
                //if the document is not added successfully, the response returned by Proskomma includes an error message
                if (!r.data?.addDocument) {
                    const bookPath = path.join(context.dataDir, 'books', context.bcId, book.file);
                    throw Error(
                        `Adding document, likely not USFM? : ${bookPath}\n${JSON.stringify(r)}`
                    );
                } else {
                    process.stdout.write(` ${book.id}`);
                }
                resolve();
            }
        );
    }
    //push new Proskomma mutation to docs array
    docs.push(
        new Promise<void>((resolve) => {
            const bookPath = path.join(context.dataDir, 'books', context.bcId, book.file);
            //(`Checking for book: ${bookPath}\n`);
            if (fs.existsSync(bookPath)) {
                //read the single usfm file (pre-12.0)
                fs.readFile(bookPath, 'utf8', (err, content) =>
                    processBookContent(resolve, err, content)
                );
            } else {
                //read multiple files that have been split up (so that portions parameter is processed)
                const extension = extname(bookPath);
                const baseFilename = basename(bookPath, extension);
                const regex = new RegExp(`${baseFilename}-\\d{3}\\.sfm`);

                //process.stdout.write(`Checking multiple files: ${baseFilename}-XXX.sfm\n`);
                const matchingFiles = files.filter((file) => {
                    return regex.test(file);
                });

                matchingFiles.sort();
                //process.stdout.write(`Found Files\n${matchingFiles.join('\n')}\n`);

                const fileContents: string[] = [];
                matchingFiles.map((file) => {
                    const filePath = path.join(context.dataDir, 'books', context.bcId, file);
                    fileContents.push(fs.readFileSync(filePath, 'utf-8'));
                });

                processBookContent(resolve, null, fileContents.join(''));
            }
        })
    );
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
    public triggerFiles: string[] = ['books', 'quiz', 'songs', 'appdef.xml'];
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
