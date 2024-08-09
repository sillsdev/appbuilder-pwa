import { groupStore } from './store-types';
import { derived, writable, get, readable } from 'svelte/store';
import { setDefaultStorage } from './storage';
import { defaultSettings, userSettings } from './setting';

export const NAVBAR_HEIGHT = '4rem';

/** a local storage flag that keeps track of if the page is at its very first launch */
const nowTime = String(Date.now());
export const launchTime = readable(nowTime);
setDefaultStorage('firstLaunchTime', nowTime);
export const firstLaunchTime = readable(localStorage.firstLaunchTime);
export const isFirstLaunch = derived(
    [firstLaunchTime, launchTime],
    ([$firstLaunchTime, $launchTime]) => $firstLaunchTime === $launchTime
);

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
export const MODAL_FONT = 'font';

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

/**Font size of contents elements */
setDefaultStorage('contentsFontSize', '17');
export const contentsFontSize = writable(localStorage.contentsFontSize);
contentsFontSize.subscribe((fontSize) => (localStorage.contentsFontSize = fontSize));

export const showDesktopSidebar = derived(
    userSettings,
    ($userSettings) => $userSettings['desktop-sidebar'] ?? defaultSettings['desktop-sidebar']
);

function createStackStore() {
    const { subscribe, update } = writable([]);

    return {
        subscribe,
        pushItem: (id) =>
            update((stack) => {
                return [...stack, id];
            }),
        popItem: () => {
            let poppedValue = 0;
            update((stack) => {
                if (stack.length > 0) {
                    poppedValue = stack.pop();
                }
                return [...stack];
            });
            return poppedValue;
        },
        length: () => {
            let length = 0;
            update((stack) => {
                length = stack.length;
                return stack; // No modification to stack, just returning current length
            });
            return length;
        }
    };
}

export const contentsStack = createStackStore();
