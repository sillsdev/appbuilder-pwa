<!--
@component
Settings row that lets the user connect, change, or disconnect the on-device
music folder that downloaded audio is saved to (via the File System Access
API), falling back to IndexedDB storage when disconnected.
-->
<script lang="ts">
    import { scriptureConfig } from '$assets/config';
    import {
        clearStoredMusicDirHandle,
        getMusicDirStatus,
        getStoredMusicDirHandle,
        pickMusicDirectory,
        requestMusicDirPermission,
        STORAGE_CHOICE_KEY
    } from '$lib/data/audioFileSystem';
    import { t } from '$lib/data/stores';
    import { onMount } from 'svelte';

    // Every `src` key actually referenced by a chapter's audio entry, across
    // all book collections/books and their book tabs. A source not used by
    // any chapter shouldn't be shown here even if it's otherwise
    // download-capable and has a folder configured.
    const usedAudioSrcKeys = new Set(
        (scriptureConfig.bookCollections ?? []).flatMap((collection) =>
            collection.books.flatMap((book) => [
                ...book.audio.map((audio) => audio.src),
                ...(book.bookTabs?.tabs.flatMap((tab) => tab.audio.map((audio) => audio.src)) ?? [])
            ])
        )
    );

    // The AudioSource(s) whose folder subdirectory audio is actually written
    // into, under whichever root folder the user picks. `audio.sources` also
    // holds non-audio (e.g. video) entries and sources no chapter references,
    // so this must match download folders ('download' type) and pre-placed
    // folders ('folder' type, not yet implemented elsewhere) - not
    // accessMethods, which is about download-vs-stream choice, a separate
    // concern from whether a source writes to an on-device folder. Deduped
    // by name+folder since distinct source keys can otherwise describe the
    // same folder.
    const audioSources = Array.from(
        new Map(
            Object.entries(scriptureConfig.audio?.sources ?? {})
                .filter(
                    (entry): entry is [string, (typeof entry)[1] & { folder: string }] =>
                        usedAudioSrcKeys.has(entry[0]) &&
                        !!entry[1].folder &&
                        (entry[1].type === 'download' || entry[1].type === 'folder')
                )
                .map(([, source]) => [JSON.stringify([source.name, source.folder]), source])
        ).values()
    );

    interface Props {
        setting: App.UserPreferenceSetting;
        fontSize: string;
    }
    let { setting, fontSize }: Props = $props();

    let status: {
        connected: boolean;
        folderName?: string;
        needsPermission?: boolean;
    } = $state({ connected: false });

    // The path(s) shown to the user for the connected state: the chosen root
    // folder's name plus the subfolder audio is actually saved into for each
    // AudioSource - never just the root folder name, which wouldn't tell them
    // where their files actually end up, and never a bare comma-joined list,
    // which doesn't say which folder belongs to which source.
    let connectedLines = $derived(
        status.folderName
            ? audioSources.length
                ? audioSources.map(
                      (source) => `${source.name}: ${status.folderName}/${source.folder}`
                  )
                : [status.folderName]
            : []
    );

    async function refreshStatus() {
        status = await getMusicDirStatus();
    }

    onMount(refreshStatus);

    async function chooseFolder() {
        const handle = await pickMusicDirectory();
        if (handle) {
            localStorage.setItem(STORAGE_CHOICE_KEY, 'enabled');
        }
        await refreshStatus();
    }

    async function reconnect() {
        const handle = await getStoredMusicDirHandle();
        if (handle) {
            await requestMusicDirPermission(handle, 'readwrite');
        }
        await refreshStatus();
    }

    async function disconnect() {
        await clearStoredMusicDirHandle();
        localStorage.setItem(STORAGE_CHOICE_KEY, 'declined');
        await refreshStatus();
    }
</script>

<div class="dy-form-control settings-item w-full max-w-lg">
    <div class="settings-title py-0">
        <div style:font-size="{fontSize}%">
            {$t[setting.title] || setting.title}
        </div>
    </div>
    <div class="settings-summary py-0 flex items-center justify-between gap-2">
        <div style:font-size="{fontSize}%">
            {#if status.connected && status.needsPermission}
                {$t['Settings_Audio_Storage_Needs_Permission'] || 'Permission needed'}
            {:else if status.connected}
                {#each connectedLines as line}
                    <div>{line}</div>
                {/each}
            {:else}
                {$t['Settings_Audio_Storage_Not_Connected'] || 'Not connected'}
            {/if}
        </div>
        {#if !status.connected}
            <button type="button" class="dy-btn dy-btn-sm" onclick={chooseFolder}>
                {$t['Settings_Audio_Storage_Choose'] || 'Choose folder'}
            </button>
        {:else if status.needsPermission}
            <button type="button" class="dy-btn dy-btn-sm" onclick={reconnect}>
                {$t['Settings_Audio_Storage_Reconnect'] || 'Reconnect'}
            </button>
        {:else}
            <div class="flex items-center gap-2">
                <button type="button" class="dy-btn dy-btn-sm" onclick={chooseFolder}>
                    {$t['Settings_Audio_Storage_Change'] || 'Change'}
                </button>
                <button type="button" class="dy-btn dy-btn-sm" onclick={disconnect}>
                    {$t['Settings_Audio_Storage_Disconnect'] || 'Stop'}
                </button>
            </div>
        {/if}
    </div>
    {#if setting.summary}
        <div class="settings-summary py-0">
            <div style:font-size="{fontSize}%">
                {$t[setting.summary]}
            </div>
        </div>
    {/if}
</div>
