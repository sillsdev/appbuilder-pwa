<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    export let options = [''];
    const cols = 5;
    const dispatch = createEventDispatcher();
    $: rows = Math.ceil(options.length / cols);

    function handleClick(opt: string) {
        dispatch('menuaction', {
            text: opt
        });
    }
</script>

<table>
    {#each Array(rows) as _, ri}
        <tr>
            {#each Array(cols) as _, ci}
                {#if ri * cols + ci < options.length}
                    <td
                        ><span
                            on:click={() => handleClick(options[ri * cols + ci])}
                            class="dy-btn dy-btn-square dy-btn-ghost p-0 m-0"
                            >{options[ri * cols + ci]}</span
                        ></td
                    >
                {/if}
            {/each}
        </tr>
    {/each}
</table>

<style>
    table {
        width: 100%;
        margin-left: auto;
        margin-right: auto;
        padding: 0px;
        border-collapse: unset;
        background-color: lightgray;
    }
    tr {
        width: 100%;
        margin: 0px;
        padding: 0px;
    }
    td {
        text-align: center;
        overflow: hidden;
        margin: 0px;
        padding: 0px;
        position: relative;
        border: 1px solid lightgray;
        border-radius: 5px;
        background-color: white;
    }
    span {
        text-overflow: ''; /* Works on Firefox only */
        overflow: hidden;
        display: inline-block;
        padding: 1.2em 0;
        vertical-align: middle;
    }
</style>
