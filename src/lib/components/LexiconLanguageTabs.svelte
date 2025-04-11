<script>
    export let reversalLanguage;
    export let selectedLanguage;
    export let onSwitchLanguage;
    export let vernacularLanguage;
    
</script>

<div class="flex w-full" style="background-color: var(--TabBackgroundColor);">
    <button
        on:click={() => onSwitchLanguage(vernacularLanguage)}
        class="py-2 px-6 font-bold text-black uppercase text-center relative"
        style="{selectedLanguage === vernacularLanguage ? 'background-color: var(--TitleBackgroundColor);' : ''}"
    >
        {vernacularLanguage}
        {#if selectedLanguage === vernacularLanguage}
            <div class="absolute bottom-0 left-0 w-full h-1 bg-black"></div>
        {/if}
    </button>
    <button
        on:click={() => onSwitchLanguage(reversalLanguage)}
        class="py-2 px-6 font-bold text-black uppercase text-center relative"
        style="{selectedLanguage === reversalLanguage ? 'background-color: var(--TitleBackgroundColor);' : ''}"
    >
        {reversalLanguage}
        {#if selectedLanguage === reversalLanguage}
            <div class="absolute bottom-0 left-0 w-full h-1 bg-black"></div>
        {/if}
    </button>
    <div class="flex-1"></div>
</div>
