import config from '$lib/data/config';
import { checkQuizAccess } from '$lib/data/quiz';

/** @type {Record<string, string>} */
const quizzes = import.meta.glob('./**/quizzes/*.json', {
    import: 'default',
    eager: true,
    base: '/src/gen-assets/collections',
    query: '?url'
});

/** @type {import('./$types').PageLoad} */
export async function load({ params, fetch }) {
    const id = params.id;
    const collection = params.collection;

    const bookCollection = config.bookCollections.find((x) => x.id === collection);
    const book = bookCollection.books.find((x) => x.id === id);

    let locked = false;
    let dependentQuizId = null;
    let dependentQuizName = null;

    if (book.quizFeatures['access-type'] === 'after') {
        dependentQuizId = book.quizFeatures['access-after'];
        const accessGranted = await checkQuizAccess(dependentQuizId);
        locked = !accessGranted;
    }

    if (locked && dependentQuizId) {
        const dependentBook = bookCollection.books.find((x) => x.id === dependentQuizId);
        dependentQuizName = dependentBook ? dependentBook.name : dependentQuizId;
    }

    let quizData;
    let passScore = 0;
    if (!locked) {
        try {
            const key = `./${collection}/quizzes/${id}.json`;
            const url = quizzes[key];
            if (!url) {
                throw new Error(`Quiz JSON asset not found for key ${key}`);
            }
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error('Failed to fetch quiz JSON file');
            }

            quizData = await response.json();
            passScore = quizData.passScore;
        } catch (error) {
            console.error('Error fetching quiz JSON file:', error);
        }
    }

    return {
        quiz: quizData,
        locked,
        quizId: id,
        quizName: book.name,
        dependentQuizId,
        dependentQuizName,
        passScore
    };
}
