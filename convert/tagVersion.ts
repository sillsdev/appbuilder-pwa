import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const version = JSON.parse(readFileSync('package.json').toString()).version as string;
const tag = `v${version}`;

const remotes = execSync('git remote').toString().trim().split('\n');
const remote = remotes.includes('upstream') ? 'upstream' : 'origin';

execSync(`git tag ${tag}`, { stdio: 'inherit' });
execSync(`git push ${remote} ${tag}`, { stdio: 'inherit' });

console.log(`✅ Tagged and pushed ${tag} to ${remote}`);
