import { json } from '@sveltejs/kit';
import config from '$lib/data/config';
import path from 'path';
import { readFile } from 'fs/promises';

export async function POST({ request }) {
    const body = await request.json();

    //search config for audio on provided collection, book, and chapter
    const audio = config.bookCollections.find((c) => {
        return body.collection.split('_')[0] === c.languageCode && 
        body.collection.split('_')[1] === c.id;
    })?.books?.find((b) => (b.id === body.book))?.audio?.find((a) => body.chapter === ''+a.num);

    if(!audio) {
        return json({
    error: `no audio found for ${body.collection}:${body.book}:${body.chapter}`
})
    }

    const source = config.audio.sources[audio.src];

    if(source.type === "fcbh") {
        return json({
    error: 'This repository is not currently designed to use audio from FCBH'
})
    }

    let prefix = '';
    if (source.type === 'assets') prefix = '/audio';
    else if (source.type === 'download') prefix = source.address;

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
        source: prefix + '/' + audio.filename,
        timing: timing.length > 0 ? timing : null
    });
}
