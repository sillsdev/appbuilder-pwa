<script lang="ts">
    import { createEventDispatcher } from 'svelte';

    export let options: App.TabMenuOptions = { '': { component: '', props: {} } };
    export let active = '';
    const dispatch = createEventDispatcher();

    function handleMenuaction({ detail }: CustomEvent) {
        dispatch('menuaction', {
            text: detail.text,
            tab: active
        });
    }
</script>

<div class="tabs bg-primary">
    {#each Object.keys(options) as opt}
        <!-- svelte-ignore a11y-missing-attribute -->
        <a
            on:click={() => (active = opt)}
            class="dy-tab dy-tab-bordered {active === opt ? 'dy-tab-active' : ''}">{opt}</a
        >
    {/each}
</div>

<svelte:component
    this={options[active].component}
    on:menuaction={handleMenuaction}
    {...options[active].props}
/>
