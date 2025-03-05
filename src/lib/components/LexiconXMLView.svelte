<script>
    import { base } from '$app/paths';
    import initSqlJs from 'sql.js';
    import { afterUpdate, onMount } from 'svelte';

    export let selectedWord;
    let xmlData = '';

    async function queryXmlByWordId(wordId) {
        const SQL = await initSqlJs({
            locateFile: (file) => `${base}/wasm/sql-wasm.wasm`
        });

        const response = await fetch(`${base}/data.sqlite`);
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

        return result;
    }

    function formatXmlByClass(xmlString) {
        if (!xmlString) return '';

        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlString, 'text/xml');

        function processNode(node, parentHasSenseNumber = false) {
            let output = '';

            if (node.nodeType === Node.TEXT_NODE) {
                return node.nodeValue.trim() ? node.nodeValue + ' ' : '';
            }

            if (node.nodeType === Node.ELEMENT_NODE) {
                let className = node.getAttribute('class') || '';
                let isSenseNumber = className.includes('sensenumber');
                let isDefinitionOrGloss = className.includes('definitionorgloss');

                let parentContainsSenseNumber =
                    parentHasSenseNumber ||
                    [...node.parentNode.children].some(
                        (child) =>
                            child.getAttribute &&
                            (child.getAttribute('class') || '').includes('sensenumber')
                    );

                const blockClasses = [
                    'sensenumber',
                    'minimallexreferences',
                    'sharedgrammaticalinfo'
                ];

                if (blockClasses.some((cls) => className.includes(cls))) {
                    output += '\n';
                }

                if (isDefinitionOrGloss && !parentContainsSenseNumber) {
                    output += '\n';
                }

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

            return output;
        }

        return processNode(xmlDoc.documentElement);
    }

    async function updateXmlData() {
        if (!selectedWord || (!selectedWord.index && (!selectedWord.indexes || selectedWord.indexes.length === 0))) {
            xmlData = '';
            return;
        }

        let wordIds = selectedWord.indexes ? selectedWord.indexes : [selectedWord.index];
        let xmlResults = await Promise.all(wordIds.map(queryXmlByWordId));

        // Insert an `<hr>` tag or a visible separator between entries
        xmlData = xmlResults
            .filter(xml => xml)  // Ensure no null values are included
            .map(formatXmlByClass)
            .join('\n<hr>\n') + '\n<hr>\n';  // `<hr>` adds a visible line between entries
    }

    onMount(updateXmlData);
    afterUpdate(updateXmlData);
</script>

<pre class="whitespace-pre-wrap break-words">{@html xmlData}</pre>