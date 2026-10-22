<!--
  @component
  Daisy UI Stack View component
-->

<script lang="ts">
    import config, { scriptureConfig } from '$assets/config';
    import {
        convertStyle,
        footnotes,
        refs,
        s,
        themeColors,
        type FootnoteItem
    } from '$lib/data/stores';
    import { navigateToText } from '$lib/navigate';
    import type { AnchorReference } from '$lib/scripts/scripture-reference-utils';
    import { splitString } from '$lib/scripts/stringUtils';
    import ScriptureViewProskomma from './ScriptureViewProskomma.svelte';

    interface Props {
        bodyFontSize: number | string;
        bodyLineHeight: number | string;
        font?: string;
        onNavigate?: () => void;
    }

    let { bodyFontSize, bodyLineHeight, font, onNavigate }: Props = $props();

    let stack: HTMLDivElement | undefined = $state();
    let listening = false;
    const PrimaryColor = $derived($themeColors['PrimaryColor']);

    function clickOutside(event: Event) {
        if (event.target && stack && !stack.contains(event.target as HTMLElement)) {
            footnotes.pop();
        }
    }

    function navigate(reference: AnchorReference) {
        footnotes.reset();
        navigateToText({
            docSet: reference.docSet,
            collection: reference.collection,
            book: reference.book,
            chapter: reference.chapter,
            verse: reference.verse
        }).then(() => onNavigate?.());
    }

    const openInNewIcon = () => {
        return `<svg fill='${PrimaryColor}' xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24"><path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h280v80H200v560h560v-280h80v280q0 33-23.5 56.5T760-120H200Zm188-212-56-56 372-372H560v-80h280v280h-80v-144L388-332Z"/></svg>`;
    };
    // handles clicks on in text markdown reference links
    function referenceLinkClickHandler(target: HTMLElement) {
        const linkRef = target.getAttribute('ref') ?? '';
        const splitRef = splitString(linkRef, '.');
        const splitSet = splitRef[0];
        const refBook = splitRef[1];
        const splitChapter = splitRef[2];
        const splitVerse = splitRef[3];

        let refDocSet = $refs.docSet;
        const refBc = scriptureConfig.bookCollections?.find((x) => x.id === splitSet);
        if (refBc) {
            refDocSet = refBc.languageCode + '_' + refBc.id;
        } else {
            // Invalid collection
            return;
        }
        refs.set({ docSet: refDocSet, book: refBook, chapter: splitChapter, verse: splitVerse });
        footnotes.reset();
        return;
    }
    async function insideClick(target: HTMLElement, item: FootnoteItem) {
        const closest = target.closest('#icon')?.querySelector('[data-reference]');
        if (target.hasAttribute('data-start-ref')) {
            let start = JSON.parse(target.getAttribute('data-start-ref') || '{}');
            let end =
                target.getAttribute('data-end-ref') === 'undefined'
                    ? undefined
                    : JSON.parse(target.getAttribute('data-end-ref') || '{}');
            if (config.mainFeatures['scripture-refs-display-from-popup'] === 'viewer') {
                navigate(start);
            } else {
                footnotes.push({
                    type: 'rich',
                    style: 'crossref',
                    props: item.props,
                    start,
                    end
                });
            }
        } else if (target.classList.contains('ref-link')) {
            referenceLinkClickHandler(target);
            // will not work since it does not have a reference to the start object...
        } else if (closest) {
            navigate(JSON.parse(closest.getAttribute('data-reference') || '{}'));
        }
    }

    function toggleListener(footnotes: unknown[]) {
        if (listening && footnotes.length === 0) {
            document.removeEventListener('click', clickOutside);
            listening = false;
        } else if (!listening && footnotes.length > 0) {
            document.addEventListener('click', clickOutside);
            listening = true;
        }
    }

    $effect(() => toggleListener($footnotes));

    const fontSize = $derived(bodyFontSize + 'px');

    const lineHeight = $derived(bodyLineHeight + '%');
</script>

<!--
  ToDo:
  - make width of scripture view
-->
{#if $footnotes.length > 0}
    <div class="flex justify-center">
        <div bind:this={stack} class="absolute max-w-breakpoint-md w-5/6 h-40 bottom-8 dy-stack">
            {#each $footnotes as item}
                <!-- svelte-ignore a11y_click_events_have_key_events -->
                <!-- svelte-ignore a11y_no_static_element_interactions -->
                <div
                    id="container"
                    class="footnote place-self-center rounded-sm h-40 shadow-lg overflow-y-auto"
                    onclick={(e) => {
                        e.stopPropagation();
                        insideClick((e.target || e.currentTarget) as HTMLElement, item);
                    }}
                >
                    <div
                        id="container"
                        class="footnote"
                        style:font-family={font}
                        style:font-size={fontSize}
                        style:line-height={lineHeight}
                        style={convertStyle($s?.[`body.${item.style}`])}
                    >
                        {#if item.type === 'plain'}
                            <!-- eslint-disable-next-line svelte/no-at-html-tags -->
                            {@html item.body}
                        {:else if item.type === 'rich'}
                            <div class="flex flex-row justify-space-between">
                                <div class="grow">
                                    <span class="xo">
                                        {item.start.phrase}
                                    </span>
                                    <span>
                                        <ScriptureViewProskomma
                                            {...item.props}
                                            references={{
                                                ...item.start,
                                                collection: item.props.references.collection,
                                                bookTab: 0,
                                                hasAudio: undefined,
                                                catalog: item.props.references.catalog
                                            }}
                                            verseRange={{
                                                start: Number(item.start.verse),
                                                end:
                                                    item.end?.chapter !== item.start.chapter
                                                        ? Object.keys(
                                                              item.props.references.catalog.documents.find(
                                                                  (d) =>
                                                                      d.bookCode === item.start.book
                                                              )?.versesByChapters[
                                                                  item.start.chapter
                                                              ] ?? {}
                                                          )
                                                              .map((k) => Number(k))
                                                              .reduce(
                                                                  (max, c) => (c > max ? c : max),
                                                                  0
                                                              ) || undefined
                                                        : item.end?.verse
                                                          ? Number(item.end.verse)
                                                          : undefined
                                            }}
                                            maxSelections={0}
                                        />
                                    </span>
                                </div>
                                <div id="icon">
                                    <!-- svelte-ignore a11y_consider_explicit_label -->
                                    <button class="p-2" data-reference={JSON.stringify(item.start)}>
                                        <!-- eslint-disable-next-line svelte/no-at-html-tags -->
                                        {@html openInNewIcon()}
                                    </button>
                                </div>
                            </div>
                        {/if}
                    </div>
                </div>
            {/each}
        </div>
    </div>
{/if}
