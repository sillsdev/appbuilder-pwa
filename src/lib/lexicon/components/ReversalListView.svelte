<script lang="ts">
    import type { ReversalWord } from '$lib/data/stores/lexicon.svelte';

    interface Props {
        reversalWordsList: ReversalWord[];
        onSelectWord: (word: ReversalWord) => void;
    }

    let { reversalWordsList, onSelectWord }: Props = $props();
</script>

<ul class="space-y-3 px-4 pb-4" style="background-color: var(--BackgroundColor);">
    {#each reversalWordsList as word}
        <li class="cursor-pointer text-lg mb-3" id="letter-{word.letter}">
            <button
                type="button"
                class="w-full text-left py-1"
                aria-label={`Select word ${word}`}
                style="color: var(--TextColor); border-bottom: 1px solid var(--SettingsSeparatorColor);"
                onclick={() => onSelectWord(word)}
                onkeydown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                        onSelectWord(word);
                        event.preventDefault();
                    }
                }}
            >
                <p class="font-bold break-words" style="color: var(--TextColor);">{word.word}</p>
                <p class="text-md ml-4" style="color: var(--TextColor);">
                    {#each word.vernacularWords as { name, homonymIndex }, i}
                        {#if i > 0},
                        {/if}
                        <span style="color: var(--TextColor);"
                            >{name}{#if homonymIndex > 0}<sub>{homonymIndex}</sub>{/if}</span
                        >
                    {/each}
                </p>
            </button>
        </li>
    {/each}
</ul>
