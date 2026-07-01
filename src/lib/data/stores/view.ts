import { derived, get, readable, writable } from 'svelte/store';
import { defaultSettings, userSettings } from './setting';
import { persistedLocal } from './storage';

export const NAVBAR_HEIGHT = '4rem';

/** a local storage flag that keeps track of if the page is at its very first launch */
const nowTime = String(Date.now());
export const launchTime = readable(nowTime);
export const firstLaunchTime = persistedLocal<string, typeof readable<string>>(
    'firstLaunchTime',
    nowTime,
    readable
);
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
    Note: 'note',
    TextAppearance: 'text-appearance',
    Font: 'font',
    StopPlan: 'stop-plan',
    PlaybackSpeed: 'playback-speed',
    VerseOnImage: 'verse-on-image',
    Download: 'download',
    Collection: 'collection'
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
export const bodyFontSize = persistedLocal('bodyFontSize', 17);
/**line height of body elements */
export const bodyLineHeight = persistedLocal('bodyLineHeight', 175);

/**Font size of contents elements */
export const contentsFontSize = persistedLocal('contentsFontSize', 17);

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
export const voiCustomImage = writable<{ original: string | null; cropped: string | null }>({
    original: null,
    cropped: null
});
