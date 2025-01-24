
<script>
    import { goto } from '$app/navigation';
    import { base } from '$app/paths';
    import { page } from '$app/stores';
    import LexiconReversalView from '$lib/components/LexiconReversalView.svelte';
    import Navbar from '$lib/components/Navbar.svelte';
    import config from '$lib/data/config';
    import { t } from '$lib/data/stores';
    import { onMount } from 'svelte';

    const { alphabet, initialReversalData } = $page.data;
    let activeTab = 'main';
    let selectedEntry = null;

    let dictionaryEntries = [];

    onMount(() => {
        if (config.programType !== 'DAB') {
            goto(`${base}/text`);
        }
    });

    function showDetails(entry) {
        selectedEntry = entry;
    }

    let selectedLanguage = 'English'; // Default language
    let REVERSAL_LANG = 'Hanga';

    // Switch language function for managing language toggle
    function switchLanguage(language) {
        selectedLanguage = language;
    }

    let selectedLetter = '';
</script>

<Navbar />

<div class="flex flex-col">
    <LexiconReversalView {alphabet} {initialReversalData} selectedLanguage={selectedLanguage} REVERSAL_LANG={REVERSAL_LANG} onSwitchLanguage={switchLanguage} />
</div>

            <!--
            <main class="bg-[#f0f0f0] rounded-md shadow-md p-4">
                <AlphabetStrip {alphabet} activeLetter={selectedLetter} onLetterSelect={filterByLetter} />
                {#if selectedEntry}
                    <div class="bg-[#f0f0f0] pb-4">
                        <div class="font-bold mb-2 cursor-pointer text-black">{selectedEntry.headword}</div>
                        {#if selectedEntry.definitions}
                            <div class="mb-2">
                                {#each selectedEntry.partOfSpeech as partOfSpeech}
                                    <div class="mb-2">
                                        <span>{partOfSpeech}</span>
                                    </div>
                                {/each}
                            </div>
                        {/if}

                        {#if selectedEntry.morphTypes}
                            <div class="mb-2">
                                {#each selectedEntry.morphTypes as morphType}
                                    <div class="mb-2">
                                        <span class="font-semibold">{morphType}</span>
                                    </div>
                                {/each}
                            </div>
                        {/if}

                        {#if selectedEntry.senses}
                            <div class="mb-2">
                                {#each selectedEntry.senses as sense}
                                    <div class="mb-2">
                                        <span>{sense}</span>
                                    </div>
                                {/each}
                            </div>
                        {/if}
                    </div>
                {:else}
                    {#each dictionaryEntries as entry}
                        <div class="bg-[#f0f0f0] p-2 mb-4">
                            <div class="font-bold cursor-pointer" on:click={() => showDetails(entry)}>{entry.headword}</div>
                        </div>
                    {/each}
                {/if}
            </main>
        {/if}
    </div>
</div>-->