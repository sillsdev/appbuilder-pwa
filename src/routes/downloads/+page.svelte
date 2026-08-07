<script lang="ts">
    import { scriptureConfig } from '$assets/config';
    import Navbar from '$lib/components/Navbar.svelte';
    import { getAudioSourceInfo } from '$lib/data/audio';
    import { t, theme, themeIsDark } from '$lib/data/stores';
    import ChevronIcon from '$lib/icons/ChevronIcon.svelte';
    import { onMount } from 'svelte';

    let downloadItems: { name: string; numDownloaded: number; numToDownload: number }[] = $state(
        []
    );
    onMount(async () => {
        if (scriptureConfig?.bookCollections) {
            for (const collection of scriptureConfig?.bookCollections) {
                if (collection.books) {
                    let numDownloaded = 0;
                    let numToDownload = 0;
                    for (const book of collection.books) {
                        if (book.audio.length > 0) {
                            numToDownload += book.audio.length;
                        }
                        for (const audio of book.audio) {
                            const audioSourceInfo = await getAudioSourceInfo({
                                collection: collection.id,
                                book: book.id,
                                chapter: '' + audio.num
                            });
                            if (!audioSourceInfo?.isRemoteFile) {
                                numDownloaded++;
                            }
                        }
                    }
                    if (numToDownload > 0) {
                        downloadItems.push({
                            name: collection.collectionName || '',
                            numDownloaded,
                            numToDownload
                        });
                    }
                }
            }
        }
    });
</script>

<div class="grid grid-rows-[auto_1fr]" style="height:100vh;height:100dvh;">
    <div class="navbar">
        <Navbar>
            {#snippet center()}
                <label for="sidebar">
                    <div class="dy-btn dy-btn-ghost normal-case text-xl">
                        {$t['Menu_Downloads']}
                    </div>
                </label>
            {/snippet}
        </Navbar>
    </div>
    <div id="container" class="downloads">
        <div class="download-title">
            {$t['Download_Title']}
        </div>
        {#each downloadItems as item}
            <div class="download-item flex">
                <div class="w-[20%]"></div>
                <div class="w-full">
                    <div class="download-item-name">{item.name}</div>

                    <div class="download-item-info">
                        Downloaded {item.numDownloaded} of {item.numToDownload}
                    </div>
                    <div class="download-item-progress h-1 w-[95%]">
                        <div
                            class="download-item-progress-bar h-full"
                            style="width:{(item.numDownloaded * 100) / item.numToDownload}%;"
                        ></div>
                    </div>
                </div>
                <div class="flex items-center" class:invert={themeIsDark($theme)}>
                    <ChevronIcon></ChevronIcon>
                </div>
            </div>
        {/each}
    </div>
</div>
