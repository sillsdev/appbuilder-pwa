import contents from '$lib/data/contents';

export async function load({ params }) {
    const id = Number(params.id);
    const menu = contents.screens.find((x) => x.id === id);

    const items = [];
    for (const item of menu.items) {
        const found = contents.items.find((x) => x.id === item.id);
        if (found) {
            items.push(found);
        }
    }

    const features = contents.features;

    const title = contents.title;

    return { menu, items, features, title };
}
