import { filenameWithoutPath, padWithInitialZeros } from './stringUtils';
import type { AudioData } from '$config';

export function checkForMilestoneLinks(
    textType: string[],
    footnoteDiv: HTMLElement,
    parentDiv: HTMLElement,
    milestoneText: string,
    milestoneLink: string,
    numberOfClips: number,
    subType: string,
    audioConfig: AudioData,
    onClickFunction: (e: any) => void
) {
    switch (subType) {
        case 'usfm:zaudioc': {
            const [audioEntry, audioLink] = getAudioLinkHtml(
                milestoneLink,
                milestoneText,
                numberOfClips,
                audioConfig,
                onClickFunction
            );
            appendMilestoneElement(textType, footnoteDiv, parentDiv, audioEntry, false);
            appendMilestoneElement(textType, footnoteDiv, parentDiv, audioLink, true);
            break;
        }
        case 'usfm:zreflink': {
            const reflink = getReferenceLinkHtml(milestoneLink, milestoneText);
            appendMilestoneElement(textType, footnoteDiv, parentDiv, reflink, true);
            break;
        }
        case 'usfm:zweblink': {
            const reflink = getWebLinkHtml(milestoneLink, milestoneText);
            appendMilestoneElement(textType, footnoteDiv, parentDiv, reflink, true);
            break;
        }
        case 'usfm:ztellink': {
            const reflink = getTelephoneLinkHtml(milestoneLink, milestoneText);
            appendMilestoneElement(textType, footnoteDiv, parentDiv, reflink, true);
            break;
        }
        case 'usfm:zelink': {
            const reflink = getEmailLinkHtml(milestoneLink, milestoneText);
            appendMilestoneElement(textType, footnoteDiv, parentDiv, reflink, true);
            break;
        }
        default: {
            break;
        }
    }
}

function appendMilestoneElement(
    textType: string[],
    footnoteDiv: HTMLElement,
    parentDiv: HTMLElement,
    reflink: HTMLElement,
    pop: boolean
) {
    if (textType.includes('footnote')) {
        footnoteDiv.appendChild(reflink);
    } else {
        parentDiv.appendChild(reflink);
    }
    if (pop) {
        textType.pop();
    }
}

function getWebLinkHtml(link: string, text: string): HTMLElement {
    const a = document.createElement('a');
    a.href = link;
    a.setAttribute('target', '_blank');
    a.classList.add('web-link');
    a.innerHTML = text;
    return a;
}

function getEmailLinkHtml(link: string, text: string): HTMLElement {
    const a = document.createElement('a');
    a.href = link;
    a.setAttribute('target', '_blank');
    a.classList.add('email-link');
    a.innerHTML = text;
    return a;
}

function getTelephoneLinkHtml(link: string, text: string): HTMLElement {
    const a = document.createElement('a');
    a.href = link;
    a.setAttribute('target', '_blank');
    a.classList.add('tel-link');
    a.innerHTML = text;
    return a;
}
function getAudioLinkHtml(
    link: string,
    text: string,
    clipNumber: number,
    audioConfig: AudioData,
    onClickFunction: (e: any) => void
): [HTMLElement, HTMLElement] {
    const audio = document.createElement('audio');
    const audioId = 'audio' + padWithInitialZeros(clipNumber.toString(), 3);

    const filename = filenameWithoutPath(link);
    let src = '';
    let sourceType = '';

    if (audioConfig?.files && audioConfig?.sources) {
        const audioFile = audioConfig.files.find((x) => x.name === filename);
        if (audioFile) {
            const audioSource = audioConfig.sources[audioFile.src];
            if (audioSource) {
                sourceType = audioSource.type;
                if (audioSource.type === 'assets') {
                    src = 'clips/' + filename;
                } else if (audioSource.type === 'download') {
                    const address = audioSource.address;
                    src = ensureTrailingSlash(address) + filename;
                }
            }
        }
    } else {
        console.warn('Audio configuration is not properly initialized.');
    }

    audio.id = audioId;
    audio.src = src;
    audio.setAttribute('preload', 'auto');

    const a = document.createElement('a');
    a.href = '#';
    if (sourceType === 'assets') {
        a.setAttribute('onClick', `document.getElementById('${audioId}').play();`);
    } else if (sourceType === 'download') {
        a.classList.add('audioclip');
        a.setAttribute('filelink', audioId);
        a.addEventListener('click', onClickFunction, false);
    }

    a.innerHTML = text;

    return [audio, a];
}
function getReferenceLinkHtml(link: string, text: string): HTMLElement {
    const a = document.createElement('a');
    a.classList.add('web-link');
    a.classList.add('ref-link');
    a.setAttribute('ref', link);
    a.innerHTML = text;
    return a;
}

function ensureTrailingSlash(url) {
    if (!url.endsWith('/')) {
        return url + '/';
    }
    return url;
}
