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
    const { stdout } = await execFileAsync(findAdb(), args);
    return stdout.trim();
}

// Ports this process has forwarded with `adb reverse`. They are removed on exit, leaving any
// forwards set up outside this plugin alone. The removal is synchronous because 'exit' listeners
// can't wait on async work; failures (e.g. the device was unplugged) are ignored.
const reversedPorts = new Set<string>();

function removeReversedPorts() {
    for (const port of reversedPorts) {
        try {
            execFileSync(findAdb(), ['reverse', '--remove', `tcp:${port}`], { stdio: 'ignore' });
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
        await adb(['reverse', `tcp:${port}`, `tcp:${port}`]);
        trackReversedPort(port);
        await adb(['shell', 'am', 'start', '-a', 'android.intent.action.VIEW', '-d', url.href]);
        logger.info(`  Opened ${url.href} on Android device`);
    } catch (e) {
        const err = e as NodeJS.ErrnoException & { stderr?: string };
        const detail =
            err.code === 'ENOENT'
                ? `adb not found (tried ${findAdb()}); set ADB or ANDROID_HOME, or add it to PATH`
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
