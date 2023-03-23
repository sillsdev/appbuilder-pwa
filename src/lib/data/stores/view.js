import { groupStore } from './store-types';
import { derived, writable } from 'svelte/store';
import { setDefaultStorage } from './storage';
import { userSettings } from './setting';

/**a group of writable stores to store the top visible verse in a group*/
export const scrolls = groupStore(writable, 'title');
/**the current view/layout mode*/
export const viewMode = writable('Single Pane');

/**scrollTop of main window*/
export const mainScroll = writable({ top: 0, height: 0});
/**Font size of body elements */
setDefaultStorage('bodyFontSize', '17');
export const bodyFontSize = writable(localStorage.bodyFontSize);
bodyFontSize.subscribe((fontSize)  => localStorage.bodyFontSize = fontSize);
/**line height of body elements */
setDefaultStorage('bodyLineHeight', '175');
export const bodyLineHeight = writable(localStorage.bodyLineHeight);
bodyLineHeight.subscribe((lineHeight)=> localStorage.bodyLineHeight = lineHeight);

export const showDesktopSidebar = derived(userSettings, $userSettings => $userSettings['desktop-sidebar']);
