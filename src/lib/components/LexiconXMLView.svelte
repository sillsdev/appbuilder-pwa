<script>
    import { base } from '$app/paths';
    import { onMount } from "svelte";
    import initSqlJs from 'sql.js';

    export let selectedWord;
    let xmlData = "";

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

    onMount(async () => {
        xmlData = await queryXmlByWordId(selectedWord.index);
    });
</script>

<div>{@html xmlData}</div>