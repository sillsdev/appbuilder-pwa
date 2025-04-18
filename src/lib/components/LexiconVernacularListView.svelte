<script>
    export let vernacularWordsList;
    export let onSelectWord;
</script>

<ul class="space-y-3 px-4 pb-4">
    {#each vernacularWordsList as { id, name, homonym_index, type, num_senses, summary, letter }}
        <li class="cursor-pointer text-lg mb-3 scroll-mt-16" id="letter-{letter}">
            <button
                type="button"
                class="w-full text-left py-1"
                aria-label={`Select word ${name}`}
                on:click={() => onSelectWord({ word: name, index: id })}
                on:keydown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                        onSelectWord({ word: name, index: id });
                        event.preventDefault();
                    }
                }}
            >
                <p class="font-bold break-words">
                    {name}{#if homonym_index > 0}<sub>{homonym_index}</sub>{/if}
                </p>
                {#if summary}
                    <p class="ml-4 italic">
                        {#each summary.match(/{(.*?)}/g) || [] as match}
                            {match.replace(/[{}]/g, '')}
                        {/each}
                    </p>
                {/if}
            </button>
        </li>
    {/each}
</ul>
