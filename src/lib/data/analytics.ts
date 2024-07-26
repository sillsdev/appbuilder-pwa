import { analytics } from '$lib/data/stores';
import config from '$lib/data/config';
import type { HistoryItem } from './history';
import type { AudioPlayer } from './audio';

export function getBook(item: { collection?: string; book: string }) {
    return config.bookCollections
        .find((x) => x.id === item.collection)
        .books.find((x) => x.id === item.book);
}

function getDamId(item: { book: any; chapter: string }) {
    let damId;
    if (item.book.audio.length > 0) {
        const audio = item.book.audio.find((x) => x.num === Number(item.chapter));
        const source = audio.src;
        if (source) {
            if (config.audio.sources[source]?.type === 'fcbh') {
                damId = config.audio.sources[source].damId;
            }
        }
    }
    return damId;
}

export function logScreenView(item: HistoryItem) {
    const book = getBook({ ...item });
    const chapter = item.chapter;
    const bookAbbrev = book.abbreviation;
    const damId = getDamId({ book, chapter });
    const params = {
        screenName: item.book,
        bookCol: item.collection,
        bookId: item.book,
        bookAbbrev,
        chapter,
        damId
    };
    analytics.log('ab_screen_view', params);
}

export function logAudioPlay(audioPlayer: AudioPlayer) {
    const bookCol = audioPlayer.collection;
    const book = getBook({ collection: bookCol, book: audioPlayer.book });
    const screenName = book.id;
    const chapter = audioPlayer.chapter;
    const bookAbbrev = book.abbreviation;
    const damId = getDamId({ book, chapter });
    const playing = audioPlayer.playing;
    const params = {
        screenName,
        bookCol,
        bookAbbrev,
        chapter,
        damId,
        playing
    };
    analytics.log('ab_audio_play', params);
}

export function logAudioDuration(audioPlayer: AudioPlayer) {
    const bookCol = audioPlayer.collection;
    const book = getBook({ collection: bookCol, book: audioPlayer.book });
    const screenName = book.id;
    const chapter = audioPlayer.chapter;
    const bookAbbrev = book.abbreviation;
    const damId = getDamId({ book, chapter });
    const playStart = audioPlayer.playStart;
    const playEnd = Date.now();
    const playDuration = (playEnd - playStart + 500) / 1000;
    const params = {
        screenName,
        bookCol,
        bookAbbrev,
        chapter,
        damId,
        playDuration,
        playStart,
        playEnd
    };
    analytics.log('ab_audio_duration', params);
}

// TODO: Complete once shareApp is implemented
export function logShareApp(appName, appVersion, appType) {
    analytics.log('ab_share_app', { appName, appVersion, appType });
}

export function logShareContent(
    contentType: String,
    bookCol: String,
    bookAbbrev: String,
    reference: string
) {
    // include reference info (bookCol, bookAbbrev, verses selected)
    const params = {
        contentType,
        bookCol,
        bookAbbrev,
        reference
    };
    analytics.log('ab_share_content', params);
}
