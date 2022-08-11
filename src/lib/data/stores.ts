import { readable, writable } from 'svelte/store';
import { groupStore, referenceStore } from './store-types';
import globalConfigJson from '../../config';

export const globalConfig = readable(globalConfigJson);
/**a group of reference stores*/
export const refs = groupStore(referenceStore);
/**a group of writable stores to store the top visible verse in a group*/
export const scrolls = groupStore(writable, 'title');
/**the current view/layout mode*/
export const viewMode = writable('Single Pane');
/**is audio active in the app*/
export const playingAudio = writable(true);
/**which element should be highlighted as the audio is playing*/
export const audioHighlight = writable('0,0,0,0,0');
/**scrollTop of main window*/
export const mainScroll = writable({ top: 0, height: 0});
