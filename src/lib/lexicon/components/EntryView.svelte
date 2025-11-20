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
    export let removeNewLines = false;

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

        const parseError = xmlDoc.querySelector('parsererror');
        if (parseError) {
            console.error('XML parsing error:', parseError.textContent);
            return `<span class="text-error" style="background-color: var(--BackgroundColor);">Error parsing XML: Invalid format</span>`;
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

                const addStyle =
                    node.tagName === 'span' ||
                    className === 'clickable cursor-pointer' ||
                    (node.tagName === 'div' && className === 'entry');

                if (node.tagName === 'a' && node.hasAttribute('href')) {
                    const href = node.getAttribute('href');
                    const match = href.match(/E-(\d+)/);
                    if (match) {
                        const index = parseInt(match[1], 10);
                        const wordObject = get(vernacularWordsStore).find(
                            (item) => item.id === index
                        );
                        const word = wordObject ? wordObject.name : 'Unknown';
                        const homonymIndex = wordObject ? wordObject.homonym_index : 1;

                        let linkText = node.textContent.trim();

                        if (linkText === String(homonymIndex)) {
                            linkText = homonymIndex.toString();
                        }

                        output += `<span class="clickable cursor-pointer" style="background-color: var(--BackgroundColor);" data-word="${word}" data-index="${index}" data-homonym="${homonymIndex}">${linkText}</span>`;
                    }
                } else {
                    output += `<${node.tagName}`;
                    for (let attr of node.attributes) {
                        output += ` ${attr.name}="${attr.value}"`;
                    }

                    // Add appropriate styling based on class name
                    if (className.includes('sensenumber')) {
                        output += ` style="color: var(--TextColor); font-weight: bold;"`;
                    } else if (className.includes('vernacular')) {
                        output += ` style="color: var(--TextColor2);"`;
                    } else if (className.includes('example')) {
                        output += ` style="color: var(--TextColor3); font-style: italic;"`;
                    } else if (className.includes('definition')) {
                        output += ` style="color: var(--TextColor); font-weight: normal;"`;
                    }

                    if (addStyle) {
                        output += ` style="background-color: var(--BackgroundColor); color: var(--TextColor);"`;
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
                .join('\n<hr style="border-color: var(--SettingsSeparatorColor);">\n') +
            '\n<hr style="border-color: var(--SettingsSeparatorColor);">\n';
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

                if (cleaned && !cleaned.endsWith(';')) cleaned += ';';
                cleaned += ' margin-left: -1.1em;';

                style = cleaned;
            }

            if (removeNewLines) {
                style = style.replace(/display:\s*block/g, 'display: inline');
            }

            el.setAttribute('style', style.trim());
        });
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

<pre
    class="p-4 whitespace-pre-wrap break-words"
    style="background-color: var(--BackgroundColor); color: var(--TextColor);">{@html xmlData}</pre>
