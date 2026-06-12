import { scriptureConfig } from '$assets/config';
import { MRUCache } from '$lib/data/mrucache';
import {
    audioHighlightElements,
    audioPlayerDefault,
    audioPlayer as audioPlayerStore,
    defaultPlayMode,
    playMode,
    PlayMode,
    refs,
    type AudioPlayer,
    type PlayModeRange,
    type PlayModeSettings,
    type Timing
} from '$lib/data/stores';
import { pathJoin } from '$lib/scripts/stringUtils';
import { logAudioDuration, logAudioPlay } from './analytics';

const audioSources = import.meta.glob('./*', {
    import: 'default',
    eager: true,
    query: '?url',
    base: '/src/gen-assets/audio'
}) as Record<string, string>;

const timings = import.meta.glob('./*', {
    import: 'default',
    eager: true,
    query: '?url',
    base: '/src/gen-assets/timings'
}) as Record<string, string>;

const AUDIO_SEEK_THRESHOLD = 2.0;

const cache = new MRUCache<string, AudioPlayer>(10);
let currentAudioPlayer: AudioPlayer | undefined = undefined;
audioPlayerStore.subscribe(async (value: AudioPlayer) => {
    currentAudioPlayer = value;
    await getAudio();
});
let currentPlayMode: PlayModeSettings | undefined = undefined;
playMode.subscribe((value) => {
    currentPlayMode = value;
});
// produces the cache key for the mru audio cache
function cacheKey(collection: string, book: string, chapter: string) {
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
    const source = document.createElement('source');
    source.src = audioSource;
    audio.appendChild(source);

    // webm isn't supported by MobileSafari, so add fallback for caf and mp3 (like static PWA)
    if (/\.webm$/i.test(audioSource)) {
        // Create additional source elements
        const sourceCaf = document.createElement('source');
        sourceCaf.src = audioSource.replace(/\.webm$/i, '.caf');
        sourceCaf.type = 'audio/x-caf';

        const sourceMp3 = document.createElement('source');
        sourceMp3.src = audioSource.replace(/\.webm$/i, '.mp3');
        sourceMp3.type = 'audio/mpeg';

        // Add additional source elements to the audio element
        audio.appendChild(sourceCaf);
        audio.appendChild(sourceMp3);
    } else if (/\.3gp$/i.test(audioSource)) {
        // Create additional source elements
        const sourceMp3 = document.createElement('source');
        sourceMp3.src = audioSource.replace(/\.3gp$/i, '.mp3');
        sourceMp3.type = 'audio/mpeg';

        // Add additional source elements to the audio element
        audio.appendChild(sourceMp3);
    }
    return audio;
}
//gets the current audio
async function getAudio() {
    if (!currentAudioPlayer || currentAudioPlayer.loaded) {
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
        currentAudioPlayer!.duration = a.duration;
        currentAudioPlayer!.timeIndex = 0;
        currentAudioPlayer!.loaded = true;
        currentAudioPlayer!.audio = a;
        audioPlayerStore.set(currentAudioPlayer!);
        updateTime();
    };
}

/**
 * If the current audio is loaded, toggles its playing state.
 */
export function playPause() {
    if (!currentAudioPlayer?.loaded) {
        console.error("Warning: tried to playPause() audio that wasn't loaded");
        return;
    }

    if (currentAudioPlayer.playing) {
        pause();
    } else {
        if (
            currentPlayMode &&
            currentPlayMode.range !== defaultPlayMode.range &&
            currentAudioPlayer.progress > currentPlayMode.range.end
        ) {
            resetVersePlaybackRange();
        }

        play();
    }
}

/**
 * If the current audio is loaded and playing, pauses it.
 */
export function playStop() {
    if (!currentAudioPlayer?.loaded) {
        console.error("Warning: tried to playStop() audio that wasn't loaded");
        return;
    }

    if (currentAudioPlayer.playing) {
        pause();
    }
}

// changes chapter
export async function skip(direction: number) {
    const wasPlaying = currentAudioPlayer?.playing;
    pause();

    if (!currentAudioPlayer?.loaded || !currentAudioPlayer.timing) {
        if (
            direction < 0 &&
            currentAudioPlayer?.progress &&
            currentAudioPlayer.progress >= AUDIO_SEEK_THRESHOLD
        ) {
            seek(0);
            if (wasPlaying) {
                play();
            }
        } else {
            await refs.skip(direction);
            playMode.reset();
        }
    } else {
        const headingMarkers = getHeadingMarkers();

        if (!currentAudioPlayer?.headingMarkers) {
            currentAudioPlayer.headingMarkers = headingMarkers;
            audioPlayerStore.set(currentAudioPlayer);
        }

        let finalIntermediateMarker;
        if (headingMarkers.length > 1) {
            finalIntermediateMarker = headingMarkers.at(-2);
        }

        if (
            (direction < 0 && currentAudioPlayer.progress < AUDIO_SEEK_THRESHOLD) ||
            (direction >= 0 &&
                finalIntermediateMarker &&
                currentAudioPlayer.progress >= finalIntermediateMarker)
        ) {
            await refs.skip(direction);
            playMode.reset();
            return;
        }


        console.log(`(1) skip: currentAudioPlayer: progress is now ${currentAudioPlayer.progress}`);
        for (let i = 1; i < currentAudioPlayer.headingMarkers.length; i++) {
            const marker = currentAudioPlayer.headingMarkers[i];
            if (currentAudioPlayer.progress < marker + AUDIO_SEEK_THRESHOLD) {
                if (direction < 0) {
                    console.log(`skip: seeking to previous heading`)
                    seek(currentAudioPlayer.headingMarkers[i - 1]);
                } else if (
                    i < currentAudioPlayer.headingMarkers.length - 1 &&
                    currentAudioPlayer.progress >= marker
                ) {
                    console.log(`skip: seeking to next heading`)
                    seek(currentAudioPlayer.headingMarkers[i + 1]);
                } else {
                    console.log(`skip: seeking to current heading`)
                    seek(marker);
                }
                if (wasPlaying) {
                    play();
                }
                break;
            }
        }
    }

    updateTime();
}

function getHeadingMarkers() {
    if (currentAudioPlayer?.headingMarkers) {
        return currentAudioPlayer.headingMarkers;
    }

    const headingMarkers = [0.0];

    const headings = document.querySelectorAll('div.s');
    headings.forEach((h) => {
        let next = nextElementDFS(h);
        while (next && !next?.getAttribute('data-verse')) {
            // console.log(`searching ${next.outerHTML}...`);
            next = nextElementDFS(next);
        }
        // console.log(`found ${next}`);

        // If defined this is the first verse immediately after the heading
        const verse = next?.getAttribute('data-verse');
        if (verse === null || verse === undefined) {
            return;
        }

        // find() always returns the first element it matches, so
        // this will locate the beginning of the first phrase of the verse
        const marker = currentAudioPlayer?.timing?.find((v) => v.tag.includes(verse))?.starttime;
        if (marker) {
            headingMarkers.push(marker);
        }
    });

    const endMarker = currentAudioPlayer?.timing?.at(-1)?.endtime || currentAudioPlayer?.duration;
    if (typeof endMarker === 'number') {
        headingMarkers.push(endMarker);
    }

    console.log(`headingMarkers: ${headingMarkers}`);

    return headingMarkers;
}

function nextElementDFS(e: Element) {
    let next = e.firstElementChild || e.nextElementSibling;
    if ((next instanceof Element)) {
        return next;
    }

    let ancestor = e.parentElement;
    while (ancestor instanceof Element && !ancestor.nextElementSibling) {
        ancestor = ancestor.parentElement;
    }
    return ancestor?.nextElementSibling || null;
}

// formats timing information
export function format(seconds: number) {
    if (isNaN(seconds)) {
        return '0:00';
    }

    const minutes = Math.floor(seconds / 60);
    seconds = Math.floor(seconds % 60);
    const sPrefix = seconds < 10 ? '0' : '';
    return `${minutes}:${sPrefix}${seconds}`;
}

/**
 * Seeks to the next audio phrase in the given direction.
 * @param direction the direction to seek (backwards if negative, forwards otherwise)
 */
export async function changeVerse(direction: number) {
    if (!currentAudioPlayer?.loaded) {
        console.error('Warning: tried to change audio verse before audio was loaded');
        return;
    }

    const wasPlaying = currentAudioPlayer.playing;
    pause();

    if (direction >= 0) {
        if (
            currentAudioPlayer.timing?.[currentAudioPlayer.timeIndex] !=
            currentAudioPlayer.timing?.at(-1)
        ) {
            currentAudioPlayer.timeIndex++;
        } else {
            await skip(1);
        }
    } else {
        if (currentAudioPlayer.timeIndex > 0) {
            currentAudioPlayer.timeIndex--;
        }
    }

    const newtime = currentAudioPlayer.timing?.[currentAudioPlayer.timeIndex].starttime;
    if (newtime && currentAudioPlayer.audio) {
        seek(newtime);
    }
    if (wasPlaying) {
        play();
    }
}

export async function seekOffset(offset: number) {
    const playing = currentAudioPlayer?.playing;
    pause();
    if (currentAudioPlayer?.audio) {
        let time = (currentAudioPlayer.audio.currentTime += offset);
        if (time > currentAudioPlayer.duration) {
            await skip(1);
        } else {
            if (time < 0) {
                time = 0;
            }

            currentAudioPlayer.audio.currentTime = time;
            updateTime();
        }
    } else {
        console.log('audio seekOffset: current audio player audio missing ');
    }
    if (playing === true) {
        play();
    }
}

/**
 * Moves the audio player to the given number of seconds from the start.
 * @param position the target location in seconds from the beginning of the track
 */
export function seek(position: number) {
    if (!currentAudioPlayer) {
        console.error('Warning: missing audio player in seek()');
        return;
    } else if (!currentAudioPlayer.audio) {
        console.error('Warning: null audio element in seek()');
        return;
    }

    // If the audio is playing, we'll need to resume after the seek
    const wasPlaying = currentAudioPlayer.playing;
    if (wasPlaying) {
        pause();
    }

    currentAudioPlayer.audio.currentTime = position;
    currentAudioPlayer.progress = position;
    audioPlayerStore.set(currentAudioPlayer);
    updateHighlights();

    if (wasPlaying) {
        play();
    }
}

// Tracks delay before repeating audio section or continuing to next
let warmdown: number | undefined = undefined;

/**
 * Updates the audio playback according to the current playback mode.
 */
async function handlePlayMode() {
    if (warmdown) {
        warmdown--;
        if (warmdown === 0) {
            if (currentPlayMode?.mode === PlayMode.Continue) {
                await skip(1);
                playMode.set({ ...currentPlayMode, continue: true });
            } else if (currentPlayMode?.mode === PlayMode.RepeatPage) {
                seek(0);
            } else if (currentPlayMode?.mode === PlayMode.RepeatSelection) {
                seek(currentPlayMode.range.start);
                play();
            }
            warmdown = undefined;
        }
        return;
    }
    if (currentAudioPlayer?.audio?.ended) {
        if (currentPlayMode?.mode === PlayMode.Stop) {
            pause();
        } else {
            warmdown = 5;
        }
        return;
    }
    if (currentPlayMode?.mode === PlayMode.Continue && currentPlayMode.continue) {
        playMode.set({ ...currentPlayMode, continue: false });
        play();
    }
    if (currentPlayMode?.mode === PlayMode.RepeatSelection) {
        if (currentPlayMode.range === defaultPlayMode.range) {
            const resultArray = getCurrentVerseTiming();
            if (resultArray?.start === undefined || resultArray.end === undefined) {
                return;
            }
            playMode.set({
                ...currentPlayMode,
                range: { start: resultArray.start, end: resultArray.end }
            });
        }
        if (
            currentAudioPlayer?.playing &&
            (currentAudioPlayer?.progress ?? 0) + 0.05 > currentPlayMode.range.end
        ) {
            pause({ keepListening: true });
            warmdown = 5;
        }
    }
}

/**
 * Returns the audio timestamp range for the current verse.
 */
function getCurrentVerseTiming() {
    if (!currentAudioPlayer?.timing) {
        console.error(`Warning in getCurrentVerseTiming(): ` + 'missing audio timing data');
        return defaultPlayMode.range;
    }

    // If in the first or title segment, treat the first verse as current
    if (currentAudioPlayer.progress < currentAudioPlayer.timing[1].starttime) {
        return getVerseTimingRange('1', '1');
    }

    let start = 0,
        end = 0;

    for (let i = 1; i < currentAudioPlayer.timing.length; i++) {
        const timing = currentAudioPlayer.timing[i];
        if (
            currentAudioPlayer.progress >= timing.starttime &&
            currentAudioPlayer.progress < timing.endtime
        ) {
            const verseNumber = parseInt(timing.tag, 10);

            // Step backwards until we reach the previous verse
            for (let k = i - 1; k >= 0; k--) {
                const startVerseNumber = parseInt(currentAudioPlayer.timing[k].tag, 10);
                // The last tag of the previous verse is the closest
                // to the current tag to have a different verse number
                if (startVerseNumber !== verseNumber) {
                    start = currentAudioPlayer.timing[k + 1].starttime;
                    break;
                }
            }

            // Step forwards until we reach the next verse
            for (let j = i + 1; j < currentAudioPlayer.timing.length; j++) {
                const endVerseNumber = parseInt(currentAudioPlayer.timing[j].tag, 10);
                if (endVerseNumber !== verseNumber) {
                    end = currentAudioPlayer.timing[j - 1].endtime;
                    break;
                }
                // If we've gone to the end of the section without progressing
                // to the next verse, assume we're at the last tag
                if (j === currentAudioPlayer.timing.length - 1) {
                    end = currentAudioPlayer.timing[j].endtime;
                    break;
                }
            }
            break;
        }
    }

    if (end === 0) {
        console.error('Warning: failed to get current verse timing range, falling back to default');
        return defaultPlayMode.range;
    }

    return { start, end } as PlayModeRange;
}

/**
 * Sets the playback range to the start and end of the current verse
 */
function resetVersePlaybackRange() {
    playMode.set({ ...(currentPlayMode || defaultPlayMode), range: getCurrentVerseTiming() });
}

/**
 * Updates the audio player store, playback mode, and text highlights.
 * This method is designed to be called via `setInterval()`.
 */
async function updateTime() {
    if (!currentAudioPlayer?.loaded) {
        console.error('Warning: tried to updateTime() for audio before it was loaded');
        return;
    }
    currentAudioPlayer.progress = currentAudioPlayer.audio?.currentTime ?? 0;
    if (!currentAudioPlayer.timing) {
        audioPlayerStore.set(currentAudioPlayer);
    }
    if (currentAudioPlayer.hasPlayed && currentAudioPlayer.timing) {
        updateHighlights();
    }
    await handlePlayMode();
}

/**
 * If audio is playing, starts the audio update interval callback;
 * otherwise if playback has stopped, clears the interval callback.
 */
function updateAudioHandler() {
    if (!currentAudioPlayer?.audio) {
        console.error('Warning: tried to update handler for missing audio');
        return;
    }

    if (currentAudioPlayer.audio.ended || !currentAudioPlayer.playing) {
        // Separate this condition check since we don't want to call
        // setInterval (the else case) unless the audio is actually playing
        if (currentAudioPlayer.timer) {
            clearInterval(currentAudioPlayer.timer);
            currentAudioPlayer.timer = null;
        }
    } else if (!currentAudioPlayer.timer) {
        currentAudioPlayer.timer = setInterval(() => updateTime(), 100);
    }
    return;
}

// checks if audio has played
export function hasAudioPlayed() {
    return (currentAudioPlayer?.progress ?? 0) > 0;
}

/**
 * Pauses audio if currently playing. Optionally keeps the audio update interval active.
 */
function pause(options?: { keepListening: boolean }) {
    if (!currentAudioPlayer?.loaded) {
        console.error('Warning: tried to pause() audio before it was loaded');
        return;
    }

    if (currentAudioPlayer.playing) {
        currentAudioPlayer.audio?.pause();
        logAudioDuration(currentAudioPlayer);
        currentAudioPlayer.playing = false;
        if (!options?.keepListening) {
            updateAudioHandler();
        }
        audioPlayerStore.set(currentAudioPlayer);
    }
}

/**
 * Plays audio if currently paused.
 */
export function play() {
    if (!currentAudioPlayer?.loaded) {
        console.error('Warning: tried to play() audio before it was loaded');
        return;
    }

    if (!currentAudioPlayer.playing) {
        if (!currentAudioPlayer.hasPlayed) {
            currentAudioPlayer.hasPlayed = true;
        }
        currentAudioPlayer.audio?.play();
        currentAudioPlayer.playStart = Date.now();
        logAudioPlay(currentAudioPlayer);
        currentAudioPlayer.playing = true;
        updateAudioHandler();
        audioPlayerStore.set(currentAudioPlayer);
    }
}

/**
 * Begins audio playback at beginning of startVerse, repeating after endverse
 * if endVerse is provided.
 * @param startVerse the verse at which to start playback
 * @param endVerse   the verse after which to loop playback
 */
export function playVerses(startVerse: string, endVerse?: string) {
    let mode: PlayMode, range: PlayModeRange;

    if (endVerse) {
        mode = PlayMode.RepeatSelection;
        range =
            getVerseTimingRange(startVerse, endVerse) || //
            defaultPlayMode.range;
    } else {
        mode = currentPlayMode?.mode || defaultPlayMode.mode;
        range =
            getVerseTimingRange(startVerse, startVerse) || //
            defaultPlayMode.range;
    }

    playMode.set({ mode, range });
    seekToVerse(startVerse);
    play();
}

// selects the tag to highlight
function updateHighlights() {
    const highlights = [];
    for (let i = 0; i < (currentAudioPlayer?.timing?.length ?? 0); i++) {
        const timing = currentAudioPlayer!.timing![i];
        if (
            currentAudioPlayer!.progress >= timing.starttime &&
            currentAudioPlayer!.progress < timing.endtime
        ) {
            currentAudioPlayer!.timeIndex = i;
            highlights.push(timing.tag);
        }
    }
    return audioHighlightElements.set(highlights);
}
export function updatePlaybackSpeed(playbackSpeed: string) {
    if (currentAudioPlayer?.audio && playbackSpeed) {
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
export async function getAudioSourceInfo(
    item: Partial<{
        collection: string;
        book: string;
        chapter: string;
    }>
) {
    //search config for audio on provided collection, book, and chapter
    const audio = scriptureConfig.bookCollections
        ?.find((c) => item.collection === c.id)
        ?.books?.find((b) => b.id === item.book)
        ?.audio?.find((a) => item.chapter === '' + a.num);
    if (!audio) {
        return;
    }

    const audioSource = scriptureConfig.audio?.sources[audio.src];
    let audioPath = null;

    if (audioSource?.type === 'fcbh') {
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
    } else if (audioSource?.type === 'assets') {
        const audioKey = `./${audio.filename}`;
        if (!audioSources[audioKey]) {
            throw new Error(`Audio file not found in generated assets: ${audio.filename}`);
        }
        audioPath = audioSources[audioKey];
    } else if (audioSource?.type === 'download') {
        audioPath = pathJoin([audioSource.address, audio.filename]);
    }
    //parse timing file
    const timing: Timing[] = [];
    if (audio.timingFile) {
        const timingKey = `./${audio.timingFile}`;
        if (!timings[timingKey]) {
            throw new Error(`Timing file not found in generated assets: ${audio.timingFile}`);
        }
        const timeFilePath = timings[timingKey];
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

/**
 * Seeks to the start of the first audio tag for the specified verse
 * @param verse the verse to seek
 */
export function seekToVerse(verse: string) {
    if (!currentAudioPlayer?.timing) {
        console.error(`Warning in seekToVerse(${verse}): ` + 'missing audio timing data');
        return;
    }

    for (let i = 0; i < currentAudioPlayer.timing.length; i++) {
        const timing = currentAudioPlayer.timing[i];
        // Handle case where tag has form '9a' for first tag in verse 9
        if (timing.tag === verse || timing.tag === verse + 'a') {
            seek(timing.starttime);
            return;
        }
    }
}

/**
 * Returns an audio timing range bounded by the first tag of startVerse
 * and the last tag of endVerse
 * @param startVerse the first verse of the range
 * @param endVerse   the last verse of the range
 */
function getVerseTimingRange(startVerse: string, endVerse: string) {
    if (!currentAudioPlayer?.timing) {
        console.error(
            `Warning in getVerseTimingRange(${startVerse}-${endVerse}): ` +
                'missing audio timing data'
        );
        return defaultPlayMode.range;
    }

    let start = 0,
        end = 0;
    const finalTiming = currentAudioPlayer.timing.at(-1)!;
    const finalVerseNumber = parseInt(finalTiming.tag);

    for (let i = 0; i < currentAudioPlayer.timing.length; i++) {
        const timing = currentAudioPlayer.timing[i];

        // Tags like '9' or '9a' would both represent the first tag in verse 9
        if (timing.tag === startVerse || timing.tag === startVerse + 'a') {
            start = timing.starttime;
        }

        // If end verse has a single numeric tag, that is the last tag
        if (timing.tag === endVerse) {
            end = timing.endtime;
            break;
        }

        const verseNumber = parseInt(timing.tag);
        if (verseNumber === parseInt(endVerse) + 1) {
            // The current timing tag is the first in the next verse after endVerse,
            // so the previous timing tag is the last tag in endVerse
            end = currentAudioPlayer.timing[i - 1].endtime;
            break;
        } else if (verseNumber === finalVerseNumber) {
            end = finalTiming.endtime;
            break;
        }
    }

    return { start, end } as PlayModeRange;
}
