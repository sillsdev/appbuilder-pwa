import { createHash } from 'crypto';
import { createReadStream, createWriteStream, existsSync } from 'fs';
import fs from 'fs/promises';
import path from 'path';
import { stdout as output } from 'process';
import { Readable, Transform } from 'stream';
import { pipeline } from 'stream/promises';
import type { ReadableStream as WebReadableStream } from 'stream/web';

export const DEFAULT_INDEX_URL =
    'https://sil-app-builders-pwa-test-files.s3.us-east-1.amazonaws.com/index.json';

export const PROJECT_LISTS = ['projects', 'bloom'] as const;

export type ProjectList = (typeof PROJECT_LISTS)[number];

export type TestProject = {
    name: string;
    description: string;
    file: string;
    size: string;
    size_bytes: number;
    sha1: string;
    tests: string[];
    program: string;
};

export type RemoteFile = {
    url: URL;
    filePath: string;
    sizeBytes: number;
    sha1: string;
};

export async function fetchJson(url: string): Promise<unknown> {
    console.log(`Fetching ${url}...`);
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
    }
    return response.json();
}

function validateEntry(entry: any, where: string, program: string): TestProject {
    const fail = (reason: string) => {
        throw new Error(`Invalid index.json entry ${where}: ${reason}`);
    };
    if (typeof entry !== 'object' || entry === null) {
        fail('not an object');
    }
    for (const key of ['name', 'file', 'size', 'sha1']) {
        if (typeof entry[key] !== 'string' || !entry[key]) {
            fail(`missing "${key}"`);
        }
    }
    if (typeof entry.description !== 'string') {
        fail('"description" must be a string');
    }
    if (
        !/^[\w.-]+(\/[\w.-]+)*\.zip$/.test(entry.file) ||
        entry.file.split('/').some((part: string) => part === '.' || part === '..')
    ) {
        fail(`"file" must be a relative path to a .zip file, got "${entry.file}"`);
    }
    if (!Number.isInteger(entry.size_bytes) || entry.size_bytes <= 0) {
        fail('"size_bytes" must be a positive integer');
    }
    if (!/^[0-9a-f]{40}$/i.test(entry.sha1.trim())) {
        fail('"sha1" is not a SHA-1 hex digest');
    }
    if (!Array.isArray(entry.tests) || entry.tests.some((t: unknown) => typeof t !== 'string')) {
        fail('"tests" must be an array of strings');
    }
    return {
        name: entry.name,
        description: entry.description,
        file: entry.file,
        size: entry.size,
        size_bytes: entry.size_bytes,
        sha1: entry.sha1.trim().toLowerCase(),
        tests: entry.tests,
        program
    };
}

export async function fetchIndex(indexUrl: string, list: ProjectList): Promise<TestProject[]> {
    const data = await fetchJson(indexUrl);
    if (typeof data !== 'object' || data === null || Array.isArray(data)) {
        throw new Error('index.json must be an object keyed by program');
    }
    const projects: TestProject[] = [];
    for (const [program, lists] of Object.entries(data)) {
        if (!/^[a-z]+$/.test(program) || typeof lists !== 'object' || lists === null) {
            throw new Error(`Invalid index.json program "${program}"`);
        }
        for (const [key, entries] of Object.entries(lists)) {
            if (!PROJECT_LISTS.includes(key as ProjectList) || !Array.isArray(entries)) {
                throw new Error(`Invalid index.json list "${program}.${key}"`);
            }
            const validated = entries.map((entry, i) =>
                validateEntry(entry, `${program}.${key}[${i}]`, program)
            );
            if (key === list) {
                projects.push(...validated);
            }
        }
    }
    if (projects.length === 0) {
        throw new Error(`index.json has no "${list}" entries`);
    }
    return projects;
}

export function downloadProject(
    project: TestProject,
    indexUrl: string,
    dir: string
): Promise<string> {
    return downloadFile({
        url: new URL(project.file, indexUrl),
        filePath: path.join(dir, path.basename(project.file)),
        sizeBytes: project.size_bytes,
        sha1: project.sha1
    });
}

export async function hashFile(filePath: string): Promise<string> {
    const hash = createHash('sha1');
    await pipeline(createReadStream(filePath), hash);
    return hash.digest('hex');
}

export function formatMB(bytes: number): string {
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export async function downloadFile(file: RemoteFile): Promise<string> {
    const { url, filePath, sizeBytes, sha1 } = file;
    const name = path.basename(filePath);
    await fs.mkdir(path.dirname(filePath), { recursive: true });

    if (existsSync(filePath)) {
        console.log(`Verifying cached ${name}...`);
        if ((await hashFile(filePath)) === sha1) {
            console.log('Cached file is valid, skipping download.');
            return filePath;
        }
        console.log('Cached file does not match sha1, downloading again.');
        await fs.rm(filePath, { force: true });
    }

    console.log(`Downloading ${url} (${formatMB(sizeBytes)})...`);
    const response = await fetch(url);
    if (!response.ok || !response.body) {
        throw new Error(`Failed to download ${name}: ${response.status} ${response.statusText}`);
    }

    const partPath = `${filePath}.part`;
    const hash = createHash('sha1');
    let received = 0;
    let lastPercent = -1;
    const progress = new Transform({
        transform(chunk: Buffer, _encoding, callback) {
            hash.update(chunk);
            received += chunk.length;
            const percent = Math.floor((received / sizeBytes) * 100);
            if (percent !== lastPercent && output.isTTY) {
                lastPercent = percent;
                output.write(`\r  ${percent}% (${formatMB(received)} / ${formatMB(sizeBytes)})`);
            }
            callback(null, chunk);
        }
    });

    try {
        await pipeline(
            Readable.fromWeb(response.body as WebReadableStream),
            progress,
            createWriteStream(partPath)
        );
        if (output.isTTY) {
            output.write('\n');
        }

        if (received !== sizeBytes) {
            throw new Error(
                `Incomplete download for ${name}: expected ${sizeBytes} bytes, got ${received}`
            );
        }
        const actual = hash.digest('hex');
        if (actual !== sha1) {
            throw new Error(`SHA-1 mismatch for ${name}: expected ${sha1}, got ${actual}`);
        }
        await fs.rename(partPath, filePath);
    } catch (error) {
        await fs.rm(partPath, { force: true });
        throw error;
    }

    console.log('Download verified.');
    return filePath;
}
