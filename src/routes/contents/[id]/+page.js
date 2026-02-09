import contents from '$lib/data/contents';

export async function load({ params }) {
    const id = Number(params.id);
    const menu = contents.screens.find((x) => x.id === id);
    const nestedItems = contents.nestedItems;
    const features = contents.features;
    const title = contents.title;

    const items = [];
    for (const item of menu.items) {
        const found = contents.items.find((x) => x.id === item.id);
        if (found && Object.keys(found).length !== 0) {
            items.push(found);
        } else {
            console.warn(`No items found for menu item: ${item.id}`);
        }
    }

    return { menu, items, features, title, nestedItems };
}
