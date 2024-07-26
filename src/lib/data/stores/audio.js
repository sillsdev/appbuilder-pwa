import { writable, get, derived } from 'svelte/store';
import { setDefaultStorage } from './storage';
import config from '../config';

/**is audio active in the app*/
setDefaultStorage('audioActive', config.mainFeatures['audio-turn-on-at-startup']);
export const audioActive = writable(localStorage.audioActive === 'true');
audioActive.subscribe((value) => (localStorage.audioActive = value));

setDefaultStorage('quizAudioActive', true);
export const quizAudioActive = writable(localStorage.quizAudioActive);
quizAudioActive.subscribe((value) => (localStorage.quizAudioActive = value));

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
    duration: 0,
    progress: 0,
    playing: false,
    timeIndex: 0,
    timing: [],
    timer: NaN,
    audio: null,
    playStart: 0
};
export const audioPlayer = writable({ ...audioPlayerDefault });

export const PLAYMODE_CONTINUE = 'continue';
export const PLAYMODE_STOP = 'stop';
export const PLAYMODE_REPEAT_PAGE = 'repeatPage';
export const PLAYMODE_REPEAT_SELECTION = 'repeatSelection';

export const defaultPlayModeRange = { start: 0, end: 0 };
export const defaultPlayMode = {
    mode: config.mainFeatures['audio-goto-next-chapter'] ? PLAYMODE_CONTINUE : PLAYMODE_STOP,
    range: defaultPlayModeRange,
    continue: false
};
function createPlayMode() {
    const external = writable(defaultPlayMode);
    return {
        subscribe: external.subscribe,
        set: external.set,
        next: (hasTiming) => {
            const { mode, range } = get(external);
            let nextMode = mode;
            let nextRange = range;
            switch (mode) {
                case PLAYMODE_CONTINUE:
                    nextMode = PLAYMODE_STOP;
                    break;
                case PLAYMODE_STOP:
                    nextMode = PLAYMODE_REPEAT_PAGE;
                    break;
                case PLAYMODE_REPEAT_PAGE:
                    if (hasTiming) {
                        nextMode = PLAYMODE_REPEAT_SELECTION;
                        nextRange = defaultPlayModeRange;
                    } else {
                        nextMode = PLAYMODE_CONTINUE;
                    }
                    break;
                case PLAYMODE_REPEAT_SELECTION:
                    nextMode = PLAYMODE_CONTINUE;
                    break;
            }
            external.set({ mode: nextMode, range: nextRange });
        },
        reset: () => {
            external.set(defaultPlayMode);
        }
    };
}
export const playMode = createPlayMode();
