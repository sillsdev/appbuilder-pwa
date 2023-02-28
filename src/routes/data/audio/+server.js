import { json } from '@sveltejs/kit';
import config from '$lib/data/config';
import path from 'path';
import { readFile } from 'fs/promises';

export async function POST({ request }) {
    const body = await request.json();

    //search config for audio on provided collection, book, and chapter
    const audio = config.bookCollections.find((c) => body.collection === c.id)?.books?.find((b) => (b.id === body.book))?.audio?.find((a) => body.chapter === ''+a.num);

    if(!audio) {
        return json({error: `no audio found for ${body.collection}:${body.book}:${body.chapter}`})
    }

    const audioSource = config.audio.sources[audio.src];
    let audioPath = null;

    if(audioSource.type === "fcbh") {
        const dbp4 = audioSource.address ? audioSource.address : 'https://4.dbt.io';
        // if (source.accessMethods.includes('download')) {
        //    // TODO: Figure out how to use Cache API to download audio to PWA
        // }
        const request = `${dbp4}/api/bibles/filesets/${audioSource.damId}/${body.book}/${body.chapter}?v=4&key=${audioSource.key}`;
        const response = await fetch(request, {
            method: 'GET',
            headers: {
                accept: 'application/json'
            }
        });
        const result = await response.json();
        if (result.error) {
            return json({ error: `Failed to connect to BibleBrain: ${result.error}`});
        }
    
        audioPath = result.data[0].path;
    }
    if (audioSource.type === 'assets') {
        audioPath = '/audio/' + audio.filename;
    }
    else if (audioSource.type === 'download') {
        audioPath = audioSource.address + '/' + audio.filename;
    }

    //parse timing file
    const timing = [];
    if (audio.timingFile) {
        const timingFile = await readFile(path.join('static', 'timings', audio.timingFile), 'utf8');
        const lines = timingFile.split('separators ')[1].split('\n');
        timing.push({ 
            time: parseFloat(lines[1].split('\t')[0]), 
            tag: 'title'
        });

        for(let i = 1; i < lines.length; i++) {
            if(lines[i]) {
                timing.push({ 
                    time: parseFloat(lines[i].split('\t')[1]), 
                    tag: lines[i].split('\t')[2]
                });
            }
        }
    }

    return json({
        source: audioPath,
        timing: timing.length > 0 ? timing : null
    });
}
