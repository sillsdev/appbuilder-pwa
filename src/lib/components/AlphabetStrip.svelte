<script lang="ts">
    export let alphabet: string[];
    export let activeLetter: string;
    export let onLetterSelect: (letter: string) => void;
</script>

<div class="tabs tabs-boxed bg-base-200 sticky top-0 overflow-x-auto whitespace-nowrap">
    {#each alphabet as letter}
        <button
            class="tab {activeLetter === letter ? 'tab-active' : ''}"
            on:click={() => onLetterSelect(letter)}
        >
            {letter}
        </button>
    {/each}
</div>
