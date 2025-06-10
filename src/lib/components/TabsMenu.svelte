<!--
@component
A component to display tabbed menus.
-->

<script lang="ts">
    import { convertStyle, s } from '$lib/data/stores';
    import { preventDefault } from '$lib/scripts/event-wrappers';

    let {
        options = { '': { component: '', props: {}, visible: true } },
        active = Object.keys(options).filter((x) => options[x].visible)[0],
        scroll = true,
        height = '50vh',
        menuaction
    }: { options: App.TabMenuOptions; active; scroll; height; menuaction } = $props();

    const hasTabs = Object.keys(options).filter((x) => options[x].visible).length > 1;
    function handleMenuaction({ text, url }) {
        menuaction({
            text: text,
            url: url,
            tab: active
        });
    }

    /**sets the active tab*/
    export const setActive = (tab: string) => {
        if (!Object.hasOwn(options, tab)) return;
        active = tab;
    };
    const ActiveComponent = $derived(options[active].component);
</script>

{#if hasTabs}
    <div class="dy-tabs dy-tabs-bordered mb-1" style={convertStyle($s['ui.selector.tabs'])}>
        {(console.log(`active: ${active}`), '')}
        {#each Object.keys(options) as opt}
            {#if options[opt].visible}
                <!-- svelte-ignore a11y_missing_attribute -->
                <!-- svelte-ignore a11y_click_events_have_key_events -->
                <!-- svelte-ignore a11y_interactive_supports_focus -->
                <a
                    onclick={preventDefault(() => setActive(opt))}
                    style:border-color={active === opt ? '#FFFFFF' : ''}
                    class="dy-tab text-white normal-case {active === opt
                        ? 'dy-tab-active font-bold'
                        : ''}"
                    style:background="none"
                    role="button"
                >
                    {#if options[opt].tab}
                        {@const TabComponent = options[opt].tab?.component}
                        <TabComponent {...options[opt].tab?.props} />
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
    {console.log('active', active)}
    <ActiveComponent menuaction={handleMenuaction} {...options[active].props} />
</div>
