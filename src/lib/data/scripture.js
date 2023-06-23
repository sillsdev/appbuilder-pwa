import { get } from 'svelte/store';
import { base } from '$app/paths';
import { Proskomma } from 'proskomma-core';
import { thaw } from '../scripts/thaw';
import { pk } from '$lib/data/stores/pk';
import config from '$lib/data/config';
// import { refs } from '$lib/data/stores/scripture';

export async function initProskomma() {
    let proskomma = get(pk);
    if (!proskomma) {
        proskomma = new Proskomma();

        let docSet;//get(refs).docSet;
        if (!docSet) {
            docSet = config.bookCollections[0].languageCode + '_' + config.bookCollections[0].id;
        }
        await loadDocSet(proskomma, docSet);
        pk.set(proskomma);
    }

    return proskomma;
} 

export async function loadDocSet(proskomma, docSet) {
    performance.mark('pk-fetch-start');
    // console.log('fetch %o pkf', docSet);
    const res = await fetch(`${base}/collections/${docSet}.pkf`).then((r) => {
        return r.arrayBuffer();
    });
    performance.mark('pk-fetch-end');
    performance.measure('pk-fetch-duration', 'pk-fetch-start', 'pk-fetch-end')
    if (res.byteLength) {
        performance.mark('pk-thaw-start');
        // console.log('awaiting thaw');
        const uint8res = new Uint8Array(res);
        thaw(proskomma, uint8res);
        performance.mark('pk-thaw-end');
        performance.measure('pk-thaw-duration', 'pk-thaw-start', 'pk-thaw-end');
    }
}

export async function loadDocSetIfNotLoaded(proskomma, docSet) {
    performance.mark('pk-query-docset-start');
    const docslist = await proskomma.gqlQuery('{docSets { id } }');
    performance.mark('pk-query-docset-end');
    performance.measure(
        'pk-query-docset-duration',
        'pk-query-docset-start',
        'pk-query-docset-end'
    );
    // console.log('LIST %o', docslist);

    let found = false;
    for (const doc of docslist.data.docSets) {
        // console.log('ID: %o', doc.id);
        if (doc.id === docSet) {
            // console.log('Found');
            found = true;
            break;
        }
    }

    if (!found) {
        await loadDocSet(proskomma, docSet);
    }
}