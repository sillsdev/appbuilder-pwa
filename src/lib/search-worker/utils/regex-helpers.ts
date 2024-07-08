import type { SubstitutionMap } from '$lib/search/domain/interfaces/data-interfaces';
import { extendStringProperty } from './object-helpers';

// Utilities for dynamically building regular expressions.

/**
 * Represents one or more characters a Regex should match literally.
 */
class RegexToken {
    private token: string;
    private locale: string;

    constructor(token: string, locale?: string) {
        if ('\\$*.?+[]^&{}!<>|-'.includes(token)) {
            token = '\\' + token;
        }
        this.token = token;
        this.locale = locale;
    }

    toString(): string {
        return this.token;
    }

    toUpperCase(): RegexToken {
        return new RegexToken(this.token.toLocaleUpperCase(this.locale));
    }

    toLowerCase(): RegexToken {
        return new RegexToken(this.token.toLocaleLowerCase(this.locale));
    }

    hasCase(): boolean {
        return (
            this.token.toLocaleUpperCase(this.locale) !== this.token.toLocaleLowerCase(this.locale)
        );
    }
}

/**
 * Matches a group of RegexToken's that should be considered equivalent.
 * (ex: a and á)
 */
class RegexGroup {
    private tokens: RegexToken[];
    private starred: boolean;

    constructor(
        tokens: RegexToken[],
        options: { starred?: boolean; matchCase?: boolean; locale?: string } = {}
    ) {
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

function tokenize(input: string, locale?: string): RegexToken[] {
    return [...input].map((c) => new RegexToken(c, locale));
}

/**
 * Convert the SubstitutionMap to use upper and lower case interchangeably
 */
function allowCaseSubstitution(substitute: SubstitutionMap, locale?: string): SubstitutionMap {
    const subs: SubstitutionMap = {};
    for (const key of Object.keys(substitute)) {
        const value = upperAndLowerCase(substitute[key], locale);
        extendStringProperty(subs, key.toLocaleUpperCase(locale), value);
        extendStringProperty(subs, key.toLocaleLowerCase(locale), value);
    }
    // Remove any duplicate characters
    for (const key of Object.keys(subs)) {
        subs[key] = [...new Set(subs[key]).values()].join('');
    }
    return subs;
}

function upperAndLowerCase(input: string, locale?: string) {
    const upper = input.toLocaleUpperCase(locale);
    const lower = input.toLocaleLowerCase(locale);
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
    locale?: string; // Used to customise upper/lowercase conversions
}

class RegexBuilder {
    regex(phrase: string, options: RegexOptions = {}): RegExp {
        const pattern = this.pattern(phrase, options);
        return new RegExp(pattern);
    }

    pattern(phrase: string, options: RegexOptions = {}): string {
        const substitute = options.matchCase
            ? options.substitute
            : allowCaseSubstitution(options.substitute ?? {}, options.locale);
        const groups = this.getGroupsWithIgnore(
            phrase,
            options.ignore,
            substitute,
            options.matchCase,
            options.locale
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
        matchCase?: boolean,
        locale?: string
    ) {
        const ignoreGroup = this.getIgnoreGroup(ignore, matchCase, locale);
        if (ignoreGroup) {
            phrase = phrase.replaceAll(new RegExp(ignoreGroup.toString(), 'g'), '');
        }
        let groups = this.getGroups(phrase, substitute, matchCase, locale);
        if (ignoreGroup) {
            groups = this.addIgnoreGroups(groups, ignoreGroup);
        }
        return groups;
    }

    private getIgnoreGroup(ignore?: string, matchCase?: boolean, locale?: string): RegexGroup {
        if (!ignore) {
            return null;
        }
        const ignoreTokens = tokenize(ignore, locale);
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
        matchCase?: boolean,
        locale?: string
    ): RegexGroup[] {
        const groups = [];
        for (const char of [...phrase]) {
            const tokens = [new RegexToken(char, locale)];
            if (substitute[char]) {
                tokens.push(...tokenize(substitute[char], locale));
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
