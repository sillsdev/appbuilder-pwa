import { exec } from 'node:child_process';
import { platform } from 'node:process';

const openCommand = platform === 'darwin' ? 'open' : platform === 'win32' ? 'start' : 'xdg-open';

exec(`${openCommand} stats.html`, (error) => {
    if (error) {
        console.error(`❌ Unable to open stats.html: ${error.message}`);
        process.exit(1);
    }
});
