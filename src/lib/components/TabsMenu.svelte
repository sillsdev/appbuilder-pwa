<!--
@component
A component to display tabbed menus.
-->
<svelte:options accessors={true} />

<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import { s, convertStyle } from '$lib/data/stores';

    export let options: App.TabMenuOptions = { '': { component: '', props: {}, visible: true } };
    export let active = Object.keys(options).filter((x) => options[x].visible)[0];
    export let scroll = true;
    export let height = '50vh';

    const dispatch = createEventDispatcher();
    const hasTabs = Object.keys(options).filter((x) => options[x].visible).length > 1;
    function handleMenuaction({ detail }: CustomEvent) {
        dispatch('menuaction', {
            text: detail.text,
            url: detail?.url,
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
    <div class="dy-tabs mb-1" style={convertStyle($s['ui.selector.tabs'])}>
        {#each Object.keys(options) as opt}
            {#if options[opt].visible}
                <!-- svelte-ignore a11y-missing-attribute -->
                <!-- svelte-ignore a11y-click-events-have-key-events -->
                <!-- svelte-ignore a11y-interactive-supports-focus -->
                <a
                    on:click|preventDefault={() => setActive(opt)}
                    style:border-color={active === opt ? '#FFFFFF' : ''}
                    class="dy-tab dy-tab-bordered text-white normal-case {active === opt
                        ? 'dy-tab-active'
                        : ''}"
                    style:background="none"
                    role="button"
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
            {/if}
        {/each}
    </div>
{/if}
<div
    style={convertStyle($s['ui.background'])}
    class:p-2={!hasTabs}
    style:overflow-y={scroll ? 'auto' : ''}
    style:max-height={height}
>
    <svelte:component
        this={options[active].component}
        on:menuaction={handleMenuaction}
        {...options[active].props}
    />
</div>
