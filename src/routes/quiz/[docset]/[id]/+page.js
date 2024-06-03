/** @type {import('./$types').PageLoad} */
import { base } from '$app/paths';

// // +page.js

export async function load({ params }) {
    const { docset, id } = params;
    try {
        const response = await fetch(`${base}/collections/${docset}/quizzes/${id}.json`);

        if (!response.ok) {
            throw new Error('Failed to fetch quiz JSON file');
        }
        const quiz = await response.json();
        return { quiz };
    } catch (error) {
        console.error('Error fetching quiz JSON file:', error);
        return {};
    }
}
