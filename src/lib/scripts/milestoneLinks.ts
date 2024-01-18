import { filenameWithoutPath, padWithInitialZeros } from './stringUtils';

export function getWebLinkHtml(link: string, text: string): HTMLElement {
    const a = document.createElement('a');
    a.href = link;
    a.setAttribute('target', '_blank');
    a.classList.add('web-link');
    a.innerHTML = text;
    return a;
}
export function getEmailLinkHtml(link: string, text: string): HTMLElement {
    const a = document.createElement('a');
    a.href = link;
    a.setAttribute('target', '_blank');
    a.classList.add('email-link');
    a.innerHTML = text;
    return a;
}
export function getTelephoneLinkHtml(link: string, text: string): HTMLElement {
    const a = document.createElement('a');
    a.href = link;
    a.setAttribute('target', '_blank');
    a.classList.add('tel-link');
    a.innerHTML = text;
    return a;
}
export function getAudioLinkHtml(
    link: string,
    text: string,
    clipNumber: number
): [HTMLElement, HTMLElement] {
    const audio = document.createElement('audio');
    const audioId = 'audio' + padWithInitialZeros(clipNumber.toString(), 3);
    const filename = 'clips/' + filenameWithoutPath(link);
    audio.id = audioId;
    audio.src = filename;
    audio.setAttribute('preload', 'auto');
    const a = document.createElement('a');
    a.href = '#';
    a.setAttribute('onClick', "document.getElementById('" + audioId + "').play();"); //function() { document.getElementById(audioId); };
    a.innerHTML = text;
    return [audio, a];
}
export function getReferenceLinkHtml(link: string, text: string): HTMLElement {
    const a = document.createElement('a');
    a.classList.add('web-link');
    a.classList.add('ref-link');
    a.setAttribute('ref', link);
    a.innerHTML = text;
    return a;
}
