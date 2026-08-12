<script lang="ts">
    import { scriptureConfig } from '$assets/config';
    import Navbar from '$lib/components/Navbar.svelte';
    import { getAudioSourceInfo, getAudioSourceType } from '$lib/data/audio';
    import { removeAudioFile } from '$lib/data/audioFilesDB';
    import { actionBarColor, t, theme, themeIsDark } from '$lib/data/stores';
    import { DownloadIcon } from '$lib/icons';
    import ChevronIcon from '$lib/icons/ChevronIcon.svelte';
    import DeleteIcon from '$lib/icons/DeleteIcon.svelte';
    import DownloadDoneIcon from '$lib/icons/DownloadDoneIcon.svelte';
    import { onMount } from 'svelte';

    type ChaptersInfo = { number: number; type: string; selected: boolean };

    type BookInfo = {
        name: string;
        id: string;
        numDownloaded: number;
        numToDownload: number;
        chapters: ChaptersInfo[];
        containedInApp: boolean;
        selected: boolean;
    };
    type CollectionInfo = {
        name: string;
        id: string;
        docSet: string;
        numDownloaded: number;
        numToDownload: number;
        books: BookInfo[];
    };

    let downloadItems: CollectionInfo[] = $state([]);
    onMount(async () => {
        if (scriptureConfig?.bookCollections) {
            for (const collection of scriptureConfig.bookCollections) {
                if (collection.books) {
                    let numDownloaded = 0;
                    let numToDownload = 0;
                    const books: BookInfo[] = [];
                    for (const book of collection.books) {
                        let bookInfo: BookInfo = {
                            name: book.name,
                            id: book.id,
                            numDownloaded: 0,
                            numToDownload: 0,
                            chapters: [],
                            containedInApp: true,
                            selected: false
                        };
                        for (const audio of book.audio) {
                            const audioSourceType = getAudioSourceType({
                                collection: collection.id,
                                book: book.id,
                                chapter: '' + audio.num
                            });
                            if (audioSourceType === 'assets') {
                                bookInfo.numDownloaded++;
                                numDownloaded++;
                                bookInfo.chapters.push({
                                    number: audio.num,
                                    type: 'local',
                                    selected: false
                                }); //This would be the type that says, "Contained in app"
                            } else {
                                bookInfo.containedInApp = false;
                                const audioSourceInfo = await getAudioSourceInfo({
                                    collection: collection.id,
                                    book: book.id,
                                    chapter: '' + audio.num
                                });
                                if (!audioSourceInfo?.isRemoteFile) {
                                    bookInfo.numDownloaded++;
                                    numDownloaded++;
                                    bookInfo.chapters.push({
                                        number: audio.num,
                                        type: 'downloaded',
                                        selected: false
                                    }); //This would be the type that says when it was downloaded (Or in the PWA, probably just "Downloaded")
                                } else {
                                    bookInfo.chapters.push({
                                        number: audio.num,
                                        type: 'remote',
                                        selected: false
                                    }); //This would be the type that says, "Not downloaded yet".
                                }
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
                            docSet: collection.languageCode + '_' + collection.id,
                            id: collection.id,
                            numDownloaded,
                            numToDownload,
                            books: books
                        });
                    }
                }
            }
        }
    });
    $effect(() => {
        if (currentState === 'collection' && currentCollection) {
            const eligible = currentCollection.books.filter((b) => !b.containedInApp);
            const allSelected = eligible.length > 0 && eligible.every((b) => b.selected);

            selectAll = allSelected;
        } else if (currentState === 'book' && currentBook) {
            const eligible = currentBook.chapters.filter(
                (c) => c.type === 'remote' || c.type === 'downloaded' || c.type === 'waiting'
            );
            const allSelected = eligible.length > 0 && eligible.every((b) => b.selected);

            selectAll = allSelected;
        }
    });
    function toggleSelectAll() {
        selectAll = !selectAll;
        if (currentState === 'collection' && currentCollection) {
            for (const book of currentCollection.books) {
                if (!book.containedInApp) {
                    book.selected = selectAll;
                }
            }
        } else if (currentState === 'book' && currentBook) {
            for (const chapter of currentBook.chapters) {
                if (
                    chapter.type === 'remote' ||
                    chapter.type === 'downloaded' ||
                    chapter.type === 'waiting'
                ) {
                    chapter.selected = selectAll;
                }
            }
        }
    }
    let currentState = $state('root'); //root, collection, or book
    let currentCollection: CollectionInfo | undefined = $state();
    let currentBook: BookInfo | undefined = $state();
    let selectAll = $state(false);
    navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data.type === 'DOWNLOAD_FINISHED') {
            const downloadedItem = event.data.item;
            const collection = downloadItems.find((c) => c.id === downloadedItem.collectionId);
            const book = collection?.books.find((b) => b.id === downloadedItem.bookId);
            const chapter = book?.chapters.find((c) => c.number === downloadedItem.chapter);
            if (chapter && chapter.type !== 'downloaded') {
                chapter.type = 'downloaded';
                book!.numDownloaded++;
                collection!.numDownloaded++;
            }
        } else if (event.data.type === 'DOWNLOAD_FAILED') {
            const downloadedItem = event.data.item;
            const collection = downloadItems.find((c) => c.id === downloadedItem.collectionId);
            const book = collection?.books.find((b) => b.id === downloadedItem.bookId);
            const chapter = book?.chapters.find((c) => c.number === downloadedItem.chapter);
            if (chapter && chapter.type !== 'downloaded') {
                chapter.type = 'remote';
            }
        }
    });
    function replacePlaceholders(str: string, placeholders: string[]) {
        let i = 0;
        return str.replace(/%d/g, () => placeholders[i++]);
    }
    function deleteSelected() {
        if (currentState === 'collection') {
            currentCollection?.books
                .filter((b) => b.selected && !b.containedInApp)
                .forEach((book) => {
                    book.selected = false;
                    book.chapters
                        .filter((c) => c.type === 'downloaded')
                        .forEach((chapter) => {
                            removeAudioFile({
                                collection: currentCollection!.id,
                                book: book.id,
                                chapter: chapter.number + ''
                            }).then(() => {
                                chapter.type = 'remote';
                                book.numDownloaded--;
                            });
                        });
                });
        } else if (currentState === 'book') {
            currentBook?.chapters
                .filter((c) => c.selected && c.type === 'downloaded')
                .forEach((chapter) => {
                    chapter.selected = false;
                    removeAudioFile({
                        collection: currentCollection?.id || '',
                        book: currentBook!.id,
                        chapter: chapter.number + ''
                    }).then(() => {
                        chapter.type = 'remote';
                        currentBook!.numDownloaded--;
                    });
                });
        }
    }
    function downloadSelected() {
        if (currentState === 'collection') {
            currentCollection?.books
                .filter((b) => b.selected && !b.containedInApp)
                .forEach((book) => {
                    book.selected = false;
                    book.chapters
                        .filter((c) => c.type === 'remote')
                        .forEach((chapter) => {
                            navigator.serviceWorker?.controller?.postMessage({
                                type: 'START_DOWNLOAD',
                                collectionId: currentCollection?.id,
                                docSet: currentCollection?.docSet,
                                bookId: book.id,
                                chapter: chapter.number
                            });
                        });
                });
        } else if (currentState === 'book') {
            currentBook?.chapters
                .filter((c) => c.selected && c.type === 'remote')
                .forEach((chapter) => {
                    chapter.selected = false;
                    navigator.serviceWorker?.controller?.postMessage({
                        type: 'START_DOWNLOAD',
                        collectionId: currentCollection?.id,
                        docSet: currentCollection?.docSet,
                        bookId: currentBook?.id,
                        chapter: chapter.number
                    });
                    chapter.type = 'waiting';
                });
        }
    }
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
            {#snippet end()}
                {#if (currentState === 'collection' && currentCollection?.books
                        .filter((b) => !b.containedInApp)
                        .some((b) => b.selected)) || (currentState === 'book' && currentBook?.chapters
                            .filter((c) => c.type === 'remote' || c.type === 'downloaded' || c.type === 'waiting')
                            .some((c) => c.selected))}
                    <button class="dy-btn-sm dy-btn-ghost" onclick={deleteSelected}>
                        <DeleteIcon color={$actionBarColor} />
                    </button>
                    <button class="dy-btn-sm dy-btn-ghost" onclick={downloadSelected}>
                        <DownloadIcon color={$actionBarColor} />
                    </button>
                {/if}
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
                        selectAll = false;
                        currentCollection = item;
                        currentState = 'collection';
                    }}
                >
                    <div class="w-[20%]"></div>
                    <div class="w-full">
                        <div class="download-item-name">{item.name}</div>

                        <div class="download-item-info">
                            {replacePlaceholders($t['Download_Downloaded_X_Of_Y'], [
                                item.numDownloaded + '',
                                item.numToDownload + ''
                            ])}
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
                {#if currentCollection.books.some((b) => !b.containedInApp)}
                    <div class="download-select-all-items flex">
                        <div class="download-checkbox">
                            <input
                                type="checkbox"
                                class="dy-checkbox dy-checkbox-neutral appearance-none bg-white border-black
         checked:bg-black text-white"
                                class:invert={themeIsDark($theme)}
                                bind:checked={selectAll}
                                onclick={toggleSelectAll}
                            />
                        </div>
                        <div>{$t['Download_Select_All']}</div>
                    </div>
                {/if}
                {#each currentCollection.books as item}
                    <!-- svelte-ignore a11y_click_events_have_key_events -->
                    <!-- svelte-ignore a11y_no_static_element_interactions -->
                    <div
                        class="download-item flex !ps-0 {item.selected
                            ? 'download-item-selected'
                            : ''}"
                        onclick={() => {
                            selectAll = false;
                            currentBook = item;
                            currentState = 'book';
                        }}
                    >
                        <div class="w-[20%] flex items-center justify-center p-0">
                            {#if !item.containedInApp}
                                <input
                                    type="checkbox"
                                    class="dy-checkbox dy-checkbox-neutral appearance-none bg-white border-black
         checked:bg-black text-white"
                                    class:invert={themeIsDark($theme)}
                                    bind:checked={item.selected}
                                    onclick={(event) => event.stopPropagation()}
                                />
                            {/if}
                        </div>
                        <div class="w-full">
                            <div class="download-item-name">{item.name}</div>

                            <div class="download-item-info">
                                {item.containedInApp
                                    ? $t['Download_Contained_In_App']
                                    : replacePlaceholders($t['Download_Downloaded_X_Of_Y'], [
                                          item.numDownloaded + '',
                                          item.numToDownload + ''
                                      ])}
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
        {:else if currentState === 'book'}
            {#if currentBook}
                <div class="download-title">
                    {currentBook.name}
                </div>
                {#if currentBook.chapters.some((c) => c.type === 'remote' || c.type === 'downloaded' || c.type === 'waiting')}
                    <div class="download-select-all-items flex">
                        <div class="download-checkbox">
                            <input
                                type="checkbox"
                                class="dy-checkbox dy-checkbox-neutral appearance-none bg-white border-black
         checked:bg-black text-white"
                                class:invert={themeIsDark($theme)}
                                checked={selectAll}
                                onclick={toggleSelectAll}
                            />
                        </div>
                        <div>{$t['Download_Select_All']}</div>
                    </div>
                {/if}
                {#each currentBook.chapters as item}
                    <!-- svelte-ignore a11y_click_events_have_key_events -->
                    <!-- svelte-ignore a11y_no_static_element_interactions -->
                    <div
                        class="download-item flex !ps-0 {item.selected
                            ? 'download-item-selected'
                            : ''}"
                    >
                        <div class="w-[20%] flex items-center justify-center p-0">
                            {#if item.type === 'remote' || item.type === 'downloaded' || item.type === 'waiting'}
                                <input
                                    type="checkbox"
                                    class="dy-checkbox dy-checkbox-neutral appearance-none bg-white border-black
         checked:bg-black text-white"
                                    class:invert={themeIsDark($theme)}
                                    bind:checked={item.selected}
                                />
                            {/if}
                        </div>
                        <div class="w-full">
                            <div class="download-item-name">
                                {currentBook.name + ' ' + item.number}
                            </div>

                            <div class="download-item-info">
                                {item.type === 'local'
                                    ? $t['Download_Contained_In_App']
                                    : item.type === 'remote'
                                      ? $t['Download_Not_Downloaded_Yet']
                                      : item.type === 'waiting'
                                        ? $t['Download_Waiting_To_Download']
                                        : $t['Download_Downloaded']}
                            </div>
                            <div class="download-item-progress h-1 w-[95%]">
                                {#if item.type === 'local' || item.type === 'downloaded'}
                                    <div
                                        class="download-item-progress-bar h-full"
                                        style="width:100%;"
                                    ></div>
                                {/if}
                            </div>
                        </div>
                        <div class="flex items-center" class:invert={themeIsDark($theme)}>
                            {#if item.type === 'local' || item.type === 'downloaded'}
                                <DownloadDoneIcon></DownloadDoneIcon>
                            {/if}
                        </div>
                    </div>
                {/each}
            {/if}
        {/if}
    </div>
</div>
