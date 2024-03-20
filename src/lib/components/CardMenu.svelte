<!--
@component
A drop-down menu for use in ColorCard, HistoryCard, and IconCard.
Dispatches a menuaction event when an option is selected from the menu.
-->
<script lang="ts">
    import MoreVertIcon from '$lib/icons/MoreVertIcon.svelte';
    import { monoIconColor } from '$lib/data/stores';
    import { createEventDispatcher } from 'svelte';
    const dispatch = createEventDispatcher();
    export let actions = [''];

    function handleAction(action: string) {
        dispatch('menuaction', {
            text: action
        });

        // Close the menu. Not done by DaisyUI CSS library.
        // https://github.com/saadeghi/daisyui/issues/1195
        (document.activeElement as HTMLElement).blur();
    }
</script>

<div class="dy-dropdown dy-dropdown-bottom dy-dropdown-end">
    <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
    <div tabindex="0" class="dy-btn dy-btn-ghost p-1">
        <MoreVertIcon color={$monoIconColor} />
    </div>
    <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
    <ul tabindex="0" class="dy-dropdown-content dy-menu shadow bg-base-100 z-10">
        {#each actions as a}
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <!-- svelte-ignore a11y-missing-attribute -->
            <!-- svelte-ignore a11y-no-static-element-interactions -->
            <li><a on:click={() => handleAction(a)}>{a}</a></li>
        {/each}
    </ul>
</div>
