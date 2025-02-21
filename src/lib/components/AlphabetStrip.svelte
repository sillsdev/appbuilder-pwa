<script lang="ts">
    export let alphabet: string[];
    export let activeLetter: string;
    export let onLetterSelect: (letter: string) => void;
</script>

<div
    class="alphabet-scroll flex m-2 gap-1 md:gap-2 mb-4 justify-start overflow-x-auto whitespace-nowrap pb-2 snap-x"
>
    {#each alphabet as letter}
        <button
            class="px-2 py-1 text-xs font-bold border rounded-md bg-gray-100 hover:bg-gray-200 cursor-pointer snap-start
            {activeLetter === letter ? 'bg-[#bb9ac2] border-black' : ''}
            sm:text-sm sm:px-3 sm:py-2
            md:text-base md:px-4 md:py-2"
            on:click={() => onLetterSelect(letter)}
        >
            {letter}
        </button>
    {/each}
</div>
