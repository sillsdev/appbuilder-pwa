/** @type {import('./$types').PageLoad} */
export async function load() {
    // use window.fetch for now so that the ?raw works.
    const response = await fetch('/about.partial.html?raw');
    const partial = await response.text();
    return { partial };
}
