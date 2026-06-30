<!--
  @component
  Daisy UI Stack View component
-->

<script lang="ts">
    import config, { scriptureConfig } from '$assets/config';
    import { footnotes, refs, themeColors } from '$lib/data/stores';
    import type { Reference } from '$lib/data/stores/reference';
    import { handleHeaderLinkPressed } from '$lib/scripts/scripture-reference-utils';
    import { splitString } from '$lib/scripts/stringUtils';

    interface Props {
        bodyFontSize: number | string;
        bodyLineHeight: number | string;
        font?: string;
    }

    let { bodyFontSize, bodyLineHeight, font }: Props = $props();

    let stack: HTMLDivElement;
    let listening = false;
    const PrimaryColor = $derived($themeColors['PrimaryColor']);

    function clickOutside(event: Event) {
        if (event.target && !stack.contains(event.target as HTMLElement)) {
            footnotes.pop();
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

    const openInNewIcon = () => {
        return `<svg fill='${PrimaryColor}' xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24"><path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h280v80H200v560h560v-280h80v280q0 33-23.5 56.5T760-120H200Zm188-212-56-56 372-372H560v-80h280v280h-80v-144L388-332Z"/></svg>`;
    };
    // handles clicks on in text markdown reference links
    function referenceLinkClickHandler(target: HTMLElement) {
        console.warn(`Reference link clicked -> ${target}`);
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
    async function insideClick(target: HTMLElement) {
        console.log(`inside click registered on ${target}`);
        console.log(`target has classes ${target.classList.toString()}`);
        if (target.hasAttribute('data-start-ref')) {
            let start = JSON.parse(target.getAttribute('data-start-ref') || '{}');
            let end =
                target.getAttribute('data-end-ref') === 'undefined'
                    ? undefined
                    : JSON.parse(target.getAttribute('data-end-ref') || '{}');
            if (config.mainFeatures['scripture-refs-display-from-popup'] === 'viewer') {
                navigate(start);
            } else {
                console.log('Creating inner footer?');
                const footnoteHTML = await handleHeaderLinkPressed(start, end, themeColors);
                footnotes.push(footnoteHTML);
            }
        } else if (target.classList.contains('ref-link')) {
            referenceLinkClickHandler(target);
            // will not work since it does not have a reference to the start object...
        } else if (document.getElementById('icon')?.contains(target)) {
            let start = JSON.parse(
                document.getElementById('icon')?.firstElementChild?.getAttribute('reference') ||
                    '{}'
            );
            navigate(start);
        }
    }

    function toggleListener(footnotes: string[]) {
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
    <div bind:this={stack} class="absolute max-w-breakpoint-md w-5/6 h-40 bottom-8 dy-stack">
        {#each $footnotes as item}
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <div
                id="container"
                class="footnote rounded-sm h-40 shadow-lg overflow-y-auto"
                onclick={(e) => {
                    e.stopPropagation();
                    insideClick((e.target || e.currentTarget) as HTMLElement);
                }}
            >
                <div
                    id="container"
                    class="footnote"
                    style:font-family={font}
                    style:font-size={fontSize}
                    style:line-height={lineHeight}
                >
                    <!-- eslint-disable-next-line svelte/no-at-html-tags -->
                    {@html item}
                </div>
            </div>
        {/each}
    </div>
{/if}
