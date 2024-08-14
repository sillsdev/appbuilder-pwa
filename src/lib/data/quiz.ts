import { openDB, type DBSchema } from 'idb';
import config from '$lib/data/config';

export interface QuizScore {
    date: number;
    score: number;
    passScore: number;
    collection: string;
    book: string;
    pass: boolean;
    bookIndex: number;
}

interface Quiz extends DBSchema {
    quiz: {
        key: number;
        value: QuizScore;
        indexes: {
            'collection, book': string;
            date: number;
        };
    };
}

let quizDB = null;
async function openQuiz() {
    if (!quizDB) {
        quizDB = await openDB<Quiz>('quiz', 1, {
            upgrade(db) {
                const quizStore = db.createObjectStore('quiz', {
                    keyPath: 'date'
                });
                quizStore.createIndex('collection, book', ['collection', 'book']);

                quizStore.createIndex('date', 'date');
            }
        });
    }
    return quizDB;
}

export async function addQuiz(item: {
    collection: string;
    book: string;
    score: number;
    passScore: number;
    pass: boolean;
}) {
    try {
        const quiz = await openQuiz();
        if (!quiz) {
            console.error('Failed to open quiz database');
            return;
        }
        const date = new Date()[Symbol.toPrimitive]('number');
        const bookCollection = config.bookCollections.find((x) => x.id === item.collection);
        const bookIndex = bookCollection.books.findIndex((x) => x.id === item.book);

        const nextItem = {
            ...item,
            date: date,
            bookIndex: bookIndex
        };
        await quiz.add('quiz', nextItem);
    } catch (error) {
        console.error('Error adding quiz result:', error);
    }
}

export async function getQuiz() {
    const quiz = await openQuiz();
    return await quiz.getAllFromIndex('quiz', 'date');
}

export async function findQuiz(item: { collection: string; book: string }) {
    const quiz = await openQuiz();
    const tx = quiz.transaction('quiz', 'readonly');
    const index = tx.store.index('collection, book');
    const result = await index.getAll([item.collection, item.book]);
    await tx.done;
    return result;
}

export async function checkQuizAccess(quizId) {
    const quiz = await openQuiz();
    const result = await quiz.getAllFromIndex('quiz', 'collection, book');
    return result.some((item) => item.book === quizId && item.pass);
}
