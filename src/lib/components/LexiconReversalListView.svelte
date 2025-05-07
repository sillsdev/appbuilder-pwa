<script>
    export let reversalWordsList;
    export let onSelectWord;
</script>

<ul class="space-y-3 px-4 pb-4" style="background-color: var(--BackgroundColor);">
    {#each reversalWordsList as { word, indexes, vernacularWords, letter }}
        <li class="cursor-pointer text-lg mb-3" id="letter-{letter}">
            <button
                type="button"
                class="w-full text-left py-1"
                aria-label={`Select word ${word}`}
                style="color: var(--TextColor); border-bottom: 1px solid var(--SettingsSeparatorColor);"
                on:click={() => onSelectWord({ word, indexes })}
                on:keydown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                        onSelectWord({ word, indexes });
                        event.preventDefault();
                    }
                }}
            >
                <p class="font-bold break-words" style="color: var(--TextColor);">{word}</p>
                <p class="text-md ml-4" style="color: var(--TextColor);">
                    {#each vernacularWords as { name, homonymIndex }, i}
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
