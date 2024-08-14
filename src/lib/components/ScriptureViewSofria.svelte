<!--
@component
A component for displaying scripture.  
TODO:
- find a way to scroll smoothly, as CSS only option does not work as expected.
- save graft info so that references can be handled
- parse introduction for references
LOGGING:
- add logs entry to local storage with this value (and change 1 to 0 to disable topic)
    { "scripture" : {"root": 1, "docResult": 1, "document":1, "paragraph": 1, "phrase" :1 , "chapter": 1, "verses": 1, "text": 1, "sequence": 1, "wrapper":1, "milestone":1, "blockGraft": 1, "inlineGraft": 1, "mark": 1, "meta": 1, "row": 1} }
-->
<script lang="ts">
    import type { SABProskomma } from '$lib/sab-proskomma';
    import { SofriaRenderFromProskomma } from 'proskomma-json-tools';
    import config from '$lib/data/config';
    import { base } from '$app/paths';
    import { footnotes, refs, logs, modal, MODAL_NOTE, userSettings } from '$lib/data/stores';
    import {
        generateHTML,
        handleHeaderLinkPressed,
        isBibleBook
    } from '$lib/scripts/scripture-reference-utils';
    import {
        onClickText,
        deselectAllElements,
        updateSelections
    } from '$lib/scripts/verseSelectUtil';
    import { prepareAudioPhraseEndChars, parsePhrase } from '$lib/scripts/parsePhrase';
    import { createVideoBlock, addVideoLinks } from '$lib/video';
    import { loadDocSetIfNotLoaded } from '$lib/data/scripture';
    import { seekToVerse, hasAudioPlayed } from '$lib/data/audio';
    import { audioPlayer } from '$lib/data/stores';
    import { checkForMilestoneLinks } from '$lib/scripts/milestoneLinks';
    import { ciEquals, isDefined, isNotBlank, splitString } from '$lib/scripts/stringUtils';
    import { getFeatureValueBoolean, getFeatureValueString } from '$lib/scripts/configUtils';
    import * as numerals from '$lib/scripts/numeralSystem';

    export let audioPhraseEndChars: string;
    export let bodyFontSize: any;
    export let bodyLineHeight: any;
    export let bookmarks: any;
    export let notes: any;
    export let highlights: any;
    export let maxSelections: any;
    export let redLetters: boolean;
    export let references: any;
    export let glossary: any;
    export let selectedVerses: any;
    export let themeColors: any;
    export let verseLayout: any;
    export let viewShowBibleImages: string;
    export let viewShowBibleVideos: string;
    export let viewShowIllustrations: boolean;
    export let viewShowVerses: boolean;
    export let viewShowGlossaryWords: boolean;
    export let font: string;
    export let proskomma: SABProskomma;

    $: scriptureLogs = $userSettings['scripture-logs']
        ? {
              root: 1,
              docResult: 1,
              document: 1,
              paragraph: 1,
              phrase: 1,
              chapter: 1,
              verses: 1,
              text: 1,
              sequence: 1,
              wrapper: 1,
              milestone: 1,
              blockGraft: 1,
              inlineGraft: 1,
              mark: 1,
              meta: 1,
              row: 1
          }
        : $logs['scripture'];

    let container: HTMLElement;
    let displayingIntroduction = false;
    const fnc = 'abcdefghijklmnopqrstuvwxyz';

    function escapeSpecialChars(separators: string) {
        return separators.replace(/[.*+\-?^${}()|[\]\\]/g, '\\$&');
    }
    const seprgx2 = (inputChars: string) => {
        let separators = prepareAudioPhraseEndChars(inputChars);
        let result = '(';
        for (let i = 0; i < separators.length; i++) {
            if (i > 0) {
                result += '|';
            }
            result += escapeSpecialChars(separators[i]);
        }
        result += ')';
        const regEx = new RegExp(result, 'g');
        return regEx;
    };
    $: seprgx = seprgx2(audioPhraseEndChars);

    const onlySpaces = (str) => {
        return str.trim().length === 0;
    };

    $: $selectedVerses, updateSelections(selectedVerses);

    const countSubheadingPrefixes = (subHeadings: [string], labelPrefix: string) => {
        let result = 0;
        for (let i in subHeadings) {
            if (subHeadings[i] === labelPrefix) {
                result++;
            }
        }
        return result;
    };

    const phraseTerminated = (phrase) => {
        return phrase.match(seprgx) != null;
    };
    const currentTextType = (workspace) => {
        return workspace.textType[workspace.textType.length - 1];
    };
    const startPhrase = (workspace, indexOption = 'advance') => {
        if (scriptureLogs?.phrase) {
            console.log('Start phrase!!!');
        }
        // Add pending phrase to the paragraph before starting
        // new ones
        if (workspace.phraseDiv != null) {
            if (workspace.phraseDiv.innerText.length === 0) {
                if (indexOption === 'advance') {
                    indexOption = 'keep';
                }
            } else {
                appendPhrase(workspace);
            }
        }
        const div = document.createElement('div');
        if (!workspace.introductionGraft) {
            switch (indexOption) {
                case 'reset':
                    workspace.currentPhraseIndex = 0;
                    break;
                case 'advance':
                    workspace.currentPhraseIndex++;
                    break;
                default:
                    break;
            }
            const phraseIndex = fnc.charAt(workspace.currentPhraseIndex);
            div.id = workspace.currentVerse + phraseIndex;
            div.setAttribute('data-verse', workspace.currentVerse);
            div.setAttribute('data-phrase', phraseIndex);
            div.classList.add('txs', 'seltxt', 'scroll-item');
        } else {
            div.id = '+' + parseInt(workspace.introductionIndex);
            div.classList.add('txs');
            workspace.introductionIndex++;
        }
        return div.cloneNode(true);
    };
    const addTableText = (workspace, text) => {
        if (workspace.inRow) {
            if (workspace.textType.includes('usfm') && workspace.usfmWrapperType === 'xt') {
                const references = text.split('; ');
                for (let i = 0; i < references.length; i++) {
                    const links = references[i].split('|');
                    const displayText = links[0];
                    const referenceText = links.length > 1 ? links[1] : links[0];
                    const spanElement = document.createElement('span');
                    spanElement.classList.add('reflink');

                    // TODO: Figure out what really needs to be added to go to references
                    // For now, just make it look consistent
                    const aElement = document.createElement('a');
                    aElement.setAttribute('href', referenceText);
                    const refText = document.createTextNode(displayText);
                    aElement.appendChild(refText);
                    spanElement.appendChild(aElement);

                    workspace.tableCellElement.appendChild(spanElement);
                    if (i < references.length - 1) {
                        const textNode = document.createTextNode('; ');
                        workspace.tableCellElement.appendChild(textNode);
                    }
                }
            } else {
                const div = addTextNode(workspace.tableCellElement, text, workspace);
                workspace.tableCellElement = div.cloneNode(true);
            }
        }
    };
    const addGraftText = (workspace, text, textType, usfmType) => {
        if (workspace.textType.includes(textType)) {
            if (isDefined(workspace.footnoteDiv)) {
                if (workspace.textType.includes('note_caller')) {
                    workspace.footnoteDiv.setAttribute('nc', text);
                } else {
                    const div = addTextNode(workspace.footnoteDiv, text, workspace);
                    workspace.footnoteDiv = div.cloneNode(true);
                }
            }
        } else {
            console.warn('%s ignored: %s', usfmType, text);
        }
    };
    const addText = (workspace, text) => {
        if (scriptureLogs?.text) {
            console.log('Adding text:', text);
        }
        if (!onlySpaces(text)) {
            let phrases = [];
            if (!workspace.introductionGraft && references.hasAudio) {
                phrases = parsePhrase(text, seprgx);
            } else {
                // Don't parse introduction or if there is no audio.
                // Each paragraph is a single div.
                phrases[0] = text;
            }
            for (let i = 0; i < phrases.length; i++) {
                if (workspace.lastPhraseTerminated) {
                    if (scriptureLogs?.text) {
                        console.log('Add text start phrase (terminated)');
                    }
                    workspace.phraseDiv = startPhrase(workspace);
                }
                if (workspace.phraseDiv === null) {
                    if (scriptureLogs?.text) {
                        console.log('Add text start phrase (null)');
                    }
                    workspace.phraseDiv = startPhrase(workspace, 'keep');
                }
                let div = workspace.phraseDiv.cloneNode(true);
                const phrase = phrases[i];
                div = addTextNode(div, phrase, workspace);
                if (i < phrases.length - 1) {
                    workspace.phraseDiv = div.cloneNode(true);
                    if (scriptureLogs?.text) {
                        console.log('Add text start phrase');
                    }
                    workspace.phraseDiv = startPhrase(workspace);
                } else {
                    workspace.phraseDiv = div.cloneNode(true);
                }
            }
            workspace.lastPhraseTerminated =
                phrases.length > 0 ? phraseTerminated(phrases[phrases.length - 1]) : false;
        }
        return;
    };
    const usfmSpan = (parent: any, spanClass: string, phrase: string, lemma: string = '') => {
        const spanElement = document.createElement('span');
        let child;
        spanElement.classList.add(spanClass);
        switch (spanClass) {
            case 'xt': {
                spanElement.innerHTML = phrase;
                break;
            }
            case 'glossary': {
                const aElement = document.createElement('a');
                let matchWord = phrase;
                if (isNotBlank(lemma)) {
                    matchWord = lemma;
                }
                aElement.setAttribute('match', matchWord.trim());
                aElement.setAttribute('href', ' ');
                const refText = document.createTextNode(phrase);
                aElement.classList.add('glossary');
                aElement.appendChild(refText);
                spanElement.appendChild(aElement);
                break;
            }
            default: {
                child = document.createTextNode(phrase);
                spanElement.appendChild(child);
                break;
            }
        }
        parent.appendChild(spanElement);
        return parent;
    };
    const addTextNode = (div: any, phrase: string, workspace: any) => {
        const usfmWrapperType = workspace.usfmWrapperType;
        if (usfmWrapperType) {
            switch (usfmWrapperType) {
                case 'wj': {
                    if (workspace.showWordsOfJesus) {
                        div = usfmSpan(div, usfmWrapperType, phrase);
                    } else {
                        const textNode = document.createTextNode(phrase);
                        div.appendChild(textNode);
                    }
                    break;
                }
                case 'w': {
                    const lemma = workspace.lemma;
                    if (viewShowGlossaryWords) {
                        div = usfmSpan(div, 'glossary', phrase, lemma);
                    } else {
                        div = usfmSpan(div, usfmWrapperType, phrase);
                    }
                    break;
                }
                default: {
                    div = usfmSpan(div, usfmWrapperType, phrase);
                    break;
                }
            }
        } else {
            const textNode = document.createTextNode(phrase);
            div.appendChild(textNode);
        }
        return div;
    };
    const processText = (introductionGraft, showIntroduction, titleGraft) => {
        let returnValue = false;
        if (introductionGraft == showIntroduction || (titleGraft && showIntroduction)) {
            returnValue = true;
        }
        return returnValue;
    };
    function appendPhrase(workspace) {
        workspace.lastPhrase = workspace.phraseDiv.getAttribute('data-phrase');
        if (versePerLine) {
            workspace.verseDiv.appendChild(workspace.phraseDiv.cloneNode(true));
        } else {
            workspace.paragraphDiv.appendChild(workspace.phraseDiv.cloneNode(true));
        }
    }
    function addVerseNumber(workspace: any, element: any, showVerseNumbers: boolean) {
        if (showVerseNumbers === true) {
            var spanV = document.createElement('span');
            spanV.classList.add('v');
            spanV.innerText = numerals.formatNumber(numeralSystem, element.atts['number']);
            var spanVsp = document.createElement('span');
            spanVsp.classList.add('vsp');
            spanVsp.innerText = '\u00A0'; // &nbsp
            workspace.phraseDiv.appendChild(spanV);
            workspace.phraseDiv.appendChild(spanVsp);
        }
    }
    function handleVerseLabel(element, showVerseNumbers, workspace) {
        if (workspace.firstVerse === true && workspace.chapterNumText !== '') {
            const div = document.createElement('div');
            const chapterNumberFormatSetting = getFeatureValueString(
                'chapter-number-format',
                references.collection,
                references.book
            );
            if (chapterNumberFormatSetting === 'drop-cap') {
                workspace.paragraphDiv.className = 'm';
                div.classList.add('c-drop');
                // SAB is statically generating div.c-drop: { float: left|right; } based on settings than can change
                // So override that style based on the current directin of the text
                div.style.float = direction.toLowerCase() === 'ltr' ? 'left' : 'right';
                div.innerText = workspace.chapterNumText;
                workspace.paragraphDiv.appendChild(div);
                if (!config.mainFeatures['hide-verse-number-1']) {
                    addVerseNumber(workspace, element, showVerseNumbers);
                }
            } else {
                // chapter at top of page
                div.classList.add('c');
                div.innerText = workspace.chapterNumText;
                workspace.root.appendChild(div);
                addVerseNumber(workspace, element, showVerseNumbers);
            }
        } else {
            addVerseNumber(workspace, element, showVerseNumbers);
        }
        workspace.firstVerse = false;
    }
    // handles clicks on verse numbers
    function audioClickHandler(click) {
        if (!hasAudioPlayed()) {
            return;
        }
        const element = click.target.textContent;
        const verseSelection = document.querySelector('[data-verse="' + element + '"]');
        const verseId = verseSelection.getAttribute('id');
        seekToVerse(verseId);
    }
    // handles clicks on in-text notation superscripts
    function footnoteClickHandler(event) {
        if ($footnotes.length === 0) {
            event.stopPropagation();
            const root = event.target.parentNode.parentNode;
            const footnote = root.querySelector(`div#${root.getAttribute('data-graft')}`);
            const workingSpan = footnote.cloneNode(true);
            const spans = workingSpan.querySelectorAll('span.xt');
            // Loop through each span and modify its inner HTML
            spans.forEach((span) => {
                span.innerHTML = generateHTML(span.innerHTML, ''); // Change inner HTML as needed
            });
            const parsed = workingSpan.innerHTML;
            footnotes.push(parsed);
        }
    }
    // handles clicks on in text markdown reference links
    function referenceLinkClickHandler(event: any) {
        const linkRef = event.target.getAttribute('ref');
        const splitRef = splitString(linkRef, '.');
        const splitSet = splitRef[0];
        const refBook = splitRef[1];
        const splitChapter = splitRef[2];
        const splitVerse = splitRef[3];

        let refDocSet = currentDocSet;
        const refBc = config.bookCollections.find((x) => x.id === splitSet);
        if (refBc) {
            refDocSet = refBc.languageCode + '_' + refBc.id;
        } else {
            // Invalid collection
            return;
        }
        refs.set({ docSet: refDocSet, book: refBook, chapter: splitChapter, verse: splitVerse });
        return;
    }
    async function headerLinkClickReference(event: any) {
        event.stopPropagation();
        let start = JSON.parse(event.target.getAttribute('data-start-ref'));
        let end =
            event.target.getAttribute('data-end-ref') === 'undefined'
                ? undefined
                : JSON.parse(event.target.getAttribute('data-end-ref'));
        if (config.mainFeatures['scripture-refs-display'] === 'viewer') {
            navigate(start);
        } else {
            const footnoteHTML = await handleHeaderLinkPressed(start, end, themeColors);
            footnotes.push(footnoteHTML);
        }
    }
    function glossaryClickHandler(event: any) {
        event.stopPropagation();
        event.preventDefault();
        const glossaryLink = event.target.getAttribute('match');
        glossary.then((glossaryResults) => {
            if (isDefined(glossaryResults.data.docSets[0].document)) {
                glossaryResults.data.docSets[0].document.mainBlocks.forEach((block) => {
                    if (ciEquals(block.key, glossaryLink)) {
                        if ($footnotes.length === 0) {
                            const glossaryDiv = document.createElement('div');
                            glossaryDiv.classList.add('txs');
                            const glossarySpan = document.createElement('span');
                            glossarySpan.classList.add('k');
                            const titleText = document.createTextNode(glossaryLink);
                            glossarySpan.append(block.key);
                            glossaryDiv.append(glossarySpan);
                            const blockText = block.text.slice(glossaryLink.length);
                            const glossaryText = document.createTextNode(blockText);
                            glossaryDiv.append(glossaryText);
                            const glossaryHTML = glossaryDiv.outerHTML;
                            footnotes.push(glossaryHTML);
                        }
                    }
                });
            }
        });
    }
    function remoteAudioClipHandler(event: any) {
        event.stopPropagation();
        const address = event.target.getAttribute('filelink');
        const el = document.querySelector(`audio[id="${address}" ]`);
        if (el) {
            const urlString = el.getAttribute('src');
            const audio = new Audio(urlString);
            audio.play();
        }
    }
    function navigate(reference) {
        refs.set({
            docSet: reference.docSet,
            book: reference.book,
            chapter: reference.chapter,
            verse: reference.verse
        });
        footnotes.reset();
    }
    function addNotesDiv(workspace) {
        const notesSpan = document.createElement('span');
        notesSpan.id = 'notes' + workspace.currentVerse;
        let el = workspace.paragraphDiv?.querySelector(
            `div[data-verse="${workspace.currentVerse}"][data-phrase=${workspace.lastPhrase}]`
        );
        if (el === null) {
            // Try finding if it is already attached to root
            el = workspace.root.querySelector(
                `div[data-verse="${workspace.currentVerse}"][data-phrase=${workspace.lastPhrase}]`
            );
        }
        el?.parentNode.insertBefore(notesSpan, el.nextSibling);
    }
    const noteSvg = () => {
        return '<svg fill="#000000" style="display:inline" xmlns="http://www.w3.org/2000/svg" height="16" width="16" viewBox="0 0 96 96"><path d="M 21.07 74.80 L 8.76 87.35 Q 8.00 88.12 8.00 87.03 Q 8.00 52.12 8.00 18.00 Q 8.00 7.73 18.00 7.80 Q 48.00 8.00 78.00 8.00 Q 88.27 8.00 88.18 18.00 Q 88.00 40.13 88.09 62.25 Q 88.13 72.31 78.00 72.22 C 72.03 72.17 25.23 70.89 23.56 72.37 Q 22.78 73.07 21.07 74.80 Z M 72.00 21.60 A 0.60 0.60 0.0 0 0 71.40 21.00 L 24.60 21.00 A 0.60 0.60 0.0 0 0 24.00 21.60 L 24.00 28.40 A 0.60 0.60 0.0 0 0 24.60 29.00 L 71.40 29.00 A 0.60 0.60 0.0 0 0 72.00 28.40 L 72.00 21.60 Z M 72.00 35.60 A 0.60 0.60 0.0 0 0 71.40 35.00 L 24.60 35.00 A 0.60 0.60 0.0 0 0 24.00 35.60 L 24.00 42.40 A 0.60 0.60 0.0 0 0 24.60 43.00 L 71.40 43.00 A 0.60 0.60 0.0 0 0 72.00 42.40 L 72.00 35.60 Z M 60.00 49.60 A 0.60 0.60 0.0 0 0 59.40 49.00 L 24.60 49.00 A 0.60 0.60 0.0 0 0 24.00 49.60 L 24.00 56.40 A 0.60 0.60 0.0 0 0 24.60 57.00 L 59.40 57.00 A 0.60 0.60 0.0 0 0 60.00 56.40 L 60.00 49.60 Z"</path></svg>';
    };
    function editNote(note) {
        modal.open(MODAL_NOTE, note);
    }
    function addNotedVerses(notesInChapter) {
        notesInChapter.then((notes) => {
            for (var k = 0; k < notes.length; k++) {
                const note = notes[k];
                let notesSpan = document.getElementById('bookmarks' + note.verse);
                let noteSpan = document.createElement('span');
                noteSpan.id = 'note' + k;
                noteSpan.innerHTML = noteSvg();
                noteSpan.onclick = (event) => editNote(note);
                notesSpan.appendChild(noteSpan);
            }
        });
    }
    function addBookmarksDiv(workspace) {
        const bookmarksSpan = document.createElement('span');
        bookmarksSpan.id = 'bookmarks' + workspace.currentVerse;
        let el = workspace.paragraphDiv?.querySelector(
            `div[data-verse="${workspace.currentVerse}"][data-phrase=${workspace.lastPhrase}]`
        );
        if (el === null) {
            // Try finding if it is already attached to root
            el = workspace.root.querySelector(
                `div[data-verse="${workspace.currentVerse}"][data-phrase=${workspace.lastPhrase}]`
            );
        }
        el?.parentNode.insertBefore(bookmarksSpan, el.nextSibling);
    }
    const bookmarkSvg = () => {
        return '<svg fill="#b10000" style="display:inline" xmlns="http://www.w3.org/2000/svg" height="16" width="16" viewBox="0 0 24 24"><path d="M5 21V5q0-.825.588-1.413Q6.175 3 7 3h10q.825 0 1.413.587Q19 4.175 19 5v16l-7-3Z"/></svg>';
    };
    function addBookmarkedVerses(bookmarksInChapter) {
        bookmarksInChapter.then((bookmarks) => {
            for (var j = 0; j < bookmarks.length; j++) {
                let bookmarksSpan = document.getElementById('bookmarks' + bookmarks[j].verse);
                let bookmarkSpan = document.createElement('span');
                bookmarkSpan.id = 'bookmark' + j;
                bookmarkSpan.innerHTML = bookmarkSvg();
                bookmarksSpan.appendChild(bookmarkSpan);
            }
        });
    }
    function addHighlightedVerses(highlightsInChapter) {
        highlightsInChapter.then((highlights) => {
            for (let i = 0; i < highlights.length; i++) {
                //Skip this entry if the the next is a highlight for the same verse
                if (i < highlights.length - 1) {
                    if (highlights[i].verse === highlights[i + 1].verse) {
                        continue;
                    }
                }
                let elements = container?.querySelectorAll(
                    `div[data-verse="${highlights[i].verse}"]`
                );
                for (const element of elements) {
                    const penClass = 'hlp' + highlights[i].penColor;
                    element.classList.add(penClass);
                }
            }
        });
    }
    function createFootnoteDiv(workspace, element) {
        let footnoteSpan = null;
        let footnoteId = `X-${workspace.footnoteIndex + 1}`;
        let footnoteDiv = document.createElement('div');
        footnoteDiv.id = footnoteId;
        footnoteDiv.style.display = 'none';
        footnoteDiv.setAttribute('type', element.subType);

        const div = workspace.phraseDiv.cloneNode(true);
        footnoteSpan = document.createElement('span');
        footnoteSpan.setAttribute('data-graft', footnoteId);
        const a = document.createElement('a');
        const sup = document.createElement('sup');
        sup.classList.add('footnote');
        sup.innerHTML = fnc.charAt(workspace.footnoteIndex % 26);
        a.appendChild(sup);
        a.classList.add('cursor-pointer');
        footnoteSpan.appendChild(a);
        workspace.footnoteIndex++;
        if (scriptureLogs?.footnote) {
            console.log('Create Footnote %o %o', footnoteSpan, footnoteDiv);
        }
        return [footnoteSpan, footnoteDiv];
    }
    function placeElement(
        document: Document,
        container: HTMLElement,
        element: HTMLElement,
        pos: string,
        verse: string
    ) {
        if (pos === 'after') {
            const el = document.getElementById('bookmarks' + verse);
            el.insertAdjacentElement('afterend', element);
        } else if (pos === 'before') {
            var el = container.querySelector(`div[data-verse="${verse}"][data-phrase="a"]`);
            if (el.previousElementSibling?.classList.contains('c-drop')) {
                el = el.previousElementSibling;
            }
            el.insertAdjacentElement('beforebegin', element);
        } else if (pos === 'top') {
            const el = document.getElementsByClassName('m')[0];
            el.insertAdjacentElement('beforebegin', element);
        } else if (pos === 'bottom') {
            const els = container.querySelectorAll('span[id^=bookmarks]');
            const el = els[els.length - 1];
            el.insertAdjacentElement('afterend', element);
        }
    }
    function addVideos(videos) {
        if (videos) {
            videos.forEach((video, index) => {
                // ref can be MAT 1:1 or MAT.1.1
                let verse = video.placement.ref.split(/[:.]/).at(-1);
                const videoBlockDiv = createVideoBlock(document, video, index);
                placeElement(document, container, videoBlockDiv, video.placement.pos, verse);
            });
            addVideoLinks(document, videos);
        }
    }

    // Add CSS for fullscreen popup
    const style = document.createElement('style');
    style.innerHTML = `
    .fullscreen-popup {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
    }

    .fullscreen-popup img {
        width: 100%;
        height: 100%;
        object-fit: contain;
        border: 2px solid white;
    }
    .fullscreen-popup .close-btn {
        position: absolute;
        top: 10px;
        left: 40px;
        background: none;
        border: none;
        font-size: 35px;
        color: white;
        cursor: pointer;
        z-index: 1001;
    }

    .fullscreen-popup .close-btn::before {
        content: '\\2190'; /* Unicode for left arrow */
    }
    `;
    document.head.appendChild(style);

    function addIllustrations(illustrations) {
        if (illustrations) {
            illustrations.forEach((illustration, index) => {
                let verse = illustration.placement.ref.split(/[:.]/).at(-1);
                const illustrationBlockDiv = createIllustrationBlock(
                    illustration.filename,
                    illustration.placement.caption
                );
                placeElement(
                    document,
                    container,
                    illustrationBlockDiv,
                    illustration.placement.pos,
                    verse
                );
            });
        }
    }

    function createIllustrationBlock(source, caption) {
        const imageSource = base + '/illustrations/' + source;
        const divFigure = document.createElement('div');
        divFigure.classList.add('image-block');
        const spanFigure = document.createElement('span');
        spanFigure.classList.add('image');
        const figureImg = document.createElement('img');
        figureImg.setAttribute('src', imageSource);
        figureImg.style.display = 'inline-block';
        if (config.mainFeatures['zoom-illustrations']) {
            figureImg.addEventListener('click', () => showFullscreenPopup(imageSource));
        }
        spanFigure.appendChild(figureImg);
        divFigure.appendChild(spanFigure);
        if (caption !== null && caption !== '') {
            const divFigureText = createIllustrationCaptionBlock(caption);
            divFigure.appendChild(divFigureText);
        }
        return divFigure;
    }

    function createIllustrationCaptionBlock(caption) {
        const divFigureText = document.createElement('div');
        divFigureText.classList.add('caption');
        const spanFigureText = document.createElement('span');
        spanFigureText.classList.add('caption');
        const spanFigureTextNode = document.createTextNode(caption);
        spanFigureText.append(spanFigureTextNode);
        divFigureText.append(spanFigureText);
        return divFigureText;
    }

    function showFullscreenPopup(imageSource) {
        // Create the fullscreen popup div
        const fullscreenDiv = document.createElement('div');
        fullscreenDiv.classList.add('fullscreen-popup');

        const fullscreenImg = document.createElement('img');
        fullscreenImg.setAttribute('src', imageSource);

        const closeButton = document.createElement('button');
        closeButton.classList.add('close-btn');
        closeButton.addEventListener('click', () => {
            document.body.removeChild(fullscreenDiv);
        });

        fullscreenDiv.appendChild(fullscreenImg);
        fullscreenDiv.appendChild(closeButton);

        document.body.appendChild(fullscreenDiv);
    }

    function addFooter(document: Document, container: HTMLElement, docSet: string) {
        const collection = docSet.split('_')[1];
        let footer = config.bookCollections.find((x) => x.id === collection)?.footer;
        const bookFooter = config.bookCollections
            .find((x) => x.id === collection)
            .books.find((x) => x.id === currentBook).footer;
        if (bookFooter) {
            footer = bookFooter;
        }

        if (footer && container.getElementsByClassName('footer').length == 0) {
            const divFooter = document.createElement('div');
            divFooter.classList.add('footer');
            const divFooterLine = document.createElement('div');
            divFooterLine.classList.add('footer-line');
            divFooter.appendChild(divFooterLine);
            const spanFooter = document.createElement('span');
            spanFooter.classList.add('footer');
            spanFooter.innerHTML = footer;
            divFooterLine.appendChild(spanFooter);
            container.appendChild(divFooter);
        }
    }
    function figureSource(element: any) {
        let source: any;
        if ('src' in element.atts) {
            source = element.atts['src'][0];
        } else if ('unknownDefault_fig' in element.atts) {
            source = element.atts['unknownDefault_fig'][0];
        }
        return source;
    }
    function showImage() {
        const showBibleImage = viewShowBibleImages === 'normal';
        const showImages = currentIsBibleBook && showBibleImage && viewShowIllustrations;
        return showImages;
    }
    function showVideo() {
        const showBibleVideo = viewShowBibleVideos === 'normal';
        const showVideos = currentIsBibleBook && showBibleVideo;
        return showVideos;
    }
    function addFigureDiv(source: string, workspace: any) {
        if (workspace.phraseDiv != null && workspace.phraseDiv.innerText !== '') {
            appendPhrase(workspace);
        }
        workspace.phraseDiv = null;
        const divFigure = createIllustrationBlock(source, null);
        const imageSource = base + '/illustrations/' + source;
        workspace.figureDiv = divFigure;
        if (showImage()) {
            checkImageExists(imageSource, divFigure);
        }
    }

    async function checkImageExists(src: string, div: HTMLElement) {
        try {
            const response = await fetch(src, { method: 'HEAD' });

            if (!response.ok) {
                // The file does not exist
                div.style.display = 'none';
            }
        } catch (error) {
            // An error occurred (e.g., network error)
            console.error('Error checking image existence:', error);
        }
    }
    function preprocessAction(action: string, workspace: any) {
        // Table ends if row ended and anything other than start row follows it
        if (!workspace.inRow && workspace.inTable && !(action === 'startRow')) {
            workspace.inTable = false;
            workspace.root.appendChild(workspace.tableElement);
        }
    }
    // handles on click when interacting with the scripture view
    function onClick(e: any) {
        switch (e.target.getAttribute('class')) {
            case 'v':
                audioClickHandler(e);
                break;
            case 'footnote':
                footnoteClickHandler(e);
                break;
            case 'glossary':
                glossaryClickHandler(e);
                break;
            case 'audioclip':
                remoteAudioClipHandler(e);
                break;
            default:
                if (e.target.classList.contains('ref-link')) {
                    referenceLinkClickHandler(e);
                    break;
                }
                if (e.target.classList.contains('header-ref')) {
                    headerLinkClickReference(e);
                }
                if (!$audioPlayer.playing) {
                    onClickText(e, selectedVerses, maxSelections);
                }
                break;
        }
    }
    function chapterCount(book) {
        const count = Object.keys(books.find((x) => x.bookCode === book).versesByChapters).length;
        return count;
    }
    let bookRoot = document.createElement('div');
    if (scriptureLogs?.root) {
        console.log('START: %o', bookRoot);
    }
    let loading = true;

    const output = {};
    const query = async (
        docSet: string,
        bookCode: string,
        chapter: string,
        showVerses: boolean,
        showGlossaryLinks: boolean,
        showRedLetters: boolean,
        versePerLine: boolean,
        bookmarks: any[],
        notes: any[],
        highlights: any[],
        videos: any[],
        illustrations: any[]
    ) => {
        // Is it possible that this could be called and proskomma is not set yet?
        if (!proskomma) return;
        await loadDocSetIfNotLoaded(proskomma, docSet, fetch);
        const cl = new SofriaRenderFromProskomma({
            proskomma,
            actions: {
                startDocument: [
                    {
                        description: 'Set up; Book heading',
                        test: () => true,
                        action: ({ context, workspace }) => {
                            if (scriptureLogs?.document) {
                                console.log(
                                    'Start Document: %o, %o',
                                    context,
                                    context.document.metadata.document
                                );
                            }
                            preprocessAction('startDocument', workspace);
                            bookRoot.replaceChildren();
                            workspace.root = bookRoot;
                            workspace.footnoteIndex = 0;
                            workspace.introductionIndex = 0;
                            workspace.firstVerse = true;
                            workspace.currentVerse = 'none';
                            workspace.currentPhraseIndex = 0;
                            workspace.milestoneLink = '';
                            workspace.milestoneText = '';
                            workspace.lastPhrase = 'a';
                            workspace.introductionGraft = false;
                            workspace.titleGraft = false;
                            workspace.paragraphDiv = document.createElement('div');
                            workspace.titleBlockDiv = document.createElement('div');
                            workspace.verseDiv = null;
                            workspace.phraseDiv = null;
                            workspace.videoDiv = null;
                            workspace.footnoteDiv = null;
                            workspace.figureDiv = null;
                            workspace.subheaders = [];
                            workspace.textType = [];
                            workspace.titleText = [];
                            workspace.headerText = [];
                            workspace.audioClips = [];
                            workspace.usfmWrapperType = '';
                            workspace.showWordsOfJesus = showRedLetters;
                            workspace.lastPhraseTerminated = false;
                            workspace.currentVideoIndex = 0;
                            workspace.chapterNumText = '';
                            workspace.inTable = false;
                            workspace.inRow = false;
                            workspace.tableElement = null;
                            workspace.tableRowElement = null;
                            workspace.tableCellElement = null;
                            workspace.rowCellNumber = 0;
                            workspace.lemma = '';
                            deselectAllElements(selectedVerses);

                            const div = document.createElement('div');
                            div.setAttribute('data-verse', 'start');
                            div.setAttribute('data-phrase', 'none');
                            workspace.root.append(div);
                        }
                    }
                ],
                endDocument: [
                    {
                        description: 'Set up',
                        test: () => true,
                        action: ({ context, workspace, output }) => {
                            if (scriptureLogs?.document) {
                                console.log('End Document');
                            }
                            preprocessAction('endDocument', workspace);
                            if (!displayingIntroduction) {
                                var els = document.getElementsByTagName('div');
                                for (var i = 0; i < els.length; i++) {
                                    if (
                                        (els[i].classList.contains('seltxt') && els[i].id != '') ||
                                        els[i].classList.contains('r')
                                    ) {
                                        els[i].addEventListener('click', onClick, false);
                                    }
                                }
                                addNotedVerses(notes);
                                addBookmarkedVerses(bookmarks);
                                addHighlightedVerses(highlights);
                                if (showVideo()) {
                                    addVideos(videos);
                                }
                                if (showImage()) {
                                    addIllustrations(illustrations);
                                }
                            }
                            addFooter(document, workspace.root, docSet);
                        }
                    }
                ],
                startParagraph: [
                    {
                        description: 'Start HTML para with appropriate class',
                        test: () => true,
                        action: ({ context, workspace }) => {
                            if (scriptureLogs?.paragraph) {
                                console.log(
                                    'Start Paragraph %o %o',
                                    context.sequences[0].block,
                                    context.sequences[0].type
                                );
                            }
                            const sequenceType = context.sequences[0].type;
                            preprocessAction('startPara', workspace);
                            if (
                                processText(
                                    workspace.introductionGraft,
                                    displayingIntroduction,
                                    workspace.titleGraft
                                )
                            ) {
                                var paraClass =
                                    context.sequences[0].block.subType.split(':')[1] ||
                                    context.sequences[0].block.subType;
                                if (sequenceType === 'main' && !displayingIntroduction) {
                                    workspace.lastPhraseTerminated = false;

                                    if (workspace.currentVerse != 'none') {
                                        workspace.phraseDiv = startPhrase(workspace);
                                        if (scriptureLogs?.paragraph) {
                                            console.log(
                                                'Paragraph Start phrase: %o',
                                                workspace.phraseDiv
                                            );
                                        }
                                    }
                                    workspace.paragraphDiv = document.createElement('div');
                                    workspace.paragraphDiv.classList.add(paraClass);
                                } else if (sequenceType == 'introduction') {
                                    if (scriptureLogs?.paragraph) {
                                        console.log('Introduction start phrase');
                                    }
                                    workspace.phraseDiv = startPhrase(workspace, 'keep');
                                    workspace.paragraphDiv = document.createElement('div');
                                    workspace.paragraphDiv.classList.add(paraClass);
                                }
                            }
                        }
                    }
                ],
                endParagraph: [
                    {
                        description: 'End HTML para',
                        test: () => true,
                        action: ({ context, workspace }) => {
                            const sequenceType = context.sequences[0].type;
                            if (scriptureLogs?.paragraph) {
                                console.log('End paragraph: Sequence type ' + sequenceType);
                                console.log(
                                    'End Paragraph %o %o',
                                    context.sequences[0].block,
                                    context.sequences[0].type
                                );
                            }
                            preprocessAction('endPara', workspace);
                            if (
                                processText(
                                    workspace.introductionGraft,
                                    displayingIntroduction,
                                    workspace.titleGraft
                                )
                            ) {
                                if (sequenceType == 'main') {
                                    if (scriptureLogs?.paragraph) {
                                        console.log('End main paragraph');
                                    }
                                    if (
                                        workspace.phraseDiv != null &&
                                        workspace.phraseDiv.innerText !== ''
                                    ) {
                                        appendPhrase(workspace);
                                        workspace.phraseDiv = null;
                                    }
                                    if (versePerLine) {
                                        if (workspace.verseDiv !== null) {
                                            workspace.paragraphDiv.appendChild(
                                                workspace.verseDiv.cloneNode(true)
                                            );
                                            workspace.verseDiv = document.createElement('div');
                                        }
                                    }
                                    // Build div
                                    workspace.root.appendChild(workspace.paragraphDiv);
                                    if (workspace.videoDiv) {
                                        workspace.root.appendChild(workspace.videoDiv);
                                        workspace.videoDiv = null;
                                    }
                                } else if (sequenceType == 'title') {
                                    const div = document.createElement('div');
                                    var paraClass =
                                        context.sequences[0].block.subType.split(':')[1] ||
                                        context.sequences[0].block.subType;
                                    div.classList.add(paraClass);
                                    const span = document.createElement('span');
                                    span.classList.add(paraClass);
                                    span.innerText = workspace.titleText;
                                    div.appendChild(span);
                                    workspace.titleBlockDiv.appendChild(div);
                                    workspace.titleText = '';
                                } else if (sequenceType == 'heading') {
                                    const div = document.createElement('div');
                                    var headingParaClass =
                                        context.sequences[0].block.subType.split(':')[1] ||
                                        context.sequences[0].block.subType;
                                    div.classList.add(headingParaClass);
                                    const prefix = headingParaClass.replaceAll(/[0-9]/g, '');
                                    workspace.subheaders.push(prefix);
                                    const count = countSubheadingPrefixes(
                                        workspace.subheaders,
                                        prefix
                                    );
                                    const innerDiv = document.createElement('div');
                                    innerDiv.id = prefix + count;
                                    if (headingParaClass == 'r') {
                                        innerDiv.innerHTML = workspace.headerText;
                                    } else {
                                        innerDiv.innerText = workspace.headerText;
                                    }
                                    div.appendChild(innerDiv);
                                    workspace.root.appendChild(div);
                                    workspace.headerText = '';
                                } else if (sequenceType == 'introduction') {
                                    if (
                                        workspace.phraseDiv != null &&
                                        workspace.phraseDiv.innerText !== ''
                                    ) {
                                        appendPhrase(workspace);
                                        workspace.phraseDiv = null;
                                    }
                                    workspace.root.appendChild(workspace.paragraphDiv);
                                }
                            }
                        }
                    }
                ],
                startVerses: [
                    {
                        description: 'Start Verses',
                        test: () => true,
                        action: ({ context, workspace }) => {
                            const element = context.sequences[0].element;
                            if (scriptureLogs?.verses) {
                                console.log('Start Verses %o %o', element.atts['number'], element);
                            }
                            preprocessAction('startVerses', workspace);
                            workspace.textType.push('verses');
                            if (!displayingIntroduction) {
                                workspace.lastPhraseTerminated = false;
                                workspace.currentVerse = element.atts.number;
                                if (scriptureLogs?.verses) {
                                    console.log('verses %o start phrase', element.atts.number);
                                }
                                workspace.phraseDiv = startPhrase(workspace, 'reset');
                                if (versePerLine) {
                                    workspace.verseDiv = document.createElement('div');
                                    workspace.verseDiv.classList.add('verse-block');
                                }
                                if (scriptureLogs?.verses) {
                                    console.log('IN: %o', workspace.phraseDiv);
                                }
                            }
                        }
                    }
                ],
                endVerses: [
                    {
                        description: 'End Verses',
                        test: () => true,
                        action: ({ context, workspace }) => {
                            const element = context.sequences[0].element;
                            if (scriptureLogs?.verses) {
                                console.log('End Verses %o %o', element.atts['number'], element);
                                /*const textTypeV = workspace.textType.pop(); */
                                // if (textTypeV != 'verses') {
                                //     console.log('Verses texttype mismatch!!! %o', textTypeV);
                                // }
                            }
                            preprocessAction('endVerses', workspace);
                            workspace.textType.pop();
                            if (!displayingIntroduction) {
                                if (
                                    workspace.phraseDiv != null &&
                                    workspace.phraseDiv.innerText !== ''
                                ) {
                                    appendPhrase(workspace);
                                }
                                if (versePerLine) {
                                    workspace.paragraphDiv.appendChild(
                                        workspace.verseDiv.cloneNode(true)
                                    );
                                    workspace.verseDiv = null;
                                }
                                workspace.phraseDiv = null;
                                addBookmarksDiv(workspace);
                                addNotesDiv(workspace);
                                workspace.currentVerse = 'none';
                            }
                        }
                    }
                ],
                startChapter: [
                    {
                        description: 'Start Chapter',
                        test: () => true,
                        action: ({ context, workspace }) => {
                            if (scriptureLogs?.chapter) {
                                const element = context.sequences[0].element;
                                console.log('Start Chapter %o %o', element.atts['number'], element);
                            }
                            preprocessAction('startChapter', workspace);
                        }
                    }
                ],
                endChapter: [
                    {
                        description: 'End Chapter',
                        test: () => true,
                        action: ({ context, workspace }) => {
                            if (scriptureLogs?.chapter) {
                                const element = context.sequences[0].element;
                                console.log('End Chapter %o %o', element.atts['number'], element);
                            }
                            preprocessAction('endChapter', workspace);
                        }
                    }
                ],
                text: [
                    {
                        description: 'Output text',
                        test: () => true,
                        action: ({ context, workspace }) => {
                            if (scriptureLogs?.text) {
                                console.log(
                                    'Text element: %o %o %o',
                                    context.sequences[0].element.type,
                                    context.sequences[0].element.text,
                                    context.sequences[0].block
                                );
                                console.log('Text Type: %o', currentTextType(workspace));
                            }
                            preprocessAction('text', workspace);
                            if (
                                processText(
                                    workspace.introductionGraft,
                                    displayingIntroduction,
                                    workspace.titleGraft
                                )
                            ) {
                                const text = context.sequences[0].element.text;
                                switch (currentTextType(workspace)) {
                                    case 'title': {
                                        workspace.titleText += text;
                                        break;
                                    }
                                    case 'heading': {
                                        const blockType = context.sequences[0].block.subType;
                                        if (blockType.includes('usfm:r')) {
                                            const refText = generateHTML(text, 'header-ref');
                                            workspace.headerText += refText;
                                        } else {
                                            workspace.headerText += text;
                                        }
                                        break;
                                    }
                                    case 'fig': {
                                        const divFigureText = createIllustrationCaptionBlock(text);
                                        workspace.figureDiv.append(divFigureText);
                                        break;
                                    }
                                    case 'audioc':
                                    case 'reflink':
                                    case 'tellink':
                                    case 'elink':
                                    case 'weblink': {
                                        workspace.milestoneText = text;
                                        break;
                                    }
                                    default: {
                                        const blockType = context.sequences[0].block.subType;

                                        if (blockType.includes('usfm:x')) {
                                            addGraftText(workspace, text, 'xref', 'usfm:x');
                                            // Footnote Text
                                        } else if (blockType.includes('usfm:f')) {
                                            addGraftText(workspace, text, 'footnote', 'usfm:f');
                                        } else if (blockType === 'usfm:ip') {
                                            // Introduction
                                            addText(workspace, text);
                                        } else if (blockType === 'usfm:tr') {
                                            addTableText(workspace, text);
                                        } else {
                                            if (workspace.usfmWrapperType === 'xt') {
                                                var spanV = document.createElement('span');
                                                spanV.classList.add('reflink');
                                                const refText = generateHTML(text, 'header-ref');
                                                spanV.innerHTML = refText;
                                                if (workspace.phraseDiv === null) {
                                                    workspace.phraseDiv = startPhrase(workspace, 'keep');
                                                } 
                                                workspace.phraseDiv.appendChild(spanV);
                                            } else {
                                                addText(workspace, text);
                                            }
                                        }
                                        break;
                                    }
                                }
                            }
                            if (scriptureLogs?.text) {
                                console.log('End text');
                            }
                        }
                    }
                ],
                metaContent: [
                    {
                        description: 'Meta Content',
                        test: () => true,
                        action: ({ context, workspace }) => {
                            if (scriptureLogs?.meta) {
                                console.log('Meta Content %o', context.sequences[0].element);
                            }
                            preprocessAction('metaContent', workspace);
                        }
                    }
                ],
                mark: [
                    {
                        description: 'Mark',
                        test: () => true,
                        action: ({ context, workspace }) => {
                            const element = context.sequences[0].element;
                            if (scriptureLogs?.mark) {
                                console.log(
                                    'Mark: SubType %o, Atts: %o',
                                    element.subType,
                                    element.atts
                                );
                            }
                            preprocessAction('mark', workspace);
                            if (
                                processText(
                                    workspace.introductionGraft,
                                    displayingIntroduction,
                                    workspace.titleGraft
                                )
                            ) {
                                if (element.subType === 'chapter_label') {
                                    if (
                                        getFeatureValueBoolean(
                                            'show-chapter-numbers',
                                            references.collection,
                                            references.book
                                        )
                                    ) {
                                        workspace.chapterNumText = numerals.formatNumber(
                                            numeralSystem,
                                            element.atts['number']
                                        );
                                    } else {
                                        workspace.chapterNumText = '';
                                    }
                                } else if (element.subType === 'verses_label') {
                                    handleVerseLabel(element, showVerses, workspace);
                                }
                            }
                        }
                    }
                ],
                startSequence: [
                    {
                        description: 'Start Sequence',
                        test: () => true,
                        action: ({ context, workspace }) => {
                            const sequenceType = context.sequences[0].type;
                            if (scriptureLogs?.sequence) {
                                console.log('start sequence %o', sequenceType);
                            }
                            preprocessAction('startSequence', workspace);
                            if (
                                processText(
                                    workspace.introductionGraft,
                                    displayingIntroduction,
                                    workspace.titleGraft
                                )
                            ) {
                                switch (sequenceType) {
                                    case 'title': {
                                        workspace.textType.push('title');
                                        const div = document.createElement('div');
                                        div.setAttribute('data-verse', 'title');
                                        div.setAttribute('data-phrase', 'none');
                                        div.classList.add('scroll-item');
                                        workspace.titleBlockDiv = div;
                                        break;
                                    }
                                    case 'heading': {
                                        workspace.textType.push('heading');
                                        break;
                                    }
                                    case 'main': {
                                        workspace.textType.push('main');
                                        break;
                                    }
                                    case 'introduction': {
                                        workspace.textType.push('introduction');
                                        break;
                                    }
                                    case 'fig': {
                                        workspace.textType.push('fig');
                                        break;
                                    }
                                    case 'footnote': {
                                        workspace.textType.push('footnote');
                                        break;
                                    }
                                    case 'xref': {
                                        workspace.textType.push('xref');
                                        break;
                                    }
                                    default: {
                                        break;
                                    }
                                }
                                if (scriptureLogs?.sequence) {
                                    console.log('Processed: %o', workspace.textType);
                                }
                            }
                        }
                    }
                ],
                endSequence: [
                    {
                        description: 'End Sequence',
                        test: () => true,
                        action: ({ context, workspace }) => {
                            const sequenceType = context.sequences[0].type;
                            if (scriptureLogs?.sequence) {
                                console.log('End sequence |%o|', sequenceType);
                            }
                            preprocessAction('endSequence', workspace);
                            if (
                                processText(
                                    workspace.introductionGraft,
                                    displayingIntroduction,
                                    workspace.titleGraft
                                )
                            ) {
                                switch (sequenceType) {
                                    case 'title': {
                                        //const textType = workspace.textType.pop();
                                        // if (textType != 'title') {
                                        //     console.log('Title texttype mismatch!!! %o', textType);
                                        // }
                                        workspace.textType.pop();
                                        const div = workspace.titleBlockDiv;
                                        div.innerHTML += `<div class="b"></div><div class="b"></div>`;
                                        if (scriptureLogs?.sequence) {
                                            console.log('TITLE DIV %o', div);
                                        }
                                        workspace.root.append(div);
                                        break;
                                    }
                                    case 'heading': {
                                        //const textTypeH = workspace.textType.pop();
                                        // if (textTypeH != 'heading') {
                                        //     console.log(
                                        //         'Heading texttype mismatch!!! %o',
                                        //         textTypeH
                                        //     );
                                        // }
                                        workspace.textType.pop();
                                        break;
                                    }
                                    case 'main': {
                                        //const textTypeM = workspace.textType.pop();
                                        // if (textTypeM != 'main') {
                                        //     console.log('Main texttype mismatch!!! %o', textTypeM);
                                        // }
                                        workspace.textType.pop();
                                        break;
                                    }
                                    case 'introduction':
                                        {
                                            // const textTypeI = workspace.textType.pop();
                                            // if (textTypeH != 'introduction') {
                                            //     console.log(
                                            //         'Introduction texttype mismatch!!! %o',
                                            //         textTypeI
                                            //     );
                                            // }
                                            workspace.textType.pop();
                                        }
                                        break;
                                    case 'fig': {
                                        //const textTypeF = workspace.textType.pop();
                                        // if (textTypeF != 'fig') {
                                        //     console.log('Fig texttype mismatch!!! %o', textTypeF);
                                        // }
                                        workspace.textType.pop();
                                        break;
                                    }
                                    case 'footnote': {
                                        workspace.textType.pop();
                                        break;
                                    }
                                    case 'xref': {
                                        workspace.textType.pop();
                                        break;
                                    }
                                    default: {
                                        break;
                                    }
                                }
                            }
                        }
                    }
                ],
                blockGraft: [
                    {
                        description: 'Block Graft',
                        test: () => true,
                        action: (environment) => {
                            if (scriptureLogs?.blockGraft) {
                                console.log(
                                    'Block Graft %o',
                                    environment.context.sequences[0].block
                                );
                            }
                            preprocessAction('blockGraft', environment.workspace);
                            const currentBlock = environment.context.sequences[0].block;
                            const graftRecord = {
                                type: currentBlock.type,
                                sequence: {}
                            };
                            if (currentBlock.subType === 'introduction') {
                                if (scriptureLogs?.blockGraft) {
                                    console.log('*** START INTRODUCTION ***');
                                }
                                environment.workspace.introductionGraft = true;
                                environment.workspace.introductionIndex = 1;
                            } else if (currentBlock.subType === 'title') {
                                environment.workspace.titleGraft = true;
                            }
                            if (currentBlock.sequence) {
                                graftRecord.sequence = {};
                                const cachedSequencePointer = environment.workspace.currentSequence;
                                environment.workspace.currentSequence = graftRecord.sequence;
                                environment.context.renderer.renderSequence(environment);
                                environment.workspace.currentSequence = cachedSequencePointer;
                            }
                            if (currentBlock.subType === 'introduction') {
                                if (scriptureLogs?.blockGraft) {
                                    console.log('*** END INTRODUCTION');
                                }
                                environment.workspace.introductionGraft = false;
                            } else if (currentBlock.subType === 'title') {
                                environment.workspace.titleGraft = false;
                            }
                            if (scriptureLogs?.blockGraft) {
                                console.log('Block Graft End %o %o', graftRecord, currentBlock);
                            }
                        }
                    }
                ],
                inlineGraft: [
                    {
                        description: 'Inline graft',
                        test: () => true,
                        action: (environment) => {
                            const element = environment.context.sequences[0].element;
                            const workspace = environment.workspace;
                            if (scriptureLogs?.inlineGraft) {
                                console.log(
                                    'Inline Graft Type: %o, Subtype: %o, id: %o %o',
                                    element.type,
                                    element.subType,
                                    element.sequence.id,
                                    environment.context.sequences[0].element
                                );
                            }
                            preprocessAction('inlineGraft', workspace);
                            let footnoteSpan = null;
                            const graftRecord = {
                                type: element.type,
                                subtype: element.subType,
                                sequence: {}
                            };
                            if (element.subType === 'xref' || element.subType === 'footnote') {
                                workspace.textType.push('footnote');
                                const [span, footnoteDiv] = createFootnoteDiv(workspace, element);
                                workspace.footnoteDiv = footnoteDiv.cloneNode(true);
                                footnoteSpan = span;
                            } else if (element.subType === 'note_caller') {
                                workspace.textType.push(element.subType);
                            }
                            const cachedSequencePointer = workspace.currentSequence;
                            workspace.currentSequence = graftRecord.sequence;
                            environment.context.renderer.renderSequence(environment);
                            // Runs after all segments in graft have run
                            workspace.currentSequence = cachedSequencePointer;
                            if (element.subType === 'xref' || element.subType === 'footnote') {
                                const div = workspace.phraseDiv.cloneNode(true);
                                footnoteSpan.appendChild(workspace.footnoteDiv);
                                div.appendChild(footnoteSpan);
                                workspace.phraseDiv = div.cloneNode(true);
                                if (workspace.lastPhraseTerminated) {
                                    // console.log('Add text start phrase (graft)');
                                    workspace.phraseDiv = startPhrase(workspace);
                                    workspace.lastPhraseTerminated = false;
                                }
                                const textTypeF = workspace.textType.pop();
                                // if (textTypeF != 'footnote') {
                                //     console.log('Footnote text type mismatch!!! %o', textTypeF);
                                // }
                            } else if (element.subType === 'note_caller') {
                                const textTypeF = workspace.textType.pop();
                                if (textTypeF != 'note_caller') {
                                    // console.log('note caller text type mismatch!!! %o', textTypeF);
                                }
                            }
                            if (scriptureLogs?.inlineGraft) {
                                console.log('Inline Graft End');
                            }
                        }
                    }
                ],
                startWrapper: [
                    {
                        description: 'Start Wrapper',
                        test: () => true,
                        action: ({ context, workspace }) => {
                            if (scriptureLogs?.wrapper) {
                                console.log('Start Wrapper %o', context.sequences[0].element);
                            }
                            preprocessAction('startWrapper', workspace);
                            let element = context.sequences[0].element;
                            let subType = element.subType;
                            if (element.subType.startsWith('usfm:')) {
                                subType = 'usfm';
                            }

                            switch (subType) {
                                case 'verses': {
                                    break;
                                }
                                // Various types appear under the usfm:xx wrapper
                                // Words of Jesus is one as usfm:wj
                                case 'usfm': {
                                    // console.log('usfm Wrapper');
                                    let usfmType = element.subType.split(':')[1];
                                    if (scriptureLogs?.wrapper) {
                                        console.log('start wrapper usfmType: %o ', usfmType);
                                    }
                                    if (usfmType === 'fig') {
                                        let source = figureSource(element);
                                        if (source) {
                                            addFigureDiv(source, workspace);
                                        }
                                    } else {
                                        workspace.textType.push('usfm');
                                        if (usfmType === 'w') {
                                            // Glossary - Check for lemma
                                            let lemma = '';
                                            if (isDefined(element.atts['lemma'])) {
                                                lemma = element.atts['lemma'][0];
                                            }
                                            workspace.lemma = lemma;
                                        }
                                        if (!workspace.textType.includes('footnote')) {
                                            if (workspace.lastPhraseTerminated === true) {
                                                // console.log('not footnote start phrase');
                                                workspace.phraseDiv = startPhrase(workspace);
                                                workspace.lastPhraseTerminated = false;
                                            }
                                        }
                                        workspace.usfmWrapperType = usfmType;
                                        // console.log('setting wrapper type to (%o)', usfmType);
                                    }
                                    break;
                                }
                                case 'cell': {
                                    workspace.textType.push('cell');
                                    workspace.rowCellNumber++;
                                    const cellClass = 'tc' + workspace.rowCellNumber;
                                    workspace.tableCellElement = document.createElement('td');
                                    workspace.tableCellElement.classList.add(cellClass);
                                    break;
                                }
                                default: {
                                    break;
                                }
                            }
                        }
                    }
                ],
                endWrapper: [
                    {
                        description: 'End Wrapper',
                        test: () => true,
                        action: ({ context, workspace }) => {
                            if (scriptureLogs?.wrapper) {
                                console.log('End Wrapper %o', context.sequences[0].element);
                            }
                            preprocessAction('endWrapper', workspace);
                            let element = context.sequences[0].element;
                            let subType = element.subType;
                            if (element.subType.startsWith('usfm:')) {
                                subType = 'usfm';
                            }
                            switch (subType) {
                                case 'verses': {
                                    break;
                                }
                                case 'usfm': {
                                    workspace.textType.pop();
                                    let usfmType = element.subType.split(':')[1];
                                    if (usfmType === 'fig') {
                                        if (showImage()) {
                                            workspace.paragraphDiv.appendChild(workspace.figureDiv);
                                        }
                                    }
                                    workspace.usfmWrapperType = '';
                                    break;
                                }
                                case 'cell': {
                                    workspace.textType.pop();
                                    if (workspace.tableRowElement != null) {
                                        workspace.tableRowElement.appendChild(
                                            workspace.tableCellElement
                                        );
                                    }
                                    break;
                                }
                                default: {
                                    break;
                                }
                            }
                        }
                    }
                ],
                startMilestone: [
                    {
                        description: 'Start Milestone',
                        test: () => true,
                        action: ({ context, workspace }) => {
                            if (scriptureLogs?.milestone) {
                                console.log('Start Milestone %o', context.sequences[0].element);
                            }
                            preprocessAction('startMilestone', workspace);
                            const element = context.sequences[0].element;
                            switch (element.subType) {
                                case 'usfm:zvideo': {
                                    const id = element.atts['id'][0];
                                    const video = config.videos.find((x) => x.id === id);
                                    workspace.videoDiv = createVideoBlock(
                                        document,
                                        video,
                                        workspace.currentVideoIndex++
                                    );
                                    break;
                                }
                                case 'usfm:zaudioc': {
                                    workspace.textType.push('audioc');
                                    workspace.milestoneLink = decodeURIComponent(
                                        element.atts['link'][0]
                                    );
                                    workspace.audioClips.push(workspace.milestoneLink);
                                    break;
                                }
                                case 'usfm:zreflink': {
                                    workspace.textType.push('reflink');
                                    workspace.milestoneLink = decodeURIComponent(
                                        element.atts['link'][0]
                                    );
                                    break;
                                }
                                case 'usfm:zweblink': {
                                    workspace.textType.push('weblink');
                                    workspace.milestoneLink = decodeURIComponent(
                                        element.atts['link'][0]
                                    );
                                    break;
                                }
                                case 'usfm:ztellink': {
                                    workspace.textType.push('tellink');
                                    workspace.milestoneLink = decodeURIComponent(
                                        element.atts['link'][0]
                                    );
                                    break;
                                }
                                case 'usfm:zelink': {
                                    workspace.textType.push('elink');
                                    workspace.milestoneLink = decodeURIComponent(
                                        element.atts['link'][0]
                                    );
                                    break;
                                }
                                default: {
                                    break;
                                }
                            }
                        }
                    }
                ],
                endMilestone: [
                    {
                        description: 'End Milestone',
                        test: () => true,
                        action: ({ context, workspace }) => {
                            if (scriptureLogs?.milestone) {
                                console.log('End Milestone %o', context.sequences[0].element);
                            }
                            preprocessAction('endMilestone', workspace);
                            const element = context.sequences[0].element;
                            checkForMilestoneLinks(
                                workspace.textType,
                                workspace.footnoteDiv,
                                workspace.phraseDiv ?? workspace.paragraphDiv,
                                workspace.milestoneText,
                                workspace.milestoneLink,
                                workspace.audioClips.length,
                                element.subType,
                                config.audio,
                                onClick
                            );
                            workspace.milestoneLink = '';
                            workspace.milestoneText = '';
                        }
                    }
                ],
                startRow: [
                    {
                        description: 'Start Row',
                        test: () => true,
                        action: ({ context, workspace }) => {
                            if (scriptureLogs?.row) {
                                console.log('Start Row %o', context.sequences[0].element);
                            }
                            preprocessAction('startRow', workspace);
                            if (!workspace.inTable) {
                                workspace.tableElement = document.createElement('table');
                                workspace.tableElement.setAttribute('cellpadding', '5');
                                workspace.inTable = true;
                            }
                            workspace.inRow = true;
                            workspace.tableRowElement = document.createElement('tr');
                        }
                    }
                ],
                endRow: [
                    {
                        description: 'End Row',
                        test: () => true,
                        action: ({ context, workspace }) => {
                            if (scriptureLogs?.row) {
                                console.log('End Row %o', context.sequences[0].element);
                            }
                            preprocessAction('endRow', workspace);
                            workspace.tableElement.appendChild(workspace.tableRowElement);
                            workspace.rowCellNumber = 0;
                            workspace.inRow = false;
                        }
                    }
                ]
            },
            debugLevel: 0
        });
        performance.mark('pk-query-books-start');
        const docsResult = proskomma.gqlQuerySync(
            '{documents { docSetId id bookCode: header(id: "bookCode")} }'
        );
        performance.mark('pk-query-books-end');
        performance.measure(
            'pk-query-books-duration',
            'pk-query-books-start',
            'pk-query-books-end'
        );

        if (scriptureLogs?.docResult) {
            console.log('docsResult %o', docsResult);
        }
        const bookLookup = {};
        for (const docRecord of docsResult.data.documents) {
            if (docRecord.docSetId === docSet) {
                bookLookup[docRecord.bookCode] = docRecord.id;
            }
        }
        const docId = bookLookup[bookCode];

        performance.mark('cl-render-start');
        // Parse whole book if no chapters
        if (chapterCount(currentBook) === 0) {
            cl.renderDocument({ docId, config: {}, output });
        } else {
            cl.renderDocument({ docId, config: { chapters: [chapter] }, output });
        }
        performance.mark('cl-render-end');
        performance.measure('cl-render-duration', 'cl-render-start', 'cl-render-end');
        loading = false;
        if (scriptureLogs?.root) {
            console.log('DONE %o', bookRoot);
        }
    };

    function videosForChapter(docSet: string, bookCode: string, chapter: string) {
        let collection = docSet.split('_')[1];
        let videos = config.videos?.filter(
            (x) =>
                x.placement &&
                x.placement.collection === collection &&
                (x.placement.ref.startsWith(bookCode + ' ' + chapter + ':') ||
                    x.placement.ref.startsWith(bookCode + '.' + chapter + '.'))
        );
        return videos;
    }

    function illustrationsForChapter(docSet: string, bookCode: string, chapter: string) {
        let collection = docSet.split('_')[1];
        let illustrations = config.illustrations?.filter(
            (x) =>
                x.placement &&
                x.placement.collection === collection &&
                (x.placement.ref.startsWith(bookCode + ' ' + chapter + ':') ||
                    x.placement.ref.startsWith(bookCode + '.' + chapter + '.'))
        );
        return illustrations;
    }
    $: fontSize = bodyFontSize + 'px';

    $: lineHeight = bodyLineHeight + '%';

    $: currentChapter = references.chapter;

    $: currentBook = references.book;

    $: currentDocSet = references.docSet;

    $: currentIsBibleBook = isBibleBook(references);

    $: numeralSystem = numerals.systemForBook(config, references.collection, currentBook);

    $: versePerLine = verseLayout === 'one-per-line';
    /**list of books in current docSet*/
    $: books = $refs.catalog.documents;
    $: direction = config.bookCollections.find((x) => x.id === references.collection).style
        .textDirection;

    $: (() => {
        performance.mark('query-start');
        const bookHasIntroduction = books.find((x) => x.bookCode === currentBook).hasIntroduction;
        let chapterToDisplay = currentChapter;
        if (bookHasIntroduction && chapterToDisplay == 'i') {
            chapterToDisplay = '1';
            displayingIntroduction = true;
        } else {
            displayingIntroduction = false;
        }
        const bookCode = currentBook;
        const chapter = chapterToDisplay;
        const docSet = currentDocSet;
        const videos = videosForChapter(docSet, bookCode, chapter);
        const illustrations = illustrationsForChapter(docSet, bookCode, chapter);
        query(
            docSet,
            bookCode,
            chapter,
            viewShowVerses,
            viewShowGlossaryWords,
            redLetters,
            versePerLine,
            bookmarks,
            notes,
            highlights,
            videos,
            illustrations
        );
        performance.mark('query-end');
        performance.measure('query-duration', 'query-start', 'query-end');
    })();
</script>

<article class="container" bind:this={container}>
    {#if loading}
        <span class="spin" />
    {/if}
    <div
        id="content"
        bind:this={bookRoot}
        class:hidden={loading}
        style:font-family={font}
        style:font-size={fontSize}
        style:line-height={lineHeight}
        class="single"
        style:direction
    ></div>
</article>
