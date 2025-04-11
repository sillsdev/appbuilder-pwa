<script>
    import { expoInOut } from 'svelte/easing';
    import { fly } from 'svelte/transition';

    export let reversalLanguage;
    export let selectedLanguage;
    export let onSwitchLanguage;
    export let vernacularLanguage;
</script>

<div class="flex bg-[#e1bee8] w-full">
    <div
        role="button"
        tabindex="0"
        aria-pressed={selectedLanguage === vernacularLanguage}
        on:click={() => onSwitchLanguage(vernacularLanguage)}
        on:keydown={(e) => e.key === 'Enter' && onSwitchLanguage(vernacularLanguage)}
        class="py-2.5 px-3.5 text-sm uppercase text-center relative dy-tabs dy-tabs-bordered mb-1">
        {vernacularLanguage}
        {#if selectedLanguage === vernacularLanguage}
            <div
                transition:fly="{{ axis: 'x', easing: expoInOut, x: 70 }}"
                class="absolute -bottom-1 left-0 w-full h-1 bg-black"
            ></div>
        {/if}
    </div>
    <div
        role="button"
        tabindex="0"
        aria-pressed={selectedLanguage === reversalLanguage}
        on:click={() => onSwitchLanguage(reversalLanguage)}
        on:keydown={(e) => e.key === 'Enter' && onSwitchLanguage(reversalLanguage)}
        class="py-2.5 px-3.5 text-sm uppercase text-center relative dy-tabs dy-tabs-bordered mb-1"
    >
        {reversalLanguage}
        {#if selectedLanguage === reversalLanguage}
            <div
                transition:fly="{{ axis: 'x', easing: expoInOut, x: -70 }}"
                class="absolute -bottom-1 left-0 w-full h-1 bg-black"
            ></div>
        {/if}
    </div>
    <div class="flex-1"></div>
</div>
