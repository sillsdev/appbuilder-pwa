import { describe, test, expect, beforeEach, it } from 'vitest';
import { checkForMilestoneLinks } from './milestoneLinks';
describe('milestoneLinks', () => {
    let phraseDiv: HTMLElement;
    let footnoteDiv: HTMLElement;
    let textType: string[];
    beforeEach(() => {
        phraseDiv = document.createElement('div');
        footnoteDiv = document.createElement('div');
        textType = ['verses'];
    });
    describe('usfm:zweblink milestone received outside footnote', () => {
        let webLinks;
        beforeEach(() => {
            textType.push('weblink');
            checkForMilestoneLinks(
                textType,
                footnoteDiv,
                phraseDiv,
                'SIL Link',
                'https://sil.org',
                0,
                'usfm:zweblink'
            );
            webLinks = phraseDiv.getElementsByTagName('a');
        });
        it('creates a single link element', () => {
            expect(webLinks.length).toEqual(1);
        });
        describe('which', () => {
            let webLink;
            beforeEach(() => {
                webLink = webLinks[0];
            });
            it('has a class of web-link', () => {
                expect(webLink.classList.contains('web-link')).toBe(true);
            });
            it('opens link in a separate tab', () => {
                expect(webLink.getAttribute('target')).toEqual('_blank');
            });
            it('sets the link', () => {
                expect(webLink.href).toEqual('https://sil.org/');
            });
            it('sets the link text', () => {
                expect(webLink.innerHTML).toEqual('SIL Link');
            });
        });
    });
});
