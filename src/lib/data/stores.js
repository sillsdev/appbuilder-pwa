import { readable, writable, derived } from 'svelte/store';
import { groupStore, referenceStore } from './store-types';
import globalConfigJson from '../../config';

export const globalConfig = readable(globalConfigJson);
/**a group of reference stores*/
export const refs = groupStore(referenceStore);
/**writable store of the current theme and a function to access color attributes of an associated theme*/
export const theme = (() => {
  const theme = writable('Normal');
  return {subscribe: theme.subscribe, set: theme.set};
})();

/**a group of writable stores to store the top visible verse in a group*/
export const scrolls = groupStore(writable, 'title');
/**the current view/layout mode*/
export const viewMode = writable('Single Pane');
/**is audio active in the app*/
export const audioActive = writable(true);
/**which element should be highlighted as the audio is playing*/
export const audioHighlight = (() => {
    const listener = derived([refs, audioActive], ([$refs, $audioActive]) => {
        reset();
    });

    const reset = () => {
        external.set('0,0,0,0,0');
    }

    const external = writable('0,0,0,0,0');

    return { subscribe: external.subscribe, set: external.set };
})();
/**scrollTop of main window*/
export const mainScroll = writable({ top: 0, height: 0});
