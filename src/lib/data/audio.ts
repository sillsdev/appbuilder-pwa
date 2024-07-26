import config from '$lib/data/config';
import {
    audioHighlightElements,
    playMode,
    defaultPlayMode,
    PLAYMODE_CONTINUE,
    PLAYMODE_STOP,
    PLAYMODE_REPEAT_PAGE,
    PLAYMODE_REPEAT_SELECTION
} from '$lib/data/stores';
import { refs, audioPlayer as audioPlayerStore, audioPlayerDefault } from '$lib/data/stores';
import { MRUCache } from '$lib/data/mrucache';
import { base } from '$app/paths';
import { pathJoin } from '$lib/scripts/stringUtils';
import { logAudioDuration, logAudioPlay } from './analytics';
export interface AudioPlayer {
    audio: HTMLAudioElement;
    loaded: boolean;
    duration: number;
    progress: number;
    playing: boolean;
    timeIndex: number;
    timing: Array<any>;
    collection: string;
    book: string;
    chapter: string;
    timer: number;
    playStart: number;
}
const cache = new MRUCache<string, AudioPlayer>(10);
export let currentAudioPlayer;
audioPlayerStore.subscribe(async (value) => {
    currentAudioPlayer = value;
    await getAudio();
});
export let currentPlayMode;
playMode.subscribe((value) => {
    if (
        currentPlayMode &&
        currentPlayMode.mode !== value.mode &&
        value.mode === PLAYMODE_REPEAT_SELECTION
    ) {
        value.range = getCurrentVerseTiming();
    }
    currentPlayMode = value;
});
// produces the cache key for the mru audio cache
function cacheKey(collection, book, chapter) {
    return `${collection}-${book}-${chapter}`;
}
// builds a collection of audio players which can be switched between
export function updateAudioPlayer(item: { collection: string; book: string; chapter: string }) {
    const key = cacheKey(item.collection, item.book, item.chapter);
    let audioPlayer = cache.get(key);
    if (!audioPlayer) {
        audioPlayer = { ...item, ...audioPlayerDefault };
        cache.put(key, audioPlayer);
    } else {
        if (audioPlayer.audio) {
            audioPlayer.audio.currentTime = 0;
            audioPlayer.progress = 0;
            audioPlayer.timeIndex = 0;
        }
    }
    audioPlayerStore.set(audioPlayer);
}
// some browsers don't support all sources (e.g. Mobile Safari doesn't support webm)
function createAudio(audioSource: string): HTMLAudioElement {
    const audio: HTMLAudioElement = new Audio();

    // If you do 'new Audio(audioSource)', it won't look at additional sources
    var source = document.createElement('source');
    source.src = audioSource;
    audio.appendChild(source);

    // webm isn't supported by MobileSafari, so add fallback for caf and mp3 (like static PWA)
    if (/\.webm$/i.test(audioSource)) {
        // Create additional source elements
        var sourceCaf = document.createElement('source');
        sourceCaf.src = audioSource.replace(/\.webm$/i, '.caf');
        sourceCaf.type = 'audio/x-caf';

        var sourceMp3 = document.createElement('source');
        sourceMp3.src = audioSource.replace(/\.webm$/i, '.mp3');
        sourceMp3.type = 'audio/mpeg';

        // Add additional source elements to the audio element
        audio.appendChild(sourceCaf);
        audio.appendChild(sourceMp3);
    }
    return audio;
}
//gets the current audio
async function getAudio() {
    if (currentAudioPlayer.loaded) {
        return;
    }
    currentAudioPlayer.duration = 0;
    currentAudioPlayer.progress = 0;
    if (currentAudioPlayer.playing) {
        pause();
    }
    const audioSourceInfo = await getAudioSourceInfo(currentAudioPlayer);
    if (!audioSourceInfo) {
        return;
    }
    currentAudioPlayer.timing = audioSourceInfo.timing;
    const a = createAudio(audioSourceInfo.source);
    a.onloadedmetadata = () => {
        currentAudioPlayer.duration = a.duration;
        currentAudioPlayer.timeIndex = 0;
        currentAudioPlayer.loaded = true;
        currentAudioPlayer.audio = a;
        audioPlayerStore.set(currentAudioPlayer);
        updateTime();
    };
}
// plays or pauses the audio
export function playPause() {
    if (!currentAudioPlayer.loaded) return;
    if (currentAudioPlayer.playing === true) {
        pause();
    } else {
        play();
    }
    audioPlayerStore.set(currentAudioPlayer);
}
// changes chapter
export async function skip(direction) {
    pause();
    await refs.skip(direction);
}
// formats timing information
export function format(seconds) {
    if (isNaN(seconds)) return '0:00';

    const minutes = Math.floor(seconds / 60);
    seconds = Math.floor(seconds % 60);
    if (seconds < 10) seconds = '0' + seconds;
    return `${minutes}:${seconds}`;
}
// changes the phrase of the audio
export async function changeVerse(direction) {
    if (!currentAudioPlayer.loaded) return;
    const playing = currentAudioPlayer.playing;
    pause();
    if (direction >= 0) {
        if (
            currentAudioPlayer.timing[currentAudioPlayer.timeIndex] !=
            currentAudioPlayer.timing.at(-1)
        ) {
            currentAudioPlayer.timeIndex++;
            const newtime = currentAudioPlayer.timing[currentAudioPlayer.timeIndex].starttime;
            currentAudioPlayer.audio.currentTime = newtime;
            updateTime();
        } else {
            await skip(1);
        }
    } else {
        if (currentAudioPlayer.timeIndex > 0) {
            currentAudioPlayer.timeIndex--;
        }
        currentAudioPlayer.audio.currentTime =
            currentAudioPlayer.timing[currentAudioPlayer.timeIndex].starttime;
        updateTime();
    }
    if (playing) {
        play();
    }
}
export function seek(position) {
    const playing = currentAudioPlayer.playing;
    pause();
    if (currentAudioPlayer.audio) {
        currentAudioPlayer.audio.currentTime = position;
    } else {
        console.log('audio seek: current audio player audio missing ');
    }
    currentAudioPlayer.progress = position;
    playMode.set({ ...currentPlayMode, range: getCurrentVerseTiming() });
    audioPlayerStore.set(currentAudioPlayer);
    if (playing === true) {
        play();
    }
}
let warmdown = undefined;
async function handlePlayMode() {
    if (warmdown) {
        warmdown--;
        if (warmdown === 0) {
            if (currentPlayMode.mode === PLAYMODE_CONTINUE) {
                await skip(1);
                playMode.set({ ...currentPlayMode, continue: true });
            } else if (currentPlayMode.mode === PLAYMODE_REPEAT_PAGE) {
                seek(0);
            } else if (currentPlayMode.mode === PLAYMODE_REPEAT_SELECTION) {
                seek(currentPlayMode.range.start);
                play();
            }
            warmdown = undefined;
        }
        return;
    }
    if (currentAudioPlayer.audio.ended) {
        if (currentPlayMode.mode === PLAYMODE_STOP) {
            pause();
            audioPlayerStore.set(currentAudioPlayer);
        } else {
            warmdown = 5;
        }
        return;
    }
    if (currentPlayMode.mode === PLAYMODE_CONTINUE && currentPlayMode.continue) {
        playMode.set({ ...currentPlayMode, continue: false });
        play();
    }
    if (currentPlayMode.mode === PLAYMODE_REPEAT_SELECTION) {
        if (currentPlayMode.range === defaultPlayMode.range) {
            const resultArray = getCurrentVerseTiming();
            if (resultArray.start === undefined || resultArray.end === undefined) {
                return;
            }
            playMode.set({
                ...currentPlayMode,
                range: { start: resultArray.start, end: resultArray.end }
            });
        }
        if (currentAudioPlayer.progress + 0.05 > currentPlayMode.range.end) {
            pause();
            warmdown = 5;
        }
    }
}
// gets the current verse start and end tag
function getCurrentVerseTiming() {
    let end;
    let start;
    for (let i = 0; i < currentAudioPlayer.timing.length; i++) {
        const timing = currentAudioPlayer.timing[i];
        if (
            currentAudioPlayer.progress >= timing.starttime &&
            currentAudioPlayer.progress < timing.endtime
        ) {
            const verseNumber = parseInt(timing.tag, 10);
            for (let k = i + 1; k >= 0; k--) {
                const startVerseNumber = parseInt(currentAudioPlayer.timing[k].tag, 10);
                if (startVerseNumber !== verseNumber) {
                    start = currentAudioPlayer.timing[k + 1].tag;
                    break;
                }
                if (k === 0) {
                    start = currentAudioPlayer.timing.tag;
                    break;
                }
            }
            for (let j = i + 1; j < currentAudioPlayer.timing.length; j++) {
                const endVerseNumber = parseInt(currentAudioPlayer.timing[j].tag, 10);
                if (endVerseNumber !== verseNumber) {
                    end = currentAudioPlayer.timing[j - 1].tag;
                    break;
                }
                if (j === currentAudioPlayer.timing.length - 1) {
                    end = currentAudioPlayer.timing.tag;
                    break;
                }
            }
            break;
        }
    }
    return getVerseTimingRange(start, end);
}
// function get range of current index all labels of the current verse playing
// calls updatehighlights() to see if highlights need to be change
async function updateTime() {
    if (!currentAudioPlayer.loaded) {
        return;
    }
    currentAudioPlayer.progress = currentAudioPlayer.audio.currentTime;
    if (!currentAudioPlayer.timing && currentAudioPlayer.progress) {
        audioPlayerStore.set(currentAudioPlayer);
    }
    if (currentAudioPlayer.timing && currentAudioPlayer.progress) {
        updateHighlights();
    }
    await handlePlayMode();
}
// calls updateTime() every 100ms
function toggleTimeRunning() {
    if (currentAudioPlayer.audio.ended || currentAudioPlayer.playing === false) {
        clearInterval(currentAudioPlayer.timer);
        currentAudioPlayer.timer = null;
    } else {
        currentAudioPlayer.timer = setInterval(() => updateTime(), 100);
    }
    return;
}
// checks if audio has played
export function hasAudioPlayed() {
    return currentAudioPlayer.progress > 0;
}
function pause() {
    if (!currentAudioPlayer.loaded) return;
    if (currentAudioPlayer.playing) {
        currentAudioPlayer.audio?.pause();
        logAudioDuration(currentAudioPlayer);
        currentAudioPlayer.playing = false;
    }
    toggleTimeRunning();
}

export function play() {
    if (!currentAudioPlayer.loaded) return;
    if (!currentAudioPlayer.playing) {
        currentAudioPlayer.audio?.play();
        currentAudioPlayer.playStart = Date.now();
        logAudioPlay(currentAudioPlayer);
        currentAudioPlayer.playing = true;
    }
    toggleTimeRunning();
}
// selects the tag to highlight
function updateHighlights() {
    const highlights = [];
    let tag = '';
    for (let i = 0; i < currentAudioPlayer.timing.length; i++) {
        const timing = currentAudioPlayer.timing[i];
        if (
            currentAudioPlayer.progress >= timing.starttime &&
            currentAudioPlayer.progress < timing.endtime
        ) {
            currentAudioPlayer.timeIndex = i;
            highlights.push(timing.tag);
        }
    }
    return audioHighlightElements.set(highlights);
}
export function updatePlaybackSpeed(playbackSpeed) {
    if (currentAudioPlayer.audio != null && playbackSpeed) {
        currentAudioPlayer.audio.playbackRate = parseFloat(playbackSpeed);
    }
}
function getDamId(audioSource: any) {
    let damId = audioSource.damId;
    if (damId.endsWith('-opus16')) {
        // Check to see if the browser can handle webm files.
        const audio = new Audio();
        if (!audio.canPlayType('audio/webm')) {
            damId = damId.replace(/-opus16$/, '');
        }
    }
    return damId;
}
export async function getAudioSourceInfo(item: {
    collection: string;
    book: string;
    chapter: string;
}) {
    //search config for audio on provided collection, book, and chapter
    const audio = config.bookCollections
        .find((c) => item.collection === c.id)
        ?.books?.find((b) => b.id === item.book)
        ?.audio?.find((a) => item.chapter === '' + a.num);
    if (!audio) {
        return;
    }

    const audioSource = config.audio.sources[audio.src];
    let audioPath = null;

    if (audioSource.type === 'fcbh') {
        const dbp4 = audioSource.address ? audioSource.address : 'https://4.dbt.io';
        // if (source.accessMethods.includes('download')) {
        //    // TODO: Figure out how to use Cache API to download audio to PWA
        // }
        const damId = getDamId(audioSource);
        const request = `${dbp4}/api/bibles/filesets/${damId}/${item.book}/${item.chapter}?v=4&key=${audioSource.key}`;
        const response = await fetch(request, {
            method: 'GET',
            headers: {
                accept: 'application/json'
            }
        });
        const result = await response.json();
        if (result.error) {
            throw `Failed to connect to BibleBrain: ${result.error}`;
        }

        audioPath = result.data[0].path;
    } else if (audioSource.type === 'assets') {
        audioPath = pathJoin(['/audio/', audio.filename]);
    } else if (audioSource.type === 'download') {
        audioPath = pathJoin([audioSource.address, audio.filename]);
    }
    //parse timing file
    const timing = [];
    if (audio.timingFile) {
        const timeFilePath = `${base}/timings/${audio.timingFile}`;
        const response = await fetch(timeFilePath);
        if (!response.ok) {
            throw new Error('Failed to read file');
        }
        const timingFile = await response.text();

        const lines = timingFile.split('\n');
        timing.push({
            starttime: 0.0,
            endtime: 0.0,
            tag: 'title'
        });

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line) {
                if (line.startsWith('\\')) {
                    continue;
                }
                const parts = line.split('\t');
                timing.push({
                    starttime: parseFloat(parts[0]),
                    endtime: parseFloat(parts[1]),
                    tag: parts[2]
                });
            }
        }
    }

    return {
        source: audioPath,
        timing: timing.length > 0 ? timing : null
    };
}
// This function can be called when the text selection toolbar play button is clicked on and it changes the audio to the start of the verse clicked on
export function seekToVerse(verseClicked) {
    if (!currentAudioPlayer.timing) {
        return;
    }
    const elements = currentAudioPlayer.timing;
    for (let i = 0; i < elements.length; i++) {
        const tag = currentAudioPlayer.timing[i].tag;
        // Handle timing tags that are just the verse number
        let containsAlpha = /[a-z]/.test(tag);
        const adjustedTag = containsAlpha ? tag : tag + 'a';
        if (verseClicked === adjustedTag) {
            const newtime = currentAudioPlayer.timing[i].starttime;
            seek(newtime);
            break;
        }
    }
    //forces highlighting change
    updateTime();
}
// takes a start and end tag and returns the range of times
function getVerseTimingRange(startverse, endverse) {
    const elements = currentAudioPlayer.timing;
    let start;
    for (let i = 0; i < elements.length; i++) {
        const tag = currentAudioPlayer.timing[i].tag;
        if (startverse === tag) {
            const newstarttime = currentAudioPlayer.timing[i].starttime;
            start = newstarttime;
        }
        if (endverse === tag) {
            const newendtime = currentAudioPlayer.timing[i].endtime;
            const end = newendtime;
            const range = { start, end };
            return range;
        }
    }
}
