import { RegexHelpers, makeRegex as makeRegex } from './regex-helpers';
import { describe, expect, test } from 'vitest';

const RegexToken = RegexHelpers.RegexToken;
const RegexGroup = RegexHelpers.RegexGroup;
const RegexString = RegexHelpers.RegexString;
const tokenize = RegexHelpers.tokenize;
const makeGroups = RegexHelpers.makeGroups;
const groupFor = RegexHelpers.groupFor;

describe('RegexToken', () => {
    test('escapes special characters', () => {
        const raw = '$*.?+[]^&{}!<>|-\\';
        for (const c of raw) {
            expect(new RegexToken(c).toString()).toBe('\\' + c);
        }
    });

    test('does not escape alphanumeric', () => {
        const raw = 'abcdefghijklmnopqrstuvwxyz1234567890';
        for (const c of raw) {
            expect(new RegexToken(c).toString()).toBe(c);
        }
        for (const c of raw.toUpperCase()) {
            expect(new RegexToken(c).toString()).toBe(c);
        }
    });

    test('Works with UTF-16 surrogates', () => {
        const c = '𝟘';
        expect(new RegexToken(c).toString()).toBe(c);
    });
});

describe('RegexGroup', () => {
    test('Matches single token', () => {
        const token = new RegexToken('w');
        const group = new RegexGroup([token]);
        const regex = new RegExp(group.toString());
        expect('Hello world!!'.match(regex).slice()).toEqual(['w']);
    });

    test('Matches multiple tokens', () => {
        const tokens = [new RegexToken('h'), new RegexToken('d')];
        const group = new RegexGroup(tokens);
        const regex = new RegExp(group.toString());
        for (const word of ['hello', 'world']) {
            expect(word.match(regex)).toBeTruthy();
        }
    });

    test('Matches UTF-16 surrogate', () => {
        const tokens = [new RegexToken('𝟚'), new RegexToken('a')];
        const group = new RegexGroup(tokens);
        const regex = new RegExp(group.toString());
        expect('𝟘𝟙𝟚𝟛'.match(regex).slice()).toEqual(['𝟚']);
    });

    test('works with multi-character tokens', () => {
        const tokens = [new RegexToken('world')];
        const group = new RegexGroup(tokens);
        const regex = new RegExp(group.toString());
        expect('Hello world!!!'.match(regex).slice()).toEqual(['world']);
    });

    test('supports concatenation with other groups', () => {
        const group1 = new RegexGroup([new RegexToken('a'), new RegexToken('b')]);
        const group2 = new RegexGroup([new RegexToken('x'), new RegexToken('y')]);
        const regex = new RegExp(group1.toString() + group2.toString());
        expect('Fine by me'.match(regex).slice()).toEqual(['by']);
    });

    test('supports star operator', () => {
        const group1 = new RegexGroup([new RegexToken('a'), new RegexToken('b')]);
        const regex = new RegExp('x' + group1.toString() + '*y');
        expect('txaabbabaysno'.match(regex).slice()).toEqual(['xaabbabay']);
    });
});

describe('RegexString', () => {
    test('Matches string of groups', () => {
        const a = new RegexGroup([new RegexToken('a')]);
        const b = new RegexGroup([new RegexToken('b')]);
        const c = new RegexGroup([new RegexToken('c'), new RegexToken('ç')]);
        const pattern = new RegexString([a, b, c]).toString();
        const regex = new RegExp(pattern);
        expect('Hello abçdef world'.match(regex).slice()).toEqual(['abç']);
    });

    test('Capture match', () => {
        const a = new RegexGroup([new RegexToken('a')]);
        const b = new RegexGroup([new RegexToken('b')]);
        const c = new RegexGroup([new RegexToken('c'), new RegexToken('ç')]);
        const pattern = new RegexString([a, b, c], { capture: true }).toString();
        const regex = new RegExp(pattern);
        expect('Hello abçd world'.match(regex).slice()).toEqual(['abç', 'abç']);
    });

    test('Ignore characters', () => {
        const a = new RegexGroup([new RegexToken('a')]);
        const b = new RegexGroup([new RegexToken('b')]);
        const c = new RegexGroup([new RegexToken('c'), new RegexToken('ç')]);
        const ignored = new RegexGroup([new RegexToken('x'), new RegexToken('y')]);
        const pattern = new RegexString([a, b, c], { ignore: ignored }).toString();
        const regex = new RegExp(pattern);
        expect('Hello xyaxyxbçyd world'.match(regex)?.slice()).toEqual(['xyaxyxbçy']);
    });

    test('Capture with ignored characters', () => {
        const a = new RegexGroup([new RegexToken('a')]);
        const b = new RegexGroup([new RegexToken('b')]);
        const c = new RegexGroup([new RegexToken('c'), new RegexToken('ç')]);
        const ignored = new RegexGroup([new RegexToken('x'), new RegexToken('y')]);
        const pattern = new RegexString([a, b, c], { ignore: ignored, capture: true }).toString();
        const regex = new RegExp(pattern);
        expect('Hello xyaxyxbçyd world'.match(regex)?.slice()).toEqual(['xyaxyxbçy', 'xyaxyxbçy']);
    });

    describe('Whole words', () => {
        test('Does not match parital word', () => {
            const a = new RegexGroup([new RegexToken('a')]);
            const b = new RegexGroup([new RegexToken('b')]);
            const c = new RegexGroup([new RegexToken('c'), new RegexToken('d')]);
            const ignored = new RegexGroup([new RegexToken('x'), new RegexToken('y')]);
            const pattern = new RegexString([a, b, c], {
                ignore: ignored,
                capture: true,
                wholeWords: true
            }).toString();
            const regex = new RegExp(pattern);
            expect('Hello xyaxyxbdyd world'.match(regex)).toBeNull();
        });

        test('Matches whole word', () => {
            const a = new RegexGroup([new RegexToken('a')]);
            const b = new RegexGroup([new RegexToken('b')]);
            const c = new RegexGroup([new RegexToken('c'), new RegexToken('d')]);
            const ignored = new RegexGroup([new RegexToken('x'), new RegexToken('y')]);
            const pattern = new RegexString([a, b, c], {
                ignore: ignored,
                capture: true,
                wholeWords: true
            }).toString();
            const regex = new RegExp(pattern);
            expect('Hello xyaxyxbdy world'.match(regex)?.slice()).toEqual([
                'xyaxyxbdy',
                'xyaxyxbdy'
            ]);
        });

        test('Matches whole word with trailing comma', () => {
            const a = new RegexGroup([new RegexToken('a')]);
            const b = new RegexGroup([new RegexToken('b')]);
            const c = new RegexGroup([new RegexToken('c'), new RegexToken('ç')]);
            const ignored = new RegexGroup([new RegexToken('x'), new RegexToken('y')]);
            const pattern = new RegexString([a, b, c], {
                ignore: ignored,
                capture: true,
                wholeWords: true
            }).toString();
            const regex = new RegExp(pattern);
            expect('Hello xyaxyxbçy, world'.match(regex)?.slice()).toEqual([
                'xyaxyxbçy',
                'xyaxyxbçy'
            ]);
        });
    });
});

describe('tokenize', () => {
    test('Number of tokens matches number of characters', () => {
        const text = '𝟘123*';
        expect(tokenize(text).length).toBe(5);
    });
});

describe('groupFor', () => {
    test('returns correct group', () => {
        const a = new RegexGroup([new RegexToken('a'), new RegexToken('å')]);
        const b = new RegexGroup([new RegexToken('b')]);
        const c = new RegexGroup([new RegexToken('c'), new RegexToken('ç')]);
        expect(groupFor('ç', [a, b, c])).toBe(c);
    });
});

describe('makeGroups', () => {
    test('Default options', () => {
        const a = new RegexGroup([new RegexToken('a')]);
        const b = new RegexGroup([new RegexToken('b')]);
        const c = new RegexGroup([new RegexToken('ç')]);
        expect(makeGroups('abç')).toEqual([a, b, c]);
    });

    test('With equivalent characters', () => {
        const a = new RegexGroup([new RegexToken('a'), new RegexToken('å'), new RegexToken('á')]);
        const b = new RegexGroup([new RegexToken('b')]);
        const c = new RegexGroup([new RegexToken('c'), new RegexToken('ç')]);
        expect(makeGroups('abç', ['aåá', 'cç'])).toEqual([a, b, c]);
    });
});

describe('makeRegex', () => {
    test('Basic regex', () => {
        const regex = makeRegex('def');
        expect('abcdefghij'.match(regex).slice()).toEqual(['def']);
    });

    test('With replace and ignore', () => {
        const regex = makeRegex('hello', { equivalent: ['hy'], ignore: 'w' });
        expect('yellow'.match(regex)?.slice()).toEqual(['yellow']);
    });

    describe('Whole words', () => {
        const regex = makeRegex('am', { wholeWords: true });

        test('Matches whole word', () => {
            expect(regex.test('am')).toBe(true);
        });

        test('Does not match partial word', () => {
            expect(regex.test('ham')).toBe(false);
        });
    });

    test('Capture', () => {
        const regex = makeRegex('am', { capture: true });
        expect('am'.match(regex).slice()).toEqual(['am', 'am']);
    });

    describe('Ignored words occur in equivalence', () => {
        // Shouldn't normally happen, but test just in case.
        //
        // If a and b are equivalent and a is ignored, it should
        // not follow that b is ignored.

        const ignore = 'a';
        const equivalent = ['ab'];

        describe('Search for "tom"', () => {
            const regex = makeRegex('tom', { ignore, equivalent, wholeWords: true });

            test('Matches atom', () => {
                expect(regex.test('atom')).toBe(true);
            });

            test('Does not match btom', () => {
                expect(regex.test('btom')).toBe(false);
            });
        });

        test('Search for "bxy" find "axy"', () => {
            const regex = makeRegex('bxy', { ignore, equivalent, wholeWords: true });
            expect(regex.test('axy')).toBe(true);
        });

        test('Search for "axy" find "bxy"', () => {
            const regex = makeRegex('axy', { ignore, equivalent, wholeWords: true });
            expect(regex.test('bxy')).toBe(true);
        });
    });
});
