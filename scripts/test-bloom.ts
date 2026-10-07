import { spawn } from 'child_process';
import os from 'os';
import path from 'path';
import { stdin as input, stdout as output } from 'process';
import { createInterface } from 'readline';
import { prepareAndBuild } from '../example/index';
import {
    DEFAULT_INDEX_URL,
    downloadProject,
    fetchIndex,
    type TestProject
} from '../example/remote-test-files';

const CACHE_DIR = path.resolve('test_data/bloom');
const BLOOM_PROGRAMS = ['sab', 'rab'];
const BUILDABLE_PROGRAMS = ['sab'];

type Options = {
    indexUrl: string;
    project?: string;
    list: boolean;
    runAll: boolean;
};

function parseArgs(argv: string[]): Options {
    const options: Options = {
        indexUrl: DEFAULT_INDEX_URL,
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
        throw new Error('No index URL. Pass --index <url>');
    }
    return options;
}

function describeProject(project: TestProject, n: number): string {
    const program = project.program === 'sab' ? '' : ` [${project.program}]`;
    return `${n}) ${project.name}${program} — ${project.description} (${project.size})`;
}

async function chooseProjects(
    projects: TestProject[],
    name?: string,
    runAll = false
): Promise<TestProject[]> {
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

function runNpmScript(args: string[]): Promise<number> {
    return new Promise((resolve, reject) => {
        const child = spawn('npm', args, { stdio: 'inherit', shell: os.platform() === 'win32' });
        child.on('error', reject);
        child.on('close', (code) => resolve(code ?? 1));
    });
}

async function run(command: string[], label: string): Promise<void> {
    const code = await runNpmScript(command);
    if (code !== 0) {
        throw new Error(`${label} failed with exit code ${code}`);
    }
}

function checkProgram(project: TestProject): void {
    if (!BLOOM_PROGRAMS.includes(project.program)) {
        throw new Error(
            `Program "${project.program}" does not use bloom books. Bloom projects must be one of: ${BLOOM_PROGRAMS.join(', ')}`
        );
    }
    if (!BUILDABLE_PROGRAMS.includes(project.program)) {
        throw new Error(`Program "${project.program}" is not supported yet`);
    }
}

async function testProject(project: TestProject, indexUrl: string): Promise<number> {
    checkProgram(project);

    const zipPath = await downloadProject(project, indexUrl, CACHE_DIR);

    await run(['run', 'clean:all'], 'Clean');
    await prepareAndBuild(zipPath, project.program);
    await run(['run', 'convert'], 'Convert');

    return runNpmScript(['exec', '--', 'vitest', 'run', '--project', 'bloom', ...project.tests]);
}

(async function main(): Promise<void> {
    try {
        const options = parseArgs(process.argv.slice(2));
        const projects = await fetchIndex(options.indexUrl, 'bloom');

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
