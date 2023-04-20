<!--
@component
A component for displaying scripture.  
TODO:
- find a way to scroll smoothly, as CSS only option does not work as expected.
- save graft info so that references can be handled
- parse introduction for references
-->
<script lang="ts">
    import { onDestroy } from 'svelte';
    import { base } from '$app/paths';
    import { Proskomma } from 'proskomma-core';
    import { SofriaRenderFromProskomma } from 'proskomma-json-tools';
    import { thaw } from '../scripts/thaw';
    import { catalog } from '$lib/data/catalog';
    import config from '$lib/data/config';
    import { refs } from '$lib/data/stores';
    import {
        onClickText,
        deselectAllElements,
        updateSelections
    } from '$lib/scripts/verseSelectUtil';
    import { prepareAudioPhraseEndChars, parsePhrase } from '$lib/scripts/parsePhrase';
    import { LoadingIcon } from '$lib/icons';
    import { createVideoBlock, addVideoLinks } from '$lib/video';

    export let audioActive: any;
    export let audioHighlight: any;
    export let audioPhraseEndChars: string;
    export let bodyFontSize: any;
    export let bodyLineHeight: any;
    export let bookmarks: any;
    export let highlights: any;
    export let mainScroll: any;
    export let maxSelections: any;
    export let redLetters: boolean;
    export let references: any;
    export let scrolls: any;
    export let selectedVerses: any;
    export let themeColors: any;
    export let verseLayout: any;
    export let viewShowVerses: boolean;

    const pk = new Proskomma();
    let container: HTMLElement;
    let lastVerseInView = '';
    let displayingIntroduction = false;

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

    /**unique key to use for groupStore modifier*/
    const key = {};

    let group = 'default';
    let scrollId: string;
    let scrollMod: any;
    const unSub = scrolls.subscribe((val, mod) => {
        scrollId = val;
        scrollMod = mod;
    }, group);

    /**scrolls element with id into view*/
    const scrollTo = (id: string) => {
        if (scrollMod === key) return;
        container
            ?.querySelector(
                `div[data-verse="${id.split('-')[0]}"][data-phrase="${id.split('-')[1]}"]`
            )
            ?.scrollIntoView();
    };
    $: scrollTo(scrollId);

    const onlySpaces = (str) => {
        return str.trim().length === 0;
    };

    const handleScroll = (() => {
        let scrollTimer: NodeJS.Timeout;
        return (trigger) => {
            clearTimeout(scrollTimer);
            scrollTimer = setTimeout(() => {
                const items = Array.from(container?.getElementsByClassName('scroll-item'))
                    .filter((it, i) => {
                        const rect = it.getBoundingClientRect();
                        const win = container.getBoundingClientRect();

                        return (
                            rect.top - win.top >= mainScroll.top &&
                            rect.bottom - win.top <= mainScroll.height + mainScroll.top
                        );
                    })
                    .map(
                        (el) => `${el.getAttribute('data-verse')}-${el.getAttribute('data-phrase')}`
                    );

                scrolls.set(items[0], group, key);
                lastVerseInView = items.pop();
            }, 500);
        };
    })();
    $: handleScroll([mainScroll, $refs]);

    $: $selectedVerses, updateSelections(selectedVerses);

    /**updates highlight*/
    const updateHighlight = (h: string, color: string, timing: any) => {
        if (!timing) {
            return;
        }
        const a = h.split(',');
        // Remove highlighting for currently highlighted verses
        let el = container?.getElementsByClassName('highlighting')?.item(0);
        let node = el?.getAttributeNode('style');
        el?.removeAttributeNode(node);
        el?.classList.remove('highlighting');
        // If audio off or if not in the right chapter, return
        if (
            !audioActive ||
            a[0] !== currentDocSet ||
            a[1] !== currentBook ||
            a[2] !== currentChapter
        )
            return;
        // Try to get verse for timing
        el = container?.querySelector(`div[data-verse="${a[3]}"][data-phrase="${a[4]}"]`);
        // If failed to get 'verse #, none' then try for 'verse # a' instead
        if (el == null && a[4] == 'none') {
            el = container?.querySelector(`div[data-verse="${a[3]}"][data-phrase="a"]`);
        }
        // Highlight verse if found
        el?.setAttribute('style', 'background-color: ' + color + ';');
        el?.classList.add('highlighting');
        if (
            `${el?.getAttribute('data-verse')}-${el?.getAttribute('data-phrase')}` ===
            lastVerseInView
        )
            el?.scrollIntoView();
    };
    $: updateHighlight(audioHighlight, highlightColor, references.hasAudio?.timingFile);

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
        // console.log('Start phrase!!!');
        const fnc = 'abcdefghijklmnopqrstuvwxyz';
        // Add pending phrase to the paragraph before starting
        // new ones
        if (workspace.phraseDiv != null) {
            appendPhrase(workspace);
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
    const addText = (workspace, text) => {
        // console.log('Adding text:', text);
        if (!onlySpaces(text)) {
            let phrases = [];
            if (!workspace.introductionGraft && $refs.hasAudio) {
                phrases = parsePhrase(text, seprgx);
            } else {
                // Don't parse introduction or if there is no audio.
                // Each paragraph is a single div.
                phrases[0] = text;
            }
            for (let i = 0; i < phrases.length; i++) {
                if (workspace.phraseDiv === null) {
                    workspace.phraseDiv = startPhrase(workspace, 'keep');
                }
                let div = workspace.phraseDiv.cloneNode(true);
                const phrase = phrases[i];
                const spanRequired = usfmSpanRequired(
                    workspace.usfmWrapperType,
                    workspace.showWordsOfJesus
                );
                div = addTextNode(div, phrase, workspace.usfmWrapperType, spanRequired);
                if (i < phrases.length - 1) {
                    workspace.phraseDiv = div.cloneNode(true);
                    // console.log('Add text start phrase');
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
    const usfmSpanRequired = (usfmWrapperType: string, showWordsOfJesus: boolean) => {
        let required = false;
        if (usfmWrapperType === 'wj') {
            if (showWordsOfJesus) {
                required = true;
            }
        } else if (usfmWrapperType) {
            required = true;
        }
        return required;
    };
    const addTextNode = (div, phrase, usfmWrapperType: string, wrapperRequired: boolean) => {
        const textNode = document.createTextNode(phrase);
        if (wrapperRequired) {
            var spanUsfm = document.createElement('span');
            spanUsfm.classList.add(usfmWrapperType);
            spanUsfm.appendChild(textNode);
            div.appendChild(spanUsfm);
        } else {
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
    function handleVerseLabel(element, showVerseNumbers, workspace) {
        if (workspace.firstVerse === true) {
            workspace.paragraphDiv.className = 'm';
            const div = document.createElement('div');
            div.classList.add('c-drop');
            div.innerText = workspace.chapterNumText;
            workspace.paragraphDiv.appendChild(div);
            workspace.firstVerse = false;
        } else if (showVerseNumbers === true) {
            var spanV = document.createElement('span');
            spanV.classList.add('v');
            spanV.innerText = element.atts['number'];
            var spanVsp = document.createElement('span');
            spanVsp.classList.add('vsp');
            spanVsp.innerText = '\u00A0'; // &nbsp
            var div = workspace.phraseDiv.cloneNode(true);
            div.appendChild(spanV.cloneNode(true));
            div.appendChild(spanVsp.cloneNode(true));
            workspace.phraseDiv = div.cloneNode(true);
        }
    }
    function addBookmarksDiv(workspace) {
        const fnc = 'abcdefghijklmnopqrstuvwxyz';
        const phraseIndex = fnc.charAt(workspace.currentPhraseIndex);
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
        for (var j = 0; j < bookmarksInChapter.length; j++) {
            let bookmarksSpan = document.getElementById('bookmarks' + bookmarksInChapter[j].verse);
            let bookmarkSpan = document.createElement('span');
            bookmarkSpan.id = 'bookmark' + j;
            bookmarkSpan.innerHTML = bookmarkSvg();
            bookmarksSpan.appendChild(bookmarkSpan);
        }
    }
    function addHighlightedVerses(highlightsInChapter) {
        for (let i = 0; i < highlightsInChapter.length; i++) {
            //Skip this entry if the the next is a highlight for the same verse
            if (i < highlightsInChapter.length - 1) {
                if (highlightsInChapter[i].verse === highlightsInChapter[i + 1].verse) {
                    continue;
                }
            }
            let elements = container?.querySelectorAll(
                `div[data-verse="${highlightsInChapter[i].verse}"]`
            );
            for (const element of elements) {
                const penClass = 'hlp' + highlightsInChapter[i].penColor;
                element.classList.add(penClass);
            }
        }
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
    function addFooter(document: Document, container: HTMLElement, docSet: string) {
        const collection = docSet.split('_')[1];
        const footer = config.bookCollections.find((x) => x.id === collection)?.footer;
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
    function onClick(e: any) {
        onClickText(e, selectedVerses, maxSelections);
    }

    function chapterCount(book) {
        const count = Object.keys(books.find((x) => x.bookCode === book).versesByChapters).length;
        return count;
    }
    let bookRoot = document.createElement('div');
    // console.log('START: %o', bookRoot);
    let loading = true;

    const output = {};
    const query = async (
        docSet: string,
        bookCode: string,
        chapter: string,
        showVerses: boolean,
        showRedLetters: boolean,
        versePerLine: boolean,
        bookmarks: any[],
        highlights: any[],
        videos: any[]
    ) => {
        // console.log('PARMS: bc: %o, chapter: %o, collection: %o', bookCode, chapter, docSet);
        // console.log('bookmarks: ', bookmarks);
        const docslist = await pk.gqlQuery('{docSets { id } }');
        // console.log('LIST %o', docslist);
        // console.log('Displaying Introduction %o', displayingIntroduction);
        let found = false;
        for (const doc of docslist.data.docSets) {
            // console.log('ID: %o', doc.id);
            if (doc.id === docSet) {
                // console.log('Found');
                found = true;
                break;
            }
        }

        if (!found) {
            // console.log('fetch %o pkf', docSet);
            const res = await fetch(`${base}/collections/${docSet}.pkf`).then((r) => {
                return r.arrayBuffer();
            });
            if (res.byteLength) {
                // console.log('awaiting thaw');
                const uint8res = new Uint8Array(res);
                thaw(pk, uint8res);
            }
        }

        const fnc = 'abcdefghijklmnopqrstuvwxyz';
        const cl = new SofriaRenderFromProskomma({
            proskomma: pk,
            actions: {
                startDocument: [
                    {
                        description: 'Set up; Book heading',
                        test: () => true,
                        action: ({ context, workspace }) => {
                            // console.log(
                            //     'Start Document: %o, %o',
                            //     context,
                            //     context.document.metadata.document
                            // );
                            bookRoot.replaceChildren();
                            workspace.root = bookRoot;
                            workspace.footnoteIndex = 0;
                            workspace.introductionIndex = 0;
                            workspace.firstVerse = true;
                            workspace.currentVerse = 'none';
                            workspace.currentPhraseIndex = 0;
                            workspace.lastPhrase = 'a';
                            workspace.introductionGraft = false;
                            workspace.titleGraft = false;
                            workspace.paragraphDiv = document.createElement('div');
                            workspace.titleBlockDiv = document.createElement('div');
                            workspace.verseDiv = null;
                            workspace.phraseDiv = null;
                            workspace.videoDiv = null;
                            workspace.subheaders = [];
                            workspace.textType = [];
                            workspace.titleText = [];
                            workspace.headerText = [];
                            workspace.usfmWrapperType = '';
                            workspace.showWordsOfJesus = showRedLetters;
                            workspace.lastPhraseTerminated = false;
                            workspace.currentVideoIndex = 0;
                            workspace.chapterNumText = '';
                            deselectAllElements(selectedVerses);
                        }
                    }
                ],
                endDocument: [
                    {
                        description: 'Set up',
                        test: () => true,
                        action: ({ context, workspace, output }) => {
                            // console.log('End Document');
                            if (!displayingIntroduction) {
                                var els = document.getElementsByTagName('div');
                                for (var i = 0; i < els.length; i++) {
                                    if (els[i].classList.contains('seltxt') && els[i].id != '') {
                                        els[i].addEventListener('click', onClick, false);
                                    }
                                }
                                const bookmarksInChapter = annotationsForChapter(
                                    bookmarks,
                                    docSet,
                                    bookCode,
                                    chapter
                                );
                                addBookmarkedVerses(bookmarksInChapter);
                                const highlightsInChapter = annotationsForChapter(
                                    highlights,
                                    docSet,
                                    bookCode,
                                    chapter
                                );
                                addHighlightedVerses(highlightsInChapter);
                                addVideos(videos);
                            }

                            addFooter(document, container, docSet);
                        }
                    }
                ],
                startParagraph: [
                    {
                        description: 'Start HTML para with appropriate class',
                        test: () => true,
                        action: ({ context, workspace }) => {
                            // console.log(
                            //     'Start Paragraph %o %o',
                            //     context.sequences[0].block,
                            //     context.sequences[0].type
                            // );
                            const sequenceType = context.sequences[0].type;
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
                                        // console.log(
                                        //     'Paragraph Start phrase: %o',
                                        //     workspace.phraseDiv
                                        // );
                                    }
                                    workspace.paragraphDiv = document.createElement('div');
                                    workspace.paragraphDiv.classList.add(paraClass);
                                } else if (sequenceType == 'introduction') {
                                    // console.log('Introduction start phrase');
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
                            // console.log('End paragraph: Sequence type ' + sequenceType);
                            // console.log(
                            //     'End Paragraph %o %o',
                            //     context.sequences[0].block,
                            //     context.sequences[0].type
                            // );
                            if (
                                processText(
                                    workspace.introductionGraft,
                                    displayingIntroduction,
                                    workspace.titleGraft
                                )
                            ) {
                                if (sequenceType == 'main') {
                                    // console.log("End main paragraph");
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
                                    innerDiv.innerText = workspace.headerText;
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
                text: [
                    {
                        description: 'Output text',
                        test: () => true,
                        action: ({ context, workspace }) => {
                            // console.log(
                            //     'Text element: %o %o %o',
                            //     context.sequences[0].element.type,
                            //     context.sequences[0].element.text,
                            //     context.sequences[0].block
                            // );
                            // console.log('Text Type: %o', currentTextType(workspace));
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
                                        workspace.headerText += text;
                                        break;
                                    }
                                    default: {
                                        const blockType = context.sequences[0].block.subType;
                                        if (
                                            blockType.includes('usfm:x') ||
                                            blockType.includes('usfm:f')
                                        ) {
                                            // Graft Text
                                        } else if (blockType.includes('usfm:ip')) {
                                            // Introduction
                                            addText(workspace, text);
                                        } else {
                                            addText(workspace, text);
                                        }
                                        break;
                                    }
                                }
                            }
                        }
                    }
                ],
                mark: [
                    {
                        description: 'Mark',
                        test: () => true,
                        action: ({ context, workspace }) => {
                            const element = context.sequences[0].element;
                            // console.log(
                            //     'Mark: SubType %o, Atts: %o',
                            //     element.subType,
                            //     element.atts
                            // );
                            if (
                                processText(
                                    workspace.introductionGraft,
                                    displayingIntroduction,
                                    workspace.titleGraft
                                )
                            ) {
                                if (element.subType === 'chapter_label') {
                                    workspace.chapterNumText = element.atts['number'];
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
                            // console.log('start sequence %o', sequenceType);
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
                                    default: {
                                        break;
                                    }
                                }
                                // console.log('Processed: %o', workspace.textType);
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
                            // console.log('End sequence |%o|', sequenceType);
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
                                        // console.log('TITLE DIV %o', div);
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
                            // console.log('Block Graft %o', environment.context.sequences[0].block);
                            const currentBlock = environment.context.sequences[0].block;
                            const graftRecord = {
                                type: currentBlock.type,
                                sequence: {}
                            };
                            if (currentBlock.subType === 'introduction') {
                                // console.log('*** START INTRODUCTION ***');
                                environment.workspace.introductionGraft = true;
                                environment.workspace.introductionIndex = 1;
                            } else if (currentBlock.subType === 'title') {
                                environment.workspace.titleGraft = true;
                            }
                            if (currentBlock.sequence) {
                                //                                environment.workspace.htmlBits.push(`<span data-graft="${currentBlock.sequence.id}">`);
                                graftRecord.sequence = {};
                                const cachedSequencePointer = environment.workspace.currentSequence;
                                environment.workspace.currentSequence = graftRecord.sequence;
                                environment.context.renderer.renderSequence(environment);
                                environment.workspace.currentSequence = cachedSequencePointer;
                                //                                environment.workspace.htmlBits.push(`</span>`);
                            }
                            if (currentBlock.subType === 'introduction') {
                                // console.log('*** END INTRODUCTION');
                                environment.workspace.introductionGraft = false;
                            } else if (currentBlock.subType === 'title') {
                                environment.workspace.titleGraft = false;
                            }
                            // console.log('Block Graft End %o %o', graftRecord, currentBlock);
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
                            // console.log(
                            //     'Inline Graft Type: %o, Subtype: %o, id: %o %o',
                            //     element.type,
                            //     element.subType,
                            //     element.sequence.id,
                            //     environment.context.sequences[0].element
                            // );
                            const graftRecord = {
                                type: element.type,
                                subtype: element.subType,
                                sequence: {}
                            };
                            if (element.subType === 'xref' || element.subType === 'footnote') {
                                workspace.textType.push('footnote');
                                const div = workspace.phraseDiv.cloneNode(true);
                                // console.log('Footnote or xref');
                                const span = document.createElement('span');
                                span.setAttribute('data-graft', `X-${workspace.footnoteIndex + 1}`);
                                span.classList.add('footnote');
                                const a = document.createElement('a');
                                const sup = document.createElement('sup');
                                sup.innerHTML = fnc.charAt(workspace.footnoteIndex);
                                a.appendChild(sup);
                                span.appendChild(a);
                                div.appendChild(span);
                                workspace.phraseDiv = div.cloneNode(true);
                                workspace.footnoteIndex++;
                            }
                            const cachedSequencePointer = workspace.currentSequence;
                            workspace.currentSequence = graftRecord.sequence;
                            environment.context.renderer.renderSequence(environment);
                            workspace.currentSequence = cachedSequencePointer;
                            if (element.subType === 'xref' || element.subType === 'footnote') {
                                const textTypeF = workspace.textType.pop();
                                // if (textTypeF != 'footnote') {
                                //     console.log('Footnote text type mismatch!!! %o', textTypeF);
                                // }
                            }
                            // console.log('Inline Graft End');
                        }
                    }
                ],
                startWrapper: [
                    {
                        description: 'Start Wrapper',
                        test: () => true,
                        action: ({ context, workspace }) => {
                            // console.log('Start Wrapper %o', context.sequences[0].element);
                            let element = context.sequences[0].element;
                            let subType = element.subType;
                            if (element.subType.startsWith('usfm:')) {
                                subType = 'usfm';
                            }

                            switch (subType) {
                                case 'verses': {
                                    workspace.textType.push('verses');
                                    if (!displayingIntroduction) {
                                        workspace.lastPhraseTerminated = false;
                                        workspace.currentVerse = element.atts.number;
                                        // console.log('verses %o start phrase', element.atts.number);
                                        workspace.phraseDiv = startPhrase(workspace, 'reset');
                                        if (versePerLine) {
                                            workspace.verseDiv = document.createElement('div');
                                            workspace.verseDiv.classList.add('verse-block');
                                        }
                                        // console.log('IN: %o', workspace.phraseDiv);
                                    }
                                    break;
                                }
                                // Various types appear under the usfm:xx wrapper
                                // Words of Jesus is one as usfm:wj
                                case 'usfm': {
                                    // console.log('usfm Wrapper');
                                    let usfmType = element.subType.split(':')[1];
                                    workspace.textType.push('usfm');
                                    if (!workspace.textType.includes('footnote')) {
                                        if (workspace.lastPhraseTerminated === true) {
                                            // console.log('footnote start phrase');
                                            workspace.phraseDiv = startPhrase(workspace);
                                        }
                                    }
                                    workspace.usfmWrapperType = usfmType;
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
                            // console.log('End Wrapper %o', context.sequences[0].element);
                            let element = context.sequences[0].element;
                            let subType = element.subType;
                            if (element.subType.startsWith('usfm:')) {
                                subType = 'usfm';
                            }
                            switch (subType) {
                                case 'verses': {
                                    /*const textTypeV = workspace.textType.pop(); */
                                    // if (textTypeV != 'verses') {
                                    //     console.log('Verses texttype mismatch!!! %o', textTypeV);
                                    // }
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
                                        workspace.currentVerse = 'none';
                                    }
                                    break;
                                }
                                case 'usfm': {
                                    workspace.textType.pop();
                                    workspace.usfmWrapperType = '';
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
                            //console.log('Start Milestone %o', context.sequences[0].element);
                            const element = context.sequences[0].element;
                            if (element.subType === 'usfm:zvideo') {
                                const id = element.atts['id'][0];
                                const video = config.videos.find((x) => x.id === id);
                                workspace.videoDiv = createVideoBlock(
                                    document,
                                    video,
                                    workspace.currentVideoIndex++
                                );
                            }
                        }
                    }
                ],
                endMilestone: [
                    {
                        description: 'End Milestone',
                        test: () => true,
                        action: ({ context }) => {
                            //console.log('End Milestone %o', context.sequences[0].element);
                        }
                    }
                ]
            },
            debugLevel: 0
        });
        const docsResult = pk.gqlQuerySync(
            '{documents { docSetId id bookCode: header(id: "bookCode")} }'
        );
        // console.log('docsResult %o', docsResult);
        const bookLookup = {};
        for (const docRecord of docsResult.data.documents) {
            if (docRecord.docSetId === docSet) {
                bookLookup[docRecord.bookCode] = docRecord.id;
            }
        }
        const docId = bookLookup[bookCode];

        // Parse whole book if no chapters
        if (chapterCount(currentBook) === 0) {
            cl.renderDocument({ docId, config: {}, output });
        } else {
            cl.renderDocument({ docId, config: { chapters: [chapter] }, output });
        }
        loading = false;
        // console.log('DONE %o', root);
    };

    function annotationsForChapter(annotations, docSet: string, bookCode: string, chapter: string) {
        // Get entries for chapter and sort by verse
        let entries = annotations
            .filter(
                (entry) =>
                    entry.docSet === docSet && entry.book === bookCode && entry.chapter === chapter
            )
            .sort((e1, e2) => {
                const c1 = parseInt(e1.verse, 10);
                const c2 = parseInt(e2.verse, 10);
                return c1 > c2 ? 1 : c1 < c2 ? -1 : 0;
            });
        return entries;
    }

    function videosForChapter(docSet: string, bookCode: string, chapter: string) {
        let collection = docSet.split('_')[1];
        let videos = config.videos?.filter(
            (x) =>
                x.placement.collection === collection &&
                (x.placement.ref.startsWith(bookCode + ' ' + chapter + ':') ||
                    x.placement.ref.startsWith(bookCode + '.' + chapter + '.'))
        );
        return videos;
    }
    $: fontSize = bodyFontSize + 'px';

    $: lineHeight = bodyLineHeight + '%';

    $: highlightColor = themeColors['TextHighlightColor'];

    $: currentChapter = references.chapter;

    $: currentBook = references.book;

    $: currentDocSet = references.docSet;

    $: versePerLine = verseLayout === 'one-per-line';
    /**list of books in current docSet*/
    $: books = catalog.find((d) => d.id === currentDocSet).documents;

    $: (() => {
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
        query(
            docSet,
            bookCode,
            chapter,
            viewShowVerses,
            redLetters,
            versePerLine,
            bookmarks,
            highlights,
            videos
        );
    })();
    onDestroy(unSub);
</script>

<article class="container" bind:this={container}>
    {#if loading}
        <LoadingIcon />
    {/if}
    <div
        bind:this={bookRoot}
        class:hidden={loading}
        style:font-size={fontSize}
        style:line-height={lineHeight}
    />
</article>
