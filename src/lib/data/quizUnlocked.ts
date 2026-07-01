import { scriptureConfig } from '$assets/config';
import { openDB, type DBSchema } from 'idb';

export interface QuizSpecification {
    collection: string;
    book: string;
}

interface QuizUnlocked extends DBSchema {
    quizUnlocked: {
        key: [string, string];
        value: QuizSpecification;
        indexes: {
            'collection, book': [string, string];
        };
    };
}

let quizDB: Awaited<ReturnType<typeof openDB<QuizUnlocked>>> | null = null;
async function openQuizUnlocked() {
    if (!quizDB) {
        quizDB = await openDB<QuizUnlocked>('quizUnlocked', 1, {
            upgrade(db) {
                const quizStore = db.createObjectStore('quizUnlocked', {
                    keyPath: ['collection', 'book']
                });
                quizStore.createIndex('collection, book', ['collection', 'book'], { unique: true });
            }
        });
    }
    return quizDB;
}

export async function addQuizUnlocked(item: { collection: string; book: string }) {
    try {
        const quiz = await openQuizUnlocked();
        if (!quiz) {
            console.error('Failed to open quiz unlocked database');
            return;
        }
        await quiz.add('quizUnlocked', item);
    } catch (error) {
        console.error('Error adding quiz unlock:', error);
    }
}

export async function checkQuizUnlocked(item: { collection: string; book: string }) {
    const quiz = await openQuizUnlocked();
    return Boolean(await quiz.get('quizUnlocked', [item.collection, item.book]));
}
