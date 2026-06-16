<!--
@component
A component to display tabbed menus.
-->

<script lang="ts">
    import { actionBarColor, convertStyle, s } from '$lib/data/stores';
    import { preventDefault } from '$lib/scripts/event-wrappers';

    let {
        options = { '': { visible: true } },
        active = $bindable(Object.keys(options).filter((x) => options[x].visible)[0]),
        scroll = true,
        height = '50vh',
        menuaction,
        color
    }: {
        options: App.TabMenuOptions;
        active?: string;
        scroll?: boolean;
        height?: string;
        menuaction?: App.TabMenuActionHandler;
        color?: string;
    } = $props();

    const hasTabs = $derived(Object.keys(options).filter((x) => options[x].visible).length > 1);
    function handleMenuaction({ text, url }: { text: string; url: string }) {
        menuaction?.({
            text: text,
            url: url,
            tab: active
        });
    }

    /**sets the active tab*/
    export const setActive = (tab: string) => {
        if (!Object.hasOwn(options, tab)) {
            return;
        }
        active = tab;
    };
    const ActiveComponent = $derived(options[active]?.snippet);
    //When used for collection selector, this needs to use the ui.dialog style rather than the ui.selector.tabs style.
</script>

{#if hasTabs}
    <div class="dy-tabs dy-tabs-bordered mb-1" style={convertStyle($s?.['ui.selector.tabs'])}>
        {#each Object.keys(options) as opt}
            {#if options[opt].visible}
                <!-- svelte-ignore a11y_missing_attribute -->
                <!-- svelte-ignore a11y_click_events_have_key_events -->
                <!-- svelte-ignore a11y_interactive_supports_focus -->
                <a
                    onclick={preventDefault(() => setActive(opt))}
                    style:border-color={active === opt ? color : ''}
                    class="dy-tab normal-case {active === opt ? 'dy-tab-active font-bold' : ''}"
                    style:background="none"
                    style:color={$actionBarColor}
                    role="button"
                >
                    {#if options[opt].tab?.icon}
                        {@render options[opt].tab.icon(opt)}
                    {:else}
                        {opt}
                    {/if}
                </a>
            {/if}
        {/each}
    </div>
{/if}
<div
    style={convertStyle($s?.['ui.background'])}
    class:p-2={!hasTabs}
    style:overflow-y={scroll ? 'auto' : ''}
    style:max-height={height}
>
    {@render ActiveComponent?.(active, handleMenuaction)}
</div>
