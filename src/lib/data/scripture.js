import { get } from 'svelte/store';
import { base } from '$app/paths';
import { SABProskomma } from '$lib/sab-proskomma';
import { thaw } from '../scripts/thaw';
import { pk } from '$lib/data/stores/pk';
import config from '$lib/data/config';

export async function initProskomma({ fetch }) {
    let proskomma = get(pk);
    if (!proskomma) {
        proskomma = new SABProskomma();

        let docSet; //get(refs).docSet;
        if (!docSet) {
            docSet = config.bookCollections[0].languageCode + '_' + config.bookCollections[0].id;
        }
        // Delay loading, allows page to render while waiting for data to load
        // await loadDocSet(proskomma, docSet, fetch);
        pk.set(proskomma);
    }

    return proskomma;
}

export function getDocSetUrl(docSet) {
    return `${base}/collections/${docSet}.pkf`;
}

export async function fetchDocSet(docSet, fetch) {
    performance.mark('pk-fetch-start');

    const data = await fetch(getDocSetUrl(docSet));
    const buffer = await data.arrayBuffer();

    performance.mark('pk-fetch-end');
    performance.measure('pk-fetch-duration', 'pk-fetch-start', 'pk-fetch-end');

    return new Uint8Array(buffer);
}

export async function loadDocSet(proskomma, docSet, fetch) {
    // console.log('fetch %o pkf', docSet);
    const data = await fetchDocSet(docSet, fetch);
    if (data.length) {
        performance.mark('pk-thaw-start');
        // console.log('awaiting thaw');
        thaw(proskomma, data);
        performance.mark('pk-thaw-end');
        performance.measure('pk-thaw-duration', 'pk-thaw-start', 'pk-thaw-end');
    }
}

export async function loadDocSetIfNotLoaded(proskomma, docSet, fetch) {
    performance.mark('pk-query-docset-start');
    const docslist = await proskomma.gqlQuery('{docSets { id } }');
    performance.mark('pk-query-docset-end');
    performance.measure('pk-query-docset-duration', 'pk-query-docset-start', 'pk-query-docset-end');
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
        try {
            await loadDocSet(proskomma, docSet, fetch);
        } catch (e) {}
    }
}
