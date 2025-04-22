<script>
    import { expoInOut } from 'svelte/easing';
    import { fly } from 'svelte/transition';

    export let reversalLanguages = [];
    export let selectedLanguage;
    export let onSwitchLanguage;
    export let vernacularLanguage;
</script>

<div class="flex bg-[#e1bee8] w-full">
    <button
        on:click={() => onSwitchLanguage(vernacularLanguage)}
        class="py-2 px-6 font-bold text-black uppercase text-center relative {selectedLanguage ===
        vernacularLanguage
            ? 'bg-[#bb9ac2]'
            : ''}"
    >
        {vernacularLanguage}
        {#if selectedLanguage === vernacularLanguage}
            <div class="absolute bottom-0 left-0 w-full h-1 bg-black"></div>
        {/if}
</button>
    
    {#each reversalLanguages as lang (lang)}
        <div
            role="button"
            tabindex="0"
            aria-pressed={selectedLanguage === lang}
            on:click={() => onSwitchLanguage(lang)}
            on:keydown={(e) => e.key === 'Enter' && onSwitchLanguage(lang)}
            class="py-2.5 px-3.5 text-sm uppercase text-center relative dy-tabs dy-tabs-bordered mb-1"
        >
            {lang}
            {#if selectedLanguage === lang}
                <div
                    transition:fly={{ axis: 'x', easing: expoInOut, x: -70 }}
                    class="absolute -bottom-1 left-0 w-full h-1 bg-black"
                ></div>
            {/if}
        </div>
    {/each}

    <div class="flex-1"></div>
</div>
