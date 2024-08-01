/**
 * A list of inline character format markers
 */
const characterMarkers = 'em bd it bdit no sc sup'.split(' ');

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
 * Replace \p_Normal paragraphs with \m
 */
export function convertPTags(usfm: string) {
    return usfm.replace(/\\p_Normal/g, '\\m');
}

/**
 * Convert list tags to milestones
 */
export function transformLists(usfm: string): string {
    usfm = transformUnorderedLists(usfm);
    usfm = transformOrderedLists(usfm);
    return usfm;
}

function transformUnorderedLists(usfm: string): string {
    const inlineMarkers = [...characterMarkers, 'zuli'].join('|');
    const listPattern = new RegExp(`\\\\zuli([^\\\\]|\\\\(${inlineMarkers}))*`, 'g');
    // Place a paragraph marker (\m) before unordered lists
    usfm = usfm.replace(listPattern, '\\m $& ');
    let level = 1;
    let tag = '\\zuli' + level;
    while (usfm.includes(tag)) {
        const inlineMarkers = [...characterMarkers, `zuli[^1-${level}]`].join('|');
        const pattern = new RegExp(`\\${tag}\\s(([^\\\\]|\\\\(${inlineMarkers}))*)`, 'g');
        usfm = usfm.replace(pattern, `${tag}-s |\\* $1 ${tag}-e\\* `);
        level++;
        tag = '\\zuli' + level;
    }
    return usfm;
}

/**
 * Get the start number for an ordered list
 */
function getStartNumber(usfm: string, level: number) {
    const startPattern = new RegExp(`\\\\zon${level} (\\d+)`);
    const startMatch = usfm.match(startPattern);
    return startMatch ? startMatch[1] : '1';
}

function transformOrderedListItems(usfm: string, level: number) {
    // A nested list
    //  * begins with \zon# or \zoli#, where # does not equal the current level
    //  * ends at the first sfm tag that is not \zon#, \zoli#, or a character marker
    const sublistMarkers = [...characterMarkers, `zon[^${level}]`, `zoli[^${level}]`].join('|');
    const sublistPattern = `(\\\\zo(n|li)[^${level}])([^\\\\]|\\\\(${sublistMarkers}))*`;

    // A list item consists of the following parts:
    //  * \zoli# tag, where # is the current level
    //  * text that may include only character markers
    //  * a nested list (optional)
    const textMarkers = characterMarkers.join('|');
    const itemPattern = new RegExp(
        `\\\\zoli${level}\\s((?:[^\\\\]|\\\\(?:${textMarkers}))*)(${sublistPattern})?`,
        'g'
    );
    const items = Array.from(usfm.matchAll(itemPattern));
    return items
        .map((item) => {
            const sublist = item[2] ? transformOrderedSublist(item[2], level + 1) : '';
            return `\\zoli${level}-s |\\* ${item[1]} ${sublist} \\zoli${level}-e\\*`;
        })
        .join(' ');
}

function transformOrderedSublist(usfm: string, level: number): string {
    const start = getStartNumber(usfm, level);

    // A list's contents
    //  * begins with \zoli#, where # is the current level
    //  * contains no sfm tags except the following:
    //     - \zoli#, where # is any number
    //     - \zon#, where # is not the current level
    const allowedMarkers = [...characterMarkers, 'zoli', `zon[^${level}]`].join('|');
    const contentsPattern = new RegExp(`\\\\zoli${level}\\s([^\\\\]|\\\\(${allowedMarkers}))*`);
    const contentsMatch = usfm.match(contentsPattern);
    if (contentsMatch) {
        const contents = transformOrderedListItems(contentsMatch[0], level);
        return ` \\zon${level}-s |start="${start}"\\* ${contents} \\zon${level}-e\\* `;
    }
    throw new Error(`Invalid USFM list: ${usfm}`);
}

function transformOrderedLists(usfm: string) {
    // Each ordered list
    //  * begins with \zon1
    //  * contains no sfm markers except the following:
    //     - inline character markup
    //     - \zoli#, where # is any number
    //     - \zon#, where # is not 1
    const allowedMarkers = [...characterMarkers, 'zoli', 'zon[^1]'].join('|');
    const listPattern = new RegExp(`\\\\zon1\\s([^\\\\]|\\\\(${allowedMarkers}))*`, 'g');
    const lists = usfm.matchAll(listPattern);
    let transformed = '';
    let i = 0;
    for (const list of lists) {
        transformed += usfm.substring(i, list.index);
        transformed += ' \\m ';
        transformed += transformOrderedSublist(list[0], 1);
        if (list.index === undefined) {
            throw new Error('Expected regex match index to be defined');
        } else {
            i = list.index + list[0].length;
        }
    }
    return transformed + usfm.substring(i);
}

export function transformHeadings(usfm: string): string {
    return usfm.replace(/\\(m?s\d?)([^\\]*)/g, '\\m \\zusfm-s |class="$1"\\* $2 \\zusfm-e ');
}

export function convertStorybookElements(usfm: string) {
    usfm = replacePageTags(usfm);
    usfm = removeImageTags(usfm);
    usfm = convertPTags(usfm);
    usfm = transformLists(usfm);
    usfm = transformHeadings(usfm);
    return usfm;
}
