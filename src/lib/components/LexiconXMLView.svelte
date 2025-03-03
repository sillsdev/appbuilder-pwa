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

        function processNode(node) {
            let output = '';

            if (node.nodeType === Node.TEXT_NODE) {
                return node.nodeValue.trim() ? node.nodeValue + ' ' : '';
            }

            if (node.nodeType === Node.ELEMENT_NODE) {
                let className = node.getAttribute('class') || '';

                // Define elements that should be on a new line
                const blockClasses = ['sensenumber', 'minimallexreferences', 'sharedgrammaticalinfo', 'definitionorgloss'];

                if (blockClasses.some(cls => className.includes(cls))) {
                    output += '\n';
                }

                output += '<' + node.tagName;
                for (let attr of node.attributes) {
                    output += ` ${attr.name}="${attr.value}"`;
                }
                output += '>';

                for (let child of node.childNodes) {
                    output += processNode(child);
                }

                output += `</${node.tagName}>`;
            }

            return output;
        }

        let formatted = processNode(xmlDoc.documentElement);

        return formatted;
    }

    async function updateXmlData(wordId) {
        if (!wordId) return;
        let rawXml = await queryXmlByWordId(wordId);
        xmlData = formatXmlByClass(rawXml);
    }

    onMount(async () => {
        await updateXmlData(selectedWord.index);
    });

    afterUpdate(async () => {
        if (selectedWord && selectedWord.index) {
            await updateXmlData(selectedWord.index);
        } else if (selectedWord && selectedWord.indexes && selectedWord.indexes.length > 0) {
            await updateXmlData(selectedWord.indexes[0]);
        }
    });
</script>

<pre>{@html xmlData}</pre>
