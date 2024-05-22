function regexSafe(input: string): string {
    let result = input.replaceAll('\\\\', '\\\\\\\\');
    for (const c of '$*.?+[]^&{}!<>|-') {
        result = result.replaceAll(c, `\\\\${c}`);
    }
    return result;
}

export function searchParams(keywords: string[], wholeWords: boolean): string {
    const safeKeywords = keywords
        .map((wd) => wd.replaceAll('\\', '\\\\'))
        .map((wd) => wd.replaceAll('"', '\\"'));
    const searchTerms = wholeWords
        ? safeKeywords
        : safeKeywords.map((wd) => regexSafe(wd)).map((wd) => wd + '.*');
    const param = wholeWords ? 'withChars' : 'withMatchingChars';
    return `${param}: ["${searchTerms.join('", "')}"]`;
}

export function tokenize(input: string): string[] {
    return input.split(/\s+/).filter((t) => t);
}

function searchQuery(searchTerms: string[], wholeWords: boolean): string {
    const params = searchParams(searchTerms, wholeWords);
    return `
{
  docSets {
    documents(${params} allChars: true) {
      book: header(id: "bookCode")
      mainSequence {
        blocks(${params} allChars: true) {
          tokens(includeContext: true) {
            scopes(startsWith: ["chapter/" "verses/"])
            payload
          }
        }
      }
    }
  }
}

`;
}
