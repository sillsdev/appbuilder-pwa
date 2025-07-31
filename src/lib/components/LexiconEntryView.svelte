<script>
    import config from '$lib/data/config';
    import { lexicon } from '$lib/data/lexicon.svelte';
    import { convertStyle } from '$lib/data/stores';

    let { wordIds, onSelectWord, removeNewLines = false } = $props();

    function attachEventListeners() {
        const spans = document.querySelectorAll('.clickable');

        spans.forEach((span) => {
            const oldSpan = span.cloneNode(true);
            span.parentNode.replaceChild(oldSpan, span);
        });

        const freshSpans = document.querySelectorAll('.clickable');
        freshSpans.forEach((span) => {
            span.addEventListener('click', () => {
                lexicon.setLanguage();
                const word = span.getAttribute('data-word');
                const index = parseInt(span.getAttribute('data-index'), 10);
                const homonym_index = parseInt(span.getAttribute('data-homonym'), 10);

                onSelectWord({
                    word,
                    index,
                    homonym_index
                });
            });
        });
    }

    function applyStyles() {
        // Apply styles from config
        for (let stl of config.singleEntryStyles) {
            for (let elm of document.querySelectorAll(stl.name)) {
                let styleString = convertStyle(stl.properties);

                if (removeNewLines) {
                    styleString = styleString.replace(/display:\s*block/g, 'display: inline');
                }

                elm.style = styleString;
            }
        }

        // Fix legacy sensecontent indentation
        const senseEls = document.querySelectorAll('.sensecontent');
        senseEls.forEach((el) => {
            let style = el.getAttribute('style') || '';

            const hasLegacyIndent =
                style.includes('text-indent: -2em') && style.includes('margin-left: 4em');

            if (hasLegacyIndent) {
                let cleaned = style
                    .replace(/text-indent:\s*-2em;?/g, '')
                    .replace(/margin-left:\s*4em;?/g, '')
                    .trim();

                if (cleaned && !cleaned.endsWith(';')) {
                    cleaned += ';';
                }
                cleaned += ' margin-left: -1.1em;';

                style = cleaned;
            }

            if (removeNewLines) {
                style = style.replace(/display:\s*block/g, 'display: inline');
            }

            el.setAttribute('style', style.trim());
        });
    }

    let xmlData = $derived(lexicon.data());

    const updateDOM = (_element) => {
        applyStyles();
        attachEventListeners();
    };
</script>

{#await lexicon.search(wordIds) then}
    <!-- prettier-ignore-attribute -->
    <pre
        class="p-4 whitespace-pre-wrap break-words"
        style="background-color: var(--BackgroundColor); color: var(--TextColor);">

        <div {@attach updateDOM}>
            {@html xmlData}
        </div>
    </pre>
{/await}
