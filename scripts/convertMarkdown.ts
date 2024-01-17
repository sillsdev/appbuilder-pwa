export function convertMarkdownsToMilestones(content: string): string {
    let result: string = '';
    result = content;
    const sb = [];
    let inputString = content;
    const patternString = /(!?)\[([^[]*?)\]\((.*?)\)/;
    let match;
    while ((match = patternString.exec(inputString)) !== null) {
        // Append text segment with 1st part of string
        sb.push(inputString.substring(0, match.index));
        // Handle markdown
        const excl = match[1];
        const text = match[2];
        const ref = match[3];
        const link = ref;
        if (isBlank(ref)) {
            // Empty link reference, e.g. [text]()
            // Output simple text without a link
            sb.push(text);
        } else if (isLocalAudioFile(ref)) {
            const zaudioc = getAudioHtmlFromMarkdownLink(link, text);
            sb.push(zaudioc);
        } else if (isImageLink(ref, excl)) {
            // Image ![alt text](image.png)
            const fig = getImageHtmlFromMarkdownLink(ref, text);
            sb.push(fig);
        } else if (isWebLink(ref)) {
            const webLink = getWebHtmlFromMarkdownLink(link, text);
            sb.push(webLink);
        } else if (isEmailLink(ref)) {
            const emailLink = getEmailHtmlFromMarkdownLink(link, text);
            sb.push(emailLink);
        } else if (isTelephoneNumberLink(ref)) {
            const telLink = getTelHtmlFromMarkdownLink(link, text);
            sb.push(telLink);
        } else {
            const refLink = getReferenceHtmlFromMarkdownLink(link, text);
            sb.push(refLink);
        }
        inputString = inputString.substring(match.index + match[0].length);
    }
    sb.push(inputString);
    result = sb.join('');
    return result;
}

function isEmailLink(ref: string): boolean {
    const refLower = ref.toLowerCase();
    return refLower.startsWith('mailto:');
}
function isWebLink(ref: string): boolean {
    const refLower = ref.toLowerCase();
    return refLower.startsWith('http');
}
function isTelephoneNumberLink(ref: string): boolean {
    const refLower = ref.toLowerCase();
    return refLower.startsWith('tel:');
}
function isLocalAudioFile(ref: string): boolean {
    let result = false;
    const refLower = ref.toLowerCase();
    if (!refLower.startsWith('http')) {
        const ext = getFilenameExt(refLower);
        if (ext != null) {
            result = ext === 'mp3' || ext === 'ogg' || ext === 'wav';
        }
    }
    return result;
}
function isImageLink(ref: string, excl: string): boolean {
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
function getAudioHtmlFromMarkdownLink(link: string, text: string): string {
    // \zaudioc-s | link="audioclip.mp3"\*audioclip.mp3\zaudioc-e\*
    const result =
        ' \\zaudioc-s | link="' + encodeURIComponent(link) + '" \\*' + text + ' \\zaudioc-e\\* ';
    return result;
}
function getImageHtmlFromMarkdownLink(link: string, text: string): string {
    // \fig Pharisee|src="VB-John 1v22.jpg" size="span" ref="1.22"\fig*
    const result = '\\fig ' + text + '|src="' + link + '" size="span"\\fig*';
    return result;
}
function getWebHtmlFromMarkdownLink(link: string, text: string): string {
    // \zweblink-s | link="https://www.sil.org/"\*Web Link \zweblink-e\*
    const result =
        ' \\zweblink-s | link="' + encodeURIComponent(link) + '"\\*' + text + ' \\zweblink-e\\* ';
    return result;
}
function getEmailHtmlFromMarkdownLink(link: string, text: string): string {
    // \zelink-s | link="mailto:david_moore1@sil.org"\*EMAIL DAVID \zelink-e\*
    const result =
        ' \\zelink-s | link="' + encodeURIComponent(link) + '"\\*' + text + ' \\zelink-e\\* ';
    return result;
}
function getTelHtmlFromMarkdownLink(link: string, text: string): string {
    // \ztellink-s | link="tel:6144323864"\*CAMB \ztellink-e\*
    const result =
        ' \\ztellink-s | link="' + encodeURIComponent(link) + '"\\*' + text + ' \\ztellink-e\\* ';
    return result;
}
function getReferenceHtmlFromMarkdownLink(link: string, text: string): string {
    // \zreflink-s |link="ENGWEB.MAT.5.1"\*Beatitudes\zreflink-e\* \
    const result =
        ' \\zreflink-s | link="' + encodeURIComponent(link) + '"\\*' + text + ' \\zreflink-e\\* ';
    return result;
}
function isNotBlank(str: string): boolean {
    let result: boolean;
    if (str === null || str === undefined) {
        result = false;
    } else {
        result = str.length > 0 && str.trim().length > 0;
    }
    return result;
}
function isBlank(str: string): boolean {
    return !isNotBlank(str);
}
function getFilenameExt(filename: string): string {
    let extension: string = '';
    if (isNotBlank(filename)) {
        const i = filename.lastIndexOf('.');
        const p = Math.max(filename.lastIndexOf('/'), filename.lastIndexOf('\\'));
        if (i > p) {
            extension = filename.substring(i + 1);
        }
    }
    return extension;
}
