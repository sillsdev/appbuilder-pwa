//It seems that even before the code in convertBooks, the storybook already has had its img tags removed. I need to figure out how to prevent this from happening.
/*By the time that applyFilters (In convertBooks) is called, which is at the beginning of convertScriptureBook and thus the beginning of where I would expect
anything to alter the file, the storybook has already had some changes made to it compared to what is displayed in the Scripture App Builder in the "Book File"
tab of the Unmerciful Servant book. These changes include the removal of img tags. The Unmerciful Servant book has its source in a .docx file, so I am guessing
that the changes are made in the conversion of the .docx to the .sfm files.
*/

/**
 * Replace page tags with chapters
 */
export function replacePageTags(usfm: string): string {
    return usfm.replace(/\\page\s+(\d+)/g, '\\c $1');
}

/**
 * Replace img tags with figs
 */
export function replaceImageTags(usfm: string): string {
    return usfm.replace(/\\img\s+(\S+)/g, '\\fig caption |src="$1"\\fig*');
} //"caption" is just a placeholder for now.
//\fig Jesus Birth|src="JesusBirth.jpg" size="span"\fig*
//\img image1.jpeg

/**
 * Convert list tags to milestones (I need to test this to see if this is needed or if the list tags can be parsed as they currently are)
 */
export function transformLists(usfm: string): string {
    return usfm
        .replace(/\\zuli1\s+([^\\]*)/g, '\\zuli1-s\\* $1 \\zuli1-e\\* ')
        .replace(/\\zon1 (\d+)(([^\\]|\\zoli)*)/g, '\\zon1-s |start="$1"\\* $2 \\zon1-e\\* ')
        .replace(/\\zoli1\s+([^\\]*)/g, '\\zoli1-s\\* $1 \\zoli1-e\\* ');
} //Maybe keep, maybe not

export function transformHeadings(usfm: string): string {
    return usfm.replace(/\\(m?s\d?)([^\\]*)/g, '\\m \\zusfm-s |class="$1"\\* $2 \\zusfm-e ');
} //Also maybe keep, maybe not

export function convertStorybookElements(usfm: string) {
    console.log('Storybook start:');
    console.log(usfm);
    usfm = replacePageTags(usfm);
    usfm = replaceImageTags(usfm);
    //usfm = transformLists(usfm);
    //usfm = transformHeadings(usfm);
    console.log('Storybook end:');
    console.log(usfm);
    return usfm;
}
