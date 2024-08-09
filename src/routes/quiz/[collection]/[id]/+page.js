import { base } from '$app/paths';
import config from '$lib/data/config';
import { checkQuizAccess } from '$lib/data/quiz';

/** @type {import('./$types').PageLoad} */
export async function load({ params, fetch }) {
    const id = params.id;
    const collection = params.collection;

    const bookCollection = config.bookCollections.find((x) => x.id === collection);
    const book = bookCollection.books.find((x) => x.id === id);

    let locked = false;
    let dependentQuizId = null;

    if (book.quizFeatures['access-type'] === 'after') {
        dependentQuizId = book.quizFeatures['access-after'];
        const accessGranted = await checkQuizAccess(dependentQuizId);
        locked = !accessGranted;
    }
    if (locked) {
        const dependentBook = bookCollection.books.find((x) => x.id === dependentQuizId);
        dependentQuizName = dependentBook ? dependentBook.name : dependentQuizId;
    }

    if (!locked) {
        try {
            const response = await fetch(`${base}/collections/${collection}/quizzes/${id}.json`);
            if (!response.ok) {
                throw new Error('Failed to fetch quiz JSON file');
            }

            const quizData = await response.json();
            return { quiz: quizData, locked, quizId: id, quizName: book.name, dependentQuizId };
        } catch (error) {
            console.error('Error fetching quiz JSON file:', error);
        }
    }

    return { locked, quizId: id, quizName: book.name, dependentQuizId };
}