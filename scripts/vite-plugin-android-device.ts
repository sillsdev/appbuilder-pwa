// Adds a "d + enter" shortcut to `vite dev` and `vite preview` that opens the app in the default
// browser of a USB-connected Android device. `adb reverse` forwards the device's localhost port
// to this machine, so the page loads as http://localhost (a secure context, which service
// workers require) instead of over the LAN address.
// With several devices connected, set ANDROID_SERIAL to choose one (adb reads it directly).
import { execFile, execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { promisify } from 'node:util';
import type { CLIShortcut, Plugin, PreviewServer, ViteDevServer } from 'vite';

const execFileAsync = promisify(execFile);

// Bounds on each adb call so an unresponsive adb server can't hang the shortcut (vite ignores
// other shortcuts while one is running) or delay exit. The first call can include adb starting
// its server, which takes a few seconds; the exit cleanup gets less time since it blocks exit.
const ADB_TIMEOUT_MS = 15_000;
const ADB_CLEANUP_TIMEOUT_MS = 3_000;

// adb is looked up in order: the ADB env var, the SDK's platform-tools (ANDROID_HOME, then
// ANDROID_SDK_ROOT), and finally plain `adb` from PATH.
function findAdb(): string {
    if (process.env.ADB) {
        return process.env.ADB;
    }
    const exe = process.platform === 'win32' ? 'adb.exe' : 'adb';
    for (const sdk of [process.env.ANDROID_HOME, process.env.ANDROID_SDK_ROOT]) {
        if (sdk) {
            const candidate = join(sdk, 'platform-tools', exe);
            if (existsSync(candidate)) {
                return candidate;
            }
        }
    }
    return 'adb';
}

async function adb(args: string[]): Promise<string> {
    const { stdout } = await execFileAsync(findAdb(), args, { timeout: ADB_TIMEOUT_MS });
    return stdout.trim();
}

// Ports this process has forwarded with `adb reverse`. They are removed on exit, leaving any
// forwards set up outside this plugin alone. The removal is synchronous because 'exit' listeners
// can't wait on async work; failures (e.g. the device was unplugged) are ignored.
const reversedPorts = new Set<string>();

function removeReversedPorts() {
    for (const port of reversedPorts) {
        try {
            execFileSync(findAdb(), ['reverse', '--remove', `tcp:${port}`], {
                stdio: 'ignore',
                timeout: ADB_CLEANUP_TIMEOUT_MS
            });
        } catch {
            // Nothing to clean up
        }
    }
}

function trackReversedPort(port: string) {
    // Registered on first use so processes that never forward a port (e.g. `vite build`) are
    // untouched. Ctrl+C (SIGINT) would otherwise terminate without running 'exit' listeners, so
    // it is turned into a normal exit with the conventional 128 + SIGINT(2) code.
    if (reversedPorts.size === 0) {
        process.on('exit', removeReversedPorts);
        process.on('SIGINT', () => process.exit(130));
    }
    reversedPorts.add(port);
}

// --no-rebind keeps a mapping owned by another tool (or a manual `adb reverse`) from being
// replaced here and then removed on exit. It also fails when the existing mapping is identical,
// so in that case the mapping is reused, but not tracked, since this process didn't create it.
async function ensureReversed(port: string): Promise<void> {
    if (reversedPorts.has(port)) {
        return;
    }
    const spec = `tcp:${port}`;
    try {
        await adb(['reverse', '--no-rebind', spec, spec]);
        trackReversedPort(port);
    } catch (e) {
        const err = e as { stderr?: string };
        if (!err.stderr?.includes('cannot rebind')) {
            throw e;
        }
        // Each line of the list is "<transport> <device spec> <local spec>"
        const existing = (await adb(['reverse', '--list']))
            .split('\n')
            .map((line) => line.trim().split(/\s+/))
            .find((fields) => fields[1] === spec);
        if (existing?.[2] !== spec) {
            throw new Error(
                `${spec} on the device is already forwarded to ${existing?.[2] ?? 'another port'}; ` +
                    `remove it with \`adb reverse --remove ${spec}\``
            );
        }
    }
}

async function openOnDevice(server: ViteDevServer | PreviewServer): Promise<void> {
    const logger = server.config.logger;
    const localUrl = server.resolvedUrls?.local[0];
    if (!localUrl) {
        logger.warn('No local URL available to open on device');
        return;
    }
    const url = new URL(localUrl);
    const port = url.port || (url.protocol === 'https:' ? '443' : '80');
    url.hostname = 'localhost';
    try {
        await ensureReversed(port);
        await adb(['shell', 'am', 'start', '-a', 'android.intent.action.VIEW', '-d', url.href]);
        logger.info(`  Opened ${url.href} on Android device`);
    } catch (e) {
        const err = e as NodeJS.ErrnoException & { stderr?: string; killed?: boolean };
        const detail =
            err.code === 'ENOENT'
                ? `adb not found (tried ${findAdb()}); set ADB or ANDROID_HOME, or add it to PATH`
                : err.killed
                  ? `adb did not respond within ${ADB_TIMEOUT_MS / 1000}s`
                  : err.stderr?.trim() || err.message;
        logger.error(`  Failed to open on Android device: ${detail}`);
    }
}

export function androidDevice(): Plugin {
    const customShortcuts: CLIShortcut<ViteDevServer | PreviewServer>[] = [
        { key: 'd', description: 'open on Android device (adb)', action: openOnDevice }
    ];
    return {
        name: 'android-device',
        apply: 'serve',
        configureServer(server) {
            server.bindCLIShortcuts({ customShortcuts });
        },
        configurePreviewServer(server) {
            server.bindCLIShortcuts({ customShortcuts });
        }
    };
}
