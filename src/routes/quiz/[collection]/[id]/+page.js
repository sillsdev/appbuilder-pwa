import { base } from '$app/paths';
import config from '$lib/data/config';
import { checkQuizAccess } from '$lib/data/quiz';

/** @type {import('./$types').PageLoad} */
export async function load({ params, fetch }) {
    const id = params.id;
    const collection = params.collection;

    const book = config.bookCollections.find((x) => x.id === collection).books.find((x) => x.id === id);

    if (book.quizFeatures['access-type'] === 'after') {
        const dependentQuizId = book.quizFeatures['access-after'];
        const accessGranted = await checkQuizAccess(dependentQuizId);
        if (!accessGranted) {
            return { locked: true, dependentQuizId: dependentQuizId, quizId: id, quizName: book.name };
        }
    }

    try {
        const response = await fetch(`${base}/collections/${collection}/quizzes/${id}.json`);
        if (!response.ok) {
            throw new Error('Failed to fetch quiz JSON file');
        }

        const quizData = await response.json();
        return { quiz: quizData };
    } catch (error) {
        console.error('Error fetching quiz JSON file:', error);
        return {};
    }
}