<script>
    export let reversalLanguage;
    export let selectedLanguage;
    export let onSwitchLanguage;
    export let vernacularLanguage;
</script>

<div class="flex flex-wrap bg-[#e1bee8] p-2 mb-4">
    <button
        on:click={() => onSwitchLanguage(vernacularLanguage)}
        class="px-4 py-2 text-base font-bold text-black uppercase border-b-4 border-transparent cursor-pointer mr-2 mb-2 rounded-md hover:bg-gray-200 {selectedLanguage ===
        vernacularLanguage
            ? 'bg-[#bb9ac2] border-black'
            : ''}"
    >
        {vernacularLanguage}
    </button>
    <button
        on:click={() => onSwitchLanguage(reversalLanguage)}
        class="px-4 py-2 text-base font-bold text-black uppercase border-b-4 border-transparent cursor-pointer mr-2 mb-2 rounded-md hover:bg-gray-200 {selectedLanguage ===
        reversalLanguage
            ? 'bg-[#bb9ac2] border-black'
            : ''}"
    >
        {reversalLanguage}
    </button>
</div>
