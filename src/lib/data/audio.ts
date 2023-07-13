import config from '$lib/data/config';
import { audioHighlightElements } from '$lib/data/stores/audio.js';
// import { isSelectableText } from '$lib/scripts/verseSelectUtil';
import { refs, audioPlayer as audioPlayerStore, audioPlayerDefault } from '$lib/data/stores';
import { MRUCache } from '$lib/data/mrucache';

interface AudioPlayer {
    audio: HTMLAudioElement;
    loaded: boolean;
    duration: number;
    progress: number;
    playing: boolean;
    playAfterSkip: boolean;
    timeIndex: number;
    timing: Array<any>;
    collection: string;
    book: string;
    chapter: string;
    timer: number;
}
const cache = new MRUCache<string, AudioPlayer>(10);
let currentAudioPlayer;
audioPlayerStore.subscribe(async (value) => {
    currentAudioPlayer = value;
    await getAudio();
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
//gets the current audio
async function getAudio() {
    if (currentAudioPlayer.loaded) {
        return;
    }
    currentAudioPlayer.duration = NaN;
    currentAudioPlayer.progress = 0;
    if (currentAudioPlayer.playing) {
        pause();
    }

    const audioSourceInfo = await getAudioSourceInfo(currentAudioPlayer);
    const a = new Audio(audioSourceInfo.source);
    a.onloadedmetadata = () => {
        currentAudioPlayer.duration = a.duration;
        currentAudioPlayer.timeIndex = 0;
        currentAudioPlayer.loaded = true;
        currentAudioPlayer.audio = a;
        updateTime();
        if (currentAudioPlayer.playAfterSkip && !currentAudioPlayer.playing) {
            play();
            currentAudioPlayer.playAfterSkip = false;
        }
    };

    currentAudioPlayer.timing = audioSourceInfo.timing;
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
export function skip(direction) {
    pause();
    if (refs.skip(direction)) {
        currentAudioPlayer.playAfterSkip = true && currentAudioPlayer.playing;
    }
}
export function format(seconds) {
    if (isNaN(seconds)) return '...';

    const minutes = Math.floor(seconds / 60);
    seconds = Math.floor(seconds % 60);
    if (seconds < 10) seconds = '0' + seconds;

    return `${minutes}:${seconds}`;
}
// changes the phrase of the audio
export function changeVerse(direction) {
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
            skip(1);
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
    let seekTimer;
    let mutedBySeek;

    return (scale) => {
        clearInterval(seekTimer);
        if (!currentAudioPlayer.loaded) return;
        if (mutedBySeek) currentAudioPlayer.audio.muted = false;
        if (scale === 0) {
            currentAudioPlayer.audio.playbackRate = currentAudioPlayer.audio.defaultPlaybackRate;
        } else if (scale > 0) {
            mutedBySeek = true;
            currentAudioPlayer.audio.muted = true;
            currentAudioPlayer.audio.playbackRate =
                currentAudioPlayer.audio.defaultPlaybackRate * scale;
        } else {
            seekTimer = setInterval(() => {
                mutedBySeek = true;
                currentAudioPlayer.audio.muted = true;
                currentAudioPlayer.audio.currentTime -=
                    currentAudioPlayer.audio.defaultPlaybackRate;
            }, 100);
        }
    };
}
// calls updatehighlights() to see if highlights need to be change
function updateTime() {
    if (!currentAudioPlayer.loaded) {
        return;
    }
    currentAudioPlayer.progress = currentAudioPlayer.audio.currentTime;
    if (currentAudioPlayer.timing && currentAudioPlayer.progress) {
        updateHighlights();
    }
    if (currentAudioPlayer.audio.ended) {
        toggleTimeRunning();
    }
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
function pause() {
    if (!currentAudioPlayer.loaded) return;
    if (currentAudioPlayer.playing) {
        currentAudioPlayer.audio?.pause();
        currentAudioPlayer.playing = false;
    }
    toggleTimeRunning();
}

function play() {
    if (!currentAudioPlayer.loaded) return;
    if (!currentAudioPlayer.playing) {
        currentAudioPlayer.audio?.play();
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
            currentAudioPlayer.progress <= timing.endtime
        ) {
            currentAudioPlayer.timeIndex = i;
            tag = timing.tag.replace(/[^ -~]+/g, '');
            highlights.push(tag);
        }
    }
    return audioHighlightElements.set(highlights);
}
export function updatePlaybackSpeed(playbackSpeed) {
    if (currentAudioPlayer.audio != null) {
        currentAudioPlayer.audio.playbackRate = parseFloat(playbackSpeed);
    }
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
        throw `no audio found for ${item.collection}:${item.book}:${item.chapter}`;
    }

    const audioSource = config.audio.sources[audio.src];
    let audioPath = null;

    if (audioSource.type === 'fcbh') {
        const dbp4 = audioSource.address ? audioSource.address : 'https://4.dbt.io';
        // if (source.accessMethods.includes('download')) {
        //    // TODO: Figure out how to use Cache API to download audio to PWA
        // }
        const request = `${dbp4}/api/bibles/filesets/${audioSource.damId}/${item.book}/${item.chapter}?v=4&key=${audioSource.key}`;
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
        audioPath = '/audio/' + audio.filename;
    } else if (audioSource.type === 'download') {
        audioPath = audioSource.address + '/' + audio.filename;
    }

    //parse timing file
    const timing = [];
    if (audio.timingFile) {
        const timeFilePath = `/timings/${audio.timingFile}`;
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
            if (lines[i]) {
                if (lines[i].startsWith('\\')) {
                    continue;
                }
                timing.push({
                    starttime: parseFloat(lines[i].split('\t')[0]),
                    endtime: parseFloat(lines[i].split('\t')[1]),
                    tag: lines[i].split('\t')[2]
                });
            }
        }
    }

    return {
        source: audioPath,
        timing: timing.length > 0 ? timing : null
    };
}

//todo implement selectable text that can play audio

// export function onClickSound(e: any) {
//     let target = e.target;

//     if (isSelectableText(target)) {
//         const start = parseFloat(target.start);
//         this.audio.currentTime = start;
//         this.audio.play();
//     } else {

//     }
// }
