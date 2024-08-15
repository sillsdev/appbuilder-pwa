import { describe, expect, beforeEach, it } from 'vitest';
import { checkForMilestoneLinks } from './milestoneLinks';
import type { AudioData } from '$config';
const emptyAudio: AudioData = {
    sources: {},
    files: []
};
describe('milestoneLinks', () => {
    function onClick(e: any) {}
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
                    'usfm:zweblink',
                    emptyAudio,
                    onClick
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
                    'usfm:zweblink',
                    emptyAudio,
                    onClick
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
                    'usfm:zreflink',
                    emptyAudio,
                    onClick
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
                    'usfm:zreflink',
                    emptyAudio,
                    onClick
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
                'usfm:zelink',
                emptyAudio,
                onClick
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
                'usfm:ztellink',
                emptyAudio,
                onClick
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
    describe('usfm:zaudioc milestone received outside footnote with asset audio', () => {
        let phraseWebLinks;
        let footnoteWebLinks;
        let audioElements;
        beforeEach(() => {
            const audioConfig: AudioData = {
                sources: {
                    a1: {
                        type: 'assets',
                        name: 'Source 1'
                    }
                },
                files: [
                    {
                        name: 'audioclip.mp3',
                        src: 'a1'
                    }
                ]
            };
            textType.push('audioc');
            checkForMilestoneLinks(
                textType,
                footnoteDiv,
                phraseDiv,
                'Audio Clip Link',
                'audioclip.mp3',
                5,
                'usfm:zaudioc',
                audioConfig,
                onClick
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
    describe('usfm:zaudioc milestone received outside footnote with remote audio', () => {
        let phraseWebLinks;
        let footnoteWebLinks;
        let audioElements;
        beforeEach(() => {
            const audioConfig: AudioData = {
                sources: {
                    d1: {
                        type: 'download',
                        name: 'Source 2',
                        accessMethods: ['stream', 'download'],
                        folder: 'Test',
                        address: 'https://archive.org/download/B0201SanMarcosCUKNVSN2DA/'
                    }
                },
                files: [
                    {
                        name: 'B02___02_San_Marcos__CUKNVSN2DA.mp3',
                        src: 'd1'
                    }
                ]
            };
            textType.push('audioc');
            checkForMilestoneLinks(
                textType,
                footnoteDiv,
                phraseDiv,
                'Audio Clip Link',
                'B02___02_San_Marcos__CUKNVSN2DA.mp3',
                6,
                'usfm:zaudioc',
                audioConfig,
                onClick
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
            it('sets attribute filelink', () => {
                expect(webLink.getAttribute('filelink')).toEqual('audio006');
            });
            it('sets class to audioclip', () => {
                expect(webLink.classList.contains('audioclip')).toBe(true);
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
                expect(audioLink.id).toEqual('audio006');
            });
            it('sets src to the name of the clip in the clips folder', () => {
                expect(audioLink.src).toContain(
                    'https://archive.org/download/B0201SanMarcosCUKNVSN2DA/B02___02_San_Marcos__CUKNVSN2DA.mp3'
                );
            });
            it('sets preload to auto', () => {
                expect(audioLink.getAttribute('preload')).toEqual('auto');
            });
        });
    });
});
