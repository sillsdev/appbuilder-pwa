import config from '$lib/data/config';

export async function getAudioSourceInfo(item: {
    collection: string;
    book: string;
    chapter: string;
}) {
    //search config for audio on provided collection, book, and chapter
    const audio = config.bookCollections
        .find((c) => item.collection === c.id)
        ?.books?.find((b) => b.id === item.book)
        ?.audio?.find((a) => item.chapter === '' + a.num);

    if (!audio) {
        throw `no audio found for ${item.collection}:${item.book}:${item.chapter}`;
    }

    const audioSource = config.audio.sources[audio.src];
    let audioPath = null;

    if (audioSource.type === 'fcbh') {
        const dbp4 = audioSource.address ? audioSource.address : 'https://4.dbt.io';
        // if (source.accessMethods.includes('download')) {
        //    // TODO: Figure out how to use Cache API to download audio to PWA
        // }
        const request = `${dbp4}/api/bibles/filesets/${audioSource.damId}/${item.book}/${item.chapter}?v=4&key=${audioSource.key}`;
        const response = await fetch(request, {
            method: 'GET',
            headers: {
                accept: 'application/json'
            }
        });
        const result = await response.json();
        if (result.error) {
            throw `Failed to connect to BibleBrain: ${result.error}`;
        }

        audioPath = result.data[0].path;
    } else if (audioSource.type === 'assets') {
        audioPath = '/audio/' + audio.filename;
    } else if (audioSource.type === 'download') {
        audioPath = audioSource.address + '/' + audio.filename;
    }

    //parse timing file
    const timing = [];
    if (audio.timingFile) {
        const timeFilePath = `/timings/${audio.timingFile}`;
        console.log('Fetching Timing File:', timeFilePath);
        const response = await fetch(timeFilePath);
        if (!response.ok) {
            throw new Error('Failed to read file');
        }
        const timingFile = await response.text();

        const lines = timingFile.split('separators ')[1].split('\n');
        timing.push({
            time: parseFloat(lines[1].split('\t')[0]),
            tag: 'title'
        });

        for (let i = 1; i < lines.length; i++) {
            if (lines[i]) {
                timing.push({
                    time: parseFloat(lines[i].split('\t')[1]),
                    tag: lines[i].split('\t')[2]
                });
            }
        }
    }

    return {
        source: audioPath,
        timing: timing.length > 0 ? timing : null
    };
}
