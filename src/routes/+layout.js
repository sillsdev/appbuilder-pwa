import catalog from '$lib/data/catalogData';
import { get } from 'svelte/store';
import { refs } from '$lib/data/stores/scripture';

export const ssr = false;

export async function load({ fetch }) {
    if (!get(refs).inititialized) {
        catalog.setFetch(fetch);
        await refs.init();
    }
}
