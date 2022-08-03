<!--
@component
A component to display tabbed menus.
-->
<script lang="ts">
    import { createEventDispatcher } from 'svelte';

    export let options: App.TabMenuOptions = { '': { component: '', props: {} } };
    export let active = '';
    export let _class = 'bg-primary';
    const dispatch = createEventDispatcher();

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

<div class="dy-tabs {_class}">
    {#each Object.keys(options) as opt}
        <!-- svelte-ignore a11y-missing-attribute -->
        <a
            on:click={() => (active = opt)}
            class="dy-tab dy-tab-bordered {active === opt ? 'dy-tab-active' : ''}"
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
