/** @type {import('./$types').PageLoad} */
export async function load({ url }) {
    const ref = url.searchParams.get('ref');
    const audio = url.searchParams.get('audio');

    return { ref, audio };
}
