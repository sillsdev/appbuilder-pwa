import type { AudioSource } from '$config';

export async function getBibleBrainUrl(
    audioSource: AudioSource,
    item: Partial<{
        collection: string;
        book: string;
        chapter: string;
    }>,
    getDamId: (src: AudioSource) => string | undefined
): Promise<{ error: unknown; path?: never } | { error?: never; path: string }> {
    try {
        const dbp4 = audioSource.address ? audioSource.address : 'https://4.dbt.io';
        // if (source.accessMethods.includes('download')) {
        //    // TODO: Figure out how to use Cache API to download audio to PWA
        // }
        const damId = getDamId(audioSource);
        const request = `${dbp4}/api/bibles/filesets/${damId}/${item.book}/${item.chapter}?v=4&key=${audioSource.key}`;
        const response = await fetch(request, {
            method: 'GET',
            headers: {
                accept: 'application/json'
            }
        });

        const json = await response.json();

        if (!json.error) {
            return { path: json.data[0].path };
        }

        return json;
    } catch (error) {
        return { error };
    }
}
