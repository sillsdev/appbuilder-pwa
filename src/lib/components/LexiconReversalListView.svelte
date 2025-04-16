<script>
    export let reversalWordsList;
    export let onSelectWord;
</script>

<ul class="space-y-3 px-4 pb-4">
    {#each reversalWordsList as { word, indexes, vernacularWords, letter }}
        <li class="cursor-pointer text-lg mb-3" id="letter-{letter}">
            <button
                type="button"
                class="w-full text-left py-1"
                aria-label={`Select word ${word}`}
                on:click={() => onSelectWord({ word, indexes })}
                on:keydown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                        onSelectWord({ word, indexes });
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
</ul>
