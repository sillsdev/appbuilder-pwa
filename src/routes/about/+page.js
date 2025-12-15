const illustrations = import.meta.glob('./*', {
    eager: true,
    import: 'default',
    base: '/src/gen-assets/illustrations'
});

function updateImgTags(/** @type {string} */ text) {
    return text.replace(
        /<img\b[^>]*\bsrc=["']([^"']*\/)?([^"']*)["'][^>]*>/gi,
        (match, _path, fileName) => {
            const img = illustrations[`./${fileName}`];
            if (!img) {
                console.error(`Error loading about illustration: could not find image ${fileName}`);
                return match; // keep original tag instead of dropping it
            }
            return match.replace(/src=["'][^"']*["']/, `src="${img}"`);
        }
    );
}

/** @type {import('./$types').PageLoad} */
export async function load() {
    const url = await import('$assets/about.partial.html?raw');
    return { partial: updateImgTags(url.default ?? '') };
}
