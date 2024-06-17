import { extendStringProperty } from './object-helpers';

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

    toUpperCase(): RegexToken {
        return new RegexToken(this.token.toUpperCase());
    }

    toLowerCase(): RegexToken {
        return new RegexToken(this.token.toLowerCase());
    }

    hasCase(): boolean {
        return this.token.toUpperCase() !== this.token.toLowerCase();
    }
}

/**
 * Matches a group of RegexToken's that should be considered equivalent.
 * (ex: a and á)
 */
class RegexGroup {
    private tokens: RegexToken[];
    private starred: boolean;

    constructor(tokens: RegexToken[], options: { starred?: boolean; matchCase?: boolean } = {}) {
        this.tokens = this.mapTokens(tokens, options.matchCase);
        this.starred = options.starred ?? false;
    }

    private mapTokens(tokens: RegexToken[], matchCase: boolean = false): RegexToken[] {
        if (matchCase) {
            return tokens;
        }
        return tokens.flatMap((t) => (t.hasCase() ? [t.toUpperCase(), t.toLowerCase()] : t));
    }

    toString(): string {
        const star = this.starred ? '*' : '';
        return '(?:' + this.tokens.join('|') + ')' + star;
    }
}

function tokenize(input: string): RegexToken[] {
    return [...input].map((c) => new RegexToken(c));
}

/**
 * Maps characters that may be substituted during a search
 */
type SubstitutionMap = { [char: string]: string };

/**
 * Convert the SubstitutionMap to use upper and lower case interchangeably
 */
function allowCaseSubstitution(substitute: SubstitutionMap): SubstitutionMap {
    const subs: SubstitutionMap = {};
    for (const key of Object.keys(substitute)) {
        const value = upperAndLowerCase(substitute[key]);
        extendStringProperty(subs, key.toUpperCase(), value);
        extendStringProperty(subs, key.toLowerCase(), value);
    }
    // Remove any duplicate characters
    for (const key of Object.keys(subs)) {
        subs[key] = [...new Set(subs[key]).values()].join('');
    }
    return subs;
}

function upperAndLowerCase(input: string) {
    const upper = input.toUpperCase();
    const lower = input.toLowerCase();
    if (upper === lower) {
        return input;
    }
    return upper + lower;
}

export interface RegexOptions {
    ignore?: string;
    substitute?: SubstitutionMap;
    capture?: boolean;
    wholeLine?: boolean;
    matchCase?: boolean;
}

class RegexBuilder {
    regex(phrase: string, options: RegexOptions = {}): RegExp {
        const pattern = this.pattern(phrase, options);
        return new RegExp(pattern);
    }

    pattern(phrase: string, options: RegexOptions = {}): string {
        const substitute = options.matchCase
            ? options.substitute
            : allowCaseSubstitution(options.substitute ?? {});
        const groups = this.getGroupsWithIgnore(
            phrase,
            options.ignore,
            substitute,
            options.matchCase
        );
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
        substitute?: SubstitutionMap,
        matchCase?: boolean
    ) {
        const ignoreGroup = this.getIgnoreGroup(ignore, matchCase);
        if (ignoreGroup) {
            phrase = phrase.replaceAll(new RegExp(ignoreGroup.toString(), 'g'), '');
        }
        let groups = this.getGroups(phrase, substitute, matchCase);
        if (ignoreGroup) {
            groups = this.addIgnoreGroups(groups, ignoreGroup);
        }
        return groups;
    }

    private getIgnoreGroup(ignore?: string, matchCase?: boolean): RegexGroup {
        if (!ignore) {
            return null;
        }
        const ignoreTokens = tokenize(ignore);
        return new RegexGroup(ignoreTokens, { starred: true, matchCase });
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

    private getGroups(
        phrase: string,
        substitute: SubstitutionMap = {},
        matchCase?: boolean
    ): RegexGroup[] {
        const groups = [];
        for (const char of [...phrase]) {
            const tokens = [new RegexToken(char)];
            if (substitute[char]) {
                tokens.push(...tokenize(substitute[char]));
            }
            groups.push(new RegexGroup(tokens, { matchCase }));
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
    RegexBuilder,
    allowCaseSubstitution,
    resetBuilderInstance,
    setBuilderInstance,
    splitByWords,
    tokenize,
    wordsOf
};
