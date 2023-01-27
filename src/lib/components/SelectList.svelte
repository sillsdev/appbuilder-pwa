<!--
@component
A component to display menu options in a list.
-->
<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import config from '$lib/data/config';
    export let options = [''];

    const dispatch = createEventDispatcher();
    $: rows = Math.ceil(options.length);
    const colors = (type: string, key: string) =>
        config.themes.find((x) => x.name === 'Normal').colorSets.find((x) => x.type === type)
            ?.colors[key];
    const textColor = colors('main', 'ChapterButtonTextColor');
    let tableColor = colors('main', 'BackgroundColor');

    function handleClick(opt: string) {
        dispatch('menuaction', {
            text: opt
        });
    }
</script>

{#each Array(rows) as _, ri}
    <table style:background-color={tableColor} style:border-spacing="5px">
        {#each Array(rows) as _, ci}
            <tr>
                {#if ri * rows + ci < options.length}
                    <td
                        style:background-color={tableColor}
                        style:border="none"
                        style:border-radius="0px"
                    >
                        <!-- svelte-ignore a11y-click-events-have-key-events -->
                        <span
                            on:click={() => handleClick(options[ri * rows + ci])}
                            class="dy-btn dy-btn-ghost p-0"
                            style:color={textColor}>{options[ri * rows + ci]}</span
                        ></td
                    >
                {/if}
            </tr>
        {/each}
    </table>
{/each}

<style>
    table {
        width: 100%;
        margin-left: auto;
        margin-right: auto;
        padding: 0px;
        border-collapse: unset;
    }
    tr {
        width: 80%;
        margin: 0px;
        padding: 0px;
    }
    td {
        margin: 0px;
        position: relative;
        border: 1px solid;
        border-radius: 2px;
    }
    span {
        text-overflow: ''; /* Works on Firefox only */
        overflow: hidden;
        padding: 1px;
        vertical-align: middle;
    }
</style>
