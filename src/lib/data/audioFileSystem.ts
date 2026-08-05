import { openDB, type DBSchema } from 'idb';

interface DirectoryHandles extends DBSchema {
    directoryHandles: {
        key: string;
        value: { id: string; handle: FileSystemDirectoryHandle };
    };
}

const MUSIC_DIR_ID = 'musicDir';

let handleDB: Awaited<ReturnType<typeof openDB<DirectoryHandles>>> | null = null;
async function openHandleDB() {
    if (!handleDB) {
        handleDB = await openDB<DirectoryHandles>('audioFileSystem', 1, {
            upgrade(db) {
                db.createObjectStore('directoryHandles', { keyPath: 'id' });
            }
        });
    }
    return handleDB;
}

export function isFileSystemAccessSupported(): boolean {
    return typeof window !== 'undefined' && 'showDirectoryPicker' in window;
}

export async function getStoredMusicDirHandle(): Promise<FileSystemDirectoryHandle | undefined> {
    const db = await openHandleDB();
    const record = await db.get('directoryHandles', MUSIC_DIR_ID);
    return record?.handle;
}

async function storeMusicDirHandle(handle: FileSystemDirectoryHandle): Promise<void> {
    const db = await openHandleDB();
    await db.put('directoryHandles', { id: MUSIC_DIR_ID, handle });
}

export async function clearStoredMusicDirHandle(): Promise<void> {
    const db = await openHandleDB();
    await db.delete('directoryHandles', MUSIC_DIR_ID);
}

/**
 * Opens the OS directory picker. Must be called from a user-gesture handler
 * (e.g. a click), or the browser will reject the call.
 */
export async function pickMusicDirectory(): Promise<FileSystemDirectoryHandle | undefined> {
    if (!isFileSystemAccessSupported()) {
        return undefined;
    }
    try {
        const handle = await window.showDirectoryPicker({
            id: 'scripture-audio',
            startIn: 'music',
            mode: 'readwrite'
        });
        await storeMusicDirHandle(handle);
        return handle;
    } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
            return undefined;
        }
        console.error('Error picking music directory:', error);
        return undefined;
    }
}

export async function queryMusicDirPermission(
    handle: FileSystemDirectoryHandle,
    mode: FileSystemPermissionMode
): Promise<PermissionState> {
    try {
        return await handle.queryPermission({ mode });
    } catch (error) {
        console.error('Error querying music directory permission:', error);
        return 'denied';
    }
}

/**
 * Must be called from a user-gesture handler, or the browser may reject/no-op the call.
 */
export async function requestMusicDirPermission(
    handle: FileSystemDirectoryHandle,
    mode: FileSystemPermissionMode
): Promise<PermissionState> {
    try {
        return await handle.requestPermission({ mode });
    } catch (error) {
        console.error('Error requesting music directory permission:', error);
        return 'denied';
    }
}

export async function getAudioSubdirHandle(
    musicDirHandle: FileSystemDirectoryHandle,
    folder: string,
    options?: { create?: boolean }
): Promise<FileSystemDirectoryHandle | undefined> {
    try {
        return await musicDirHandle.getDirectoryHandle(folder, {
            create: options?.create ?? false
        });
    } catch (error) {
        console.error(`Error opening audio subdirectory "${folder}":`, error);
        return undefined;
    }
}

export async function writeAudioFile(
    subdirHandle: FileSystemDirectoryHandle,
    filename: string,
    blob: Blob
): Promise<boolean> {
    try {
        const fileHandle = await subdirHandle.getFileHandle(filename, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(blob);
        await writable.close();
        return true;
    } catch (error) {
        console.error(`Error writing audio file "${filename}":`, error);
        return false;
    }
}

async function readAudioFile(
    subdirHandle: FileSystemDirectoryHandle,
    filename: string
): Promise<File | undefined> {
    try {
        const fileHandle = await subdirHandle.getFileHandle(filename);
        return await fileHandle.getFile();
    } catch (error) {
        if (error instanceof DOMException && error.name === 'NotFoundError') {
            return undefined;
        }
        console.error(`Error reading audio file "${filename}":`, error);
        return undefined;
    }
}

/**
 * Status for the Settings UI: whether a music folder is connected, its name,
 * and whether permission needs to be re-granted (e.g. revoked externally).
 */
export async function getMusicDirStatus(): Promise<{
    connected: boolean;
    folderName?: string;
    needsPermission?: boolean;
}> {
    if (!isFileSystemAccessSupported()) {
        return { connected: false };
    }
    const handle = await getStoredMusicDirHandle();
    if (!handle) {
        return { connected: false };
    }
    const permission = await queryMusicDirPermission(handle, 'read');
    if (permission === 'granted') {
        return { connected: true, folderName: handle.name };
    }
    return { connected: true, folderName: handle.name, needsPermission: true };
}

/**
 * Read-path entry point used by playback. Never requests permission (there's
 * no user gesture available here) - if permission isn't already granted, this
 * resolves to undefined so the caller treats the chapter exactly like it was
 * never downloaded.
 */
export async function resolveFilesystemAudioFile(item: {
    folder: string;
    filename: string;
}): Promise<File | undefined> {
    if (!isFileSystemAccessSupported()) {
        return undefined;
    }
    const musicDirHandle = await getStoredMusicDirHandle();
    if (!musicDirHandle) {
        return undefined;
    }
    if ((await queryMusicDirPermission(musicDirHandle, 'read')) !== 'granted') {
        return undefined;
    }
    const subdirHandle = await getAudioSubdirHandle(musicDirHandle, item.folder);
    if (!subdirHandle) {
        return undefined;
    }
    return readAudioFile(subdirHandle, item.filename);
}
