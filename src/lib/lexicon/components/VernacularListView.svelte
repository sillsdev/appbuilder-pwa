<script lang="ts">
    import type { SelectedWord, VernacularWord } from '$lib/data/stores/lexicon.svelte';

    interface Props {
        vernacularWordsList: VernacularWord[];
        onSelectWord: (word: SelectedWord) => void;
    }
    let { vernacularWordsList, onSelectWord }: Props = $props();
</script>

<ul class="space-y-3 px-4 pb-4" style="background-color: var(--BackgroundColor);">
    {#each vernacularWordsList as { id, name, homonym_index, type, num_senses, summary, letter }}
        <li class="cursor-pointer text-lg mb-3 scroll-mt-16" id="letter-{letter}">
            <button
                type="button"
                class="w-full text-left py-1"
                aria-label={`Select word ${name}`}
                style="color: var(--TextColor); border-bottom: 1px solid var(--SettingsSeparatorColor);"
                onclick={() => onSelectWord({ word: name, index: id })}
                onkeydown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                        onSelectWord({ word: name, index: id });
                        event.preventDefault();
                    }
                }}
            >
                <p class="font-bold break-words" style="color: var(--TextColor);">
                    {name}{#if homonym_index > 0}<sub>{homonym_index}</sub>{/if}
                </p>
                {#if summary}
                    <p class="ml-4 italic" style="color: var(--TextColor2);">
                        {#each summary.match(/{(.*?)}/g) || [] as match}
                            {match.replace(/[{}]/g, '')}
                        {/each}
                    </p>
                {/if}
            </button>
        </li>
    {/each}
</ul>
