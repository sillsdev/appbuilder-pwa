import { base } from '$app/paths';

/** @type {import('./$types').PageLoad} */
export async function load({ params }) {
    const id = params.id;
    const collection = params.collection;

    try {
        const response = await fetch(`${base}/collections/${collection}/quizzes/${id}.json`);

        if (!response.ok) {
            throw new Error('Failed to fetch quiz JSON file');
        }

        const quizData = await response.json()
        return { quizData };
    }
    catch (error) {
        console.error("Error fetching quiz JSON file:", error);
        return {};
    }
}
