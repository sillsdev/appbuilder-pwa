<!--
@component
A component to display menu options in a list.
-->
<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import { s, convertStyle } from '$lib/data/stores';
    export let options: App.GridGroup[] = [];

    const dispatch = createEventDispatcher();

    function handleClick(opt: any) {
        const text = opt.id;
        const url = opt?.url;
        dispatch('menuaction', {
            text,
            url
        });
    }

    // class=" menu p-0 cursor-pointer hover:bg-base-100 min-w-[16rem]"
</script>

{#each options as group}
    {#if group.header}
        <div style={convertStyle($s['ui.text.book-group-title'])}>{group.header}</div>
    {/if}
    <table>
        {#each Array(group.cells.length) as _, ri}
            <td>
                {#each Array(group.cells.length) as _, ci}
                    {#if ri * group.cells.length + ci < group.cells.length}
                        <tr>
                            <!-- svelte-ignore a11y-click-events-have-key-events -->
                            <!-- svelte-ignore a11y-interactive-supports-focus -->
                            <span
                                on:click={() =>
                                    handleClick(group.cells[ri * group.cells.length + ci])}
                                class="menu p-0 cursor-pointer hover:bg-base-100 min-w-[16rem]"
                                role="button"
                            >
                                {group.cells[ri * group.cells.length + ci].label}
                            </span></tr
                        >
                    {/if}
                {/each}
            </td>
        {/each}
    </table>
{/each}

<style>
    div {
        padding: 5px;
    }
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
        border-radius: 2px;
    }
    span {
        text-overflow: ''; /* Works on Firefox only */
        overflow: hidden;
        display: inline-block;
        vertical-align: middle;
        padding: 0.5em 0;
    }
</style>
