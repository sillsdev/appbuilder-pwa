import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { exit } from 'node:process';

const bump = process.argv[2] ?? 'minor';
if (!['major', 'minor', 'patch'].includes(bump)) {
    console.error('Usage: bump-version [major|minor|patch]');
    exit(1);
}

execSync(`npm version ${bump} --no-git-tag-version`, { stdio: 'inherit' });

const version = JSON.parse(readFileSync('package.json').toString()).version as string;
const branch = `version/${version}`;

execSync(`git checkout -b ${branch}`, { stdio: 'inherit' });
execSync(`git add package.json package-lock.json`, { stdio: 'inherit' });
execSync(`git commit -m "Version ${version}"`, { stdio: 'inherit' });
execSync(`git push -u origin ${branch}`, { stdio: 'inherit' });

console.log(`✅ Bumped to ${version} and pushed branch ${branch}`);
