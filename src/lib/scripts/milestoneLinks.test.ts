import { describe, expect, beforeEach, it } from 'vitest';
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
    describe('usfm:zweblink milestone received', () => {
        describe('outside footnote', () => {
            let phraseWebLinks;
            let footnoteWebLinks;
            beforeEach(() => {
                textType.push('weblink');
                checkForMilestoneLinks(
                    textType,
                    footnoteDiv,
                    phraseDiv,
                    'SIL Link',
                    'https://sil.org/',
                    0,
                    'usfm:zweblink'
                );
                phraseWebLinks = phraseDiv.getElementsByTagName('a');
                footnoteWebLinks = footnoteDiv.getElementsByTagName('a');
            });
            it('does not create a footnote link', () => {
                expect(footnoteWebLinks.length).toEqual(0);
            });
            it('creates a single link element in the phrase div', () => {
                expect(phraseWebLinks.length).toEqual(1);
            });
            describe('which', () => {
                let webLink;
                beforeEach(() => {
                    webLink = phraseWebLinks[0];
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
                it('pops one entry off of text type array', () => {
                    expect(textType.length).toEqual(1);
                });
            });
        });
        describe('inside footnote', () => {
            let phraseWebLinks;
            let footnoteWebLinks;
            beforeEach(() => {
                textType.push('footnote');
                textType.push('weblink');
                checkForMilestoneLinks(
                    textType,
                    footnoteDiv,
                    phraseDiv,
                    'SIL Link',
                    'https://sil.org/',
                    0,
                    'usfm:zweblink'
                );
                phraseWebLinks = phraseDiv.getElementsByTagName('a');
                footnoteWebLinks = footnoteDiv.getElementsByTagName('a');
            });
            it('does not create a phrase link', () => {
                expect(phraseWebLinks.length).toEqual(0);
            });
            it('creates a single link element in the footnote div', () => {
                expect(footnoteWebLinks.length).toEqual(1);
            });
            describe('which', () => {
                let webLink;
                beforeEach(() => {
                    webLink = footnoteWebLinks[0];
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
                it('pops one entry off of text type array', () => {
                    expect(textType.length).toEqual(2);
                });
            });
        });
    });
    describe('usfm:zreflink milestone received', () => {
        describe('outside footnote', () => {
            let phraseWebLinks;
            let footnoteWebLinks;
            beforeEach(() => {
                textType.push('reflink');
                checkForMilestoneLinks(
                    textType,
                    footnoteDiv,
                    phraseDiv,
                    'Ref Link',
                    'C01.MAT.5.1',
                    0,
                    'usfm:zreflink'
                );
                phraseWebLinks = phraseDiv.getElementsByTagName('a');
                footnoteWebLinks = footnoteDiv.getElementsByTagName('a');
            });
            it('does not create a footnote link', () => {
                expect(footnoteWebLinks.length).toEqual(0);
            });
            it('creates a single link element in the phrase div', () => {
                expect(phraseWebLinks.length).toEqual(1);
            });
            describe('which', () => {
                let webLink;
                beforeEach(() => {
                    webLink = phraseWebLinks[0];
                });
                it('has a class of web-link', () => {
                    expect(webLink.classList.contains('web-link')).toBe(true);
                });
                it('has a class of ref-link', () => {
                    expect(webLink.classList.contains('ref-link')).toBe(true);
                });
                it('sets reference attribute to the link', () => {
                    expect(webLink.getAttribute('ref')).toEqual('C01.MAT.5.1');
                });
                it('sets the link text', () => {
                    expect(webLink.innerHTML).toEqual('Ref Link');
                });
                it('pops one entry off of text type array', () => {
                    expect(textType.length).toEqual(1);
                });
            });
        });
        describe('inside footnote', () => {
            let phraseWebLinks;
            let footnoteWebLinks;
            beforeEach(() => {
                textType.push('footnote');
                textType.push('reflink');
                checkForMilestoneLinks(
                    textType,
                    footnoteDiv,
                    phraseDiv,
                    'Ref Link',
                    'C01.MAT.5.1',
                    0,
                    'usfm:zreflink'
                );
                phraseWebLinks = phraseDiv.getElementsByTagName('a');
                footnoteWebLinks = footnoteDiv.getElementsByTagName('a');
            });
            it('does not create a phrase link', () => {
                expect(phraseWebLinks.length).toEqual(0);
            });
            it('creates a single link element in the footnote div', () => {
                expect(footnoteWebLinks.length).toEqual(1);
            });
            describe('which', () => {
                let webLink;
                beforeEach(() => {
                    webLink = footnoteWebLinks[0];
                });
                it('has a class of web-link', () => {
                    expect(webLink.classList.contains('web-link')).toBe(true);
                });
                it('has a class of ref-link', () => {
                    expect(webLink.classList.contains('ref-link')).toBe(true);
                });
                it('sets reference attribute to the link', () => {
                    expect(webLink.getAttribute('ref')).toEqual('C01.MAT.5.1');
                });
                it('sets the link text', () => {
                    expect(webLink.innerHTML).toEqual('Ref Link');
                });
                it('pops one entry off of text type array', () => {
                    expect(textType.length).toEqual(2);
                });
            });
        });
    });
    describe('usfm:zelink milestone received outside footnote', () => {
        let phraseWebLinks;
        let footnoteWebLinks;
        beforeEach(() => {
            textType.push('elink');
            checkForMilestoneLinks(
                textType,
                footnoteDiv,
                phraseDiv,
                'Email Link',
                'mailto:david_moore1@sil.org',
                0,
                'usfm:zelink'
            );
            phraseWebLinks = phraseDiv.getElementsByTagName('a');
            footnoteWebLinks = footnoteDiv.getElementsByTagName('a');
        });
        it('does not create a footnote link', () => {
            expect(footnoteWebLinks.length).toEqual(0);
        });
        it('creates a single link element in the phrase div', () => {
            expect(phraseWebLinks.length).toEqual(1);
        });
        describe('which', () => {
            let webLink;
            beforeEach(() => {
                webLink = phraseWebLinks[0];
            });
            it('has a class of email-link', () => {
                expect(webLink.classList.contains('email-link')).toBe(true);
            });
            it('opens link in a separate tab', () => {
                expect(webLink.getAttribute('target')).toEqual('_blank');
            });
            it('sets the link', () => {
                expect(webLink.href).toEqual('mailto:david_moore1@sil.org');
            });
            it('sets the link text', () => {
                expect(webLink.innerHTML).toEqual('Email Link');
            });
            it('pops one entry off of text type array', () => {
                expect(textType.length).toEqual(1);
            });
        });
    });
    describe('usfm:ztellink milestone received outside footnote', () => {
        let phraseWebLinks;
        let footnoteWebLinks;
        beforeEach(() => {
            textType.push('tellink');
            checkForMilestoneLinks(
                textType,
                footnoteDiv,
                phraseDiv,
                'Telephone Link',
                'tel:9995551212',
                0,
                'usfm:ztellink'
            );
            phraseWebLinks = phraseDiv.getElementsByTagName('a');
            footnoteWebLinks = footnoteDiv.getElementsByTagName('a');
        });
        it('does not create a footnote link', () => {
            expect(footnoteWebLinks.length).toEqual(0);
        });
        it('creates a single link element in the phrase div', () => {
            expect(phraseWebLinks.length).toEqual(1);
        });
        describe('which', () => {
            let webLink;
            beforeEach(() => {
                webLink = phraseWebLinks[0];
            });
            it('has a class of tel-link', () => {
                expect(webLink.classList.contains('tel-link')).toBe(true);
            });
            it('opens link in a separate tab', () => {
                expect(webLink.getAttribute('target')).toEqual('_blank');
            });
            it('sets the link', () => {
                expect(webLink.href).toEqual('tel:9995551212');
            });
            it('sets the link text', () => {
                expect(webLink.innerHTML).toEqual('Telephone Link');
            });
            it('pops one entry off of text type array', () => {
                expect(textType.length).toEqual(1);
            });
        });
    });
    describe('usfm:zaudioc milestone received outside footnote', () => {
        let phraseWebLinks;
        let footnoteWebLinks;
        let audioElements;
        beforeEach(() => {
            textType.push('audioc');
            checkForMilestoneLinks(
                textType,
                footnoteDiv,
                phraseDiv,
                'Audio Clip Link',
                'audioclip.mp3',
                5,
                'usfm:zaudioc'
            );
            phraseWebLinks = phraseDiv.getElementsByTagName('a');
            footnoteWebLinks = footnoteDiv.getElementsByTagName('a');
            audioElements = phraseDiv.getElementsByTagName('audio');
        });
        it('does not create a footnote link', () => {
            expect(footnoteWebLinks.length).toEqual(0);
        });
        it('creates a single link element in the phrase div', () => {
            expect(phraseWebLinks.length).toEqual(1);
        });
        describe('which', () => {
            let webLink;
            beforeEach(() => {
                webLink = phraseWebLinks[0];
            });
            it('sets the href to #', () => {
                expect(webLink.getAttribute('href')).toEqual('#');
            });
            it('sets the link text', () => {
                expect(webLink.innerHTML).toEqual('Audio Clip Link');
            });
            it('pops one entry off of text type array', () => {
                expect(textType.length).toEqual(1);
            });
            it('sets the onClick to point at the audio element', () => {
                expect(webLink.getAttribute('onClick')).toEqual(
                    "document.getElementById('audio005').play();"
                );
            });
        });
        it('creates a single audio element in the phrase div', () => {
            expect(audioElements.length).toEqual(1);
        });
        describe('which', () => {
            let audioLink;
            beforeEach(() => {
                audioLink = audioElements[0];
            });
            it('sets an audio id', () => {
                expect(audioLink.id).toEqual('audio005');
            });
            it('sets src to the name of the clip in the clips folder', () => {
                expect(audioLink.src).toContain('clips/audioclip.mp3');
            });
            it('sets preload to auto', () => {
                expect(audioLink.getAttribute('preload')).toEqual('auto');
            });
        });
    });
});
