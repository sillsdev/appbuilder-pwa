import type { PageLoad } from './$types';

const illustrations = import.meta.glob('./*', {
    eager: true,
    import: 'default',
    query: '?url',
    base: '/src/gen-assets/illustrations'
});

function updateImgTags(text: string) {
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

export const load: PageLoad = async () => {
    const url = await import('$assets/about.partial.html?raw');
    // replace a sequence of one or more new-line characters with a <br> element to preserve line breaks
    return { partial: updateImgTags(url.default ?? '').replaceAll(/\n+/g, '<br>') };
};
