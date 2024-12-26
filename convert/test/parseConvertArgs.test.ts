import { parseConvertArgs } from '../parseConvertArgs';
import { describe, expect, test } from 'vitest';

describe('data dir', () => {
    test('defaults to "data"', () => {
        const parsed = parseConvertArgs([]);
        expect(parsed.dataDir).toBe('data');
    });

    test('override data path', () => {
        const args = ['--data-dir=./my/path'];
        const parsed = parseConvertArgs(args);
        expect(parsed.dataDir).toBe('./my/path');
    });
});

describe('watch', () => {
    test('defaults to false', () => {
        const parsed = parseConvertArgs([]);
        expect(parsed.watch).toBe(false);
    });

    test('set to true', () => {
        const parsed = parseConvertArgs(['--watch']);
        expect(parsed.watch).toBe(true);
    });
});

describe('watch timeout', () => {
    test('defaults to 100 ms', () => {
        const parsed = parseConvertArgs([]);
        expect(parsed.watchTimeout).toBe(100);
    });

    test('override', () => {
        const parsed = parseConvertArgs(['--watch-timeout=250']);
        expect(parsed.watchTimeout).toBe(250);
    });
});

describe('verbose', () => {
    test('defaults to 0', () => {
        const parsed = parseConvertArgs([]);
        expect(parsed.verbose).toBe(0);
    });

    test('set as flag', () => {
        const parsed = parseConvertArgs(['--verbose']);
        expect(parsed.verbose).toBe(1);
    });

    test('set to 3', () => {
        const parsed = parseConvertArgs(['--verbose=3']);
        expect(parsed.verbose).toBe(3);
    });
});
