<script>
    import AlphabetStrip from './AlphabetStrip.svelte';
    import LexiconLanguageTabs from './LexiconLanguageTabs.svelte';

    export let alphabet = [];
    export let initialData = {};
    export let selectedLanguage;
    export let vernacularLanguage;
    export let reversalLanguage;
    export let selectedLetter;
    export let onSwitchLanguage;
    export let onLetterChange;

    let currentLetter = alphabet[0];
    let reversalData = initialData;
    let loading = false;

    async function loadReversalData(letter) {
        if (letter === alphabet[0] && Object.keys(initialData).length > 0) {
            reversalData = initialData;
            return;
        }

        loading = true;
    }

    async function handleLetterSelect(letter) {
        currentLetter = letter;
        onLetterChange(letter);
        await loadReversalData(letter);
    }

    $: if (alphabet && alphabet.length > 0) {
        currentLetter = alphabet[0];
    }
    $: if (selectedLetter !== currentLetter) {
        currentLetter = selectedLetter;
    }
</script>

<div class="flex flex-col h-full">
    <LexiconLanguageTabs
        {reversalLanguage}
        {selectedLanguage}
        {onSwitchLanguage}
        {vernacularLanguage}
    />

    <AlphabetStrip {alphabet} activeLetter={currentLetter} onLetterSelect={handleLetterSelect} />

    {#if loading}
        <div class="flex-1 flex items-center justify-center">
            <div class="loading loading-spinner loading-lg"></div>
        </div>
    {:else}
        <div class="flex-1 overflow-y-auto px-4">
            {#each Object.entries(reversalData) as [english, entries]}
                <div class="py-2 border-b">
                    <div class="text-lg font-medium">{english}</div>
                    <div class="pl-4 text-base text-gray-600">
                        {#each entries as entry, i}
                            <span>
                                {entry.name}
                                {#if entry.homonym_index > 0}
                                    <sub>{entry.homonym_index}</sub>
                                {/if}
                            </span>
                        {/each}
                    </div>
                </div>
            {/each}
        </div>
    {/if}
</div>
