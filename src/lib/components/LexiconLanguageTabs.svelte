<script>
    export let reversalLanguage;
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
    <button
        on:click={() => onSwitchLanguage(reversalLanguage)}
        class="py-2 px-6 font-bold text-black uppercase text-center relative {selectedLanguage ===
        reversalLanguage
            ? 'bg-[#bb9ac2]'
            : ''}"
    >
        {reversalLanguage}
        {#if selectedLanguage === reversalLanguage}
            <div class="absolute bottom-0 left-0 w-full h-1 bg-black"></div>
        {/if}
    </button>
    <div class="flex-1"></div>
</div>
