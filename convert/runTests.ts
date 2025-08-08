import { spawn } from 'node:child_process';

const args = process.argv.slice(2).join(' ');
console.log('playwright test ' + args);
spawn('playwright test ' + args, {
    shell: true,
    stdio: 'inherit'
}).on('close', (code) => {
    console.log('vitest ' + args);
    spawn('vitest ' + args, {
        shell: true,
        stdio: 'inherit'
    });
});
