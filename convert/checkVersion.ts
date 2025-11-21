import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { exit } from 'node:process';
import { compareVersions } from './stringUtils';

const verNumRegExp = /[\d]+(\.[\d]+){0,2}/;

const fromCLI = execSync('node --version').toString().match(verNumRegExp)?.at(0) ?? '';
const fromPackage =
    JSON.parse(readFileSync('package.json').toString()).volta.node.match(verNumRegExp)?.at(0) ?? '';

if (compareVersions(fromCLI, fromPackage) < 0) {
    console.error(
        `❌ Error: The PWA requires a newer version of NodeJS. Please use AppBuilders 13.3 or newer.`
    );
    console.error(`| Environment: Node v${fromCLI}`);
    console.error(`> Required: Node >= v${fromPackage}`);
    exit(1);
} else {
    console.log(`✅ Using Node v${fromCLI}`);
    exit(0);
}
