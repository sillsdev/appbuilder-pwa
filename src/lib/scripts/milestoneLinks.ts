import { filenameWithoutPath, padWithInitialZeros } from './stringUtils';
export function checkForMilestoneLinks(
    textType: string[],
    footnoteDiv: HTMLElement,
    phraseDiv: HTMLElement,
    milestoneText: string,
    milestoneLink: string,
    numberOfClips: number,
    subType: string
) {
    switch (subType) {
        case 'usfm:zaudioc': {
            const [audioEntry, audioLink] = getAudioLinkHtml(
                milestoneLink,
                milestoneText,
                numberOfClips
            );
            appendMilestoneElement(textType, footnoteDiv, phraseDiv, audioEntry, false);
            appendMilestoneElement(textType, footnoteDiv, phraseDiv, audioLink, true);
            break;
        }
        case 'usfm:zreflink': {
            const reflink = getReferenceLinkHtml(milestoneLink, milestoneText);
            appendMilestoneElement(textType, footnoteDiv, phraseDiv, reflink, true);
            break;
        }
        case 'usfm:zweblink': {
            const reflink = getWebLinkHtml(milestoneLink, milestoneText);
            appendMilestoneElement(textType, footnoteDiv, phraseDiv, reflink, true);
            break;
        }
        case 'usfm:ztellink': {
            const reflink = getTelephoneLinkHtml(milestoneLink, milestoneText);
            appendMilestoneElement(textType, footnoteDiv, phraseDiv, reflink, true);
            break;
        }
        case 'usfm:zelink': {
            const reflink = getEmailLinkHtml(milestoneLink, milestoneText);
            appendMilestoneElement(textType, footnoteDiv, phraseDiv, reflink, true);
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
    phraseDiv: HTMLElement,
    reflink: HTMLElement,
    pop: boolean
) {
    if (textType.includes('footnote')) {
        footnoteDiv.appendChild(reflink);
    } else {
        phraseDiv.appendChild(reflink);
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
function getReferenceLinkHtml(link: string, text: string): HTMLElement {
    const a = document.createElement('a');
    a.classList.add('web-link');
    a.classList.add('ref-link');
    a.setAttribute('ref', link);
    a.innerHTML = text;
    return a;
}
