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
    type PlayModeSettings,
    type Timing
} from '$lib/data/stores';
import type { PlayModeRange } from '$lib/data/stores';
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

const cache = new MRUCache<string, AudioPlayer>(10);
let currentAudioPlayer: AudioPlayer | undefined = undefined;
audioPlayerStore.subscribe(async (value: AudioPlayer) => {
    currentAudioPlayer = value;
    await getAudio();
});
let currentPlayMode: PlayModeSettings | undefined = undefined;
playMode.subscribe((value) => {
    // if (
    //     currentPlayMode &&
    //     currentPlayMode.mode !== value.mode &&
    //     value.mode === PlayMode.RepeatSelection
    // ) {
    //     const timing = getCurrentVerseTiming();
    //     console.log(`playMode listener: resetting range to ${timing.start}-${timing.end}`);
    //     value.range = timing || value.range;
    // }
    currentPlayMode = value;
    console.log(`playMode listener: ${currentPlayMode.mode}`);
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
// plays or pauses the audio
export function playPause() {
    if (currentAudioPlayer?.loaded) {
        currentAudioPlayer.playing? pause() : play();
    }
}
// stops playing audio
export function playStop() {
    if (currentAudioPlayer?.loaded && currentAudioPlayer.playing) {
        pause()
    };
}
// changes chapter
export async function skip(direction: number) {
    pause();
    await refs.skip(direction);
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
// changes the phrase of the audio
export async function changeVerse(direction: number) {
    if (!currentAudioPlayer?.loaded) {
        return;
    }
    const playing = currentAudioPlayer.playing;
    pause();
    if (direction >= 0) {
        if (
            currentAudioPlayer.timing?.[currentAudioPlayer.timeIndex] !=
            currentAudioPlayer.timing?.at(-1)
        ) {
            currentAudioPlayer.timeIndex++;
            const newtime = currentAudioPlayer.timing?.[currentAudioPlayer.timeIndex].starttime;
            if (newtime && currentAudioPlayer.audio) {
                currentAudioPlayer.audio.currentTime = newtime;
                updateTime();
            }
        } else {
            await skip(1);
        }
    } else {
        if (currentAudioPlayer.timeIndex > 0) {
            currentAudioPlayer.timeIndex--;
        }
        if (currentAudioPlayer.audio && currentAudioPlayer.timing) {
            currentAudioPlayer.audio.currentTime =
                currentAudioPlayer.timing?.[currentAudioPlayer.timeIndex].starttime;
        }
        updateTime();
    }
    if (playing) {
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
export function seek(position: number) {
    if (!currentAudioPlayer) {
        console.error("Warning: missing audio player in seek()");
        return;
    } else if (!currentAudioPlayer.audio) {
        console.error("Warning: null audio element in seek()");
        return;
    }

    // If the audio is playing, we'll need to resume after the seek
    const wasPlaying = currentAudioPlayer.playing;
    if (wasPlaying) pause();

    // const timing = getCurrentVerseTiming();
    // console.log(`seek: target position ${position}, verse ${timing?.start}-${timing?.end}`);
    // if (timing) {
    //     playMode.set({ ...(currentPlayMode ?? { mode: defaultPlayMode.mode }), range: timing });
    // }

    currentAudioPlayer.audio.currentTime = position;
    currentAudioPlayer.progress = position;
    audioPlayerStore.set(currentAudioPlayer);

    if (wasPlaying) play();
}
let warmdown: number | undefined = undefined;
async function handlePlayMode() {
    if (warmdown) {
        console.log(`warmdown == ${warmdown}`);
        warmdown--;
        if (warmdown === 0) {
            if (currentPlayMode?.mode === PlayMode.Continue) {
                await skip(1);
                playMode.set({ ...currentPlayMode, continue: true });
            } else if (currentPlayMode?.mode === PlayMode.RepeatPage) {
                seek(0);
            } else if (currentPlayMode?.mode === PlayMode.RepeatSelection) {
                console.log(`handlePlayMode: seeking to start of range ${currentPlayMode.range.start}-${currentPlayMode.range.end}`);
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
            // audioPlayerStore.set(currentAudioPlayer);
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
        console.log(`warmdown == ${warmdown}`);
        if (currentPlayMode.range === defaultPlayMode.range) {
            const resultArray = getCurrentVerseTiming();
            if (resultArray?.start === undefined || resultArray.end === undefined) {
                return;
            }
            console.log(`handlePlayMode: setting range to ${resultArray.start}-${resultArray.end}`);
            playMode.set({
                ...currentPlayMode,
                range: { start: resultArray.start, end: resultArray.end }
            });
        }
        if ((currentAudioPlayer?.progress ?? 0) + 0.05 > currentPlayMode.range.end) {
            console.log(`handlePlayMode: pausing since after end (${currentAudioPlayer?.progress ?? 0 + 0.05} > ${currentPlayMode.range.end})`);
            pause();
            warmdown = 5;
        }
    }
}
// // gets the current verse start and end tag
// function getCurrentVerseTiming() {
//     let end: string = '';
//     let start: string = '';
//     if (currentAudioPlayer?.timing?.length) {
//         for (let i = 0; i < currentAudioPlayer.timing.length; i++) {
//             const timing = currentAudioPlayer.timing![i];
//             if (
//                 currentAudioPlayer.progress >= timing.starttime &&
//                 currentAudioPlayer.progress < timing.endtime
//             ) {
//                 const verseNumber = parseInt(timing.tag, 10);
//                 for (let k = i + 1; k >= 0; k--) {
//                     const startVerseNumber = parseInt(currentAudioPlayer.timing[k].tag, 10);
//                     if (startVerseNumber !== verseNumber) {
//                         start = currentAudioPlayer.timing[k + 1].tag;
//                         break;
//                     }
//                     if (k === 0) {
//                         start = currentAudioPlayer.timing[0].tag;
//                         break;
//                     }
//                 }
//                 for (let j = i + 1; j < currentAudioPlayer.timing.length; j++) {
//                     const endVerseNumber = parseInt(currentAudioPlayer.timing[j].tag, 10);
//                     if (endVerseNumber !== verseNumber) {
//                         end = currentAudioPlayer.timing[j - 1].tag;
//                         break;
//                     }
//                     if (j === currentAudioPlayer.timing.length - 1) {
//                         end = currentAudioPlayer.timing[j].tag;
//                         break;
//                     }
//                 }
//                 break;
//             }
//         }
//     }
//     return getVerseTimingRange(start, end);
// }

function getCurrentVerseTiming() {
    if (!currentAudioPlayer?.timing) {
        console.error(`Warning in getCurrentVerseTiming(): ` + 
                      "missing audio timing data");
        return defaultPlayMode.range;
    }
    
    let start = 0, end = 0;
    for (let i = 0; i < currentAudioPlayer.timing.length; i++) {
        const timing = currentAudioPlayer.timing[i];
        if (
            currentAudioPlayer.progress >= timing.starttime &&
            currentAudioPlayer.progress < timing.endtime
        ) {
            // The verse number of tag '9a' is 9
            const verseNumber = parseInt(timing.tag, 10);

            // Step backwards until we reach the previous verse
            for (let k = i; k >= 0; k--) {
                const startVerseNumber = parseInt(currentAudioPlayer.timing[k].tag, 10);
                // The last tag of the previous verse is the closest
                // to the current tag to have a different verse number
                if (startVerseNumber !== verseNumber) {
                    start = currentAudioPlayer.timing[k + 1].starttime;
                    break;
                }
                // If we've gone to the beginning of the section, 
                // assume we're in the first, "title" tag (or similar)
                if (k === 0) {
                    start = currentAudioPlayer.timing[0].starttime;
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
                // If we've gone to the end of the section without
                // progressing to the next verse, assume we're at the last tag
                if (j === currentAudioPlayer.timing.length - 1) {
                    end = currentAudioPlayer.timing[j].endtime;
                    break;
                }
            }
            break;
        }
    }

    return { start, end } as PlayModeRange;
}

function getVerseEndTag(verse: string) {
    if (!currentAudioPlayer?.timing) {
        // No further detail, so return base tag
        return verse;
    }

    let startTag = '', endTag = '', i: number;

    // First find the beginning of the verse
    for (i = 0; i < currentAudioPlayer.timing.length; i++) {
        //adapted from seekToVerse() below
        const tag = currentAudioPlayer.timing[i].tag;
        const containsAlpha = /[a-z]/.test(tag);
        const adjustedTag = containsAlpha ? tag : tag + 'a';

        console.log(`Trying tag ${adjustedTag}`);

        if (adjustedTag.slice(0, adjustedTag.length - 1) === verse) {
            startTag = adjustedTag;
            break;
        }
    }

    // Then find the end of the verse
    const baseTag = parseInt(startTag, 10);
    console.log(`getVerseEndTag(${verse}): start tag is (${startTag}), base (${baseTag})`);
    for (let j = i + 1; j < currentAudioPlayer.timing.length; j++) {
        const endVerseNumber = parseInt(currentAudioPlayer.timing[j].tag, 10);
        if (endVerseNumber !== baseTag) {
            endTag = currentAudioPlayer.timing[j - 1].tag;
            break;
        }
        if (j === currentAudioPlayer.timing.length - 1) {
            endTag = currentAudioPlayer.timing[j].tag;
            break;
        }
    }

    console.log(`getVerseEndTag(${verse}): found end tag of ${endTag}`);

    return endTag;
}

// function get range of current index all labels of the current verse playing
// calls updatehighlights() to see if highlights need to be change
async function updateTime() {
    if (!currentAudioPlayer?.loaded) {
        return;
    }
    currentAudioPlayer.progress = currentAudioPlayer.audio?.currentTime ?? 0;
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
    if (currentPlayMode?.mode !== PlayMode.RepeatSelection && 
        (currentAudioPlayer?.audio?.ended || currentAudioPlayer?.playing === false)) {
        clearInterval(currentAudioPlayer?.timer ?? undefined);
        currentAudioPlayer.timer = null;
    } else if (currentAudioPlayer) {
        currentAudioPlayer.timer = setInterval(() => updateTime(), 100);
    }
    return;
}
// checks if audio has played
export function hasAudioPlayed() {
    return (currentAudioPlayer?.progress ?? 0) > 0;
}
function pause() {
    if (!currentAudioPlayer?.loaded) {
        return;
    }
    if (currentAudioPlayer.playing) {
        currentAudioPlayer.audio?.pause();
        logAudioDuration(currentAudioPlayer);
        currentAudioPlayer.playing = false;
    }
    toggleTimeRunning();
    audioPlayerStore.set(currentAudioPlayer);
}

export function play() {
    if (!currentAudioPlayer?.loaded) {
        return;
    }
    if (!currentAudioPlayer.playing) {
        currentAudioPlayer.audio?.play();
        currentAudioPlayer.playStart = Date.now();
        logAudioPlay(currentAudioPlayer);
        currentAudioPlayer.playing = true;
    }
    toggleTimeRunning();
    audioPlayerStore.set(currentAudioPlayer);
}

export function playVerses(startVerse: string, endVerse?: string) {
    let mode: PlayMode, range: PlayModeRange;

    if (endVerse) {
        mode = PlayMode.RepeatSelection;
        range = getVerseTimingRange(startVerse, endVerse) //
            || defaultPlayMode.range;
    } else {
        mode = currentPlayMode?.mode || defaultPlayMode.mode;
        range = getVerseTimingRange(startVerse, startVerse) //
            || defaultPlayMode.range;
    }

    console.log(`playVerses: setting range ${range.start} - ${range.end}`);

    playMode.set({ mode, range });
    seekToVerse(startVerse + 'a');
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
// This function can be called when the text selection toolbar play button is clicked on and it changes the audio to the start of the verse clicked on
export function seekToVerse(verseClicked: string) {
    if (!currentAudioPlayer?.timing) {
        return;
    }
    const elements = currentAudioPlayer.timing;
    for (let i = 0; i < elements.length; i++) {
        const tag = currentAudioPlayer.timing[i].tag;
        // Handle timing tags that are just the verse number
        const containsAlpha = /[a-z]/.test(tag);
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
// function getVerseTimingRange(startTag: string, endTag: string) {
//     const elements = currentAudioPlayer?.timing ?? [];
//     let start: number = 0;
//     for (let i = 0; i < elements.length; i++) {
//         const tag = currentAudioPlayer!.timing![i].tag;
//         if (startTag === tag) {
//             const newstarttime = currentAudioPlayer!.timing![i].starttime;
//             start = newstarttime;
//         }
//         if (endTag === tag) {
//             const newendtime = currentAudioPlayer!.timing![i].endtime;
//             const end = newendtime;
//             const range = { start, end };
//             return range;
//         }
//     }
// }

// Get an audio timing range bounded by the first tag 
// of startVerse and the last tag of endVerse
function getVerseTimingRange(startVerse: string, endVerse: string) {
    if (!currentAudioPlayer?.timing) {
        console.error(`Warning in getVerseTimingRange(${startVerse}-${endVerse}): ` + 
                      "missing audio timing data");
        return defaultPlayMode.range;
    }

    let start = 0, end = 0;
    for (let i = 0; i < currentAudioPlayer.timing.length; i++) {
        const timing = currentAudioPlayer.timing[i];

        // Handle case where tag has form '9a' for first phrase in verse 9
        if (timing.tag === startVerse || timing.tag === (startVerse + 'a')) {
            start = timing.starttime;
        }
        if (timing.tag === endVerse) {
            end = timing.endtime;
            break;
        } else if (parseInt(timing.tag) === (parseInt(endVerse) + 1)) {
            // This is the first timing tag in the next verse, so 
            // the previous tag (at i - 1) is the last tag in the current verse
            end = currentAudioPlayer.timing[i - 1].endtime;
            break;
        }
    }

    return { start, end } as PlayModeRange;
}
