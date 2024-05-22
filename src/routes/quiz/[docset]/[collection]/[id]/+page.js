/** @type {import('./$types').PageLoad} */
export async function load({ params }) {
    const id = Number(params.id);
    const collection = params.collection;
    return {};
}
