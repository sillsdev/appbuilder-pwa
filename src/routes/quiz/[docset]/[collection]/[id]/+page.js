/** @type {import('./$types').PageLoad} */
export async function load({ params }) {
    const id = Number(params.id);
    const collection = params.collection;

    try {
        const response = await fetch('quiz.json');

        if (!response.ok) {
            throw new Error('Failed to fetch quiz.json file');
        }

        const quizData = await response.json()
        return { quizData };
    }
    catch (error) {
        console.error("Error fetching quiz.json file:', error")
        return {};
    }
}
