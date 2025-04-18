<script lang="ts">
    export let alphabet: string[];
    export let activeLetter: string;
    export let onLetterSelect: (letter: string) => void;
</script>

<div
    class="flex m-2 gap-1 md:gap-2 mb-4 justify-start overflow-x-auto whitespace-nowrap pb-2 snap-x"
>
    {#each alphabet as letter}
        <button
            class="px-3 py-2 text-sm font-bold border rounded-md bg-gray-100 hover:bg-gray-200 cursor-pointer snap-start
            sm:px-4 sm:py-3 sm:text-base
            md:px-5 md:py-4 md:text-base
            lg:px-6 lg:py-4 lg:text-lg"
            style={activeLetter === letter
                ? 'background-color: var(--TitleBackgroundColor); border-color: black;'
                : ''}
            on:click={() => onLetterSelect(letter)}
        >
            {letter}
        </button>
    {/each}
</div>
