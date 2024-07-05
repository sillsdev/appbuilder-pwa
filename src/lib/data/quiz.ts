import { openDB, type DBSchema } from 'idb';
import config from '$lib/data/config';

export interface QuizScore {
    date: number;
    score: number;
    collection: string;
    book: string;
}

interface Quiz extends DBSchema {
    quiz: {
        key: number;
        value: QuizScore;
        indexes: {
            'collection, book': string;
            date: number;
        };
    }
}

let quizDB = null;
async function openQuiz() {
    if (!quizDB) {
        quizDB = await openDB<Quiz>('quiz', 1, {
            upgrade(db) {
                const quizStore = db.createObjectStore('quiz', {
                    keyPath: 'date'
                });
                quizStore.createIndex('collection, book', [
                    'collection',
                    'book'
                ]);

                quizStore.createIndex('date', 'date');
            }
        });
    }
    return quizDB;
}

export async function addQuiz(item: {
    collection: string;
    book: string;
}) {
    const quiz = await openQuiz();
    const date = new Date()[Symbol.toPrimitive]('number');
    const bookIndex = config.bookCollections
        .find((x) => x.id === item.collection)
        .books.findIndex((x) => x.id === item.book)
    const nextItem = { ...item, date: date, bookIndex: bookIndex };
    await quiz.add('quiz', nextItem);
}

export async function getQuiz() {
    const quiz = await openQuiz();
    return await quiz.getAllFromIndex('quiz', 'date');
}

export async function findQuiz(item: {
    collection: string;
    book: string;
}) {
    const notes = await openQuiz();
    const tx = notes.transaction('quiz', 'readonly');
    const index = tx.store.index('collection, book');
    const result = await index.getAll([item.collection, item.book]);
    await tx.done;
    return result;
}

export async function getQuizScore(item: {
    collection: string;
    book: string;
}): Promise<number | null> {
    const results = await findQuiz(item);
    if (results.length > 0) {
        return results[0].score;
    }
    else {
        return null;
    }
}