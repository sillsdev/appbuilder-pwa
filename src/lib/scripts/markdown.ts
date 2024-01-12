import { getFilenameExt } from './stringUtils';

export function isEmailLink(ref: string): boolean {
    const refLower = ref.toLowerCase();
    return refLower.startsWith('mailto:');
}
export function isWebLink(ref: string): boolean {
    const refLower = ref.toLowerCase();
    return refLower.startsWith('http');
}
export function isTelephoneNumberLink(ref: string): boolean {
    const refLower = ref.toLowerCase();
    return refLower.startsWith('tel:');
}
export function isLocalAudioFile(ref: string): boolean {
    let result = false;
    const refLower = ref.toLowerCase();
    console.log('LOCAL AUDIO CHECK 1 %o', refLower);
    if (!refLower.startsWith('http')) {
        const ext = getFilenameExt(refLower);
        console.log('LOCAL AUDIO CHECK %o', ext);
        if (ext != null) {
            result = ext === 'mp3' || ext === 'ogg' || ext === 'wav';
        }
    }
    console.log("RETURNING");
    return result;
}
export function isImageLink(ref: string, excl: string): boolean {
    let result = false;
    const refLower = ref.toLowerCase();
    const ext = getFilenameExt(refLower);
    if (
        ext === 'png' ||
        ext === 'jpg' ||
        ext === 'jpeg' ||
        ext === 'tif' ||
        ext === 'svg' ||
        ext === 'gif'
    ) {
        if (excl != null && excl === '!') {
            result = true;
        }
    }
    return result;
}
export function getWebHtmlFromMarkdownLink(link: string, text: string): HTMLElement {
    const a = document.createElement('a');
    a.href = link;
    a.setAttribute('target', '_blank');
    a.classList.add('web-link');
    a.innerHTML = text;
    return a;
}
export function getEmailHtmlFromMarkdownLink(link: string, text: string): HTMLElement {
    const a = document.createElement('a');
    a.href = link;
    a.setAttribute('target', '_blank');
    a.classList.add('email-link');
    a.innerHTML = text;
    return a;
}
export function getTelephoneHtmlFromMarkdownLink(link: string, text: string): HTMLElement {
    const a = document.createElement('a');
    a.href = link;
    a.setAttribute('target', '_blank');
    a.classList.add('tel-link');
    a.innerHTML = text;
    return a;
}
export function getAudioHtmlFromMarkdownLink(link: string, text: string): HTMLElement {
    const a = document.createElement('audio');
    return a;

}
export function getImageHtmlFromMarkdownLink(
    link: string,
    stylePrefix: string,
    base: string
): HTMLElement {
    let imgFilename = link;
    if (!imgFilename.includes('/')) {
        imgFilename = base + '/illustrations/' + imgFilename;
    }
    const div = document.createElement('div');
    const divStyle = stylePrefix + 'image-block';
    const imgStyle = stylePrefix + 'image';
    div.classList.add(divStyle);
    const img = document.createElement('img');
    img.classList.add(imgStyle);
    img.src = imgFilename;
    div.appendChild(img);
    return div;
}
export function getReferenceHtmlFromMarkdownLink(link: string, text: string): HTMLElement {
    const a = document.createElement('a');
    a.classList.add('web-link');
    a.classList.add('ref-link');
    a.setAttribute('ref', link);
    a.innerHTML = text;
    return a;
}
