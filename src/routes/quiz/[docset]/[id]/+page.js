/** @type {import('./$types').PageLoad} */
export async function load({ params }) {
    const id = Number(params.id);
    const collection = params.collection;

    try {
        const response = await fetch(path.join(
            'static',
            'collections',
            context.docSet,
            'quizzes',
            book.id + '.json'));

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
