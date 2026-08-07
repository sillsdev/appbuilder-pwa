<script lang="ts">
    import { scriptureConfig } from '$assets/config';
    import Navbar from '$lib/components/Navbar.svelte';
    import { getAudioSourceInfo } from '$lib/data/audio';
    import { t, theme, themeIsDark } from '$lib/data/stores';
    import ChevronIcon from '$lib/icons/ChevronIcon.svelte';
    import { onMount } from 'svelte';

    type ChaptersInfo = { number: number; type: string };

    type BookInfo = {
        name: string;
        numDownloaded: number;
        numToDownload: number;
        chapters: ChaptersInfo[];
    };
    type CollectionInfo = {
        name: string;
        numDownloaded: number;
        numToDownload: number;
        books: BookInfo[];
    };

    let downloadItems: CollectionInfo[] = $state([]);
    onMount(async () => {
        if (scriptureConfig?.bookCollections) {
            for (const collection of scriptureConfig?.bookCollections) {
                if (collection.books) {
                    let numDownloaded = 0;
                    let numToDownload = 0;
                    const books: BookInfo[] = [];
                    for (const book of collection.books) {
                        let bookInfo: BookInfo = {
                            name: book.name,
                            numDownloaded: 0,
                            numToDownload: 0,
                            chapters: []
                        };
                        for (const audio of book.audio) {
                            const audioSourceInfo = await getAudioSourceInfo({
                                collection: collection.id,
                                book: book.id,
                                chapter: '' + audio.num
                            });
                            if (!audioSourceInfo?.isRemoteFile) {
                                bookInfo.numDownloaded++;
                                numDownloaded++;
                                bookInfo.chapters.push({ number: audio.num, type: 'local' }); //This would be the type that says, "Contained in app", but it would also include the ones that say when it was downloaded. Right now, I don't have a distinction.
                            } else {
                                bookInfo.chapters.push({ number: audio.num, type: 'remote' }); //This would be the type that says, "Not downloaded yet".
                            }
                        }
                        if (book.audio.length > 0) {
                            bookInfo.numToDownload += book.audio.length;
                            numToDownload += book.audio.length;
                            books.push(bookInfo);
                        }
                    }
                    if (numToDownload > 0) {
                        downloadItems.push({
                            name: collection.collectionName || '',
                            numDownloaded,
                            numToDownload,
                            books: books
                        });
                    }
                }
            }
        }
    });
    let currentState = $state('root'); //root, collection, or book
    let currentCollection: CollectionInfo | undefined = $state();
    let currentBook: string | undefined = $state();
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
        {#if currentState === 'root'}
            <div class="download-title">
                {$t['Download_Title']}
            </div>
            {#each downloadItems as item}
                <!-- svelte-ignore a11y_click_events_have_key_events -->
                <!-- svelte-ignore a11y_no_static_element_interactions -->
                <div
                    class="download-item flex"
                    onclick={() => {
                        currentCollection = item;
                        currentState = 'collection';
                    }}
                >
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
        {:else if currentState === 'collection'}
            {#if currentCollection}
                <div class="download-title">
                    {currentCollection.name}
                </div>
                <div class="download-select-all-items flex">
                    <div class="download-checkbox">
                        <input
                            type="checkbox"
                            class="dy-checkbox dy-checkbox-neutral appearance-none bg-white border-black
         checked:bg-black text-white"
                            class:invert={themeIsDark($theme)}
                        />
                    </div>
                    <div>{$t['Download_Select_All']}</div>
                </div>
                {#each currentCollection.books as item}
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
                                    style="width:{(item.numDownloaded * 100) /
                                        item.numToDownload}%;"
                                ></div>
                            </div>
                        </div>
                        <div class="flex items-center" class:invert={themeIsDark($theme)}>
                            <ChevronIcon></ChevronIcon>
                        </div>
                    </div>
                {/each}
            {/if}
        {/if}
    </div>
</div>
