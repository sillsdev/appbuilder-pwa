import { spawn } from 'child_process';
import { createHash } from 'crypto';
import { createReadStream, createWriteStream, existsSync } from 'fs';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { stdin as input, stdout as output } from 'process';
import { createInterface } from 'readline';
import { Readable, Transform } from 'stream';
import { pipeline } from 'stream/promises';
import type { ReadableStream as WebReadableStream } from 'stream/web';
import {
    ensureTempDir,
    extractZip,
    findAppDefFile,
    getExecutionCommand,
    runCommand
} from '../example/index';

const DEFAULT_INDEX_URL = '';
const CACHE_DIR = path.resolve('test_data/bloom');
const BLOOM_PROGRAMS = ['sab', 'rab'];
const BUILDABLE_PROGRAMS = ['sab'];

type BloomProject = {
    name: string;
    description: string;
    file: string;
    size: string;
    size_bytes: number;
    sha1: string;
    program: string;
};

type Options = {
    indexUrl: string;
    project?: string;
    list: boolean;
    runAll: boolean;
};

function parseArgs(argv: string[]): Options {
    if (existsSync('.env')) {
        process.loadEnvFile('.env');
    }
    const options: Options = {
        indexUrl: process.env['BLOOM_TEST_INDEX_URL'] || DEFAULT_INDEX_URL,
        list: false,
        runAll: false
    };
    for (let i = 0; i < argv.length; i++) {
        const arg = argv[i];
        switch (arg) {
            case '--index':
                options.indexUrl = argv[++i];
                break;
            case '--project':
                options.project = argv[++i];
                break;
            case '--list':
                options.list = true;
                break;
            case '--run-all':
                options.runAll = true;
                break;
            default:
                throw new Error(`Unknown argument "${arg}"`);
        }
    }
    if (!options.indexUrl) {
        throw new Error('No index URL. Set BLOOM_TEST_INDEX_URL in .env or pass --index <url>');
    }
    return options;
}

function validateEntry(entry: any, index: number): BloomProject {
    const fail = (reason: string) => {
        throw new Error(`Invalid index.json entry ${index}: ${reason}`);
    };
    if (typeof entry !== 'object' || entry === null) {
        fail('not an object');
    }
    for (const key of ['name', 'description', 'file', 'size', 'sha1']) {
        if (typeof entry[key] !== 'string' || !entry[key]) {
            fail(`missing "${key}"`);
        }
    }
    if (!Number.isInteger(entry.size_bytes) || entry.size_bytes <= 0) {
        fail('"size_bytes" must be a positive integer');
    }
    if (/[\\/]/.test(entry.file) || entry.file.includes('..') || !entry.file.endsWith('.zip')) {
        fail(`"file" must be a plain .zip file name, got "${entry.file}"`);
    }
    if (!/^[0-9a-f]{40}$/i.test(entry.sha1.trim())) {
        fail('"sha1" is not a SHA-1 hex digest');
    }
    if (entry.program !== undefined && typeof entry.program !== 'string') {
        fail('"program" must be a string');
    }
    return {
        name: entry.name,
        description: entry.description,
        file: entry.file,
        size: entry.size,
        size_bytes: entry.size_bytes,
        sha1: entry.sha1.trim().toLowerCase(),
        program: (entry.program ?? 'sab').toLowerCase()
    };
}

async function fetchIndex(indexUrl: string): Promise<BloomProject[]> {
    console.log(`Fetching ${indexUrl}...`);
    const response = await fetch(indexUrl);
    if (!response.ok) {
        throw new Error(`Failed to fetch index: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    if (!Array.isArray(data) || data.length === 0) {
        throw new Error('index.json must be a non-empty array');
    }
    return data.map(validateEntry);
}

function describeProject(project: BloomProject, n: number): string {
    const program = project.program === 'sab' ? '' : ` [${project.program}]`;
    return `${n}) ${project.name}${program} — ${project.description} (${project.size})`;
}

async function chooseProjects(
    projects: BloomProject[],
    name?: string,
    runAll = false
): Promise<BloomProject[]> {
    if (runAll) {
        return projects;
    }
    if (name) {
        const match = projects.find((p) => p.name === name);
        if (!match) {
            throw new Error(`Project "${name}" not found in index.json`);
        }
        return [match];
    }
    const count = projects.length + 1;
    console.log('\nAvailable bloom test projects:');
    console.log(`  1) All projects (run one after the other)`);
    projects.forEach((p, i) => console.log(`  ${describeProject(p, i + 2)}`));
    const rl = createInterface({ input, output });
    const ask = () => output.write(`\nChoose a project [1-${count}]: `);
    try {
        ask();
        for await (const line of rl) {
            const choice = Number(line.trim());
            if (choice === 1) {
                return projects;
            }
            if (Number.isInteger(choice) && choice >= 2 && choice <= count) {
                return [projects[choice - 2]];
            }
            console.log('Invalid choice.');
            ask();
        }
        throw new Error('No project chosen');
    } finally {
        rl.close();
    }
}

async function hashFile(filePath: string): Promise<string> {
    const hash = createHash('sha1');
    await pipeline(createReadStream(filePath), hash);
    return hash.digest('hex');
}

function formatMB(bytes: number): string {
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

async function downloadProject(project: BloomProject, indexUrl: string): Promise<string> {
    await fs.mkdir(CACHE_DIR, { recursive: true });
    const zipPath = path.join(CACHE_DIR, project.file);

    if (existsSync(zipPath)) {
        console.log(`Verifying cached ${project.file}...`);
        if ((await hashFile(zipPath)) === project.sha1) {
            console.log('Cached file is valid, skipping download.');
            return zipPath;
        }
        console.log('Cached file does not match sha1, downloading again.');
        await fs.rm(zipPath, { force: true });
    }

    const url = new URL(project.file, indexUrl);
    console.log(`Downloading ${url} (${project.size})...`);
    const response = await fetch(url);
    if (!response.ok || !response.body) {
        throw new Error(
            `Failed to download ${project.file}: ${response.status} ${response.statusText}`
        );
    }

    const partPath = `${zipPath}.part`;
    const hash = createHash('sha1');
    let received = 0;
    let lastPercent = -1;
    const progress = new Transform({
        transform(chunk: Buffer, _encoding, callback) {
            hash.update(chunk);
            received += chunk.length;
            const percent = Math.floor((received / project.size_bytes) * 100);
            if (percent !== lastPercent && output.isTTY) {
                lastPercent = percent;
                output.write(
                    `\r  ${percent}% (${formatMB(received)} / ${formatMB(project.size_bytes)})`
                );
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

        if (received !== project.size_bytes) {
            throw new Error(
                `Incomplete download for ${project.file}: expected ${project.size_bytes} bytes, got ${received}`
            );
        }
        const actual = hash.digest('hex');
        if (actual !== project.sha1) {
            throw new Error(
                `SHA-1 mismatch for ${project.file}: expected ${project.sha1}, got ${actual}`
            );
        }
        await fs.rename(partPath, zipPath);
    } catch (error) {
        await fs.rm(partPath, { force: true });
        throw error;
    }

    console.log('Download verified.');
    return zipPath;
}

function runNpmScript(args: string[]): Promise<number> {
    return new Promise((resolve, reject) => {
        const child = spawn('npm', args, { stdio: 'inherit', shell: os.platform() === 'win32' });
        child.on('error', reject);
        child.on('close', (code) => resolve(code ?? 1));
    });
}

async function prepareProject(zipFilePath: string): Promise<string> {
    console.log('Ensuring temp directory...');
    await ensureTempDir();

    console.log('Extracting ZIP file...');
    await extractZip(zipFilePath);

    console.log('Finding .appDef file...');
    const appDefFile = await findAppDefFile();
    console.log(`Found: ${appDefFile}`);
    return appDefFile;
}

async function buildProject(program: string, appDefFile: string): Promise<void> {
    console.log('Determining execution command...');
    const executionCommand = getExecutionCommand(program);
    console.log(`Using command: ${executionCommand}`);

    console.log('Running command...');
    if (!(await runCommand(executionCommand, appDefFile))) {
        throw new Error('App Builder build failed');
    }
}

async function run(command: string[], label: string): Promise<void> {
    const code = await runNpmScript(command);
    if (code !== 0) {
        throw new Error(`${label} failed with exit code ${code}`);
    }
}

function checkProgram(project: BloomProject): void {
    if (!BLOOM_PROGRAMS.includes(project.program)) {
        throw new Error(
            `Program "${project.program}" does not use bloom books. Bloom projects must be one of: ${BLOOM_PROGRAMS.join(', ')}`
        );
    }
    if (!BUILDABLE_PROGRAMS.includes(project.program)) {
        throw new Error(`Program "${project.program}" is not supported yet`);
    }
}

async function testProject(project: BloomProject, indexUrl: string): Promise<number> {
    checkProgram(project);

    const zipPath = await downloadProject(project, indexUrl);

    const appDefFile = await prepareProject(zipPath);
    await run(['run', 'clean:all'], 'Clean');
    await buildProject(project.program, appDefFile);
    await run(['run', 'convert'], 'Convert');

    return runNpmScript(['exec', '--', 'vitest', 'run', '--project', 'bloom']);
}

(async function main(): Promise<void> {
    try {
        const options = parseArgs(process.argv.slice(2));
        const projects = await fetchIndex(options.indexUrl);

        if (options.list) {
            projects.forEach((p, i) => console.log(describeProject(p, i + 1)));
            return;
        }

        const selected = await chooseProjects(projects, options.project, options.runAll);
        if (selected.length === 1) {
            process.exitCode = await testProject(selected[0], options.indexUrl);
            return;
        }

        const results: { name: string; status: string }[] = [];
        for (const [i, project] of selected.entries()) {
            console.log(`\n=== [${i + 1}/${selected.length}] ${project.name} ===`);
            try {
                checkProgram(project);
            } catch (error) {
                console.log(`Skipping: ${(error as Error).message}`);
                results.push({ name: project.name, status: 'skipped' });
                continue;
            }
            try {
                const code = await testProject(project, options.indexUrl);
                results.push({ name: project.name, status: code === 0 ? 'passed' : 'failed' });
            } catch (error) {
                console.error(`Failed: ${(error as Error).message}`);
                results.push({ name: project.name, status: 'error' });
            }
        }

        console.log('\n=== Bloom test summary ===');
        const statusColors: Record<string, string> = {
            passed: '\x1b[32m',
            failed: '\x1b[31m',
            error: '\x1b[38;5;88m'
        };
        results.forEach((r) => {
            const color = statusColors[r.status];
            const status = r.status.padEnd(8);
            console.log(`  ${color ? `${color}${status}\x1b[0m` : status} ${r.name}`);
        });
        if (results.some((r) => r.status === 'failed' || r.status === 'error')) {
            process.exitCode = 1;
        }
    } catch (error) {
        console.error(`Failed: ${(error as Error).message}`);
        process.exitCode = 1;
    }
})();
