<script lang="ts">
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

    // Temporary dummy data for testing
    /*let dictionaryEntries = [
        {
            headword: 'example',
            partOfSpeech: 'Noun',
            morphTypes: ['Singular'],
            senses: ['A representative form or pattern.']
        },
        {
            headword: 'test',
            partOfSpeech: 'Verb',
            morphTypes: ['Transitive', 'Present'],
            senses: ['A procedure intended to establish the quality.']
        }
    ];*/

    let dictionaryEntries = [];

    onMount(() => {
        //loadWords();
        // Redirect to text view if not a DAB program
        if (config.programType !== 'DAB') {
            goto(`${base}/text`);
        }
    });

    function showDetails(entry) {
        selectedEntry = entry;
    }

    let selectedLanguage = 'English'; // Default language
    let REVERSAL_LANG = 'Hanga';
    let selectedLetter = '';

    // Switch language
    function switchLanguage(language) {
        selectedLanguage = language;
        selectedLetter = ''; // Clear selected letter when switching languages
        dictionaryEntries = []; // Clear current entries
    }

    // Filter by letter for English
    async function filterByLetterEnglish(letter) {
        dictionaryEntries = [];
        selectedLetter = letter;

        const path = `/reversal/en/${letter.toLowerCase()}-001.json`;
        try {
            const response = await fetch(path);
            if (response.ok) {
                const data = await response.json();

                dictionaryEntries = Object.keys(data).map((word) => ({
                    headword: word,
                    partOfSpeech: '', // Placeholder
                    morphTypes: [], // Placeholder
                    senses: [] // Placeholder
                }));
            }
        } catch (error) {
            console.error(`Error loading ${path}:`, error);
        }
    }

    // Filter by letter for lanuage (currently empty logic)
    async function filterByLetterReversal(letter) {
        dictionaryEntries = [];
        selectedLetter = letter;

        // Add logic here for language filtering
        console.log(`Filtering for ${REVERSAL_LANG} with letter: ${letter}`);
    }

    // Determine which function to use based on language
    function filterByLetter(letter) {
        if (selectedLanguage === 'English') {
            filterByLetterEnglish(letter);
        } else if (selectedLanguage === REVERSAL_LANG) {
            filterByLetterReversal(letter);
        }
    }
</script>

<div class="grid grid-rows-[auto,auto,1fr]" style="height:100vh;height:100dvh;">
    <Navbar>
        <label for="sidebar" slot="center" class="navbar">
            <div class="btn btn-ghost normal-case text-xl">
                {$t['Menu_Dictionary']}
                {REVERSAL_LANG} Dictionary
            </div>
        </label>
    </Navbar>

    <!--<div class="tabs w-full">
        <button
            class="tab tab-bordered flex-1 {activeTab === 'main' ? 'tab-active' : ''}"
            on:click={() => (activeTab = 'main')}
        >
            {$t['Dictionary_Main']}
        </button>
        <button
            class="tab tab-bordered flex-1 {activeTab === 'reversal' ? 'tab-active' : ''}"
            on:click={() => (activeTab = 'reversal')}
        >
            {$t['Dictionary_Reversal']}
        </button>
    </div>-->

    <div class="overflow-y-auto">
        {#if activeTab === 'main'}
            <!-- Your existing lexicon view here -->
            
            <!-- Language Tabs -->
            <div class="language-tabs">
                <button
                    on:click={() => switchLanguage(REVERSAL_LANG)}
                    class:selected={selectedLanguage === REVERSAL_LANG}
                >
                    {REVERSAL_LANG}
                </button>
                <button
                    on:click={() => switchLanguage('English')}
                    class:selected={selectedLanguage === 'English'}
                >
                    English
                </button>
            </div>
            <main class="dictionary">
                <div class="alphabet-scroll">
                    {#each alphabet as letter}
                        <button
                            on:click={() => filterByLetter(letter)}
                            class:selected={selectedLetter === letter}
                        >
                            {letter}
                        </button>
                    {/each}
                </div>

                {#if selectedEntry}
                    <div class="entry">
                        <div class="mainheadword">
                            <span>{selectedEntry.headword}</span>
                        </div>

                        {#if selectedEntry.definitions}
                            <div class="partOfSpeech">
                                {#each selectedEntry.partOfSpeech as partOfSpeech}
                                    <div class="partOfSpeech">
                                        <span>{partOfSpeech}</span>
                                    </div>
                                {/each}
                            </div>
                        {/if}

                        {#if selectedEntry.morphTypes}
                            <div class="morphTypes">
                                {#each selectedEntry.morphTypes as morphType}
                                    <div class="morphTypes">
                                        <span class="morph">{morphType}</span>
                                    </div>
                                {/each}
                            </div>
                        {/if}

                        {#if selectedEntry.senses}
                            <div class="sensescontents">
                                {#each selectedEntry.senses as sense}
                                    <div class="sensescontents">
                                        <span class="senses">{sense}</span>
                                    </div>
                                {/each}
                            </div>
                        {/if}
                    </div>
                {:else}
                    {#each dictionaryEntries as entry}
                        <div class="entry">
                            <div class="mainheadword" on:click={() => showDetails(entry)}>
                                <span>{entry.headword}</span>
                            </div>
                        </div>
                    {/each}
                {/if}
            </main>
        {:else}
            <LexiconReversalView {alphabet} initialData={initialReversalData} />
        {/if}
    </div>
</div>

<style>
    body {
        font-family: font1;
        direction: ltr;
        font-size: 18px;
        font-weight: normal;
        color: #000000;
        background-color: #f0f0f0;
        margin: 15px 4%;
    }

    .navbar .btn {
        font-weight: bold;
        color: white;
        font-size: 1.25rem;
    }

    .navbar .btn-ghost {
        background: none;
        border: none;
    }

    .dictionary {
        background-color: #f0f0f0;
        border-radius: 8px;
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
    }

    .language-tabs {
        display: flex;
        justify-content: flex-start;
        background-color: #e1bee8;
        padding: 0.5rem;
        margin-bottom: 1rem;
        flex-wrap: wrap;
    }

    .language-tabs button {
        flex: 0;
        padding: 0.5rem 1rem;
        font-size: 1rem;
        font-weight: bold;
        color: black;
        text-transform: uppercase;
        background: none;
        border: none;
        border-bottom: 3px solid transparent;
        cursor: pointer;
        margin-right: 0.5rem;
        margin-bottom: 0.5rem;
        border-radius: 4px;
    }

    .language-tabs button.selected {
        border-bottom: 3px solid #606060;
        background-color: #bb9ac2;
        border-color: black;
    }

    .alphabet-scroll {
        display: flex;
        gap: 0.5rem;
        margin-bottom: 1rem;
        justify-content: flex-start;
        overflow-x: auto;
        white-space: nowrap;
        padding-bottom: 1rem;
    }

    .alphabet-scroll button {
        padding: 0.4rem 0.8rem;
        font-size: 0.9rem;
        text-transform: none;
        border: 1px solid #ccc;
        background-color: #f9f9f9;
        cursor: pointer;
        border-radius: 4px;
        font-weight: bold;
    }

    .alphabet-scroll button.selected {
        background-color: #bb9ac2;
        border-color: black;
    }

    ul {
        list-style-type: none;
        padding: 0;
    }

    li {
        margin-bottom: 1rem;
    }

    /* Responsive Design */
    @media (max-width: 768px) {
        .language-tabs {
            justify-content: center;
        }

        .alphabet-scroll {
            justify-content: center;
        }

        .alphabet-scroll button {
            font-size: 0.85rem;
        }
    }

    @media (max-width: 480px) {
        .alphabet-scroll button {
            padding: 0.3rem 0.6rem;
            font-size: 0.8rem;
        }
    }

    .alphabet-scroll button:hover {
        background-color: #e0e0e0;
    }

    @media (max-width: 600px) {
        .alphabet-scroll button {
            padding: 6px 10px;
            font-size: 14px;
        }
    }

    .entry {
        background-color: #f0f0f0;
        padding-bottom: 15px;
    }

    .mainheadword {
        font-weight: bold;
        margin-bottom: 10px;
        cursor: pointer;
        color: black;
    }

    .shared-grammatical-info {
        margin-bottom: 10px;
    }

    .sense-content {
        margin-left: 20px;
        margin-bottom: 10px;
    }

    .sense-content ol {
        padding-left: 20px;
    }
</style>
