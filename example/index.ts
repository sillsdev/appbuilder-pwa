import path from 'path';
import fs from 'fs/promises';
import os from 'os';
import { exec } from 'child_process';
import { createReadStream, readdirSync } from 'fs';
import unzipper from 'unzipper';

type IndexData = {
    [key: string]: {
        projects: string[];
    };
};

// Constants
const INDEX_FILE = path.resolve('test_data/projects/index.json');
const TEMP_DIR = path.join(os.tmpdir(), 'pwa_temp');
const APP_DEF_EXT = '.appDef';

// Determine the appropriate execution command for `scripture-app-builder`
const getExecutionCommand = (program: string): string => {
    const appName = program === 'sab' ? 'Scripture App Builder' : 'Dictionary App Builder';
    const jarName = program === 'sab' ? 'scripture-app-builder.jar' : 'dictionary-app-builder.jar';
    const exeName = program === 'sab' ? 'scripture-app-builder' : 'dictionary-app-builder';
    switch (os.platform()) {
        case 'darwin':
            return `java -jar "/Applications/${appName}.app/Contents/Resources/Java/bin/${jarName}"`;
        case 'win32': {
            const programFilesX86 = process.env['ProgramFiles(x86)'];
            if (!programFilesX86) {
                throw new Error('Environment variable "ProgramFiles(x86)" is not set on Windows');
            }
            const jarPath = path.join(programFilesX86, 'SIL', appName, 'bin', jarName);
            return `java -jar "${jarPath}"`;
        }
        case 'linux': {
            const flatpakExists = checkCommandExists('flatpak', '--version');
            const sabSystemPackageExists = checkCommandExists(appName, '-?');

            if (flatpakExists) {
                return `flatpak run org.sil.${appName}`;
            } else if (sabSystemPackageExists) {
                return appName;
            } else {
                const jarPath = `/usr/share/scripture-app-builder/bin/${jarName}`;
                return `java -jar "${jarPath}"`;
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
async function ensureTempDir(): Promise<void> {
    try {
        await fs.mkdir(TEMP_DIR, { recursive: true });
    } catch (error) {
        throw new Error(`Failed to create temp directory: ${error.message}`);
    }
}

// Load `index.json` and find the project ZIP file
async function getProjectProps(projectName: string): Promise<[string, string]> {
    try {
        const data = await fs.readFile(INDEX_FILE, 'utf8');
        const indexData: IndexData = JSON.parse(data);

        for (const [key, value] of Object.entries(indexData)) {
            if (value.projects.includes(`${projectName}.zip`)) {
                return [key, path.resolve(`test_data/projects/${key}/${projectName}.zip`)];
            }
        }
        throw new Error(`Project "${projectName}" not found in index.json`);
    } catch (error) {
        throw new Error(`Error reading index.json: ${error.message}`);
    }
}

// Extract the ZIP file
async function extractZip(zipFilePath: string): Promise<void> {
    return new Promise((resolve, reject) => {
        createReadStream(zipFilePath)
            .pipe(unzipper.Extract({ path: TEMP_DIR }))
            .on('close', resolve)
            .on('error', reject);
    });
}

// Find the `.appDef` file
async function findAppDefFile(): Promise<string> {
    try {
        const files = readdirSync(TEMP_DIR);
        const appDefFile = files.find((file) => file.endsWith(APP_DEF_EXT));
        if (!appDefFile) {
            throw new Error('No .appDef file found in the extracted directory');
        }
        return path.join(TEMP_DIR, appDefFile);
    } catch (error) {
        throw new Error(`Error finding .appDef file: ${error.message}`);
    }
}

// Run the application
function runCommand(executionCommand: string, appDefFile: string): void {
    const command = `${executionCommand} -load "${appDefFile}" -build-modern-pwa-data-files -no-save -fp pwa-repo="${process.cwd()}"`;
    console.log(`Running: ${command}`);

    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error: ${error.message}`);
            return;
        }
        if (stderr) {
            console.error(`stderr: ${stderr}`);
        }
        console.log(`stdout: ${stdout}`);
    });
}

// Main function
(async function main(): Promise<void> {
    const projectName = process.argv[2];
    if (!projectName) {
        console.error('Error: Please provide a project name (e.g., web_gospels)');
        process.exit(1);
    }

    try {
        console.log(`Finding project "${projectName}" in index.json...`);
        const [commandName, zipFilePath] = await getProjectProps(projectName);
        console.log(`Found project at: ${zipFilePath}`);

        console.log('Ensuring temp directory...');
        await ensureTempDir();

        console.log('Extracting ZIP file...');
        await extractZip(zipFilePath);

        console.log('Finding .appDef file...');
        const appDefFile = await findAppDefFile();
        console.log(`Found: ${appDefFile}`);

        console.log('Determining execution command...');
        const executionCommand = getExecutionCommand(commandName);
        console.log(`Using command: ${executionCommand}`);

        console.log('Running command...');
        runCommand(executionCommand, appDefFile);
    } catch (error) {
        console.error(`Failed: ${error.message}`);
    }
})();
