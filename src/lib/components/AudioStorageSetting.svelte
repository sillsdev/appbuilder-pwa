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

    // The AudioSource.folder subdirectory name(s) audio is actually written
    // into, under whichever root folder the user picks. `audio.sources` also
    // holds non-audio (e.g. video) entries that happen to have a `folder`,
    // so this must match the same "downloadable audio" filter addAudioFile
    // and setting.ts use, not just "has a folder".
    const audioSubfolders = Array.from(
        new Set(
            Object.values(scriptureConfig.audio?.sources ?? {})
                .filter((source) => source.accessMethods?.includes('download'))
                .map((source) => source.folder)
                .filter((folder): folder is string => !!folder)
        )
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

    // The path shown to the user for the connected state: the chosen root
    // folder's name plus the subfolder(s) audio is actually saved into -
    // never just the root folder name, which wouldn't tell them where their
    // files actually end up.
    let connectedPath = $derived(
        status.folderName
            ? audioSubfolders.length
                ? audioSubfolders.map((folder) => `${status.folderName}/${folder}`).join(', ')
                : status.folderName
            : ''
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
                {connectedPath}
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
