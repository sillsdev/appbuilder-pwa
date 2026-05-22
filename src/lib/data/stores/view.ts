import { derived, get, readable, writable } from 'svelte/store';
import { defaultSettings, userSettings } from './setting';
import { setDefaultStorage } from './storage';

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

/**the current view/layout mode*/
export const Layout = {
    Single: 'single',
    Two: 'two',
    VerseByVerse: 'verse-by-verse'
} as const;
export type Layout = (typeof Layout)[keyof typeof Layout];

const singleLayout = { mode: Layout.Single, auxDocSets: [] };
export const layout = writable<{ mode: Layout; auxDocSets?: string[] }>(singleLayout);

export const ModalType = {
    Collection: 'collection',
    Note: 'note',
    TextAppearance: 'text-appearance',
    Font: 'font',
    StopPlan: 'stop-plan',
    PlaybackSpeed: 'playback-speed',
    VerseOnImage: 'verse-on-image',
    Download: 'download'
} as const;
export type ModalType = (typeof ModalType)[keyof typeof ModalType];

function createModal() {
    const { subscribe, set } = writable([] as { modalType: ModalType; data?: unknown }[]);
    return {
        subscribe,
        open: (modalType: ModalType, data?: unknown) => {
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

    function subscribe(callback: Parameters<(typeof internal)['subscribe']>[0]) {
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
export const bodyFontSize = writable(Number(localStorage.bodyFontSize));
bodyFontSize.subscribe((fontSize) => (localStorage.bodyFontSize = fontSize));
/**line height of body elements */
setDefaultStorage('bodyLineHeight', '175');
export const bodyLineHeight = writable(Number(localStorage.bodyLineHeight));
bodyLineHeight.subscribe((lineHeight) => (localStorage.bodyLineHeight = lineHeight));

/**Font size of contents elements */
setDefaultStorage('contentsFontSize', '17');
export const contentsFontSize = writable(Number(localStorage.contentsFontSize));
contentsFontSize.subscribe((fontSize) => (localStorage.contentsFontSize = fontSize));

export const showDesktopSidebar = derived(
    userSettings,
    ($userSettings) => $userSettings['desktop-sidebar'] ?? defaultSettings['desktop-sidebar']
);

function createStackStore<T>() {
    const { subscribe, update } = writable([] as T[]);

    return {
        subscribe,
        pushItem: (id: T) =>
            update((stack) => {
                return [...stack, id];
            }),
        popItem: () => {
            let poppedValue: T | undefined = undefined;
            update((stack) => {
                if (stack.length > 0) {
                    poppedValue = stack.pop();
                }
                return [...stack];
            });
            return poppedValue as T | undefined;
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

export const contentsStack = createStackStore<number>();
export const voiCustomImage = writable({
    original: null,
    cropped: null
});
