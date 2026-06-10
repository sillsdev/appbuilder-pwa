import config from '$assets/config';
import { get, writable } from 'svelte/store';
import { setDefaultStorage } from './storage';

/**is audio active in the app*/
setDefaultStorage('audioActive', config.mainFeatures['audio-turn-on-at-startup'] as string);
export const audioActive = writable(localStorage.audioActive === 'true');
audioActive.subscribe((value) => (localStorage.audioActive = value));

setDefaultStorage('quizAudioActive', 'true');
export const quizAudioActive = writable(localStorage.quizAudioActive === 'true');
quizAudioActive.subscribe((value) => (localStorage.quizAudioActive = value));

/**which element should be highlighted as the audio is playing*/
function createaudioHighlightElements() {
    const external = writable([] as string[]);
    return {
        subscribe: external.subscribe,
        set: external.set,
        reset: () => {
            external.set([]);
        }
    };
}
export const audioHighlightElements = createaudioHighlightElements();

export type Timing = {
    starttime: number;
    endtime: number;
    tag: string;
};
export interface AudioPlayer {
    audio: HTMLAudioElement | null;
    loaded: boolean;
    duration: number;
    progress: number;
    playing: boolean;
    timeIndex: number;
    timing: Timing[] | null;
    headingMarkers?: number[];
    collection?: string;
    book?: string;
    chapter?: string;
    timer: NodeJS.Timeout | null;
    playStart: number;
}

export const audioPlayerDefault = {
    loaded: false,
    duration: 0,
    progress: 0,
    playing: false,
    timeIndex: 0,
    timing: null,
    timer: null,
    audio: null,
    playStart: 0
} as AudioPlayer;
export const audioPlayer = writable({ ...audioPlayerDefault });

export const PlayMode = {
    Continue: 'continue',
    Stop: 'stop',
    RepeatPage: 'repeatPage',
    RepeatSelection: 'repeatSelection'
} as const;
export type PlayMode = (typeof PlayMode)[keyof typeof PlayMode];

export type PlayModeRange = { start: number; end: number };
export const defaultPlayModeRange: PlayModeRange = { start: 0, end: 0 };
export type PlayModeSettings = {
    mode: PlayMode;
    range: PlayModeRange;
    continue?: boolean;
};
export const defaultPlayMode: PlayModeSettings = {
    mode: config.mainFeatures['audio-goto-next-chapter'] ? PlayMode.Continue : PlayMode.Stop,
    range: defaultPlayModeRange,
    continue: false
};
function createPlayMode() {
    const external = writable(defaultPlayMode);
    return {
        subscribe: external.subscribe,
        set: external.set,
        next: (hasTiming: boolean) => {
            const { mode, range } = get(external);
            let nextMode = mode;
            let nextRange = range;
            switch (mode) {
                case PlayMode.Continue:
                    nextMode = PlayMode.Stop;
                    break;
                case PlayMode.Stop:
                    nextMode = PlayMode.RepeatPage;
                    break;
                case PlayMode.RepeatPage:
                    if (hasTiming) {
                        nextMode = PlayMode.RepeatSelection;
                        nextRange = defaultPlayModeRange;
                    } else {
                        nextMode = PlayMode.Continue;
                    }
                    break;
                case PlayMode.RepeatSelection:
                    nextMode = PlayMode.Continue;
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
