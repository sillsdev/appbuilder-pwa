import {
    RegexHelpers,
    makeRegex as makeRegex,
    makeRegexPattern,
    type RegexOptions
} from '../regex-helpers';
import { afterAll, describe, expect, test, vi } from 'vitest';

const RegexToken = RegexHelpers.RegexToken;
const RegexGroup = RegexHelpers.RegexGroup;
const RegexBuilder = RegexHelpers.RegexBuilder;
const allowCaseSubstitution = RegexHelpers.allowCaseSubstitution;
const resetBuilderInstance = RegexHelpers.resetBuilderInstance;
const setBuilderInstance = RegexHelpers.setBuilderInstance;
const tokenize = RegexHelpers.tokenize;

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

    test('toUpperCase', () => {
        const token = new RegexToken('a');
        const upper = token.toUpperCase();
        expect(upper.toString()).toBe('A');
    });

    test('toLowerCase', () => {
        const token = new RegexToken('A');
        const upper = token.toLowerCase();
        expect(upper.toString()).toBe('a');
    });

    describe('hasCase', () => {
        test('true for letter', () => {
            const token = new RegexToken('a');
            expect(token.hasCase()).toBe(true);
        });

        test('false for number', () => {
            const token = new RegexToken('3');
            expect(token.hasCase()).toBe(false);
        });
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

    test('Duplicate token does not effect', () => {
        const tokens = [new RegexToken('$'), new RegexToken('$')];
        const group = new RegexGroup(tokens);
        const regex = new RegExp(group.toString());
        expect('$'.match(regex).slice()).toEqual(['$']);
    });

    test('starred group', () => {
        const group1 = new RegexGroup([new RegexToken('a'), new RegexToken('b')], {
            starred: true
        });
        const regex = new RegExp('x' + group1.toString() + 'y');
        expect('txaabbabaysno'.match(regex).slice()).toEqual(['xaabbabay']);
    });

    describe('match case', () => {
        test('false by default', () => {
            const tokens = [new RegexToken('a'), new RegexToken('b')];
            const group = new RegexGroup(tokens);
            const regex = new RegExp(group.toString());
            for (const c of ['a', 'b', 'A', 'B']) {
                expect(c.match(regex)?.slice()).toEqual([c]);
            }
        });

        test('requires case when true', () => {
            const tokens = [new RegexToken('a'), new RegexToken('B')];
            const group = new RegexGroup(tokens, { matchCase: true });
            const regex = new RegExp(group.toString());
            for (const c of ['a', 'B']) {
                expect(c.match(regex)?.slice()).toEqual([c]);
            }
            for (const c of ['A', 'b']) {
                expect(c.match(regex)).toBeNull();
            }
        });
    });
});

describe('tokenize', () => {
    test('Number of tokens matches number of characters', () => {
        const text = '𝟘123*';
        expect(tokenize(text).length).toBe(5);
    });
});

describe('allowCaseSubstitution', () => {
    function expectEqualSubstitutions(result, expected) {
        for (const key of Object.keys(expected)) {
            expect(result).toHaveProperty(key);
            for (const c of expected[key]) {
                expect(result[key]).toContain(c);
            }
        }
    }

    test('input is all lowercase', () => {
        const before = {
            a: 'bc',
            b: 'a',
            c: 'd'
        };
        const after = {
            a: 'bcBC',
            A: 'bcBC',
            b: 'aA',
            B: 'aA',
            c: 'dD',
            C: 'dD'
        };
        const result = allowCaseSubstitution(before);
        expectEqualSubstitutions(result, after);
    });

    test('input is all uppercase', () => {
        const before = {
            A: 'BC',
            B: 'A',
            C: 'D'
        };
        const after = {
            a: 'bcBC',
            A: 'bcBC',
            b: 'aA',
            B: 'aA',
            c: 'dD',
            C: 'dD'
        };
        const result = allowCaseSubstitution(before);
        expectEqualSubstitutions(result, after);
    });

    test('does not duplicate numerals', () => {
        const input = {
            1: '4'
        };
        const result = allowCaseSubstitution(input);
        expect(result['1']).toBe('4');
    });

    describe('Different substitutions for different cases', () => {
        test('Combines substitutions', () => {
            const before = {
                a: 'bC',
                A: 'd'
            };
            const after = {
                a: 'bcdBCD',
                A: 'bcdBCD'
            };
            const result = allowCaseSubstitution(before);
            expectEqualSubstitutions(result, after);
        });

        test('does not duplicate characters', () => {
            const before = {
                a: 'bC4',
                A: 'bd4'
            };
            const result = allowCaseSubstitution(before);
            expect(result['a'].length).toBe(7);
        });
    });
});

describe('RegexBuilder', () => {
    describe('regex', () => {
        const builder = new RegexBuilder();

        function testPattern(pattern: string, text: string, options: RegexOptions = {}): string[] {
            const regex = builder.regex(pattern, options);
            return text.match(regex)?.slice() ?? null;
        }

        test('Basic pattern', () => {
            const regex = builder.regex('def');
            expect('abcdefghij'.match(regex).slice()).toEqual(['def']);
        });

        test('Matches special characters', () => {
            const s = '$*. \\ ?+[]^&{}!<>|-';
            const regex = builder.regex(s);
            expect('a $*. \\ ?+[]^&{}!<>|- b'.match(regex)?.slice()).toEqual([s]);
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

        describe('Match case', () => {
            test('ignores case when false', () => {
                const results = testPattern('marY', 'Mary', { matchCase: false });
                expect(results).toEqual(['Mary']);
            });

            test('requires case when true', () => {
                const results = testPattern('marY', 'Mary', { matchCase: true });
                expect(results).toBeNull();
            });

            describe('with substitutions and ignore', () => {
                test('ignores case when false', () => {
                    const pattern = 'AbwWcDxU';
                    const substitute = { a: 'bC', b: 'ad', c: 'a' };
                    const options: RegexOptions = { ignore: 'uW', substitute, matchCase: false };
                    const matches = ['abcdxu', 'wbubcudx', 'BDcdx', 'cdadx'];
                    for (const text of matches) {
                        const results = testPattern(pattern, text, options);
                        expect(results).toEqual([text]);
                    }
                });
            });
        });

        describe('Ignore case by locale', () => {
            test('in search query', () => {
                const results = testPattern('İstanbul', 'istanbul', { locale: 'tr' });
                expect(results).toEqual(['istanbul']);
            });

            test('in ignore string', () => {
                const results = testPattern('İstanbul', 'stanbul', { ignore: 'i', locale: 'tr' });
                expect(results).toEqual(['stanbul']);
            });

            test('in substitution', () => {
                const results = testPattern('İstanbul', 'xstanbul', {
                    substitute: { i: 'x', x: 'i' },
                    locale: 'tr'
                });
                expect(results).toEqual(['xstanbul']);
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
