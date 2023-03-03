<!--
@component
A component to display tabbed menus.
-->
<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import { s, convertStyle } from '$lib/data/stores';

    export let options: App.TabMenuOptions = { '': { component: '', props: {} } };
    export let active = '';
    const dispatch = createEventDispatcher();
    const hasTabs = Object.keys(options).length > 1;

    function handleMenuaction({ detail }: CustomEvent) {
        dispatch('menuaction', {
            text: detail.text,
            tab: active
        });
    }

    /**sets the active tab*/
    export const setActive = (tab: string) => {
        if (!Object.hasOwn(options, tab)) return;
        active = tab;
    };
</script>

{#if hasTabs}
    <div class="dy-tabs" style={convertStyle($s['ui.selector.tabs'])}>
        {#each Object.keys(options) as opt}
            <!-- svelte-ignore a11y-missing-attribute -->
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <a
                on:click|preventDefault={() => setActive(opt)}
                style:border-color={active === opt ? '#FFFFFF' : ''}
                class="dy-tab dy-tab-bordered text-white normal-case {active === opt
                    ? 'dy-tab-active'
                    : ''}"
                style:background="none"
            >
                {#if options[opt].tab}
                    <svelte:component
                        this={options[opt].tab?.component}
                        {...options[opt].tab?.props}
                    />
                {:else}
                    {opt}
                {/if}
            </a>
        {/each}
    </div>
{/if}
<div class="tabs-content" style={convertStyle($s['ui.background'])} class:p-2={!hasTabs}>
    <svelte:component
        this={options[active].component}
        on:menuaction={handleMenuaction}
        {...options[active].props}
    />
</div>

<style>
    .tabs-content {
        max-height: 50vh;
        overflow-y: auto;
    }
</style>
