// Runs Converter and vite without the `concurrently` dependency (see dev-concurrently.ts for
// that version). The win over just running both at once: vite is held back until Converter
// logs "Watching for changes...", so vite doesn't start dev-serving against a half-converted
// project on the very first run.
import { spawn } from 'node:child_process';
import type { ChildProcess, SpawnOptions } from 'node:child_process';

const RESTART_DELAY_MS = 10;

// Mirrors concurrently's own spawn helper: spawn() doesn't parse a single "cmd arg1 arg2" string
// on its own, so each platform's shell is invoked explicitly to parse the command line.
function spawnShell(command: string, options: SpawnOptions = {}) {
    return process.platform === 'win32'
        ? spawn('cmd.exe', ['/s', '/c', `"${command}"`], {
              windowsVerbatimArguments: true,
              ...options
          })
        : spawn('/bin/sh', ['-c', command], options);
}

function timestamp() {
    const pad = (n: number) => n.toString().padStart(2, '0');
    const now = new Date();
    return `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
}

// A 'data' chunk is not necessarily a whole line (or only one line) - a long line can arrive
// split across chunks. Buffering and slicing on '\n' is what lets the "Watching for changes..."
// check below match reliably regardless of how the OS happens to chunk the output.
function forwardLines(stream: NodeJS.ReadableStream, onLine: (line: string) => void) {
    let buffered = '';
    stream.on('data', (chunk: Buffer) => {
        buffered += chunk.toString();
        let newlineIndex;
        while ((newlineIndex = buffered.indexOf('\n')) !== -1) {
            onLine(buffered.slice(0, newlineIndex));
            buffered = buffered.slice(newlineIndex + 1);
        }
    });
}

let shuttingDown = false;
let converter: ChildProcess;
let vite: ChildProcess | undefined;

function startConverter() {
    converter = spawnShell('ts-node convert/index.ts --watch', {
        stdio: ['ignore', 'pipe', 'pipe']
    });

    forwardLines(converter.stdout!, (line) => {
        console.log(`[${timestamp()} Converter] ${line}`);

        // `!vite` guards this so a later Converter restart (see below) doesn't try to spawn a
        // second vite once it's already running.
        if (!vite && line.includes('Watching for changes...')) {
            // vite only binds its interactive shortcuts (r/o/u/q) when process.stdin.isTTY is
            // true. stdio: 'inherit' gives vite the real terminal instead of a pipe, so isTTY
            // holds and vite's own raw/colored output goes straight to the terminal, unprefixed.
            vite = spawnShell('vite dev --host', { stdio: 'inherit' });
            vite.on('exit', (code) => {
                // Set before kill(): otherwise Converter's own 'exit' handler could see this as
                // an unplanned crash and schedule a pointless restart in the moment before exit().
                shuttingDown = true;
                converter.kill();
                process.exit(code ?? 0);
            });
        }
    });
    forwardLines(converter.stderr!, (line) => console.error(`[${timestamp()} Converter] ${line}`));

    converter.on('exit', (code) => {
        // A signal-killed process (Ctrl+C, or shutdown() below) also reports a non-zero/null
        // code here, which would otherwise look identical to a real crash. shuttingDown is what
        // tells the two apart, so an intentional stop doesn't get "helpfully" restarted.
        if (shuttingDown) {
            return;
        }

        if (code !== 0) {
            console.error(`[${timestamp()} Converter] exited with code ${code}, restarting...`);
            setTimeout(startConverter, RESTART_DELAY_MS);
        } else if (!vite) {
            console.error(
                `[${timestamp()} Converter] exited with code ${code} before vite started.`
            );
            process.exit(1);
        }
    });
}

function shutdown() {
    shuttingDown = true;
    converter?.kill();
    vite?.kill();
    process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

startConverter();
