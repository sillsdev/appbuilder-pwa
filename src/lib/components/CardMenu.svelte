<!--
@component
A drop-down menu for use in ColorCard, HistoryCard, and IconCard.
Dispatches a menuaction event when an option is selected from the menu.
-->
<script lang="ts">
    import { monoIconColor, themeColors } from '$lib/data/stores';
    import MoreVertIcon from '$lib/icons/MoreVertIcon.svelte';

    let { menuaction, actions = [''] } = $props();

    function handleAction(action: string) {
        menuaction({
            text: action
        });

        // Close the menu. Not done by DaisyUI CSS library.
        // https://github.com/saadeghi/daisyui/issues/1195
        (document.activeElement as HTMLElement).blur();
    }
</script>

<div class="dy-dropdown dy-dropdown-bottom dy-dropdown-end">
    <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
    <div tabindex="0" class="dy-btn dy-btn-ghost p-1">
        <MoreVertIcon color={$monoIconColor} />
    </div>
    <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
    <ul
        style:background={$themeColors['PopupBackgroundColor']}
        tabindex="0"
        color=""
        class="dy-dropdown-content dy-menu shadow bg-base-100 z-10"
    >
        {#each actions as a}
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <!-- svelte-ignore a11y_missing_attribute -->
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <li><a color={$monoIconColor} onclick={() => handleAction(a)}>{a}</a></li>
        {/each}
    </ul>
</div>
