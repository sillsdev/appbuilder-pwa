import { base } from '$app/paths';

/** @type {import('./$types').PageLoad} */
export async function load({ fetch }) {
    let languages = [];
    const response = await fetch(`${base}/badges/languages.json`)
    const result = await response.json();
    if (!result.error) {
        console.log(result, JSON.stringify(result));
        languages = result;
    }


    return { languages };
}
