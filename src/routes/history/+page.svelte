<script lang="ts">
    import HistoryCard from '$lib/components/HistoryCard.svelte';
    import Navbar from '$lib/components/Navbar.svelte';
    import { bodyFontSize, t } from '$lib/data/stores';
    import { clearHistory } from '$lib/data/history';
    import DeleteSweepIcon from '$lib/icons/DeleteSweepIcon.svelte';

    // Use "export let data" instead of $page so that local data can
    // be cleared during onClearHistory.
    export let data;
    async function onClearHistory() {
        await clearHistory();
        data.history = [];
    }
</script>

<div class="grid grid-rows-[auto,1fr]" style="height:100vh;height:100dvh;">
    <div class="navbar">
        <Navbar>
            <!-- Button to close the drawer/sidebar -->
            <!-- <div slot="left-buttons" /> -->
            <label for="sidebar" slot="center">
                <div class="btn btn-ghost normal-case text-xl">{$t['Menu_History']}</div>
            </label>
            <div slot="right-buttons">
                <button class="dy-btn dy-btn-ghost dy-btn-circle" on:click={onClearHistory}>
                    <DeleteSweepIcon color="white" />
                </button>
            </div>
            <!-- <div slot="right-buttons" /> -->
        </Navbar>
    </div>

    <div
        class="overflow-y-auto p-2.5 max-w-screen-md mx-auto w-full"
        style:font-size="{$bodyFontSize}px"
    >
        {#if data.history.length === 0}
            <div class="history-message-none">{$t['History_None']}</div>
            <div class="history-message-none-info">{$t['History_None_Info']}</div>
        {:else}
            {#each data.history.reverse() as h}
                <HistoryCard history={h} />
            {/each}
        {/if}
    </div>
</div>
