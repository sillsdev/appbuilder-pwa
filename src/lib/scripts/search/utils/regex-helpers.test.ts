import { afterEach, before } from 'node:test';
import {
    RegexHelpers,
    makeRegex as makeRegex,
    makeRegexPattern,
    type RegexOptions
} from './regex-helpers';
import { afterAll, describe, expect, test, vi } from 'vitest';

const RegexToken = RegexHelpers.RegexToken;
const RegexGroup = RegexHelpers.RegexGroup;
const RegexString = RegexHelpers.RegexString;
const RegexBuilder = RegexHelpers.RegexBuilder;
const tokenize = RegexHelpers.tokenize;
const setBuilderInstance = RegexHelpers.setBuilderInstance;
const resetBuilderInstance = RegexHelpers.resetBuilderInstance;

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

    test('starred group', () => {
        const group1 = new RegexGroup([new RegexToken('a'), new RegexToken('b')], {
            starred: true
        });
        const regex = new RegExp('x' + group1.toString() + 'y');
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
});

describe('tokenize', () => {
    test('Number of tokens matches number of characters', () => {
        const text = '𝟘123*';
        expect(tokenize(text).length).toBe(5);
    });
});

describe('RegexBuilder', () => {
    describe('regex', () => {
        const builder = new RegexBuilder();

        function testPattern(pattern: string, text: string, options: object = {}): string[] {
            const regex = builder.regex(pattern, options);
            return text.match(regex)?.slice() ?? null;
        }

        test('Basic pattern', () => {
            const regex = builder.regex('def');
            expect('abcdefghij'.match(regex).slice()).toEqual(['def']);
        });

        describe('With ignore', () => {
            test('in search phrase', () => {
                const results = testPattern('xaxxbc', 'abc', { ignore: 'x' });
                expect(results).toEqual(['abc']);
            });

            test('in text to be searched', () => {
                const results = testPattern('abc', 'axbxxc', { ignore: 'x' });
                expect(results).toEqual(['axbxxc']);
            });
        });

        describe('With substitutions', () => {
            test('positive matches', () => {
                const pattern = 'abcdx';
                const substitute = { a: 'bc', b: 'ad', c: 'a' };
                const options = { substitute };
                const matches = ['abcdx', 'abcdx', 'bbcdx', 'cdadx'];
                for (const text of matches) {
                    const results = testPattern(pattern, text, options);
                    expect(results).toEqual([text]);
                }
            });
        });

        describe('With substitutions and ignore', () => {
            test('positive matches', () => {
                const pattern = 'abcdxu';
                const substitute = { a: 'bc', b: 'ad', c: 'a' };
                const options = { ignore: 'u', substitute };
                const matches = ['abcdxu', 'aubcudx', 'bbcdx', 'cdadx'];
                for (const text of matches) {
                    const results = testPattern(pattern, text, options);
                    expect(results).toEqual([text]);
                }
            });
        });

        test('capture', () => {
            const pattern = 'abcdxu';
            const substitute = { a: 'bc', b: 'ad', c: 'a' };
            const options = { ignore: 'u', substitute, capture: true };
            const matches = ['abcdxu', 'aubcudx', 'bbcdx', 'cdadx'];
            for (const text of matches) {
                const results = testPattern(pattern, 'yy' + text + 'yy', options);
                expect(results).toEqual([text, text]);
            }
        });

        describe('Whole line', () => {
            test('Matches whole line', () => {
                const results = testPattern('am', 'am', { wholeLine: true });
                expect(results).toEqual(['am']);
            });

            test('Does not match partial line', () => {
                const results = testPattern('am', 'ham', { wholeLine: true });
                expect(results).toBeNull();
            });
        });
    });

    describe('pattern', () => {
        test('is used by regex method', () => {
            class TestRegexBuilder extends RegexBuilder {
                pattern(phrase: string, options?: RegexOptions): string {
                    return 'blahblah';
                }
            }

            const builder = new TestRegexBuilder();
            const regex = builder.regex('', {});
            expect(regex).toEqual(/blahblah/);
        });
    });
});

describe('toWords', () => {
    test('splits on whitespace', () => {
        expect(RegexHelpers.wordsOf('  some\n thing\tgreat ')).toEqual(['some', 'thing', 'great']);
    });

    test('Retuns empty array if only whitespace', () => {
        expect(RegexHelpers.wordsOf('  \n \t ')).toEqual([]);
    });
});

describe('RegexBuilder convenience functions', () => {
    class TestRegexBuilder extends RegexBuilder {
        pattern(phrase: string, options?: RegexOptions): string {
            return 'hello';
        }

        regex(phrase: string, options?: RegexOptions): RegExp {
            return /goodbye/;
        }
    }

    const testBuilder = new TestRegexBuilder();
    setBuilderInstance(testBuilder);

    afterAll(() => {
        resetBuilderInstance();
        vi.resetAllMocks();
    });

    test('makeRegex calls RegexBuilder.regex directly', () => {
        const spy = vi.spyOn(testBuilder, 'regex');

        const phrase = 'test';
        const options = { ignore: '123' };
        makeRegex(phrase, options);
        expect(spy).toHaveBeenCalledWith(phrase, options);
    });

    test('makeRegexPattern calls RegexBuilder.pattern directly', () => {
        const spy = vi.spyOn(testBuilder, 'pattern');

        const phrase = 'test';
        const options = { ignore: '123' };
        makeRegexPattern(phrase, options);
        expect(spy).toHaveBeenCalledWith(phrase, options);
    });
});
