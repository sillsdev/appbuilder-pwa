
<script>
    import { base } from '$app/paths';
    import AlphabetStrip from './AlphabetStrip.svelte';

    export let alphabet = [];
    export let initialData = {};

    let currentLetter = alphabet[0];
    let reversalData = initialData;
    let loading = false;

    // Selected language state
    let selectedLanguage = 'English'; // Default language
    const REVERSAL_LANG = 'Hanga';

    async function loadReversalData(letter) {
        if (letter === alphabet[0] && Object.keys(initialData).length > 0) {
            reversalData = initialData;
            return;
        }

        loading = true;
        try {
            const response = await fetch(
                `${base}/reversal/language/${selectedLanguage.toLowerCase()}/${letter.toLowerCase()}.json`
            );
            if (!response.ok) {
                throw new Error('Failed to load reversal data');
            }
            reversalData = await response.json();
        } catch (error) {
            console.error('Error loading reversal data:', error);
            reversalData = {};
        } finally {
            loading = false;
        }
    }

    async function handleLetterSelect(letter) {
        currentLetter = letter;
        await loadReversalData(letter);
    }

    // Switch language function
    function switchLanguage(language) {
        selectedLanguage = language;
        loadReversalData(currentLetter); // Reload data for the selected language
    }
</script>

<div class="flex flex-col h-full">
    <!-- Language Buttons -->
    <div class="flex flex-wrap bg-[#e1bee8] p-2 mb-4">
        <button
            on:click={() => switchLanguage(REVERSAL_LANG)}
            class="px-4 py-2 text-base font-bold text-black uppercase border-b-4 border-transparent cursor-pointer mr-2 mb-2 rounded-md hover:bg-gray-200 {selectedLanguage === REVERSAL_LANG ? 'bg-[#bb9ac2] border-black' : ''}">
            {REVERSAL_LANG}
        </button>
        <button
            on:click={() => switchLanguage('English')}
            class="px-4 py-2 text-base font-bold text-black uppercase border-b-4 border-transparent cursor-pointer mr-2 mb-2 rounded-md hover:bg-gray-200 {selectedLanguage === 'English' ? 'bg-[#bb9ac2] border-black' : ''}">
            English
        </button>
    </div>

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
