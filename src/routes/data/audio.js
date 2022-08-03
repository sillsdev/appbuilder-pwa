import config from '../../config';
import path from 'path';
import { readFile } from 'fs/promises';

export async function post({ request }) {
    const body = await request.json();

    //search config for audio on provided collection, book, and chapter
    const audio = config.bookCollections.find((c) => {
        return body.collection.split('_')[0] === c.languageCode && 
        body.collection.split('_')[1] === c.collectionAbbreviation;
    })?.books?.find((b) => (b.id === body.book))?.audio?.find((a) => body.chapter === ''+a.num);

    if(!audio) {
        return {
            body: {
                error: `no audio found for ${body.book}:${body.chapter}`
            }
        }
    }

    //parse timing file
    const timingFile = await readFile(path.join('static', 'timings', audio.timingFile), 'utf8');
    const lines = timingFile.split('separators ')[1].split('\n');
    const timing = [];
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

    return {
        body: {
            // TODO: handle audio sources other than assets
            source: audio.filename,
            timing: timing
        }
    };
}