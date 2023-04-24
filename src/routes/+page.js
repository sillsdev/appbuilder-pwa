/** @type {import('./$types').PageLoad} */
export function load({ url }) {
    let ref = url.searchParams.get('ref');
    let audio = url.searchParams.get('audio');
    return { ref, audio };
}
