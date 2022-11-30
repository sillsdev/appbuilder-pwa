<!--
@component
A component to display tabbed menus.
-->
<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import config from '$lib/data/config';

    export let options: App.TabMenuOptions = { '': { component: '', props: {} } };
    export let active = '';
    const dispatch = createEventDispatcher();

    const primaryColor = config.themes
        .find((x) => x.name === 'Normal') // TODO: change to fetch the current theme
        .colorSets.find((x) => x.type === 'main').colors['PrimaryColor'];

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

<div class="dy-tabs" style:background-color={primaryColor}>
    {#each Object.keys(options) as opt}
        <!-- svelte-ignore a11y-missing-attribute -->
        <!-- svelte-ignore a11y-click-events-have-key-events -->

        <!-- how to set this to white on dy-tab-active???-->
        <a
            on:click={() => (active = opt)}
            style:border-color={active === opt ? '#FFFFFF' : ''}
            class="dy-tab dy-tab-bordered text-white {active === opt ? 'dy-tab-active' : ''}"
            style:background="none"
        >
            {#if options[opt].tab}
                <svelte:component this={options[opt].tab?.component} {...options[opt].tab?.props} />
            {:else}
                {opt}
            {/if}
        </a>
    {/each}
</div>
<div class="tabs-content">
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
