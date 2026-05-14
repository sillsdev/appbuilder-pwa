import type { Quiz, ScriptureConfig } from '$config';
import config from '$lib/data/config';
import { checkQuizAccess } from '$lib/data/quiz';
import type { PageLoad } from './$types';

const quizzes: Record<string, string> = import.meta.glob('./**/quizzes/*.json', {
    import: 'default',
    eager: true,
    base: '/src/gen-assets/collections',
    query: '?url'
});

export const load: PageLoad = async ({ params, fetch }) => {
    const id = params.id;
    const collection = params.collection;

    const scriptConfig = config as ScriptureConfig;

    const bookCollection = scriptConfig.bookCollections?.find((x) => x.id === collection);
    const book = bookCollection?.books.find((x) => x.id === id);

    let locked = false;
    let dependentQuizId: string | null = null;
    let dependentQuizName: string | null = null;

    if (book?.quizFeatures?.['access-type'] === 'after' && book.quizFeatures['access-after']) {
        dependentQuizId = book.quizFeatures['access-after'] as string;
        const accessGranted = await checkQuizAccess(dependentQuizId);
        locked = !accessGranted;
    }

    if (locked && dependentQuizId) {
        const dependentBook = bookCollection?.books.find((x) => x.id === dependentQuizId);
        dependentQuizName = dependentBook ? dependentBook.name : dependentQuizId;
    }

    let quizData: Quiz | null = null;
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
        } catch (error) {
            console.error('Error fetching quiz JSON file:', error);
        }
    }

    return {
        quiz: quizData,
        locked,
        collection: params.collection,
        quizId: id,
        displayLabel: book?.name || 'Quiz',
        dependentQuizId,
        dependentQuizName,
        passScore: quizData?.passScore ?? 0
    };
};
