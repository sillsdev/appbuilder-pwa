<script>
    import { base } from '$app/paths';
    import config from '$lib/data/config';
    import { convertStyle } from '$lib/data/stores';
    import initSqlJs from 'sql.js';
    import { afterUpdate, onMount } from 'svelte';

    export let selectedWord;
    export let vernacularWordsList;
    export let vernacularLanguage;
    export let onSelectWord;
    export let onSwitchLanguage;

    let xmlData = '';

    let singleEntryStyles = config.singleEntryStyles;

    async function queryXmlByWordId(wordId) {
        try {
            const SQL = await initSqlJs({
                locateFile: (file) => `${base}/wasm/sql-wasm.wasm`
            });

            const response = await fetch(`${base}/data.sqlite`);
            if (!response.ok) {
                throw new Error(
                    `Failed to fetch database: ${response.status} ${response.statusText}`
                );
            }
            const buffer = await response.arrayBuffer();
            const db = new SQL.Database(new Uint8Array(buffer));
            if (!db) {
                console.error('Database not initialized');
                return null;
            }

            const stmt = db.prepare('SELECT xml FROM entries WHERE id = ?');
            stmt.bind([wordId]);

            let result = null;
            if (stmt.step()) {
                result = stmt.getAsObject().xml;
            }
            stmt.free();
            db.close();

            return result;
        } catch (error) {
            console.error(`Error querying XML for word ID ${wordId}:`, error);
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
                        const wordObject = vernacularWordsList.find((item) => item.id === index);
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
        if (
            !selectedWord ||
            (!selectedWord.index && (!selectedWord.indexes || selectedWord.indexes.length === 0))
        ) {
            xmlData = '';
            return;
        }

        let wordIds = selectedWord.indexes ? selectedWord.indexes : [selectedWord.index];
        let xmlResults = await Promise.all(wordIds.map(queryXmlByWordId));

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
                onSwitchLanguage(vernacularLanguage);
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
        for (let stl of singleEntryStyles) {
            for (let elm of document.querySelectorAll(stl.name)) {
                elm.style = convertStyle(stl.properties);
            }
        }
    }

    onMount(updateXmlData);

    afterUpdate(() => {
        updateXmlData();
        applyStyles();
        attachEventListeners();
    });
</script>

<pre class="p-4 whitespace-pre-wrap break-words min-w-[100vw]">{@html xmlData}</pre>
