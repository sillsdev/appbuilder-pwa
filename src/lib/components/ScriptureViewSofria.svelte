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
    import {
        audioHighlight,
        refs,
        scrolls,
        audioActive,
        mainScroll,
        themeColors,
        selectedVerses
    } from '$lib/data/stores';
    import {
        onClickText,
        deselectAllElements,
        updateSelections
    } from '$lib/scripts/verseSelectUtil';

    import { LoadingIcon } from '$lib/icons';

    export let bodyFontSize: any;
    export let bodyLineHeight: any;
    export let viewShowVerses: boolean;
    export let redLetters: boolean;

    const pk = new Proskomma();
    let container: HTMLElement;
    const seprgx = /(\.|\?|!|:|;|,|')/g;

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

    let lastVerseInView = '';
    let displayingIntroduction = false;

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
                            rect.top - win.top >= $mainScroll.top &&
                            rect.bottom - win.top <= $mainScroll.height + $mainScroll.top
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
    $: handleScroll([$mainScroll, $refs]);

    $: $selectedVerses, updateSelections();

    /**updates highlight*/
    const updateHighlight = (h: string, color: string) => {
        const a = h.split(',');
        // Remove highlighting for currently highlighted verses
        let el = container?.getElementsByClassName('highlighting')?.item(0);
        let node = el?.getAttributeNode('style');
        el?.removeAttributeNode(node);
        el?.classList.remove('highlighting');
        // If audio off or if not in the right chapter, return
        if (!$audioActive || a[0] !== $refs.docSet || a[1] !== $refs.book || a[2] !== $refs.chapter)
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
    $: updateHighlight($audioHighlight, highlightColor);

    const countSubheadingPrefixes = (subHeadings: [string], labelPrefix: string) => {
        let result = 0;
        for (let i in subHeadings) {
            if (subHeadings[i] === labelPrefix) {
                result++;
            }
        }
        return result;
    };
    const parsePhrase = (inner) => {
        let phrases = inner.split(seprgx);
        for (let i = 1; i < phrases.length; i += 2) {
            phrases[i - 1] += phrases[i];
        }
        phrases = phrases.filter((s) => s.length > 0 && (s.length > 1 || !s.match(seprgx)));
        //move chars orphaned by phrase parsing to preceding phrase
        if (phrases.length > 1) {
            for (let i = 0; i < phrases.length - 1; i++) {
                const next = phrases[i + 1].split('');
                let c = next.shift();
                while (c && c.match(/[^_a-z]/i)) {
                    phrases[i] += c;
                    c = next.shift();
                }
                if (c) {
                    next.unshift(c);
                    phrases[i + 1] = next.join('');
                } else {
                    phrases.splice(i + 1, 1);
                    i--;
                }
            }
        }
        // console.log('parsePhrase %o %o', inner, phrases);
        return phrases;
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
            workspace.paragraphDiv.appendChild(workspace.phraseDiv.cloneNode(true));
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
                phrases = parsePhrase(text);
            } else {
                // Don't parse introduction or if there is no audio.
                // Each paragraph is a single div.
                phrases[0] = text;
            }
            for (let i = 0; i < phrases.length; i++) {
                let div = workspace.phraseDiv.cloneNode(true);
                const phrase = phrases[i];
                const spanRequired = usfmSpanRequired(
                    workspace.usfmWrapperType,
                    workspace.showWordsOfJesus
                );
                div = addTextNode(div, phrase, workspace.usfmWrapperType, spanRequired);
                if (i < phrases.length - 1) {
                    workspace.phraseDiv = div.cloneNode(true);
                    workspace.phraseDiv = startPhrase(workspace);
                } else {
                    workspace.phraseDiv = div;
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
    function handleVerseLabel(element, showVerseNumbers, workspace) {
        if (showVerseNumbers === true) {
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
    let bookRoot = document.createElement('div');
    // console.log('START: %o', bookRoot);
    let loading = true;

    const output = {};
    const query = async (
        docSet: string,
        bookCode: string,
        chapter: string,
        showVerses: boolean,
        showRedLetters: boolean
    ) => {
        // console.log('PARMS: bc: %o, chapter: %o, collection: %o', bookCode, chapter, docSet);
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
                            /* console.log(
                                'Start Document: %o, %o',
                                context,
                                context.document.metadata.document
                            );*/
                            bookRoot.replaceChildren();
                            workspace.root = bookRoot;
                            workspace.footnoteIndex = 0;
                            workspace.introductionIndex = 0;
                            workspace.firstVerse = true;
                            workspace.currentVerse = 'none';
                            workspace.currentPhraseIndex = 0;
                            workspace.introductionGraft = false;
                            workspace.titleGraft = false;
                            workspace.paragraphDiv = document.createElement('div');
                            workspace.titleBlockDiv = document.createElement('div');
                            workspace.phraseDiv = null;
                            workspace.subheaders = [];
                            workspace.textType = [];
                            workspace.titleText = [];
                            workspace.headerText = [];
                            workspace.usfmWrapperType = '';
                            workspace.showWordsOfJesus = showRedLetters;
                            workspace.lastPhraseTerminated = false;
                            deselectAllElements();
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
                                    if (workspace.firstVerse == true) {
                                        paraClass = 'm';
                                        workspace.firstVerse = false;
                                    }

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
                                    workspace.paragraphDiv = document.createElement('div');
                                    workspace.paragraphDiv.classList.add(paraClass);
                                    if (workspace.introductionIndex == 1) {
                                        // console.log('Introduction start phrase');
                                        workspace.phraseDiv = startPhrase(workspace, 'keep');
                                    }
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
                                    // Build div
                                    workspace.root.appendChild(workspace.paragraphDiv);
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
                        description: 'Output text',
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
                                    const div = document.createElement('div');
                                    div.classList.add('c-drop');
                                    div.innerText = element.atts['number'];
                                    workspace.paragraphDiv.appendChild(div);
                                } else if (element.subType === 'verses_label') {
                                    handleVerseLabel(element, showVerses, workspace);
                                }
                            }
                        }
                    }
                ],
                endDocument: [
                    {
                        description: 'Set up',
                        test: () => true,
                        action: ({ context, workspace, output }) => {
                            // console.log('End Document');
                            var els = document.getElementsByTagName('div');
                            for (var i = 0; i < els.length; i++) {
                                if (els[i].classList.contains('seltxt') && els[i].id != '') {
                                    els[i].addEventListener('click', onClickText, false);
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
                                //workspace.paragraphDiv.appendChild(div.cloneNode(true));
                                workspace.footnoteIndex++;
                                if (workspace.lastPhraseTerminated === true) {
                                    workspace.phraseDiv = startPhrase(workspace);
                                }
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
                                    workspace.lastPhraseTerminated = false;
                                    workspace.textType.push('verses');
                                    workspace.currentVerse = element.atts.number;
                                    // console.log('verses start phrase');
                                    workspace.phraseDiv = startPhrase(workspace, 'reset');
                                    // console.log('IN: %o', workspace.phraseDiv);
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
                                    if (
                                        workspace.phraseDiv != null &&
                                        workspace.phraseDiv.innerText !== ''
                                    ) {
                                        workspace.paragraphDiv.appendChild(
                                            workspace.phraseDiv.cloneNode(true)
                                        );
                                    }
                                    workspace.phraseDiv = null;
                                    workspace.currentVerse = 'none';
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
                        action: ({ context }) => {
                            // console.log('Start Milestone: %o', context.sequences[0].element);
                        }
                    }
                ],
                endMilestone: [
                    {
                        description: 'End Milestone',
                        test: () => true,
                        action: ({ context }) => {
                            // console.log('End Milestone %o', context.sequences[0].element);
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
        cl.renderDocument({ docId, config: { chapters: [chapter] }, output });
        loading = false;
        // console.log('DONE %o', root);
    };

    $: fontSize = bodyFontSize + 'px';

    $: lineHeight = bodyLineHeight + '%';

    $: highlightColor = $themeColors['TextHighlightColor'];

    $: (() => {
        let chapterToDisplay = $refs.chapter;
        if (chapterToDisplay == 'i') {
            // console.log('Displaying introduction');
            chapterToDisplay = '1';
            displayingIntroduction = true;
        } else {
            displayingIntroduction = false;
        }
        const bookCode = $refs.book;
        const chapter = chapterToDisplay;
        const docSet = $refs.docSet;
        query(docSet, bookCode, chapter, viewShowVerses, redLetters);
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
