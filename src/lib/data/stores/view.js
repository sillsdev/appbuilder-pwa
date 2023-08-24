import { groupStore } from './store-types';
import { derived, writable, get } from 'svelte/store';
import { setDefaultStorage } from './storage';
import { userSettings } from './setting';

export const NAVBAR_HEIGHT = '4rem';

/** a local storage flag that keeps track of if the page is at its very first launch */
setDefaultStorage('firstLaunch', true);
export const firstLaunch = writable(localStorage.firstLaunch === 'true');
firstLaunch.subscribe((bool) => (localStorage.firstLaunch = bool));

/**a group of writable stores to store the top visible verse in a group*/
export const scrolls = groupStore(writable, 'title');
/**the current view/layout mode*/
export const LAYOUT_SINGLE = 'single';
export const LAYOUT_TWO = 'two';
export const LAYOUT_VERSE_BY_VERSE = 'verse-by-verse';

const singleLayout = { mode: LAYOUT_SINGLE, auxDocSets: [] };
export const layout = writable(singleLayout);

export const MODAL_COLLECTION = 'collection';
export const MODAL_NOTE = 'note';
export const MODAL_TEXT_APPERANCE = 'text-appearance';
export const MODAL_CROP = 'crop';
export const MODAL_FONT = 'font';
export const MODAL_VERSE_ON_IMAGE = 'verse-on-image';

function createModal() {
    const { subscribe, set } = writable([]);
    return {
        subscribe,
        open: (modalType, data = undefined) => {
            set([...get(modal), { modalType, data }]);
        },
        clear: () => set([])
    };
}
export const modal = createModal();

const createWindowSizeStore = () => {
    const internal = writable({ width: window.innerWidth, height: window.innerHeight });

    const handleResize = () => {
        internal.set({ width: window.innerWidth, height: window.innerHeight });
    };

    let numSubscriptions = 0;

    function subscribe(callback) {
        // Increment the subscription count
        numSubscriptions += 1;

        // If this is the first subscription, attach the event listener
        if (numSubscriptions === 1) {
            window.addEventListener('resize', handleResize);
        }

        // Delegate the subscription to the internal store
        const unsubscribe = internal.subscribe(callback);

        // Return an unsubscribe function that handles decrementing the subscription count
        return () => {
            // Call the internal store's unsubscribe function
            unsubscribe();

            // Decrement the subscription count
            numSubscriptions -= 1;
            if (numSubscriptions === 0) {
                window.removeEventListener('resize', handleResize);
            }
        };
    }

    return {
        subscribe
    };
};

export const windowSize = createWindowSizeStore();

/**scrollTop of main window*/
export const mainScroll = writable({ top: 0, height: 0 });
/**Font size of body elements */
setDefaultStorage('bodyFontSize', '17');
export const bodyFontSize = writable(localStorage.bodyFontSize);
bodyFontSize.subscribe((fontSize) => (localStorage.bodyFontSize = fontSize));
/**line height of body elements */
setDefaultStorage('bodyLineHeight', '175');
export const bodyLineHeight = writable(localStorage.bodyLineHeight);
bodyLineHeight.subscribe((lineHeight) => (localStorage.bodyLineHeight = lineHeight));

export const showDesktopSidebar = derived(
    userSettings,
    ($userSettings) => $userSettings['desktop-sidebar']
);
