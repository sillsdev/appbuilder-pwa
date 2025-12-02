<script lang="ts">
    import type { SelectedWord, VernacularWord } from '$lib/data/stores/lexicon.svelte';

    interface Props {
        vernacularWordsList: VernacularWord[];
        onSelectWord: (word: SelectedWord) => void;
    }
    let { vernacularWordsList, onSelectWord }: Props = $props();
</script>

<ul class="space-y-3 px-4 pb-4" style="background-color: var(--BackgroundColor);">
    {#each vernacularWordsList as word}
        <li class="cursor-pointer text-lg mb-3 scroll-mt-16" id="letter-{word.letter}">
            <button
                type="button"
                class="w-full text-left py-1"
                aria-label={`Select word ${word.name}`}
                style="color: var(--TextColor); border-bottom: 1px solid var(--SettingsSeparatorColor);"
                onclick={() => onSelectWord({ word: word.name, index: word.id })}
                onkeydown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                        onSelectWord({ word: word.name, index: word.id });
                        event.preventDefault();
                    }
                }}
            >
                <p class="font-bold break-words" style="color: var(--TextColor);">
                    {word.name}{#if word.homonym_index > 0}<sub>{word.homonym_index}</sub>{/if}
                </p>
                {#if word.summary}
                    {@const matches = word.summary.match(/{(.*?)}/g) || []}
                    <p class="ml-4" style="color: var(--TextColor2);">
                        {#if matches.length}
                            <span class="italic">
                                {#each matches as match}
                                    {match.replace(/[{}]/g, '')}
                                {/each}
                            </span>
                        {/if}
                        {word.summary.replaceAll(/{(.*?)}/g, '')}
                    </p>
                {/if}
            </button>
        </li>
    {/each}
</ul>
