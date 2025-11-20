import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { exit } from 'node:process';
import { compareVersions } from './stringUtils';

const fromCLI =
    execSync('node --version')
        .toString()
        .match(/[\d]+(\.[\d]+){0,2}/)
        ?.at(0) ?? '';
const fromPackage = JSON.parse(readFileSync('package.json').toString()).volta.node;

if (compareVersions(fromCLI, fromPackage) < 0) {
    console.error(
        `❌ Error: The PWA requires a newer version of NodeJS. Please use AppBuilders 13.3 or newer.`
    );
    exit(1);
} else {
    console.log(`✅ Using Node v${fromCLI}`);
    exit(0);
}
