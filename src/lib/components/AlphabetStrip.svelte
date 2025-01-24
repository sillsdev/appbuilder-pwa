<script lang="ts">
    export let alphabet: string[];
    export let activeLetter: string;
    export let onLetterSelect: (letter: string) => void;
</script>

<div class="alphabet-scroll flex gap-2 mb-4 justify-start overflow-x-auto whitespace-nowrap pb-4">
    {#each alphabet as letter}
        <button
            class="px-3 py-2 text-sm font-bold border rounded-md bg-gray-100 hover:bg-gray-200 cursor-pointer 
            {activeLetter === letter ? 'bg-[#bb9ac2] border-black' : ''}
            sm:text-base sm:px-4 sm:py-3 md:text-lg md:px-5 md:py-4"
            on:click={() => onLetterSelect(letter)}
        >
            {letter}
        </button>
    {/each}
</div>