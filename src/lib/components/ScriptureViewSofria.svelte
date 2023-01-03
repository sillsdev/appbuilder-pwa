<!--
@component
A component for displaying scripture.  
TODO:
- integrate SOFRIA
- add phrase info for highlight synchronization
- fully utilize groupStore functionality
- find a way to scroll smoothly, as CSS only option does not work as expected.
- change the global stylesheet to have .highlighting
-->
<script lang="ts">
    import { Proskomma } from 'proskomma';
    import { SofriaRenderFromProskomma } from 'proskomma-json-tools';
    import { thaw } from 'proskomma-freeze';
    import {
        audioHighlight,
        refs,
        scrolls,
        audioActive,
        mainScroll,
        bodyFontSize,
        bodyLineHeight,
        loadedDocsets
    } from '$lib/data/stores';

    import { LoadingIcon } from '../icons';
    import { root } from 'postcss';

    const pk = new Proskomma();
    let container: HTMLElement;
    const seprgx = /(\.|\?|!|:|;|,|')/g;

    const onlySpaces = (str) => {
        return str.trim().length === 0;
    };

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
        console.log('parsePhrase %o %o', inner, phrases);
        return phrases;
    };
    const startPhrase = (workspace, indexOption = 'advance') => {
        const fnc = 'abcdefghijklmnopqrstuvwxyz';
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
        const div = document.createElement('div');
        const phraseIndex = fnc.charAt(workspace.currentPhraseIndex);
        div.id = workspace.currentVerse + phraseIndex;
        div.setAttribute('data-verse', workspace.currentVerse);
        div.setAttribute('data-phrase', phraseIndex);
        div.classList.add('txs', 'seltxt', 'scroll-item');
        return div.cloneNode(true);
    };
    const addText = (workspace, append = true) => {
        if (!onlySpaces(workspace.text)) {
            const phrases = parsePhrase(workspace.text);
            for (let i = 0; i < phrases.length; i++) {
                const div = workspace.phraseDiv.cloneNode(true);
                const phrase = phrases[i];
                const textNode = document.createTextNode(phrase);
                div.appendChild(textNode);
                if (append || i < phrases.length - 1) {
                    workspace.paragraphDiv.appendChild(div.cloneNode(true));
                    workspace.phraseDiv = startPhrase(workspace);
                } else {
                    workspace.phraseDiv = div;
                }
            }
        }
        workspace.text = '';
        return;
    };

    let bookRoot = document.createElement('div');
    console.log('START: %o', bookRoot);
    let loading = true;
    const output = {};
    const query = async (docSet: string, bookCode: string, chapter: string) => {
        loading = true;
        console.log('PARMS: bc: %o, chapter: %o, collection: %o', bookCode, chapter, docSet);
        const docslist = await pk.gqlQuery('{docSets { id } }');
        console.log('LIST %o', docslist);
        let found = false;
        for (const doc of docslist.data.docSets) {
            console.log('ID: %o', doc.id);
            if (doc.id === docSet) {
                console.log('Found');
                found = true;
                break;
            }
        }
        if (!$loadedDocsets.includes(docSet)) {
            $loadedDocsets.push(docSet);
            const res = await fetch(`collections/${docSet}.pkf`).then((r) => {
                return r.text();
            });
            if (res.length) {
                await thaw(pk, res);
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
                            console.log(
                                'Start Document: %o, %o',
                                context,
                                context.document.metadata.document
                            );
                            bookRoot.replaceChildren();
                            workspace.root = bookRoot;
                            workspace.text = '';
                            workspace.footnoteIndex = 0;
                            workspace.firstVerse = true;
                            workspace.currentVerse = 'none';
                            workspace.currentPhraseIndex = 0;
                            workspace.introductionGraft = false;
                            workspace.paragraphDiv = document.createElement('div');
                            workspace.titleBlockDiv = document.createElement('div');
                            workspace.phraseDiv = document.createElement('div');
                            workspace.subheaders = [];
                        }
                    }
                ],
                startParagraph: [
                    {
                        description: 'Start HTML para with appropriate class',
                        test: () => true,
                        action: ({ context, workspace }) => {
                            console.log(
                                'Start Paragraph %o %o',
                                context.sequences[0].block,
                                context.sequences[0].type
                            );
                            if (!workspace.introductionGraft) {
                                const sequenceType = context.sequences[0].type;
                                var paraClass =
                                    context.sequences[0].block.subType.split(':')[1] ||
                                    context.sequences[0].block.subType;
                                if (sequenceType === 'main') {
                                    if (workspace.firstVerse == true) {
                                        paraClass = 'm';
                                        workspace.firstVerse = false;
                                    }
                                    workspace.paragraphDiv = document.createElement('div');
                                    workspace.paragraphDiv.classList.add(paraClass);
                                    if (workspace.currentVerse != 'none') {
                                        workspace.phraseDiv = startPhrase(workspace, 'keep');
                                        console.log(
                                            'Paragraph Start phrase: %o',
                                            workspace.phraseDiv
                                        );
                                    }
                                } else {
                                    //NO workspace.htmlBits.push(`<div class="${paraClass}">`)
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
                            console.log('End paragraph: Sequence type ' + sequenceType);
                            console.log(
                                'End Paragraph %o %o',
                                context.sequences[0].block,
                                context.sequences[0].type
                            );
                            if (!workspace.introductionGraft) {
                                if (sequenceType == 'main') {
                                    // Build div
                                    console.log('End Paragaph text:' + workspace.text);
                                    if (workspace.currentVerse != 'none') {
                                        console.log('END PHRASE: P');
                                        console.log('PHRASE: ' + workspace.text);
                                        addText(workspace);
                                        console.log('OUT: %o ', workspace.paragraphDiv);
                                    }
                                    workspace.root.appendChild(workspace.paragraphDiv);
                                } else if (sequenceType == 'title') {
                                    console.log('End paragraph title text:' + workspace.text);
                                    const div = document.createElement('div');
                                    var paraClass =
                                        context.sequences[0].block.subType.split(':')[1] ||
                                        context.sequences[0].block.subType;
                                    div.classList.add(paraClass);
                                    const span = document.createElement('span');
                                    span.classList.add(paraClass);
                                    span.innerText = workspace.text;
                                    div.appendChild(span);
                                    workspace.titleBlockDiv.appendChild(div);
                                    workspace.text = '';
                                } else if (sequenceType == 'heading') {
                                    console.log('Header text: ' + workspace.text);
                                    const div = document.createElement('div');
                                    var paraClass =
                                        context.sequences[0].block.subType.split(':')[1] ||
                                        context.sequences[0].block.subType;
                                    div.classList.add(paraClass);
                                    const prefix = paraClass.replaceAll(/[0-9]/g, '');
                                    workspace.subheaders.push(prefix);
                                    const count = countSubheadingPrefixes(
                                        workspace.subheaders,
                                        prefix
                                    );
                                    const innerDiv = document.createElement('div');
                                    innerDiv.id = prefix + count;
                                    innerDiv.innerText = workspace.text;
                                    div.appendChild(innerDiv);
                                    workspace.root.appendChild(div);
                                    workspace.text = '';
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
                            console.log(
                                'Text element: %o %o %o',
                                context.sequences[0].element.type,
                                context.sequences[0].element.text,
                                context.sequences[0].block
                            );
                            if (!workspace.introductionGraft) {
                                const blockType = context.sequences[0].block.subType;
                                if (blockType.includes('usfm:x') || blockType.includes('usfm:f')) {
                                    // Graft Text
                                } else if (blockType.includes('usfm:ip')) {
                                    // Introduction
                                } else {
                                    if (!workspace.introduction) {
                                        workspace.text += context.sequences[0].element.text;
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
                            console.log(
                                'Mark: SubType %o, Atts: %o',
                                element.subType,
                                element.atts
                            );
                            if (element.subType === 'chapter_label') {
                                const div = document.createElement('div');
                                div.classList.add('c-drop');
                                div.innerText = element.atts['number'];
                                workspace.paragraphDiv.appendChild(div);
                                //                                    workspace.htmlBits.push(`<div class="c-drop"> ${element.atts['number']}</div>\n`);
                            } else if (element.subType === 'verses_label') {
                                var spanV = document.createElement('span');
                                spanV.classList.add('v');
                                spanV.innerText = element.atts['number'];
                                var spanVsp = document.createElement('span');
                                spanVsp.classList.add('vsp');
                                spanVsp.innerText = '\u00A0'; // &nbsp
                                var div = workspace.phraseDiv.cloneNode(true);
                                div.appendChild(spanV.cloneNode(true));
                                div.appendChild(spanVsp.cloneNode(true));
                                console.log('OUT: %o %o %o', div, spanV, spanVsp);
                                workspace.phraseDiv = div.cloneNode(true);
                            }
                        }
                    }
                ],
                endDocument: [
                    {
                        description: 'Set up',
                        test: () => true,
                        action: ({ context, workspace, output }) => {
                            console.log('End Document');
                        }
                    }
                ],
                startSequence: [
                    {
                        description: 'Start Sequence',
                        test: () => true,
                        action: ({ context, workspace }) => {
                            const sequenceType = context.sequences[0].type;
                            console.log('start sequence %o', sequenceType);
                            if (!workspace.introductionGraft) {
                                if (sequenceType === 'title') {
                                    const div = document.createElement('div');
                                    div.setAttribute('data-verse', 'title');
                                    div.setAttribute('data-phrase', 'none');
                                    div.classList.add('scroll-item');
                                    workspace.titleBlockDiv = div;
                                } else if (sequenceType === 'heading') {
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
                            console.log('End sequence |%o|', sequenceType);
                            if (!workspace.introductionGraft) {
                                if (sequenceType === 'title') {
                                    const div = workspace.titleBlockDiv;
                                    div.innerHTML += `<div class="b"></div><div class="b"></div>`;
                                    console.log('TITLE DIV %o', div);
                                    workspace.root.append(div);
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
                            console.log('Block Graft %o', environment.context.sequences[0].block);
                            const currentBlock = environment.context.sequences[0].block;
                            const graftRecord = {
                                type: currentBlock.type,
                                sequence: {}
                            };
                            if (currentBlock.subType === 'introduction') {
                                environment.workspace.introductionGraft = true;
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
                                environment.workspace.introductionGraft = false;
                            }
                            console.log('Block Graft 2 %o %o', graftRecord, currentBlock);
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
                            console.log(
                                'Inline Graft Type: %o, Subtype: %o, id: %o %o',
                                element.type,
                                element.subType,
                                element.sequence.id,
                                environment.context.sequences[0].element
                            );
                            const graftRecord = {
                                type: element.type,
                                subtype: element.subType,
                                sequence: {}
                            };
                            if (element.subType === 'xref' || element.subType === 'footnote') {
                                console.log('PHRASE G: ' + workspace.text);
                                addText(workspace, false);
                                const div = workspace.phraseDiv.cloneNode(true);
                                console.log('Footnote or xref');
                                const span = document.createElement('span');
                                span.setAttribute('data-graft', `X-${workspace.footnoteIndex + 1}`);
                                span.classList.add('footnote');
                                const a = document.createElement('a');
                                const sup = document.createElement('sup');
                                sup.innerHTML = fnc.charAt(workspace.footnoteIndex);
                                a.appendChild(sup);
                                span.appendChild(a);
                                div.appendChild(span);
                                workspace.paragraphDiv.appendChild(div.cloneNode(true));
                                workspace.footnoteIndex++;
                                workspace.phraseDiv = startPhrase(workspace);
                            }
                            const cachedSequencePointer = workspace.currentSequence;
                            workspace.currentSequence = graftRecord.sequence;
                            environment.context.renderer.renderSequence(environment);
                            workspace.currentSequence = cachedSequencePointer;
                            console.log('Inline Graft End');
                        }
                    }
                ],
                startWrapper: [
                    {
                        description: 'Start Wrapper',
                        test: () => true,
                        action: ({ context, workspace }) => {
                            console.log('Start Wrapper %o', context.sequences[0].element);
                            let element = context.sequences[0].element;
                            if (element.subType === 'verses') {
                                workspace.currentVerse = element.atts.number;
                                workspace.phraseDiv = startPhrase(workspace, 'reset');
                                console.log('IN: %o', workspace.phraseDiv);
                            }
                        }
                    }
                ],
                endWrapper: [
                    {
                        description: 'End Wrapper',
                        test: () => true,
                        action: ({ context, workspace }) => {
                            console.log('End Wrapper %o', context.sequences[0].element);
                            let element = context.sequences[0].element;
                            if (element.subType === 'verses') {
                                if (!onlySpaces(workspace.text)) {
                                    console.log('PHRASE: ' + workspace.text);
                                    addText(workspace);
                                    console.log('OUT: %o ', workspace.paragraphDiv);
                                }
                                console.log('END PHRASE: V');
                                workspace.currentVerse = 'none';
                            }
                        }
                    }
                ],
                startMilestone: [
                    {
                        description: 'Start Milestone',
                        test: () => true,
                        action: ({ context }) => {
                            console.log('Start Milestone: %o', context.sequences[0].element);
                        }
                    }
                ],
                endMilestone: [
                    {
                        description: 'End Milestone',
                        test: () => true,
                        action: ({ context }) => {
                            console.log('End Milestone %o', context.sequences[0].element);
                        }
                    }
                ]
            },
            debugLevel: 0
        });
        const docsResult = pk.gqlQuerySync(
            '{documents { docSetId id bookCode: header(id: "bookCode")} }'
        );
        console.log('docsResult %o', docsResult);
        const bookLookup = {};
        for (const docRecord of docsResult.data.documents) {
            if (docRecord.docSetId === docSet) {
                bookLookup[docRecord.bookCode] = docRecord.id;
            }
        }
        const docId = bookLookup[bookCode];
        cl.renderDocument({ docId, config: { chapters: [chapter] }, output });
        loading = false;
        console.log('DONE %o', root);
    };

    $: fontSize = $bodyFontSize + 'px';

    $: lineHeight = $bodyLineHeight + '%';

    $: (() => {
        const bookCode = $refs.book;
        const chapter = $refs.chapter;
        const docSet = $refs.docSet;
        query(docSet, bookCode, chapter);
    })();
</script>

<article class="prose container mx-auto" bind:this={container}>
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
