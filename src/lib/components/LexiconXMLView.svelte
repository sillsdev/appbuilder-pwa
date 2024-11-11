<script>
    import { base } from '$app/paths';

    export let initialData = {};

    let reversalData = initialData;
    let loading = false;

</script>

<div class="flex flex-col h-full">

    {#if loading}
        <div class="flex-1 flex items-center justify-center">
            <div class="loading loading-spinner loading-lg"></div>
        </div>
    {:else}
        <div class="flex-1 overflow-y-auto px-4">
            {#each Object.entries(reversalData) as [english, entries]}
                <div class="py-2 border-b">
                    <div class="text-lg font-medium">{english}</div>
                    <div class="pl-4 text-base text-gray-600">
                        {#each entries as entry, i}
                            <span>
                                {entry.name}
                                {#if entry.homonym_index > 0}
                                    <sub>{entry.homonym_index}</sub>
                                {/if}
                            </span>
                        {/each}
                    </div>
                </div>
            {/each}
        </div>
    {/if}
</div>
