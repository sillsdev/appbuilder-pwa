import { scriptureConfig } from '$assets/config';
import { openDB, type DBSchema } from 'idb';

export interface QuizSpecification {
    collection: string;
    book: string;
    bookIndex: number;
}

interface QuizUnlocked extends DBSchema {
    quizUnlocked: {
        key: number;
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
                    keyPath: 'bookIndex'
                });
                quizStore.createIndex('collection, book', ['collection', 'book']);
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
        const bookCollection = scriptureConfig.bookCollections?.find(
            (x) => x.id === item.collection
        );
        const bookIndex = bookCollection?.books.findIndex((x) => x.id === item.book);

        if (bookIndex !== undefined && bookIndex >= 0) {
            const nextItem = {
                ...item,
                bookIndex: bookIndex
            };
            await quiz.add('quizUnlocked', nextItem);
        }
    } catch (error) {
        console.error('Error adding quiz unlock:', error);
    }
}

export async function checkQuizUnlocked(quizId: string) {
    const quiz = await openQuizUnlocked();
    const result: QuizSpecification[] = await quiz.getAllFromIndex(
        'quizUnlocked',
        'collection, book'
    );
    return result.some((item) => item.book === quizId);
}
