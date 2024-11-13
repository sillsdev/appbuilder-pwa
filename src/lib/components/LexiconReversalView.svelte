<script lang="ts">
    import { onMount } from 'svelte';
    import { base } from '$app/paths';
    import AlphabetStrip from './AlphabetStrip.svelte';

    export let alphabet: string[];
    export let initialData: {
        [key: string]: Array<{ index: number; name: string; homonym_index: number }>;
    };

    let currentLetter = alphabet[0];
    let reversalData = initialData;
    let loading = false;

    async function loadReversalData(letter: string) {
        if (letter === alphabet[0] && Object.keys(initialData).length > 0) {
            reversalData = initialData;
            return;
        }

        loading = true;
        try {
            const response = await fetch(
                `${base}/reversal/language/english/${letter.toLowerCase()}.json`
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

    async function handleLetterSelect(letter: string) {
        currentLetter = letter;
        await loadReversalData(letter);
    }
</script>

<div class="flex flex-col h-full">
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
                                {#if i < entries.length - 1},
                                {/if}
                            </span>
                        {/each}
                    </div>
                </div>
            {:else}
                <div class="p-4 text-center text-gray-500">No entries found for this letter</div>
            {/each}
        </div>
    {/if}
</div>
