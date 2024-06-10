/**
 * Represents one or more characters a Regex should match literally.
 */
class RegexToken {
    private token: string;

    constructor(token: string) {
        if ('\\$*.?+[]^&{}!<>|-'.includes(token)) {
            token = '\\' + token;
        }
        this.token = token;
    }

    toString(): string {
        return this.token;
    }
}

/**
 * Matches a group of RegexToken's that should be considered equivalent.
 * (ex: a and á)
 */
class RegexGroup {
    private tokens: RegexToken[];

    constructor(tokens: RegexToken[]) {
        this.tokens = tokens;
    }

    toString(): string {
        return '(?:' + this.tokens.join('|') + ')';
    }
}

/**
 * Builds a regex to match a sequence of RegexGroup's.
 *
 * Options:
 *  - ignore: A group of tokens that may occur anywhere in a match.
 *  - capture: Whether to wrap the match in a Regex capture group
 */
class RegexString {
    private pattern: string;

    constructor(chars: RegexGroup[], options: { ignore?: RegexGroup; capture?: boolean } = {}) {
        const charPatterns = chars.map((c) => c.toString());
        const ignorePattern = options.ignore ? options.ignore.toString() + '*' : '';
        this.pattern = ignorePattern + charPatterns.join(ignorePattern) + ignorePattern;
        if (options.capture) {
            this.pattern = '(' + this.pattern + ')';
        }
    }

    toString(): string {
        return this.pattern;
    }
}

function tokenize(input: string): RegexToken[] {
    return [...input].map((c) => new RegexToken(c));
}

/**
 * Get the first RegexGroup that matches the given character or string.
 */
function groupFor(char: string, groups: RegexGroup[]): RegexGroup {
    return groups.find((g) => new RegExp(g.toString()).test(char));
}

function makeGroups(input: string, equivalent: string[] = []): RegexGroup[] {
    const groups = equivalent.map((e) => newGroup(e));
    return [...input].map((c) => groupFor(c, groups) ?? newGroup(c));
}

function newGroup(chars: string): RegexGroup {
    return new RegexGroup(tokenize(chars));
}

/**
 * Build a regex from the given input.
 *
 * Options:
 *  - equivalent: A list of strings whose characters are equivalent
 *  - ignore: The presence of these characters in the input or the
 *    searched text will not affect the search results.
 */
export function makeRegex(
    input: string,
    options: {
        equivalent?: string[];
        ignore?: string;
        capture?: boolean;
    } = {}
): RegExp {
    return new RegExp(makeRegexPattern(input, options));
}

export function makeRegexPattern(
    input: string,
    options: {
        equivalent?: string[];
        ignore?: string;
        capture?: boolean;
    } = {}
): string {
    const groups = makeGroups(input, options?.equivalent);
    const ignore = options?.ignore ? newGroup(options.ignore) : null;
    const regexString = new RegexString(groups, {
        ignore,
        capture: options?.capture
    });
    return regexString.toString();
}

function toWords(input: string): string[] {
    const regex = /[\p{L}\p{N}]+/gu;
    return input.match(regex) || [];
}

export const RegexHelpers = {
    RegexToken,
    RegexGroup,
    RegexString,
    tokenize,
    groupFor,
    makeGroups,
    wordsOf: toWords
};
