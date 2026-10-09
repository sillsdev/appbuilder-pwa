import { exec } from 'child_process';
import { createReadStream, existsSync, readdirSync } from 'fs';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import unzipper from 'unzipper';
import {
    DEFAULT_INDEX_URL,
    downloadProject,
    fetchIndex,
    type TestProject
} from './remote-test-files';

// Constants
const PROJECTS_DIR = path.resolve('test_data/projects');
// Flatpak doesn't have access to system tmp, so use home instead
const TEMP_DIR = path.join(os.platform() === 'linux' ? os.homedir() : os.tmpdir(), 'pwa_temp');
const APP_DEF_EXT = '.appDef';

// Determine the appropriate execution command for `scripture-app-builder`
export const getExecutionCommand = (program: string): string => {
    const appName = program === 'sab' ? 'Scripture App Builder' : 'Dictionary App Builder';
    const jarName = program === 'sab' ? 'scripture-app-builder.jar' : 'dictionary-app-builder.jar';
    const exeName = program === 'sab' ? 'scripture-app-builder' : 'dictionary-app-builder';
    let javaPath = 'java';
    if (process.env['JAVA_HOME']) {
        javaPath = path.join(process.env['JAVA_HOME'], 'bin', 'java');
    }
    switch (os.platform()) {
        case 'darwin': {
            const appPath = `/Applications/${appName}.app/Contents`;
            javaPath = `"${appPath}/Plugins/zulu-17.jdk/Contents/Home/jre/bin/java"`;
            return `${javaPath} -jar "${appPath}/Resources/Java/bin/${jarName}"`;
        }
        case 'win32': {
            const programFiles = process.env['ProgramFiles'];
            if (!programFiles) {
                throw new Error('Environment variable "ProgramFiles" is not set on Windows');
            }
            const appPath = path.join(programFiles, 'SIL', appName);
            javaPath = path.join(appPath, 'runtime', 'bin', 'java');
            const jarPath = path.join(appPath, 'bin', jarName);
            if (javaPath.endsWith('java')) {
                javaPath = `"${javaPath}.exe"`;
            }
            return `${javaPath} -jar "${jarPath}"`;
        }
        case 'linux': {
            const flatpakExists = checkCommandExists('flatpak', '--version');
            const sabSystemPackageExists = checkCommandExists(exeName, '-?');

            if (flatpakExists) {
                return `flatpak run org.sil.${exeName}`;
            } else if (sabSystemPackageExists) {
                return exeName;
            } else {
                const jarPath = `/usr/share/scripture-app-builder/bin/${jarName}`;
                return `${javaPath} -jar "${jarPath}"`;
            }
        }
        default:
            throw new Error('Unsupported OS');
    }
};

// Check if a command exists in the PATH
function checkCommandExists(command: string, argument: string): boolean {
    try {
        exec(`${command} ${argument}`);
        return true;
    } catch {
        return false;
    }
}

// Ensure the temp directory exists
export async function ensureTempDir(): Promise<void> {
    try {
        // if temp dir already exists, delete and recreate
        if (existsSync(TEMP_DIR)) {
            await fs.rm(TEMP_DIR, { recursive: true, force: true });
        }
        await fs.mkdir(TEMP_DIR, { recursive: true });
    } catch (error) {
        throw new Error(`Failed to create temp directory: ${error.message}`);
    }
}

type Options = {
    indexUrl: string;
    projectName?: string;
    downloadAll: boolean;
};

function parseArgs(argv: string[]): Options {
    const options: Options = { indexUrl: DEFAULT_INDEX_URL, downloadAll: false };
    for (let i = 0; i < argv.length; i++) {
        const arg = argv[i];
        switch (arg) {
            case '--index':
                options.indexUrl = argv[++i];
                break;
            case '--download-all':
                options.downloadAll = true;
                break;
            default:
                if (arg.startsWith('--') || options.projectName) {
                    throw new Error(`Unknown argument "${arg}"`);
                }
                options.projectName = arg;
        }
    }
    if (!options.indexUrl) {
        throw new Error('No index URL. Pass --index <url>');
    }
    return options;
}

function downloadExample(project: TestProject, indexUrl: string): Promise<string> {
    return downloadProject(project, indexUrl, path.join(PROJECTS_DIR, project.program));
}

async function getProjectProps(
    projects: TestProject[],
    projectName: string,
    indexUrl: string
): Promise<[string, string]> {
    const project = projects.find((p) => path.basename(p.file) === `${projectName}.zip`);
    if (!project) {
        throw new Error(`Project "${projectName}" not found in index.json`);
    }
    return [project.program, await downloadExample(project, indexUrl)];
}

async function downloadAll(projects: TestProject[], indexUrl: string): Promise<void> {
    for (const project of projects) {
        await downloadExample(project, indexUrl);
    }
}

// Extract the ZIP file
export async function extractZip(zipFilePath: string): Promise<void> {
    return new Promise((resolve, reject) => {
        createReadStream(zipFilePath)
            .pipe(unzipper.Extract({ path: TEMP_DIR }))
            .on('close', resolve)
            .on('error', reject);
    });
}

// Find the `.appDef` file
export async function findAppDefFile(): Promise<string> {
    try {
        const entries = readdirSync(TEMP_DIR, { withFileTypes: true });
        const appDefFile = entries.find((entry) => entry.name.endsWith(APP_DEF_EXT));
        if (appDefFile) {
            return path.join(TEMP_DIR, appDefFile.name);
        }
        for (const dir of entries.filter((entry) => entry.isDirectory())) {
            const nested = readdirSync(path.join(TEMP_DIR, dir.name)).find((file) =>
                file.endsWith(APP_DEF_EXT)
            );
            if (nested) {
                return path.join(TEMP_DIR, dir.name, nested);
            }
        }
        throw new Error('No .appDef file found in the extracted directory');
    } catch (error) {
        throw new Error(`Error finding .appDef file: ${error.message}`);
    }
}

// Run the application
export function runCommand(executionCommand: string, appDefFile: string): Promise<boolean> {
    const command = `${executionCommand} -load "${appDefFile}" -build-modern-pwa-data-files -no-save -fp pwa-repo="${process.cwd()}"`;
    console.log(`Running: ${command}`);

    return new Promise((resolve) => {
        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error: ${error.message}`);
                resolve(false);
                return;
            }
            if (stderr) {
                console.error(`stderr: ${stderr}`);
            }
            console.log(`stdout: ${stdout}`);
            resolve(true);
        });
    });
}

export async function prepareAndBuild(zipFilePath: string, program: string): Promise<void> {
    console.log('Ensuring temp directory...');
    await ensureTempDir();

    console.log('Extracting ZIP file...');
    await extractZip(zipFilePath);

    console.log('Finding .appDef file...');
    const appDefFile = await findAppDefFile();
    console.log(`Found: ${appDefFile}`);

    console.log('Determining execution command...');
    const executionCommand = getExecutionCommand(program);
    console.log(`Using command: ${executionCommand}`);

    console.log('Running command...');
    if (!(await runCommand(executionCommand, appDefFile))) {
        throw new Error('App Builder build failed');
    }
}

// Main function
async function main(): Promise<void> {
    try {
        const options = parseArgs(process.argv.slice(2));
        if (!options.projectName && !options.downloadAll) {
            console.error(
                'Error: Please provide a project name (e.g., web_gospels) or --download-all'
            );
            process.exit(1);
        }

        const projects = await fetchIndex(options.indexUrl, 'projects');

        if (options.downloadAll) {
            await downloadAll(projects, options.indexUrl);
            if (!options.projectName) {
                return;
            }
        }

        console.log(`Finding project "${options.projectName}" in index.json...`);
        const [commandName, zipFilePath] = await getProjectProps(
            projects,
            options.projectName,
            options.indexUrl
        );
        console.log(`Found project at: ${zipFilePath}`);

        await prepareAndBuild(zipFilePath, commandName);
    } catch (error) {
        console.error(`Failed: ${error.message}`);
        process.exitCode = 1;
    }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    main();
}
