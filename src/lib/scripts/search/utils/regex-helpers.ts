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
    private starred: boolean;

    constructor(tokens: RegexToken[], options: { starred?: boolean } = {}) {
        this.tokens = tokens;
        this.starred = options.starred ?? false;
    }

    toString(): string {
        const star = this.starred ? '*' : '';
        return '(?:' + this.tokens.join('|') + ')' + star;
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

    constructor(
        chars: RegexGroup[],
        options: { ignore?: RegexGroup; capture?: boolean; wholeLine?: boolean } = {}
    ) {
        const charPatterns = chars.map((c) => c.toString());
        const ignorePattern = options.ignore ? options.ignore.toString() + '*' : '';
        this.pattern = ignorePattern + charPatterns.join(ignorePattern) + ignorePattern;
        if (options.capture) {
            this.pattern = '(' + this.pattern + ')';
        }
        if (options.wholeLine) {
            this.pattern = '^' + this.pattern + '$';
        }
    }

    toString(): string {
        return this.pattern;
    }
}

function tokenize(input: string): RegexToken[] {
    return [...input].map((c) => new RegexToken(c));
}

export interface RegexOptions {
    ignore?: string;
    substitute?: { [char: string]: string };
    capture?: boolean;
    wholeLine?: boolean;
}

class RegexBuilder {
    regex(phrase: string, options: RegexOptions = {}): RegExp {
        const pattern = this.pattern(phrase, options);
        return new RegExp(pattern);
    }

    pattern(phrase: string, options: RegexOptions = {}): string {
        const groups = this.getGroupsWithIgnore(phrase, options.ignore, options.substitute);
        let pattern = groups.map((g) => g.toString()).join('');
        if (options.capture) {
            pattern = '(' + pattern + ')';
        }
        if (options.wholeLine) {
            pattern = '^' + pattern + '$';
        }
        return pattern;
    }

    private getGroupsWithIgnore(
        phrase: string,
        ignore?: string,
        substitute?: { [char: string]: string }
    ) {
        const ignoreGroup = this.getIgnoreGroup(ignore);
        if (ignoreGroup) {
            phrase = phrase.replaceAll(new RegExp(ignoreGroup.toString(), 'g'), '');
        }
        let groups = this.getGroups(phrase, substitute);
        if (ignoreGroup) {
            groups = this.addIgnoreGroups(groups, ignoreGroup);
        }
        return groups;
    }

    private getIgnoreGroup(ignore?: string): RegexGroup {
        if (!ignore) {
            return null;
        }
        const ignoreTokens = tokenize(ignore);
        return new RegexGroup(ignoreTokens, { starred: true });
    }

    private addIgnoreGroups(match: RegexGroup[], ignore: RegexGroup): RegexGroup[] {
        const groups = [];
        groups.push(ignore);
        for (const group of match) {
            groups.push(group);
            groups.push(ignore);
        }
        return groups;
    }

    private getGroups(phrase: string, substitute: { [char: string]: string } = {}): RegexGroup[] {
        const groups = [];
        for (const char of [...phrase]) {
            const tokens = [new RegexToken(char)];
            if (substitute[char]) {
                tokens.push(...tokenize(substitute[char]));
            }
            groups.push(new RegexGroup(tokens));
        }
        return groups;
    }
}

let builderInstance = new RegexBuilder();

function resetBuilderInstance() {
    builderInstance = new RegexBuilder();
}

function setBuilderInstance(builder: RegexBuilder) {
    builderInstance = builder;
}

export function makeRegex(pattern: string, options: RegexOptions): RegExp {
    return builderInstance.regex(pattern, options);
}

export function makeRegexPattern(pattern: string, options: RegexOptions): string {
    return builderInstance.pattern(pattern, options);
}

function wordsOf(input: string): string[] {
    const regex = /[\p{L}\p{N}]+/gu;
    return input.match(regex) || [];
}

function splitByWords(input: string): string[] {
    const regex = /([\p{L}\p{N}]+)/u;
    return input.split(regex).filter((w) => w);
}

export const RegexHelpers = {
    RegexToken,
    RegexGroup,
    RegexString,
    RegexBuilder,
    setBuilderInstance,
    resetBuilderInstance,
    tokenize,
    splitByWords,
    wordsOf
};
