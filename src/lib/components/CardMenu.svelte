<!--
@component
A drop-down menu for use in ColorCard, HistoryCard, and IconCard.
Dispatches a menuaction event when an option is selected from the menu.
-->
<script lang="ts">
    import { monoIconColor } from '$lib/data/stores';
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
    <ul tabindex="0" class="dy-dropdown-content dy-menu shadow-sm z-10">
        {#each actions as a}
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <!-- svelte-ignore a11y_missing_attribute -->
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <li><a onclick={() => handleAction(a)}>{a}</a></li>
        {/each}
    </ul>
</div>

<style>
    .dy-dropdown-content {
        background-color: var(--AnnotationItemBackgroundColor);
        outline: 1px solid var(--PrimaryColor);
        --dy-menu-active-fg: var(--TextColor);
        --dy-menu-active-bg: var(--ButtonSelectedColor);
    }
    .dy-menu {
        &
            :where(
                li:not(.dy-menu-title, .dy-disabled)
                    > :not(ul, details, .dy-menu-title):not(
                        .dy-menu-active,
                        :active,
                        .dy-btn
                    ):hover,
                li:not(.dy-menu-title, .dy-disabled)
                    > details
                    > summary:not(.dy-menu-title):not(.dy-menu-active, :active, .dy-btn):hover
            ) {
            @supports (color: color-mix(in lab, red, red)) {
                background-color: color-mix(in oklab, var(--PrimaryColor) 15%, transparent);
            }
        }
    }
</style>
