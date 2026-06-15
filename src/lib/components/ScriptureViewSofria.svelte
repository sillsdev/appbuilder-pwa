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
<script module lang="ts">
    export interface Props {
        audioPhraseEndChars: string;
        maxSelections: number;
        redLetters: boolean;
        viewShowBibleImages: string;
        viewShowBibleVideos: string;
        viewShowIllustrations: boolean;
        viewShowVerses: boolean;
        viewShowGlossaryWords: boolean;
        font: string;
        proskomma: SABProskomma;
    }
</script>

<script lang="ts">
    import { goto } from '$app/navigation';
    /* eslint-disable svelte/no-dom-manipulating */

    import { scriptureConfig } from '$assets/config';
    import { hasAudioPlayed, seekToVerse } from '$lib/data/audio';
    import type { NoteItem } from '$lib/data/notes';
    import {
        addPlanProgressItem,
        deleteAllProgressItemsForPlan,
        getFirstIncompleteDay,
        getNextPlanReference
    } from '$lib/data/planProgressItems';
    import { addPlanState, getLastPlanState } from '$lib/data/planStates';
    import { loadDocSetIfNotLoaded } from '$lib/data/scripture';
    import {
        audioPlayer,
        bodyFontSize,
        bodyLineHeight,
        bookmarks,
        currentPlanData,
        currentPlanState,
        defaultPlanStore,
        footnotes,
        glossary,
        highlights,
        language,
        logs,
        modal,
        ModalType,
        monoIconColor,
        notes,
        plan,
        refs,
        selectedVerses,
        t,
        themeColors,
        userSettings,
        userSettingsOrDefault
    } from '$lib/data/stores';
    import type { Reference } from '$lib/data/stores/reference';
    import NoteIcon from '$lib/icons/NoteIcon.svelte';
    import type { SABProskomma } from '$lib/sab-proskomma';
    import { getFeatureValueBoolean, getFeatureValueString } from '$lib/scripts/configUtils';
    import { checkForMilestoneLinks } from '$lib/scripts/milestoneLinks';
    import * as numerals from '$lib/scripts/numeralSystem';
    import { parsePhrase, prepareAudioPhraseEndChars } from '$lib/scripts/parsePhrase';
    import {
        generateHTML,
        getDisplayString,
        handleHeaderLinkPressed,
        isBibleBook
    } from '$lib/scripts/scripture-reference-utils';
    import { getReferenceFromString } from '$lib/scripts/scripture-reference-utils-common';
    import { ciEquals, isDefined, isNotBlank, splitString } from '$lib/scripts/stringUtils';
    import {
        deselectAllElements,
        onClickText,
        updateSelections
    } from '$lib/scripts/verseSelectUtil';
    import { resolve } from '$lib/utils/paths';
    import { addVideoLinks, createVideoBlock, createVideoBlockFromUrl } from '$lib/video';
    import { SofriaRenderFromProskomma } from 'proskomma-json-tools';
    import { onDestroy, onMount } from 'svelte';
    import { fromStore } from 'svelte/store';

    const illustrations = import.meta.glob('./*', {
        import: 'default',
        eager: true,
        query: '?url',
        base: '/src/gen-assets/illustrations'
    }) as Record<string, string>;

    let {
        audioPhraseEndChars,
        maxSelections,
        redLetters,
        viewShowBibleImages,
        viewShowBibleVideos,
        viewShowIllustrations,
        viewShowVerses,
        viewShowGlossaryWords,
        font,
        proskomma
    }: Props = $props();

    const scriptureLogs = $derived.by(() =>
        $userSettings['scripture-logs']
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
                  row: 1,
                  placement: 1
              }
            : $logs['scripture']
    );

    let container: HTMLElement | undefined = $state();
    let displayingIntroduction = $state(false);

    const fnc = 'abcdefghijklmnopqrstuvwxyz';
    /** calculate letter index from number
     *
     * 0-25 => a-z; 26+ => aa, ab, ... zz
     */
    function createLetterIndex(index: number) {
        return (
            (index >= fnc.length ? fnc.charAt(Math.floor(index / fnc.length) - 1) : '') +
            fnc.charAt(index % fnc.length)
        );
    }
    let planDivObserver: IntersectionObserver | null = $state(null); // To store the observer instance
    let planObservationCompleted = $state(false);
    // Function to observe the visibility of the plan div
    function observeVisibility() {
        if (planDivObserver) {
            planDivObserver.disconnect(); // Disconnect any previous observer before creating a new one
            planDivObserver = null; // Clear the observer reference
        }
        if (planDivInChapter() && !$plan.completed) {
            const target = document.getElementById('PLAN-next');
            if (target) {
                planObservationCompleted = false;
                planDivObserver = new IntersectionObserver(
                    (entries) => {
                        entries.forEach((entry) => {
                            if (entry.isIntersecting && !planObservationCompleted) {
                                $plan.completed = true;
                                planObservationCompleted = true;
                                planDivObserver?.disconnect(); // Stop observing after it becomes visible
                                planDivObserver = null; // Clear the observer reference after disconnecting
                                addPlanProgressItem({
                                    id: $plan.planId,
                                    day: $plan.planDay,
                                    itemIndex: $plan.planEntry
                                });
                                if (lastPlanReference) {
                                    addPlanState({
                                        id: $plan.planId,
                                        state: 'completed'
                                    });
                                    deleteAllProgressItemsForPlan($plan.planId);
                                }
                            }
                        });
                    },
                    {
                        threshold: 0.1 // Adjust as needed
                    }
                );

                planDivObserver.observe(target);
            }
        }
    }
    onMount(() => {
        if (planDivInChapter()) {
            observeVisibility();
        }
    });

    onDestroy(() => {
        if (planDivObserver) {
            planDivObserver.disconnect();
            planDivObserver = null;
        }
    });

    function escapeSpecialChars(separators: string) {
        return separators.replace(/[.*+\-?^${}()|[\]\\]/g, '\\$&');
    }
    function seprgx2(inputChars: string) {
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
    }
    const seprgx = $derived(seprgx2(audioPhraseEndChars));

    function onlySpaces(str: string) {
        return str.trim().length === 0;
    }

    let nextPlanDay: number | null = $state(null);
    let lastPlanReference = $state();
    $effect(() => {
        if ($currentPlanData && $plan.planDay) {
            getFirstIncompleteDay($currentPlanData, $plan.planDay).then((day) => {
                nextPlanDay = day;
                if ($plan.planId) {
                    // The first is true before the end of plan div becomes visible
                    // When it becomes visible, the records are deleted and nextPlanDay
                    // is 1 but the plan status is now completed.  So must check both
                    // to know if the reference being viewed is the last.
                    if ($plan.planNextReference === '' && nextPlanDay === -1) {
                        lastPlanReference = true;
                    } else {
                        getLastPlanState($plan.planId).then((state) => {
                            lastPlanReference = state === 'completed';
                        });
                    }
                }
            });
        } else {
            nextPlanDay = null;
        }
    });

    // svelte-ignore state_referenced_locally
    const stateSelectedVerses = fromStore(selectedVerses);
    $effect(() => {
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        stateSelectedVerses.current;
        updateSelections();
    });

    function countSubheadingPrefixes(subHeadings: string[], labelPrefix: string) {
        let result = 0;
        for (let i in subHeadings) {
            if (subHeadings[i] === labelPrefix) {
                result++;
            }
        }
        return result;
    }

    function phraseTerminated(phrase: string) {
        return phrase.match(seprgx) != null;
    }
    function currentTextType(workspace: Workspace) {
        return workspace.textType[workspace.textType.length - 1];
    }
    function startPhrase(workspace: Workspace, indexOption = 'advance') {
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
            const phraseIndex = createLetterIndex(workspace.currentPhraseIndex);
            div.id = workspace.currentVerse + phraseIndex;
            div.setAttribute('data-verse', workspace.currentVerse);
            div.setAttribute('data-phrase', phraseIndex);
            div.classList.add('txs', 'seltxt', 'scroll-item');
        } else {
            div.id = '+' + workspace.introductionIndex;
            div.classList.add('txs');
            workspace.introductionIndex++;
        }
        return div.cloneNode(true) as HTMLDivElement;
    }
    function addTableText(workspace: Workspace, text: string) {
        if (workspace.inRow) {
            if (workspace.textType.includes('usfm') && workspace.usfmWrapperType === 'xt') {
                const references = text.split('; ');
                for (let i = 0; i < references.length; i++) {
                    var spanV = document.createElement('span');
                    spanV.classList.add('reflink');
                    const refText = generateHTML(text, 'header-ref');
                    spanV.innerHTML = refText;
                    spanV.addEventListener('click', onClick, false);
                    workspace.tableCellElement?.appendChild(spanV);
                    if (i < references.length - 1 && workspace.tableCellElement) {
                        appendTextToElement(workspace.tableCellElement, '; ');
                    }
                }
            } else if (workspace.tableCellElement) {
                const div = addTextNode(workspace.tableCellElement, text, workspace);
                workspace.tableCellElement = div.cloneNode(true) as HTMLTableCellElement;
            }
        }
    }
    function getFootnoteCallerCharacter(workspace: Workspace, text: string, textType: string) {
        let callerType = 'default';
        let callerSymbol: string | null = text;
        let callerCustomSymbol = '';
        let callerNoCallerToAuto = false;
        switch (textType) {
            case 'xref':
                callerType = getFeatureValueString(
                    'crossref-caller-type',
                    $refs.collection,
                    $refs.book
                );
                callerCustomSymbol = getFeatureValueString(
                    'crossref-caller-symbol',
                    $refs.collection,
                    $refs.book
                );
                callerNoCallerToAuto = getFeatureValueBoolean(
                    'crossref-caller-no-caller-to-auto',
                    $refs.collection,
                    $refs.book
                );
                break;

            default:
                callerType = getFeatureValueString(
                    'footnote-caller-type',
                    $refs.collection,
                    $refs.book
                );
                callerCustomSymbol = getFeatureValueString(
                    'footnote-caller-symbol',
                    $refs.collection,
                    $refs.book
                );
                callerNoCallerToAuto = getFeatureValueBoolean(
                    'footnote-caller-no-caller-to-auto',
                    $refs.collection,
                    $refs.book
                );
                break;
        }

        if (callerType === 'custom-symbol') {
            // Use whatever is specified as the custom symbol, even '-' or '+'
            // This matches native app. Sigh.
            return callerCustomSymbol;
        } else if (callerType === 'abc') {
            callerSymbol = '+';
        } else if (callerNoCallerToAuto && callerSymbol === '-') {
            callerSymbol = '+';
        }

        if (callerSymbol === '-') {
            callerSymbol = null;
        }

        if (callerSymbol === '+') {
            callerSymbol = createLetterIndex(workspace.footnoteIndex);
            workspace.footnoteIndex++;
        }

        return callerSymbol;
    }
    function appendTextToElement(element: HTMLElement, text: string) {
        element.innerHTML = element.innerHTML + text;
    }
    function addGraftText(workspace: Workspace, text: string, textType: string, usfmType: string) {
        if (workspace.textType.includes(textType)) {
            if (isDefined(workspace.footnoteDiv)) {
                if (workspace.textType.includes('note_caller')) {
                    const caller = getFootnoteCallerCharacter(workspace, text, textType);
                    if (!caller) {
                        // Do not include the footnote
                        workspace.footnoteSpan = null;
                    } else {
                        // Assign the caller to the footnote sup
                        const elements = workspace.footnoteSpan?.querySelectorAll('sup.footnote');
                        if (elements && elements.length > 0) {
                            elements[0].innerHTML = caller;
                        }
                    }
                } else {
                    const div = addTextNode(workspace.footnoteDiv, text, workspace);
                    workspace.footnoteDiv = div.cloneNode(true) as HTMLDivElement;
                }
            }
        } else {
            console.warn('%s ignored: %s', usfmType, text);
        }
    }
    function fixText(text: string) {
        if (text === '| default=""') {
            // HACK: Proskomma adds default="" to anonymous bars in text
            // See https://community.scripture.software.sil.org/t/issues-with-cross-references-in-pwa-modern/4476
            text = '| ';
        }
        return text;
    }
    function addText(workspace: Workspace, text: string) {
        text = fixText(text);
        if (scriptureLogs?.text) {
            console.log('Adding text:', text);
        }
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
                let div = workspace.phraseDiv.cloneNode(true) as HTMLDivElement;
                const phrase = phrases[i];
                div = addTextNode(div, phrase, workspace);
                if (i < phrases.length - 1) {
                    workspace.phraseDiv = div.cloneNode(true) as HTMLDivElement;
                    if (scriptureLogs?.text) {
                        console.log('Add text start phrase');
                    }
                    workspace.phraseDiv = startPhrase(workspace);
                } else {
                    workspace.phraseDiv = div.cloneNode(true) as HTMLDivElement;
                }
                if (workspace.encloseInSpanTag && workspace.phraseDiv.firstChild) {
                    const textNode = workspace.phraseDiv.firstChild;
                    workspace.encloseInSpanTag.appendChild(textNode);
                    workspace.phraseDiv.innerHTML = workspace.encloseInSpanTag.outerHTML;
                    workspace.phraseDiv.replaceChild(
                        workspace.encloseInSpanTag,
                        workspace.phraseDiv.firstChild
                    );
                    workspace.encloseInSpanTag = undefined;
                } //Enclose the text in a previously-created span tag
            }
            workspace.lastPhraseTerminated =
                phrases.length > 0 ? phraseTerminated(phrases[phrases.length - 1]) : false;
        }
        return;
    }
    function usfmSpan<E extends HTMLElement>(
        parent: E,
        spanClass: string,
        phrase: string,
        lemma: string = ''
    ) {
        const spanElement = document.createElement('span');
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
                aElement.classList.add('glossary');
                appendTextToElement(aElement, phrase);
                spanElement.appendChild(aElement);
                break;
            }
            default: {
                appendTextToElement(spanElement, phrase);
                break;
            }
        }
        parent.appendChild(spanElement);
        return parent;
    }
    function addTextNode<E extends HTMLElement>(div: E, phrase: string, workspace: Workspace) {
        const usfmWrapperType = workspace.usfmWrapperType;
        if (usfmWrapperType) {
            switch (usfmWrapperType) {
                case 'wj': {
                    if (workspace.showWordsOfJesus) {
                        div = usfmSpan(div, usfmWrapperType, phrase);
                    } else {
                        appendTextToElement(div, phrase);
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
            appendTextToElement(div, phrase);
        }
        return div;
    }
    function processText(
        introductionGraft: boolean,
        showIntroduction: boolean,
        titleGraft: boolean
    ) {
        let returnValue = false;
        if (introductionGraft == showIntroduction || (titleGraft && showIntroduction)) {
            returnValue = true;
        }
        return returnValue;
    }
    function appendPhrase(workspace: Workspace) {
        if (workspace.phraseDiv) {
            workspace.lastPhrase = workspace.phraseDiv.getAttribute('data-phrase') ?? '';
            if (versePerLine) {
                workspace.verseDiv?.appendChild(workspace.phraseDiv.cloneNode(true));
            } else {
                workspace.paragraphDiv.appendChild(workspace.phraseDiv.cloneNode(true));
            }
        }
    }
    function addVerseNumber(workspace: Workspace, element: Element, showVerseNumbers: boolean) {
        if (showVerseNumbers === true) {
            const spanV = document.createElement('span');
            spanV.classList.add('v');
            // 'number' can be a range of verse numbers
            spanV.innerText = numerals.formatNumberRange(
                numeralSystem,
                element.atts['number'],
                direction
            );

            const spanVsp = document.createElement('span');
            spanVsp.classList.add('vsp');
            spanVsp.innerText = '\u00A0'; // &nbsp
            workspace.phraseDiv?.appendChild(spanV);
            workspace.phraseDiv?.appendChild(spanVsp);
        }
    }
    function handleVerseLabel(element: Element, showVerseNumbers: boolean, workspace: Workspace) {
        if (workspace.firstVerse === true && workspace.chapterNumText !== '') {
            const div = document.createElement('div');
            const chapterNumberFormatSetting = getFeatureValueString(
                'chapter-number-format',
                $refs.collection,
                $refs.book
            );
            if (chapterNumberFormatSetting === 'drop-cap') {
                workspace.paragraphDiv.className = 'm';
                div.classList.add('c-drop');
                // SAB is statically generating div.c-drop: { float: left|right; } based on settings than can change
                // So override that style based on the current directin of the text
                div.style.float = direction.toLowerCase() === 'ltr' ? 'left' : 'right';
                div.innerText = workspace.chapterNumText;
                workspace.paragraphDiv.appendChild(div);
                if (!scriptureConfig.mainFeatures['hide-verse-number-1']) {
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
    function audioClickHandler(target: HTMLElement) {
        if (!hasAudioPlayed()) {
            return;
        }
        const element = target.textContent;
        const verseSelection = document.querySelector('[data-verse="' + element + '"]');
        const verseId = verseSelection?.getAttribute('id');
        if (verseId) {
            seekToVerse(verseId);
        }
    }
    // handles clicks on in-text notation superscripts
    function footnoteClickHandler(event: MouseEvent, target: HTMLElement) {
        if ($footnotes.length === 0) {
            event.stopPropagation();
            const root = target.parentNode?.parentNode as HTMLElement;
            const footnote = root?.querySelector(`div#${root.getAttribute('data-graft')}`);
            const workingSpan = footnote?.cloneNode(true) as HTMLDivElement;
            const spans = workingSpan?.querySelectorAll('span.xt');
            // Loop through each span and modify its inner HTML
            spans.forEach((span) => {
                span.innerHTML = generateHTML(span.innerHTML, ''); // Change inner HTML as needed
            });
            const parsed = workingSpan?.innerHTML;
            footnotes.push(parsed);
        }
    }
    // handles clicks on in text markdown reference links
    function referenceLinkClickHandler(target: HTMLElement) {
        const linkRef = target.getAttribute('ref') ?? '';
        const splitRef = splitString(linkRef, '.');
        const splitSet = splitRef[0];
        const refBook = splitRef[1];
        const splitChapter = splitRef[2];
        const splitVerse = splitRef[3];

        let refDocSet = currentDocSet;
        const refBc = scriptureConfig.bookCollections?.find((x) => x.id === splitSet);
        if (refBc) {
            refDocSet = refBc.languageCode + '_' + refBc.id;
        } else {
            // Invalid collection
            return;
        }
        refs.set({ docSet: refDocSet, book: refBook, chapter: splitChapter, verse: splitVerse });
        return;
    }
    async function headerLinkClickReference(event: MouseEvent, target: HTMLElement) {
        event.stopPropagation();
        let start = JSON.parse(target.getAttribute('data-start-ref') || '{}');
        let end =
            target.getAttribute('data-end-ref') === 'undefined'
                ? undefined
                : JSON.parse(target.getAttribute('data-end-ref') || '{}');
        if (scriptureConfig.mainFeatures['scripture-refs-display'] === 'viewer') {
            navigate(start);
        } else {
            const footnoteHTML = await handleHeaderLinkPressed(start, end, $themeColors);
            footnotes.push(footnoteHTML);
        }
    }
    function glossaryClickHandler(event: MouseEvent, target: HTMLElement) {
        event.stopPropagation();
        event.preventDefault();
        const glossaryLink = target.getAttribute('match');
        $glossary.then((glossaryResults) => {
            if (isDefined(glossaryResults.data.docSets[0].document)) {
                glossaryResults.data.docSets[0].document.mainBlocks.forEach((block) => {
                    if (ciEquals(block.key, glossaryLink)) {
                        if ($footnotes.length === 0) {
                            const glossaryDiv = document.createElement('div');
                            glossaryDiv.classList.add('txs');
                            const glossarySpan = document.createElement('span');
                            glossarySpan.classList.add('k');
                            //const titleText = document.createTextNode(glossaryLink);
                            glossarySpan.append(block.key);
                            glossaryDiv.append(glossarySpan);
                            const blockText = block.text.slice(glossaryLink?.length);
                            appendTextToElement(glossaryDiv, blockText);
                            const glossaryHTML = glossaryDiv.outerHTML;
                            footnotes.push(glossaryHTML);
                        }
                    }
                });
            }
        });
    }
    function remoteAudioClipHandler(event: MouseEvent, target: HTMLElement) {
        event.stopPropagation();
        const address = target.getAttribute('filelink');
        const el = document.querySelector(`audio[id="${address}" ]`);
        if (el) {
            const urlString = el.getAttribute('src');
            if (urlString) {
                const audio = new Audio(urlString);
                audio.play();
            }
        }
    }
    function navigate(reference: Reference) {
        refs.set({
            docSet: reference.docSet,
            book: reference.book,
            chapter: reference.chapter,
            verse: reference.verse
        });
        footnotes.reset();
    }
    function addNotesDiv(workspace: Workspace) {
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
        el?.parentNode?.insertBefore(notesSpan, el.nextSibling);
    }
    const noteSvg = () => {
        const noteIconColor: string = $themeColors?.TextColor || $monoIconColor;
        return `<svg fill="${noteIconColor}" style="display:inline" xmlns="http://www.w3.org/2000/svg" height="16" width="16" viewBox="0 0 96 96"><path d="M 21.07 74.80 L 8.76 87.35 Q 8.00 88.12 8.00 87.03 Q 8.00 52.12 8.00 18.00 Q 8.00 7.73 18.00 7.80 Q 48.00 8.00 78.00 8.00 Q 88.27 8.00 88.18 18.00 Q 88.00 40.13 88.09 62.25 Q 88.13 72.31 78.00 72.22 C 72.03 72.17 25.23 70.89 23.56 72.37 Q 22.78 73.07 21.07 74.80 Z M 72.00 21.60 A 0.60 0.60 0.0 0 0 71.40 21.00 L 24.60 21.00 A 0.60 0.60 0.0 0 0 24.00 21.60 L 24.00 28.40 A 0.60 0.60 0.0 0 0 24.60 29.00 L 71.40 29.00 A 0.60 0.60 0.0 0 0 72.00 28.40 L 72.00 21.60 Z M 72.00 35.60 A 0.60 0.60 0.0 0 0 71.40 35.00 L 24.60 35.00 A 0.60 0.60 0.0 0 0 24.00 35.60 L 24.00 42.40 A 0.60 0.60 0.0 0 0 24.60 43.00 L 71.40 43.00 A 0.60 0.60 0.0 0 0 72.00 42.40 L 72.00 35.60 Z M 60.00 49.60 A 0.60 0.60 0.0 0 0 59.40 49.00 L 24.60 49.00 A 0.60 0.60 0.0 0 0 24.00 49.60 L 24.00 56.40 A 0.60 0.60 0.0 0 0 24.60 57.00 L 59.40 57.00 A 0.60 0.60 0.0 0 0 60.00 56.40 L 60.00 49.60 Z"</path></svg>`;
    };
    function editNote(note: NoteItem) {
        modal.open(ModalType.Note, note);
    }
    function addNotedVerses() {
        $notes.then((notes) => {
            for (var k = 0; k < notes.length; k++) {
                const note = notes[k];
                const bookmarksSpan = document.getElementById('bookmarks' + note.verse);
                if (!bookmarksSpan) {
                    console.warn('No bookmarks span for verse %s', note.verse);
                    continue;
                }

                const existingNoteSpan = document.getElementById('note' + k);
                if (!existingNoteSpan) {
                    let noteSpan = document.createElement('span');
                    noteSpan.id = 'note' + k;
                    noteSpan.innerHTML = noteSvg();
                    noteSpan.onclick = (event) => editNote(note);
                    bookmarksSpan.appendChild(noteSpan);
                }
            }
        });
    }
    function addBookmarksDiv(workspace: Workspace) {
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
        el?.parentNode?.insertBefore(bookmarksSpan, el.nextSibling);
    }
    function bookmarkSvg() {
        return '<svg fill="#b10000" style="display:inline" xmlns="http://www.w3.org/2000/svg" height="16" width="16" viewBox="0 0 24 24"><path d="M5 21V5q0-.825.588-1.413Q6.175 3 7 3h10q.825 0 1.413.587Q19 4.175 19 5v16l-7-3Z"/></svg>';
    }
    function addBookmarkedVerses() {
        $bookmarks.then((bookmarks) => {
            for (var j = 0; j < bookmarks.length; j++) {
                const bookmarksSpan = document.getElementById('bookmarks' + bookmarks[j].verse);
                if (!bookmarksSpan) {
                    console.warn('No bookmarks span for verse %s', bookmarks[j].verse);
                    continue;
                }

                const existingBookmarkSpan = document.getElementById('bookmark' + j);
                if (!existingBookmarkSpan) {
                    let bookmarkSpan = document.createElement('span');
                    bookmarkSpan.id = 'bookmark' + j;
                    bookmarkSpan.innerHTML = bookmarkSvg();
                    bookmarksSpan.appendChild(bookmarkSpan);
                }
            }
        });
    }
    function addHighlightedVerses() {
        $highlights.then((highlights) => {
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
                for (const element of elements ?? []) {
                    const penClass = 'hlp' + highlights[i].penColor;
                    element.classList.add(penClass);
                }
            }
        });
    }
    function createFootnoteDiv(workspace: Workspace, element: Element) {
        let footnoteSpan = null;
        let footnoteId = `X-${workspace.footnoteIdIndex + 1}`;
        workspace.footnoteIdIndex++;
        let footnoteDiv = document.createElement('div');
        footnoteDiv.id = footnoteId;
        footnoteDiv.style.display = 'none';
        footnoteDiv.setAttribute('type', element.subType);

        footnoteSpan = document.createElement('span');
        footnoteSpan.setAttribute('data-graft', footnoteId);
        const a = document.createElement('a');
        const sup = document.createElement('sup');
        sup.classList.add('footnote');
        a.appendChild(sup);
        a.classList.add('cursor-pointer');
        footnoteSpan.appendChild(a);
        if (scriptureLogs?.footnote) {
            console.log('Create Footnote %o %o', footnoteSpan, footnoteDiv);
        }
        return [footnoteSpan, footnoteDiv];
    }

    function planDivInChapter() {
        let planEntryInChapter = false;
        // If plan entry is -1, there is no active entry
        if ($plan.planEntry !== -1) {
            if ($plan.planBookId === $refs.book && $plan.planChapter.toString() === $refs.chapter) {
                planEntryInChapter = true;
            }
        }
        return planEntryInChapter;
    }
    function addPlanDiv(workspace: Workspace, verseNumber: string) {
        if (planDivInChapter() && matchesVerse($plan.planToVerse, verseNumber)) {
            const planDiv = document.createElement('div');
            planDiv.id = 'plan-progress';
            planDiv.classList.add('plan-progress-block');
            if (lastPlanReference) {
                // plan is complete once this item finishes
                appendPlanProgressTextDiv(
                    planDiv,
                    'plan-progress-title',
                    '',
                    $t['Plans_Progress_Congratulations'],
                    false
                );
                appendPlanProgressTextDiv(
                    planDiv,
                    'plan-progress-info',
                    '',
                    $t['Plans_Progress_Plan_Completed'],
                    false
                );
                appendPlanProgressTextDiv(
                    planDiv,
                    'plan-progress-info',
                    '',
                    $currentPlanData?.title?.[$language] ?? $currentPlanData?.title?.default ?? '',
                    false
                );
                appendPlanProgressTextDiv(
                    planDiv,
                    'plan-progress-button',
                    'PLAN-next',
                    $t['Plans_Button_View_Plans'],
                    true
                );
            } else {
                appendPlanProgressTextDiv(
                    planDiv,
                    'plan-progress-info',
                    '',
                    $t['Plans_Progress_Item_Completed'],
                    false
                );
                appendPlanProgressTextDiv(
                    planDiv,
                    'plan-progress-reference',
                    '',
                    getPlanReferenceString($plan.planReference),
                    false
                );
                const hr = document.createElement('hr');
                if ($plan.planNextReference === '') {
                    // No more entries for current day
                    appendPlanProgressTextDiv(
                        planDiv,
                        'plan-progress-button',
                        'PLAN-next',
                        $t['Plans_Button_View_Plan'],
                        true
                    );
                } else {
                    planDiv.append(hr);
                    appendPlanProgressTextDiv(
                        planDiv,
                        'plan-progress-info',
                        '',
                        $t['Plans_Progress_Next_Reading'],
                        false
                    );
                    appendPlanProgressTextDiv(
                        planDiv,
                        'plan-progress-reference',
                        '',
                        getPlanReferenceString($plan.planNextReference),
                        false
                    );
                    appendPlanProgressTextDiv(
                        planDiv,
                        'plan-progress-button',
                        'PLAN-next',
                        $t['Button_Next'],
                        true
                    );
                }
            }
            workspace.root.appendChild(workspace.paragraphDiv);
            workspace.root.appendChild(planDiv);
            workspace.paragraphDiv = document.createElement('div');
            workspace.paragraphDiv.classList.add('p');
        } else if (planDivInChapter() === false && $plan.completed === true) {
            // If we are no longer in the plan chapter and the plan section
            // has been read, clear plan so that the plan item will not
            // appear if you go back to that chapter
            $plan = { ...defaultPlanStore };
        }
    }
    function appendPlanProgressTextDiv(
        progressDiv: HTMLDivElement,
        divClass: string,
        divId: string,
        stringId: string,
        addClick: boolean
    ) {
        const textDiv = document.createElement('div');
        if (divId !== '') {
            textDiv.id = divId;
        }
        if (addClick) {
            textDiv.onclick = (event) => planClicked();
        }
        textDiv.classList.add(divClass);
        appendTextToElement(textDiv, stringId);
        progressDiv.append(textDiv);
    }
    function getPlanReferenceString(ref: string) {
        let currentBookCollectionId = $refs.collection;
        const [_collection, book, _fromChapter, toChapter, verseRanges] =
            getReferenceFromString(ref);
        const displayString = getDisplayString(
            currentBookCollectionId,
            book,
            toChapter,
            verseRanges
        );
        return displayString;
    }
    async function gotoPlanReference() {
        let currentBookCollectionId = $refs.collection;
        const [_collection, book, _fromChapter, toChapter, verseRanges] = getReferenceFromString(
            $plan.planNextReference
        );
        const [fromVerse, toVerse, _separator] = verseRanges[0];
        let destinationVerse = fromVerse === -1 ? 1 : fromVerse;
        if ($currentPlanData?.items) {
            const item = $currentPlanData.items[$plan.planDay - 1];
            const [nextReference, nextIndex] = await getNextPlanReference(
                $plan.planId,
                item,
                $plan.planNextReferenceIndex
            );
            const newEntry = $plan.planNextReferenceIndex;
            const newReference = $plan.planNextReference;
            $plan = {
                planId: $plan.planId,
                planDay: $plan.planDay,
                planEntry: newEntry,
                planBookId: book,
                planChapter: toChapter,
                planFromVerse: fromVerse,
                planToVerse: toVerse,
                planReference: newReference,
                planNextReference: nextReference,
                planNextReferenceIndex: nextIndex,
                completed: false
            };
            refs.set({
                docSet: currentBookCollectionId,
                book: book,
                chapter: toChapter.toString(),
                verse: destinationVerse.toString()
            });
        }
    }
    function planClicked() {
        if ($plan.planNextReference === '') {
            if ($currentPlanState === 'completed') {
                goto(resolve(`/plans`));
            } else {
                goto(resolve(`/plans/${$plan.planId}`));
            }
        } else {
            gotoPlanReference();
        }
    }
    function matchesVerse(planToVerse: number, verseNumber: string): boolean {
        // If end of plan range is -1, then only match verseNumber '-1'
        if (planToVerse === -1) {
            return verseNumber === '-1';
        }

        // If it's just a single number string, compare directly
        if (/^\d+$/.test(verseNumber)) {
            return planToVerse === Number(verseNumber);
        }

        // If it's a range like "3-5"
        if (/^\d+-\d+$/.test(verseNumber)) {
            const [start, end] = verseNumber.split('-').map(Number);
            return planToVerse >= start && planToVerse <= end;
        }

        // If verseNumber is something unexpected, return false
        return false;
    }
    function findBookmarkElementForVerse(verse: number, verseRangeSeparator: string) {
        const elements = document.querySelectorAll('[id^="bookmarks"]');

        for (const element of elements) {
            const id = element.id.replace('bookmarks', '');
            const separatorRegex = verseRangeSeparator.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // Escape regex characters
            const rangeMatch = id.match(new RegExp(`^(\\d+)(?:${separatorRegex}(\\d+))?$`));

            if (rangeMatch) {
                const start = parseInt(rangeMatch[1], 10);
                const end = rangeMatch[2] ? parseInt(rangeMatch[2], 10) : start;

                if (verse >= start && verse <= end) {
                    return element;
                }
            }
        }

        return null; // No matching element found
    }
    function findDataElementForVerse(verse: number, verseRangeSeparator: string) {
        const elements = document.querySelectorAll('[data-verse][data-phrase="a"]');

        for (const element of elements) {
            const verseData = element.getAttribute('data-verse');
            const separatorRegex = verseRangeSeparator.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // Escape regex characters
            const rangeMatch = verseData?.match(new RegExp(`^(\\d+)(?:${separatorRegex}(\\d+))?$`));

            if (rangeMatch) {
                const start = parseInt(rangeMatch[1], 10);
                const end = rangeMatch[2] ? parseInt(rangeMatch[2], 10) : start;

                if (verse >= start && verse <= end) {
                    return element;
                }
            }
        }

        return null; // No matching element found
    }
    function placeElement(
        document: Document,
        container: HTMLElement,
        element: HTMLElement,
        pos: string,
        verse: string
    ) {
        if (scriptureLogs?.placement) {
            console.log('Placing element:', element, 'at', pos, 'of verse', verse);
        }
        if (pos === 'after') {
            // Place after the bookmark element for the verse
            const el = findBookmarkElementForVerse(parseInt(verse), verseRangeSeparator);
            if (el) {
                if (scriptureLogs?.placement) {
                    console.log(`Found bookmark element for verse ${verse} at ${el.id}`);
                }
                el.insertAdjacentElement('afterend', element);
            } else {
                console.log('Could not find bookmark element for verse', verse);
            }
        } else if (pos === 'before') {
            var el = findDataElementForVerse(parseInt(verse), verseRangeSeparator);
            if (el) {
                if (el.previousElementSibling?.classList.contains('c-drop')) {
                    el = el.previousElementSibling;
                }
                el.insertAdjacentElement('beforebegin', element);
            } else {
                console.log('Could not find data element for verse', verse);
            }
        } else if (pos === 'top') {
            const el = document.getElementsByClassName('m')[0];
            el.insertAdjacentElement('beforebegin', element);
        } else if (pos === 'bottom') {
            const els = container.querySelectorAll('span[id^=bookmarks]');
            const el = els[els.length - 1];
            el.insertAdjacentElement('afterend', element);
        }
    }
    function addVideos(videos: Videos) {
        if (videos && container) {
            videos.forEach((video, index) => {
                if (video.placement) {
                    // ref can be MAT 1:1 or MAT.1.1
                    let verse = video.placement.ref.split(/[:.]/).at(-1);
                    if (verse) {
                        const videoBlockDiv = createVideoBlock(document, video, index);
                        placeElement(
                            document,
                            container!,
                            videoBlockDiv,
                            video.placement.pos,
                            verse
                        );
                    }
                }
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

    function addIllustrations(illustrations: Illustrations) {
        if (illustrations && container) {
            illustrations.forEach((illustration, index) => {
                if (illustration.placement) {
                    let verse = illustration.placement.ref.split(/[:.]/).at(-1);
                    if (verse) {
                        const { block: illustrationBlockDiv } = createIllustrationBlock(
                            illustration.filename,
                            illustration.placement.caption
                        );
                        placeElement(
                            document,
                            container!,
                            illustrationBlockDiv,
                            illustration.placement.pos,
                            verse
                        );
                    }
                }
            });
        }
    }

    function createIllustrationBlock(source: string, caption: string | null) {
        const imageSource = illustrations['./' + source] ?? '';
        const divFigure = document.createElement('div');
        divFigure.classList.add('image-block');
        const spanFigure = document.createElement('span');
        spanFigure.classList.add('image');
        const figureImg = document.createElement('img');
        figureImg.setAttribute('src', imageSource);
        figureImg.style.display = 'inline-block';
        if (scriptureConfig.mainFeatures['zoom-illustrations']) {
            figureImg.addEventListener('click', () => showFullscreenPopup(imageSource));
        }
        spanFigure.appendChild(figureImg);
        divFigure.appendChild(spanFigure);
        if (caption !== null && caption !== '') {
            const divFigureText = createIllustrationCaptionBlock(caption);
            divFigure.appendChild(divFigureText);
        }
        return { block: divFigure, source: imageSource };
    }

    function createIllustrationCaptionBlock(caption: string) {
        const divFigureText = document.createElement('div');
        divFigureText.classList.add('caption');
        const spanFigureText = document.createElement('span');
        spanFigureText.classList.add('caption');
        appendTextToElement(spanFigureText, caption);
        divFigureText.append(spanFigureText);
        return divFigureText;
    }

    function showFullscreenPopup(imageSource: string) {
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
        let footer = scriptureConfig.bookCollections?.find((x) => x.id === collection)?.footer;
        const bookFooter = scriptureConfig.bookCollections
            ?.find((x) => x.id === collection)
            ?.books.find((x) => x.id === currentBook)?.footer;
        if (bookFooter) {
            footer = bookFooter;
        }

        if (footer && container.getElementsByClassName('footer').length == 0) {
            const divFooter = document.createElement('div');
            divFooter.classList.add('footer');
            divFooter.classList.add('md:footer-horizontal');
            const divFooterLine = document.createElement('div');
            divFooterLine.classList.add('footer-line');
            divFooter.appendChild(divFooterLine);
            const spanFooter = document.createElement('span');
            spanFooter.classList.add('footer');
            spanFooter.classList.add('md:footer-horizontal');
            spanFooter.innerHTML = footer;
            divFooterLine.appendChild(spanFooter);
            container.appendChild(divFooter);
        }
    }
    function figureSource(element: Element) {
        let source;
        if ('src' in element.atts) {
            source = element.atts['src'][0];
        } else if ('unknownDefault_fig' in element.atts) {
            source = element.atts['unknownDefault_fig'][0];
        }
        return source;
    }
    function showImage() {
        return viewShowIllustrations && showImageInBook();
    }
    function showImageInBook() {
        const showBibleImage = viewShowBibleImages === 'normal';
        const showImages = !currentIsBibleBook || showBibleImage;
        return showImages;
    }
    function showVideo() {
        const showBibleVideo = viewShowBibleVideos === 'normal';
        const showVideos = !currentIsBibleBook || showBibleVideo;
        return showVideos;
    }
    function addFigureDiv(source: string, workspace: Workspace) {
        if (workspace.phraseDiv != null && workspace.phraseDiv.innerText !== '') {
            appendPhrase(workspace);
        }
        workspace.phraseDiv = null;
        const { block: divFigure, source: imageSource } = createIllustrationBlock(source, null);
        workspace.figureDiv = divFigure;
        if (showImage()) {
            checkImageExists(imageSource, divFigure);
        }
    }
    function prepareJmpLink(workspace: Workspace, element: Element) {
        if (isDefined(element.atts['href'])) {
            const rawHref = element.atts['href'][0];
            try {
                workspace.jmpLink = decodeURIComponent(rawHref);
            } catch {
                workspace.jmpLink = rawHref;
            }
            const hrefLower = workspace.jmpLink.trim().toLowerCase();
            const allowed =
                hrefLower.startsWith('http://') ||
                hrefLower.startsWith('https://') ||
                hrefLower.startsWith('mailto:') ||
                hrefLower.startsWith('tel:');
            if (!allowed) {
                console.warn('Ignoring unsupported jmp href protocol:', workspace.jmpLink);
                workspace.jmpLink = '';
            }
        }
        if (isDefined(element.atts['title'])) {
            const rawTitle = element.atts['title'][0];
            try {
                workspace.jmpTitle = decodeURIComponent(rawTitle);
            } catch {
                workspace.jmpTitle = rawTitle;
            }
        }
        workspace.jmpText = '';
    }
    function addJmpLink(workspace: Workspace) {
        let parentDiv: HTMLElement | null;
        if (workspace.textType.includes('heading')) {
            parentDiv = workspace.headerInnerDiv;
        } else {
            parentDiv = workspace.phraseDiv ?? workspace.paragraphDiv;
        }
        if (!parentDiv) {
            // For safety, if no parent, reset and return
            workspace.jmpLink = '';
            workspace.jmpTitle = '';
            workspace.jmpText = '';
            return;
        }
        // Graceful degradation: no/unsupported href -> emit plain text
        if (!workspace.jmpLink) {
            appendTextToElement(parentDiv, workspace.jmpText);
            workspace.jmpTitle = '';
            workspace.jmpText = '';
            return;
        }
        const jmpLink = document.createElement('a');

        const linkLower = workspace.jmpLink.toLowerCase();
        const className = linkLower.startsWith('mailto:')
            ? 'email-link'
            : linkLower.startsWith('tel:')
              ? 'tel-link'
              : 'web-link';
        jmpLink.classList.add(className);
        jmpLink.setAttribute('href', workspace.jmpLink);
        if (className === 'web-link') {
            jmpLink.setAttribute('target', '_blank');
            jmpLink.setAttribute('rel', 'noopener noreferrer');
        }
        jmpLink.textContent = workspace.jmpText;
        jmpLink.addEventListener('click', (e) => e.stopPropagation());
        if (workspace.jmpTitle) {
            // must use inline style
            const tip = document.createElement('span');
            tip.style.display = 'inline';
            tip.classList.add('dy-tooltip');
            tip.setAttribute('data-tip', workspace.jmpTitle);
            tip.appendChild(jmpLink);
            parentDiv.appendChild(tip);
        } else {
            parentDiv.appendChild(jmpLink);
        }
        workspace.jmpLink = '';
        workspace.jmpTitle = '';
        workspace.jmpText = '';
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
    function preprocessAction(action: string, workspace: Workspace) {
        // Table ends if row ended and anything other than start row follows it
        if (!workspace.inRow && workspace.insideTable && action !== 'startRow') {
            workspace.insideTable = false;
            workspace.root.appendChild(workspace.tableElement!);
        }
    }
    // handles on click when interacting with the scripture view
    function onClick(e: MouseEvent) {
        const target = e.target as HTMLElement;
        switch (target.getAttribute('class')) {
            case 'v':
                audioClickHandler(target);
                break;
            case 'footnote':
                footnoteClickHandler(e, target);
                break;
            case 'glossary':
                glossaryClickHandler(e, target);
                break;
            case 'audioclip':
                remoteAudioClipHandler(e, target);
                break;
            case 'web-link':
            case 'email-link':
            case 'tel-link':
                // Allow native navigation without verse selection side-effects.
                e.stopPropagation();
                break;
            default:
                if (target.classList.contains('ref-link')) {
                    referenceLinkClickHandler(target);
                    break;
                }
                if (target.classList.contains('header-ref')) {
                    headerLinkClickReference(e, target);
                }
                if (!$audioPlayer.playing) {
                    onClickText(e, maxSelections);
                }
                break;
        }
    }
    function chapterCount(book: string) {
        if (bookTabSelected && bookTabs?.tabs[$refs.bookTab - 1].chapters === 1) {
            return 0;
        }
        const count = Object.keys(
            books.find((x) => x.bookCode === book)?.versesByChapters ?? {}
        ).length;
        return count;
    }

    const clickableClasses = ['seltext', 'r', 's', 'mt', 'imt2', 'ip', 'is', 'io', 'io2'] as const;
    function hasClickableClass(divElement: HTMLDivElement) {
        if (divElement.classList.contains('seltxt') && divElement.id != '') {
            return true;
        } else {
            return clickableClasses.some((cls) => divElement.classList.contains(cls));
        }
    }
    function addOnClickDivs() {
        var els = document.getElementsByTagName('div');
        for (var i = 0; i < els.length; i++) {
            if (hasClickableClass(els[i])) {
                els[i].addEventListener('click', onClick, false);
            }
        }
    }
    let bookRoot = $state(document.createElement('div'));
    $effect(() => {
        if (scriptureLogs?.root) {
            console.log('START: %o', bookRoot);
        }
    });

    let loading = $state(true);

    type Block = { type: string; subType?: string; sequence: Partial<Sequence> };

    type Element = {
        type: string;
        subType: string;
        text: string;
        atts: Record<string, string>;
        sequence: Partial<Sequence>;
    };

    type Sequence = {
        id: string;
        type: string;
        block: Block;
        element: Element;
    };

    type Context = {
        document: { metadata: { document: unknown } };
        sequences: Sequence[];
        renderer: {
            renderSequence: (env: Action) => void;
        };
    };

    type Workspace = {
        root: HTMLDivElement;
        footnoteIndex: number;
        footnoteIdIndex: number;
        introductionIndex: number;
        firstVerse: boolean;
        currentVerse: string;
        currentPhraseIndex: number;
        currentSequence: Partial<Sequence>;
        milestoneLink: string;
        milestoneText: string;
        milestoneTitle: string;
        lastPhrase: string;
        introductionGraft: boolean;
        titleGraft: boolean;
        paragraphDiv: HTMLDivElement;
        titleBlockDiv: HTMLDivElement;
        titleSpan: HTMLSpanElement | null;
        verseDiv: HTMLDivElement | null;
        phraseDiv: HTMLDivElement | null;
        videoDiv: HTMLDivElement | null;
        footnoteDiv: HTMLDivElement | null;
        footnoteSpan: HTMLSpanElement | null;
        figureDiv: HTMLDivElement | null;
        encloseInSpanTag?: HTMLSpanElement;
        subheaders: string[];
        textType: string[];
        headerDiv: HTMLDivElement | null;
        headerInnerDiv: HTMLDivElement | null;
        audioClips: string[];
        usfmWrapperType: string;
        showWordsOfJesus: boolean;
        lastPhraseTerminated: boolean;
        currentVideoIndex: number;
        chapterNumText: string;
        insideTable: boolean;
        inRow: boolean;
        tableElement: HTMLTableElement | null;
        tableRowElement: HTMLTableRowElement | null;
        tableCellElement: HTMLTableCellElement | null;
        rowCellNumber: number;
        lemma: string;
        jmpLink: string;
        jmpTitle: string;
        jmpText: string;
    } & Record<`level${number}ListNum`, number>;

    type Action = { context: Context; workspace: Workspace };

    const output = {};
    const query = async (
        docSet: string,
        bookCode: string,
        chapter: string,
        showVerses: boolean,
        showRedLetters: boolean,
        versePerLine: boolean,
        videos: Videos,
        illustrations: Illustrations
    ) => {
        // Is it possible that this could be called and proskomma is not set yet?
        if (!proskomma) {
            return;
        }
        await loadDocSetIfNotLoaded(proskomma, docSet, fetch);
        const cl = new SofriaRenderFromProskomma({
            proskomma,
            actions: {
                startDocument: [
                    {
                        description: 'Set up; Book heading',
                        test: () => true,
                        action: ({ context, workspace }: Action) => {
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
                            workspace.footnoteIdIndex = 0;
                            workspace.introductionIndex = 0;
                            workspace.firstVerse = true;
                            workspace.currentVerse = 'none';
                            workspace.currentPhraseIndex = 0;
                            workspace.milestoneLink = '';
                            workspace.milestoneText = '';
                            workspace.milestoneTitle = '';
                            workspace.lastPhrase = 'a';
                            workspace.introductionGraft = false;
                            workspace.titleGraft = false;
                            workspace.paragraphDiv = document.createElement('div');
                            workspace.titleBlockDiv = document.createElement('div');
                            workspace.titleSpan = null;
                            workspace.verseDiv = null;
                            workspace.phraseDiv = null;
                            workspace.videoDiv = null;
                            workspace.footnoteDiv = null;
                            workspace.figureDiv = null;
                            workspace.subheaders = [];
                            workspace.textType = [];
                            workspace.headerDiv = null;
                            workspace.headerInnerDiv = null;
                            workspace.audioClips = [];
                            workspace.usfmWrapperType = '';
                            workspace.showWordsOfJesus = showRedLetters;
                            workspace.lastPhraseTerminated = false;
                            workspace.currentVideoIndex = 0;
                            workspace.chapterNumText = '';
                            workspace.insideTable = false;
                            workspace.inRow = false;
                            workspace.tableElement = null;
                            workspace.tableRowElement = null;
                            workspace.tableCellElement = null;
                            workspace.rowCellNumber = 0;
                            workspace.lemma = '';
                            workspace.jmpLink = '';
                            workspace.jmpTitle = '';
                            workspace.jmpText = '';
                            deselectAllElements();

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
                        action: ({ workspace }: Action) => {
                            if (scriptureLogs?.document) {
                                console.log('End Document');
                            }
                            preprocessAction('endDocument', workspace);
                            addOnClickDivs();
                            if (!displayingIntroduction) {
                                addNotedVerses();
                                addHighlightedVerses();
                                if (showVideo()) {
                                    addVideos(videos);
                                }
                                if (showImage()) {
                                    addIllustrations(illustrations);
                                }
                                addPlanDiv(workspace, '-1');
                            }
                            addFooter(document, workspace.root, docSet);
                            if ($refs) {
                                observeVisibility();
                            }
                        }
                    }
                ],
                startParagraph: [
                    {
                        description: 'Start HTML para with appropriate class',
                        test: () => true,
                        action: ({ context, workspace }: Action) => {
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
                                    context.sequences[0].block.subType?.split(':')[1] ||
                                    context.sequences[0].block.subType ||
                                    '';
                                switch (sequenceType) {
                                    case 'main': {
                                        if (!displayingIntroduction) {
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
                                            if (paraClass === 'b') {
                                                workspace.paragraphDiv.innerHTML += '&nbsp;';
                                            }
                                        }
                                        break;
                                    }
                                    case 'introduction': {
                                        if (scriptureLogs?.paragraph) {
                                            console.log('Introduction start phrase');
                                        }
                                        workspace.phraseDiv = startPhrase(workspace, 'keep');
                                        workspace.paragraphDiv = document.createElement('div');
                                        workspace.paragraphDiv.classList.add(paraClass);
                                        break;
                                    }
                                    case 'heading': {
                                        workspace.headerDiv = document.createElement('div');
                                        var headingParaClass =
                                            context.sequences[0].block.subType?.split(':')[1] ||
                                            context.sequences[0].block.subType ||
                                            '';
                                        workspace.headerDiv.classList.add(headingParaClass);
                                        const prefix = headingParaClass.replaceAll(/[0-9]/g, '');
                                        workspace.subheaders.push(prefix);
                                        const count = countSubheadingPrefixes(
                                            workspace.subheaders,
                                            prefix
                                        );
                                        workspace.headerInnerDiv = document.createElement('div');
                                        workspace.headerInnerDiv.id = prefix + count;
                                        break;
                                    }
                                    case 'title': {
                                        workspace.titleSpan = document.createElement('span');
                                        workspace.titleSpan.classList.add(paraClass);
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
                endParagraph: [
                    {
                        description: 'End HTML para',
                        test: () => true,
                        action: ({ context, workspace }: Action) => {
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
                                switch (sequenceType) {
                                    case 'main': {
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
                                        if (workspace.paragraphDiv.innerHTML !== '') {
                                            workspace.root.appendChild(workspace.paragraphDiv);
                                        }
                                        if (workspace.videoDiv) {
                                            workspace.root.appendChild(workspace.videoDiv);
                                            workspace.videoDiv = null;
                                        }
                                        break;
                                    }
                                }
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
                                    if (workspace.paragraphDiv.innerHTML !== '') {
                                        workspace.root.appendChild(workspace.paragraphDiv);
                                    }
                                    if (workspace.videoDiv) {
                                        workspace.root.appendChild(workspace.videoDiv);
                                        workspace.videoDiv = null;
                                    }
                                } else if (sequenceType == 'title') {
                                    const div = document.createElement('div');
                                    var paraClass =
                                        context.sequences[0].block.subType?.split(':')[1] ||
                                        context.sequences[0].block.subType ||
                                        '';
                                    div.classList.add(paraClass);
                                    div.appendChild(workspace.titleSpan!);
                                    workspace.titleBlockDiv.appendChild(div);
                                    workspace.titleSpan = null;
                                } else if (sequenceType == 'heading') {
                                    workspace.headerDiv?.appendChild(workspace.headerInnerDiv!);
                                    workspace.root.appendChild(workspace.headerDiv!);
                                    workspace.headerInnerDiv = null;
                                    workspace.headerDiv = null;
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
                        action: ({ context, workspace }: Action) => {
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
                        action: ({ context, workspace }: Action) => {
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
                                        workspace.verseDiv!.cloneNode(true)
                                    );
                                    workspace.verseDiv = null;
                                }
                                workspace.phraseDiv = null;
                                addBookmarksDiv(workspace);
                                addNotesDiv(workspace);
                                addPlanDiv(workspace, element.atts['number']);
                                workspace.currentVerse = 'none';
                            }
                        }
                    }
                ],
                startChapter: [
                    {
                        description: 'Start Chapter',
                        test: () => true,
                        action: ({ context, workspace }: Action) => {
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
                        action: ({ context, workspace }: Action) => {
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
                        action: ({ context, workspace }: Action) => {
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
                                        appendTextToElement(workspace.titleSpan!, text);
                                        break;
                                    }
                                    case 'heading': {
                                        const blockType = context.sequences[0].block.subType;
                                        if (blockType?.includes('usfm:r')) {
                                            const refText = generateHTML(text, 'header-ref');
                                            // This is for usfm:r like you will find in CUK Headers
                                            // which contain references inline
                                            workspace.headerInnerDiv!.innerHTML = refText;
                                        } else {
                                            appendTextToElement(workspace.headerInnerDiv!, text);
                                        }
                                        break;
                                    }
                                    case 'fig': {
                                        // This is a HACK!
                                        // see https://github.com/Proskomma/proskomma-json-tools/issues/63
                                        if (text !== 'NO_CAPTION') {
                                            const divFigureText =
                                                createIllustrationCaptionBlock(text);
                                            workspace.figureDiv!.append(divFigureText);
                                        }
                                        break;
                                    }
                                    case 'jmp': {
                                        workspace.jmpText += text;
                                        break;
                                    }
                                    case 'audioc':
                                    case 'reflink': {
                                        workspace.milestoneText = text;
                                        break;
                                    }
                                    default: {
                                        const blockType = context.sequences[0].block.subType;

                                        if (blockType?.includes('usfm:x')) {
                                            addGraftText(workspace, text, 'xref', 'usfm:x');
                                            // Footnote Text
                                        } else if (blockType?.includes('usfm:f')) {
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
                                                    workspace.phraseDiv = startPhrase(
                                                        workspace,
                                                        'keep'
                                                    );
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
                        action: ({ context, workspace }: Action) => {
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
                        action: ({ context, workspace }: Action) => {
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
                                            $refs.collection,
                                            $refs.book
                                        )
                                    ) {
                                        workspace.chapterNumText = numerals.formatNumber(
                                            numeralSystem,
                                            element.atts['number']
                                        );
                                        const book = $refs.book;
                                        const bookType = scriptureConfig.bookCollections
                                            ?.find((x) => $refs.collection === x.id)
                                            ?.books.find((x) => book === x.id)?.type;
                                        if (
                                            bookType === 'songs' &&
                                            workspace.chapterNumText !== ''
                                        ) {
                                            const div = document.createElement('div');
                                            const chapterNumberFormatSetting =
                                                getFeatureValueString(
                                                    'chapter-number-format',
                                                    $refs.collection,
                                                    $refs.book
                                                );
                                            if (chapterNumberFormatSetting === 'drop-cap') {
                                                workspace.paragraphDiv.className = 'm';
                                                div.classList.add('c-drop');
                                                // SAB is statically generating div.c-drop: { float: left|right; } based on settings than can change
                                                // So override that style based on the current directin of the text
                                                div.style.float =
                                                    direction.toLowerCase() === 'ltr'
                                                        ? 'left'
                                                        : 'right';
                                                div.innerText = workspace.chapterNumText;
                                                workspace.paragraphDiv.appendChild(div);
                                            } else {
                                                // chapter at top of page
                                                div.classList.add('c');
                                                div.innerText = workspace.chapterNumText;
                                                workspace.root.appendChild(div);
                                            }
                                            workspace.chapterNumText = '';
                                        }
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
                        action: ({ context, workspace }: Action) => {
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
                        action: ({ context, workspace }: Action) => {
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
                        action: (environment: Action) => {
                            if (scriptureLogs?.blockGraft) {
                                console.log(
                                    'Block Graft %o',
                                    environment.context.sequences[0].block
                                );
                            }
                            preprocessAction('blockGraft', environment.workspace);
                            const currentBlock = environment.context.sequences[0].block;
                            const graftRecord: Block = {
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
                        action: (environment: Action) => {
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
                            const graftRecord: Element = {
                                type: element.type,
                                subType: element.subType,
                                sequence: {},
                                atts: {},
                                text: ''
                            };
                            if (element.subType === 'xref' || element.subType === 'footnote') {
                                workspace.textType.push('footnote');
                                const [span, footnoteDiv] = createFootnoteDiv(workspace, element);
                                workspace.footnoteDiv = footnoteDiv.cloneNode(
                                    true
                                ) as HTMLDivElement;
                                workspace.footnoteSpan = footnoteSpan = span;
                            } else if (element.subType === 'note_caller') {
                                workspace.textType.push(element.subType);
                            }
                            const cachedSequencePointer = workspace.currentSequence;
                            workspace.currentSequence = graftRecord.sequence;
                            environment.context.renderer.renderSequence(environment);
                            // Runs after all segments in graft have run
                            workspace.currentSequence = cachedSequencePointer;
                            if (element.subType === 'xref' || element.subType === 'footnote') {
                                if (footnoteSpan) {
                                    // Add space after footnote if there are multiple footnotes.
                                    const spaceNode = document.createTextNode('\u00A0\u00A0');
                                    footnoteSpan.appendChild(workspace.footnoteDiv!);
                                    let parentDiv;
                                    if (workspace.textType.includes('heading')) {
                                        parentDiv = workspace.headerInnerDiv;
                                    } else if (workspace.textType.includes('title')) {
                                        parentDiv = workspace.titleSpan;
                                    } else {
                                        parentDiv = workspace.phraseDiv;
                                    }
                                    parentDiv?.appendChild(footnoteSpan);
                                    parentDiv?.appendChild(spaceNode);
                                }
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
                        action: ({ context, workspace }: Action) => {
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
                                    } else if (usfmType === 'jmp') {
                                        workspace.textType.push('jmp');
                                        prepareJmpLink(workspace, element);
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
                        action: ({ context, workspace }: Action) => {
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
                                    let usfmType = element.subType.split(':')[1];
                                    if (usfmType === 'fig') {
                                        if (showImage()) {
                                            workspace.paragraphDiv.appendChild(
                                                workspace.figureDiv!
                                            );
                                        }
                                    } else if (usfmType === 'jmp') {
                                        workspace.textType.pop();
                                        addJmpLink(workspace);
                                    } else {
                                        workspace.textType.pop();
                                    }
                                    workspace.usfmWrapperType = '';
                                    break;
                                }
                                case 'cell': {
                                    workspace.textType.pop();
                                    if (workspace.tableRowElement != null) {
                                        workspace.tableRowElement.appendChild(
                                            workspace.tableCellElement!
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
                        action: ({ context, workspace }: Action) => {
                            if (scriptureLogs?.milestone) {
                                console.log('Start Milestone %o', context.sequences[0].element);
                            }
                            preprocessAction('startMilestone', workspace);
                            const element = context.sequences[0].element;
                            let match;
                            if ((match = element.subType.match(/^usfm:zon(\d+)$/))) {
                                workspace[`level${parseInt(match[1])}ListNum`] = parseInt(
                                    element.atts['start'][0]
                                );
                            } else if ((match = element.subType.match(/^usfm:zoli(\d+)$/))) {
                                const matchNum = parseInt(match[1]);
                                workspace.paragraphDiv.classList.add('list-item');
                                workspace.paragraphDiv.classList.add('list-decimal');
                                workspace.paragraphDiv.classList.add('list-inside');
                                if (!workspace[`level${matchNum}ListNum`]) {
                                    workspace[`level${matchNum}ListNum`] = 1;
                                }
                                workspace.paragraphDiv.style.counterSet =
                                    'list-item ' + workspace[`level${matchNum}ListNum`];
                                workspace[`level${matchNum}ListNum`]++;

                                workspace.paragraphDiv.style.paddingInlineStart =
                                    2 * parseInt(match[1]) - 1 + 'rem';
                                for (let i = matchNum + 1; workspace[`level${i}ListNum`]; i++) {
                                    delete workspace[`level${i}ListNum`];
                                } //This resets all lower-level list numbering so future lower-level lists don't continue from previous ones.
                            } else if ((match = element.subType.match(/^usfm:zuli(\d+)$/))) {
                                const matchNum = parseInt(match[1]);
                                workspace.paragraphDiv.classList.add('list-item');
                                workspace.paragraphDiv.classList.add('list-inside');

                                workspace.paragraphDiv.style.paddingInlineStart =
                                    2 * matchNum - 1 + 'rem';
                                if (matchNum === 2) {
                                    workspace.paragraphDiv.classList.add('list-[circle]');
                                } else if (matchNum >= 3) {
                                    workspace.paragraphDiv.classList.add('list-[square]');
                                }
                            }
                            switch (element.subType) {
                                case 'usfm:zvideo': {
                                    const id = element.atts['id'][0];
                                    const video = scriptureConfig.videos?.find((x) => x.id === id);
                                    if (video) {
                                        workspace.videoDiv = createVideoBlock(
                                            document,
                                            video,
                                            workspace.currentVideoIndex++
                                        );
                                    } else {
                                        // Proskomma did replacement of slashes in id
                                        const videoUrl = id.replace(/÷/g, '/');
                                        workspace.videoDiv = createVideoBlockFromUrl(
                                            document,
                                            videoUrl,
                                            scriptureConfig.mainFeatures
                                        );
                                    }
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
                                case 'usfm:zstyle': {
                                    const style = element.atts['id'][0];
                                    workspace.paragraphDiv.classList.add(style);
                                    break;
                                }
                                case 'usfm:zcstyle': {
                                    const style = element.atts['id'][0];
                                    workspace.encloseInSpanTag = document.createElement('span');
                                    workspace.encloseInSpanTag.classList.add(style);
                                    break;
                                }
                                case 'usfm:zreflink': {
                                    workspace.textType.push('reflink');
                                    workspace.milestoneLink = decodeURIComponent(
                                        element.atts['link'][0]
                                    );
                                    if (isDefined(element.atts['title'])) {
                                        workspace.milestoneTitle = decodeURIComponent(
                                            element.atts['title'][0]
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
                endMilestone: [
                    {
                        description: 'End Milestone',
                        test: () => true,
                        action: ({ context, workspace }: Action) => {
                            if (scriptureLogs?.milestone) {
                                console.log('End Milestone %o', context.sequences[0].element);
                            }
                            preprocessAction('endMilestone', workspace);
                            const element = context.sequences[0].element;
                            checkForMilestoneLinks(
                                workspace.textType,
                                workspace.footnoteDiv!,
                                workspace.phraseDiv ?? workspace.paragraphDiv,
                                workspace.milestoneText,
                                workspace.milestoneLink,
                                workspace.milestoneTitle,
                                workspace.audioClips.length,
                                element.subType,
                                scriptureConfig.audio!,
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
                        action: ({ context, workspace }: Action) => {
                            if (scriptureLogs?.row) {
                                console.log('Start Row %o', context.sequences[0].element);
                            }
                            preprocessAction('startRow', workspace);
                            if (!workspace.insideTable) {
                                workspace.tableElement = document.createElement('table');
                                workspace.tableElement.setAttribute('cellpadding', '5');
                                workspace.insideTable = true;
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
                        action: ({ context, workspace }: Action) => {
                            if (scriptureLogs?.row) {
                                console.log('End Row %o', context.sequences[0].element);
                            }
                            preprocessAction('endRow', workspace);
                            workspace.tableElement?.appendChild(workspace.tableRowElement!);
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
        const bookLookup: Record<string, string> = {};
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

    type Videos = ReturnType<typeof videosForChapter>;
    function videosForChapter(docSet: string, bookCode: string, chapter: string) {
        let collection = docSet.split('_')[1];
        let videos = scriptureConfig.videos?.filter(
            (x) =>
                x.placement &&
                x.placement.collection === collection &&
                (x.placement.ref.startsWith(bookCode + ' ' + chapter + ':') ||
                    x.placement.ref.startsWith(bookCode + '.' + chapter + '.'))
        );
        return videos;
    }

    type Illustrations = ReturnType<typeof illustrationsForChapter>;
    function illustrationsForChapter(docSet: string, bookCode: string, chapter: string) {
        let collection = docSet.split('_')[1];
        let illustrations = scriptureConfig.illustrations?.filter(
            (x) =>
                x.placement &&
                x.placement.collection === collection &&
                (x.placement.ref.startsWith(bookCode + ' ' + chapter + ':') ||
                    x.placement.ref.startsWith(bookCode + '.' + chapter + '.'))
        );
        return illustrations;
    }
    const fontSize = $derived($bodyFontSize + 'px');

    const lineHeight = $derived($bodyLineHeight + '%');

    const currentChapter = $derived($refs.chapter);

    const currentBook = $derived($refs.book);

    const currentDocSet = $derived($refs.docSet);

    const bookTabs = $derived(
        scriptureConfig.bookCollections
            ?.find((x) => x.id === $refs.collection)
            ?.books.find((x) => x.id === $refs.book)?.bookTabs
    );

    const bookTabSelected = $derived(bookTabs && $refs.bookTab > 0);

    $effect(() => {
        if (!bookTabSelected) {
            refs.setBookTab(0);
        }
    });

    const currentIsBibleBook = $derived(isBibleBook($refs));

    const numeralSystem = $derived(
        numerals.systemForBook(scriptureConfig, $refs.collection, currentBook)
    );

    const versePerLine = $derived($userSettingsOrDefault['verse-layout'] === 'one-per-line');
    /**list of books in current docSet*/
    const books = $derived($refs.catalog.documents);
    const direction = $derived(
        scriptureConfig.bookCollections?.find((x) => x.id === $refs.collection)?.style
            ?.textDirection || 'ltr'
    );
    const verseRangeSeparator = $derived(
        scriptureConfig.bookCollections?.find((x) => x.id === $refs.collection)?.features[
            'ref-verse-range-separator'
        ] as string
    );
    $effect(() => {
        performance.mark('query-start');
        const bookHasIntroduction = books.find((x) => x.bookCode === currentBook)?.hasIntroduction;
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
        if (bookTabSelected) {
            query(
                docSet,
                bookCode + bookTabs?.tabs[$refs.bookTab - 1].bookTabID,
                chapter,
                viewShowVerses,
                redLetters,
                versePerLine,
                videos,
                illustrations
            );
        } else {
            query(
                docSet,
                bookCode,
                chapter,
                viewShowVerses,
                redLetters,
                versePerLine,
                videos,
                illustrations
            );
        }
        performance.mark('query-end');
        performance.measure('query-duration', 'query-start', 'query-end');
    });
</script>

<article class="container" bind:this={container}>
    {#if loading}
        <span class="spin"></span>
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
