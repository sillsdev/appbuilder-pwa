/**
 * Replace page tags with chapters
 */
export function replacePageTags(usfm: string): string {
    return usfm.replace(/\\page\s+(\d+)/g, '\\c $1');
}

/**
 * Remove img tags
 *
 * For now, get images from config (may change this later)
 */
export function removeImageTags(usfm: string): string {
    return usfm.replace(/\\img\s+\S+/g, '');
}

/**
 * Convert list tags to milestones
 */
export function transformLists(usfm: string): string {
    return usfm
        .replace(/\\zuli1\s+([^\\]*)/g, '\\zuli1-s\\* $1 \\zuli1-e\\* ')
        .replace(/\\zon1 (\d+)(([^\\]|\\zoli)*)/g, '\\zon1-s |start="$1"\\* $2 \\zon1-e\\* ')
        .replace(/\\zoli1\s+([^\\]*)/g, '\\zoli1-s\\* $1 \\zoli1-e\\* ');
}

export function transformHeadings(usfm: string): string {
    return usfm.replace(/\\(m?s\d?)([^\\]*)/g, '\\m \\zusfm-s |class="$1"\\* $2 \\zusfm-e ');
}

export function convertStorybookElements(usfm: string) {
    usfm = replacePageTags(usfm);
    usfm = removeImageTags(usfm);
    usfm = transformLists(usfm);
    usfm = transformHeadings(usfm);
    return usfm;
}
