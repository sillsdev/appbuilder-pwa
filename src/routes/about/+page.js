/** @type {import('./$types').PageLoad} */
export async function load() {
    const response = await fetch('/about.partial.html?raw');
    const partial = await response.text();
    return { partial };
}
