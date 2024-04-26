<!--
  @component
  Daisy UI Stack View component
-->

<script>
    import { footnotes, getVerseText, refs, themeColors } from '$lib/data/stores';

    import config from '$lib/data/config';
    import { isNotBlank, splitString } from '$lib/scripts/stringUtils';
    import { handleHeaderLinkPressed } from '$lib/scripts/scripture-reference-utils';
    export let bodyFontSize;
    export let bodyLineHeight;
    export let font;
    let stack;
    let listening = false;
    $: PrimaryColor = $themeColors['PrimaryColor'];

    function clickOutside(event) {
        if (!stack.contains(event.target)) {
            footnotes.pop();
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

    const openInNewIcon = () => {
        return `<svg fill='${PrimaryColor}' xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24"><path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h280v80H200v560h560v-280h80v280q0 33-23.5 56.5T760-120H200Zm188-212-56-56 372-372H560v-80h280v280h-80v-144L388-332Z"/></svg>`;
    };
    // handles clicks on in text markdown reference links
    function referenceLinkClickHandler(event) {
        const linkRef = event.target.getAttribute('ref');
        const splitRef = splitString(linkRef, '.');
        const splitSet = splitRef[0];
        const refBook = splitRef[1];
        const splitChapter = splitRef[2];
        const splitVerse = splitRef[3];

        let refDocSet = refs.docSet;
        const refBc = config.bookCollections.find((x) => x.id === splitSet);
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
    async function insideClick(event) {
        if (event.target.hasAttribute('data-start-ref')) {
            let start = JSON.parse(event.target.getAttribute('data-start-ref'));
            let end =
                event.target.getAttribute('data-end-ref') === 'undefined'
                    ? undefined
                    : JSON.parse(event.target.getAttribute('data-end-ref'));
            if (config.mainFeatures['scripture-refs-display-from-popup'] === 'viewer') {
                navigate(start);
            } else {
                const footnoteHTML = await handleHeaderLinkPressed(start, end, themeColors);
                footnotes.push(footnoteHTML);
            }
        } else if (event.target.classList.contains('ref-link')) {
            referenceLinkClickHandler(event);
            // will not work since it does not have a reference to the start object...
        } else if (document.getElementById('icon')?.contains(event.target)) {
            let start = JSON.parse(
                document.getElementById('icon').firstChild.getAttribute('reference')
            );
            navigate(start);
        }
    }

    function toggleListener(footnotes) {
        if (listening && footnotes.length === 0) {
            document.removeEventListener('click', clickOutside);
            listening = false;
        } else if (!listening && footnotes.length > 0) {
            document.addEventListener('click', clickOutside);
            listening = true;
        }
    }
    $: toggleListener($footnotes);

    $: fontSize = bodyFontSize + 'px';

    $: lineHeight = bodyLineHeight + '%';
</script>

<!--
  ToDo: 
  - make width of scripture view
-->
<div bind:this={stack} class="absolute max-w-screen-md w-5/6 bottom-8 dy-stack">
    {#each $footnotes as item}
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <!-- svelte-ignore a11y-no-static-element-interactions -->
        <div
            id="container"
            class="footnote rounded h-40 drop-shadow-lg overflow-y-auto"
            on:click|stopPropagation={insideClick}
        >
            <div
                id="container" 
                class="footnote"
                style:font-family={font}
                style:font-size={fontSize}
                style:line-height={lineHeight}
            >{@html item}</div>
        </div>
    {/each}
</div>
