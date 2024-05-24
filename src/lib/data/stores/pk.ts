import type { SABProskomma } from '$lib/sab-proskomma';
import { writable, type Writable } from 'svelte/store';

/** proskomma data */
export const pk: Writable<SABProskomma> = writable(null);
