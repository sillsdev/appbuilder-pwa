import { describe, expect, beforeEach, it, test } from 'vitest';
import { readFile, readFileSync, writeFile, writeFileSync, mkdirSync, existsSync } from 'fs';
import path from 'path';
import { verifyGlossaryEntries } from './verifyGlossaryEntries';

describe('verifyGlossaryEntries', () => {
    // Tests using Genesis 1: 1 & 2
    const data = readFileSync(path.join('test_data', 'books', 'C01', '01GENengWEBbd.usfm'), 'utf8');
    describe('with all entries in the glossary', () => {
        let modifiedContent: string;
        beforeEach(() => {
            const glossary = ['excess', 'serpent', 'middle', 'subtle', 'tree', 'extra'];
            modifiedContent = verifyGlossaryEntries(data, glossary);
        });
        it('leaves in place simple entry', () => {
            expect(modifiedContent).toContain('Now the \\w serpent\\w* was more');
        });
        it('leaves in place entry with an extra space', () => {
            expect(modifiedContent).toContain('more \\w subtle \\w*than any animal');
        });
        it('leaves in place entry using lemma', () => {
            expect(modifiedContent).toContain(
                'We may eat fruit from the \\w trees|tree \\w* of the garden'
            );
        });
    });
    describe('with all entries case mismatch', () => {
        let modifiedContent: string;
        beforeEach(() => {
            const glossary = ['Excess', 'Serpent', 'Middle', 'Subtle', 'Tree', 'Extra'];
            modifiedContent = verifyGlossaryEntries(data, glossary);
        });
        it('leaves in place simple entry', () => {
            expect(modifiedContent).toContain('Now the \\w serpent\\w* was more');
        });
        it('leaves in place entry with an extra space', () => {
            expect(modifiedContent).toContain('more \\w subtle \\w*than any animal');
        });
        it('leaves in place entry using lemma', () => {
            expect(modifiedContent).toContain(
                'We may eat fruit from the \\w trees|tree \\w* of the garden'
            );
        });
    });
    describe('with one mismatch', () => {
        let modifiedContent: string;
        beforeEach(() => {
            const glossary = ['excess', 'serpent', 'middle', 'subtle', 'trees', 'extra'];
            modifiedContent = verifyGlossaryEntries(data, glossary);
        });
        it('leaves in place simple entry', () => {
            expect(modifiedContent).toContain('Now the \\w serpent\\w* was more');
        });
        it('leaves in place entry with an extra space', () => {
            expect(modifiedContent).toContain('more \\w subtle \\w*than any animal');
        });
        it('removes when matches first but not lemma', () => {
            expect(modifiedContent).toContain('We may eat fruit from the trees of the garden');
        });
    });
    describe('with missing entries in the glossary', () => {
        let modifiedContent: string;
        beforeEach(() => {
            const glossary = ['excess', 'serpent', 'more', 'middle', 'tree', 'extra'];
            modifiedContent = verifyGlossaryEntries(data, glossary);
        });
        it('leaves in place simple entry', () => {
            expect(modifiedContent).toContain('Now the \\w serpent\\w* was more');
        });
        it('removes mismatched entry', () => {
            expect(modifiedContent).toContain('more subtle than any animal');
        });
        it('leaves in place entry using lemma', () => {
            expect(modifiedContent).toContain(
                'We may eat fruit from the \\w trees|tree \\w* of the garden'
            );
        });
    });
    describe('with empty glossary', () => {
        let modifiedContent: string;
        beforeEach(() => {
            const glossary: string[] = [];
            modifiedContent = verifyGlossaryEntries(data, glossary);
        });
        it('removes simple entry', () => {
            expect(modifiedContent).toContain('Now the serpent was more');
        });
        it('removes entry with an extra space', () => {
            expect(modifiedContent).toContain('more subtle than any animal');
        });
        it('removes entry using lemma', () => {
            expect(modifiedContent).toContain('We may eat fruit from the trees of the garden');
        });
    });
});
