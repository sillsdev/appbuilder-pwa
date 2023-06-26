import { writable, get, derived } from 'svelte/store';
import { setDefaultStorage } from './storage';
import config from '../config';

/**is audio active in the app*/
setDefaultStorage('audioActive', config.mainFeatures['audio-turn-on-at-startup']);
export const audioActive = writable(localStorage.audioActive === 'true');
audioActive.subscribe((value) => (localStorage.audioActive = value));
/**which element should be highlighted as the audio is playing*/
function createaudioHighlightElements() {
    const external = writable([]);
    return {
        subscribe: external.subscribe,
        set: external.set,
        reset: () => {
            external.set([]);
        }
    };
}
export const audioHighlightElements = createaudioHighlightElements();
export const audioPlayerDefault = {
    loaded: false,
    duration: NaN,
    progress: 0,
    playing: false,
    playAfterSkip: false,
    timeIndex: 0,
    timing: [],
    timer: NaN,
    audio: null
};
export const audioPlayer = writable({ ...audioPlayerDefault });

function createPlayMode() {
    const external = writable(config.mainFeatures['audio-goto-next-chapter'] ? 'continue' : 'stop');
    return {
        subscribe: external.subscribe,
        next: (hasTiming) => {
            const cur = get(external);
            let next = cur;
            switch (cur) {
                case 'continue':
                    next = 'stop';
                    break;
                case 'stop':
                    next = 'repeatPage';
                    break;
                case 'repeatPage':
                    next = hasTiming ? 'repeatSelection' : 'continue';
                    break;
                case 'repeatSelection':
                    next = 'continue';
                    break;
            }
            external.set(next);
        },
        reset: () => {
            external.set('continue');
        }
    };
}
export const playMode = createPlayMode();
