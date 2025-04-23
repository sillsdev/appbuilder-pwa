<script>
    import config from '$lib/data/config';
    import { convertStyle } from '$lib/data/stores';
    import { initializeDatabase } from '$lib/data/stores/lexicon';
    import {
        selectedLanguageStore,
        vernacularLanguageStore,
        vernacularWordsStore
    } from '$lib/data/stores/lexicon.ts';
    import { afterUpdate, onMount } from 'svelte';
    import { get } from 'svelte/store';

    export let wordIds;
    export let onSelectWord;

    let xmlData = '';

    async function queryXmlByWordId(wordIds) {
        try {
            let db = await initializeDatabase({ fetch });

            let results;
            const dynamicQuery = wordIds.map(() => `id = ?`).join(' OR ');
            const dynamicParams = wordIds.map((id) => id);
            results = db.exec(`SELECT xml FROM entries WHERE ${dynamicQuery}`, dynamicParams);
            console.log('results:', results[0].values);

            return results[0].values;
        } catch (error) {
            console.error(`Error querying XML for word IDs ${wordIds}:`, error);
            return null;
        }
    }

    function formatXmlByClass(xmlString) {
        if (!xmlString) return '';

        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlString, 'text/xml');

        // Check if parsing failed
        const parseError = xmlDoc.querySelector('parsererror');
        if (parseError) {
            console.error('XML parsing error:', parseError.textContent);
            return `<span class="text-error">Error parsing XML: Invalid format</span>`;
        }

        function processNode(node, parentHasSenseNumber = false) {
            let output = '';

            if (node.nodeType === Node.TEXT_NODE) {
                return node.nodeValue.trim() ? node.nodeValue + ' ' : '';
            }

            if (node.nodeType === Node.ELEMENT_NODE) {
                let className = node.getAttribute('class') || '';
                let isSenseNumber = className.includes('sensenumber');

                let parentContainsSenseNumber =
                    parentHasSenseNumber ||
                    [...node.parentNode.children].some(
                        (child) =>
                            child.getAttribute &&
                            (child.getAttribute('class') || '').includes('sensenumber')
                    );

                if (node.tagName === 'a' && node.hasAttribute('href')) {
                    const href = node.getAttribute('href');
                    const match = href.match(/E-(\d+)/); // Extract index number
                    if (match) {
                        const index = parseInt(match[1], 10); // Extracted number as integer
                        const wordObject = get(vernacularWordsStore).find(
                            (item) => item.id === index
                        );
                        const word = wordObject ? wordObject.name : 'Unknown'; // Fallback if not found
                        const homonymIndex = wordObject ? wordObject.homonym_index : 1; // Default to 1 if not found

                        let linkText = node.textContent.trim();

                        // If the text inside the link matches the homonym index, use the homonym index as the text
                        if (linkText === String(homonymIndex)) {
                            linkText = homonymIndex.toString();
                        }

                        output += `<span class="clickable cursor-pointer" data-word="${word}" data-index="${index}" data-homonym="${homonymIndex}">${linkText}</span>`;
                        return output;
                    }
                } else {
                    output += '<' + node.tagName;
                    for (let attr of node.attributes) {
                        output += ` ${attr.name}="${attr.value}"`;
                    }
                    output += '>';

                    for (let child of node.childNodes) {
                        output += processNode(child, parentContainsSenseNumber || isSenseNumber);
                    }

                    output += `</${node.tagName}>`;
                }
            }

            return output;
        }

        return processNode(xmlDoc.documentElement);
    }

    async function updateXmlData() {
        if (!wordIds) {
            xmlData = '';
            return;
        }

        let xmlResults = await queryXmlByWordId(wordIds);

        // Insert an `<hr>` tag or a visible separator between entries
        xmlData =
            xmlResults
                .filter((xml) => xml) // Ensure no null values are included
                .map(formatXmlByClass)
                .join('\n<hr>\n') + '\n<hr>\n'; // `<hr>` adds a visible line between entries
    }

    function attachEventListeners() {
        const spans = document.querySelectorAll('.clickable');

        spans.forEach((span) => {
            const oldSpan = span.cloneNode(true);
            span.parentNode.replaceChild(oldSpan, span);
        });

        const freshSpans = document.querySelectorAll('.clickable');
        freshSpans.forEach((span) => {
            span.addEventListener('click', () => {
                selectedLanguageStore.set(get(vernacularLanguageStore));
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
        for (let stl of config.singleEntryStyles) {
            for (let elm of document.querySelectorAll(stl.name)) {
                elm.style = convertStyle(stl.properties);
            }
        }
    }

    onMount(updateXmlData);

    $: if (wordIds) {
        (async () => {
            await updateXmlData();
            applyStyles();
            attachEventListeners();
        })();
    }
</script>

<pre class="p-4 whitespace-pre-wrap break-words">{@html xmlData}</pre>
