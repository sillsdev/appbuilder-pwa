<script>
    export let selectedLanguage;
    export let vernacularLanguage;
    export let vernacularWordsList;
    export let reversalWordsList;
    export let selectWord;
</script>

<ul class="space-y-3">
    {#if selectedLanguage === vernacularLanguage}
        {#each vernacularWordsList as { id, name, homonym_index, type, num_senses, summary, letter }}
            <li class="cursor-pointer text-lg mb-3" id="letter-{letter}">
                <button
                    type="button"
                    class="w-full text-left py-1"
                    aria-label={`Select word ${name}`}
                    on:click={() => selectWord({ word: name, index: id })}
                    on:keydown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                            selectWord({ word: name, index: id });
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
    {:else}
        {#each reversalWordsList as { word, indexes, vernacularWords, letter }}
            <li class="cursor-pointer text-lg mb-3" id="letter-{letter}">
                <button
                    type="button"
                    class="w-full text-left py-1"
                    aria-label={`Select word ${word}`}
                    on:click={() => selectWord({ word, indexes })}
                    on:keydown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                            selectWord({ word, indexes });
                            event.preventDefault();
                        }
                    }}
                >
                    <p class="font-bold break-words">{word}</p>
                    <p class="text-md ml-4">
                        {#each vernacularWords as { name, homonymIndex }, i}
                            {#if i > 0},
                            {/if}
                            {name}{#if homonymIndex > 0}<sub>{homonymIndex}</sub>{/if}
                        {/each}
                    </p>
                </button>
            </li>
        {/each}
    {/if}
</ul>
