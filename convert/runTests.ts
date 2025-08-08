import { spawn } from 'node:child_process';

let args = '';
for (let i = 2; i < process.argv.length; i++) {
    args += process.argv[i];
}
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
