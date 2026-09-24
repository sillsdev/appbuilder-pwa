// Adds a "d + enter" shortcut to `vite dev` and `vite preview` that opens the app in the default
// browser of a USB-connected Android device. `adb reverse` forwards the device's localhost port
// to this machine, so the page loads as http://localhost (a secure context, which service
// workers require) instead of over the LAN address.
// The device used is the only ready one, or the one named by ANDROID_SERIAL when several are
// connected. With OPEN_ON_DEVICE set (see scripts/preview-device.mts), `vite preview` also opens
// the app on the device once the server is listening, if a device is connected.
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

// Every device operation names its device with -s. Without it adb counts all entries in
// `adb devices`, including offline and unauthorized ones, and fails with "more than one
// device/emulator" even when only one device is usable.
function adbOn(serial: string, args: string[]): Promise<string> {
    return adb(['-s', serial, ...args]);
}

type DeviceSelection = { serial: string } | { reason: string; expected: boolean };

// The device to use is the ANDROID_SERIAL one if set, otherwise the only ready device. A reason
// is returned when there isn't exactly one; `expected` marks no device being connected at all,
// which is normal for the automatic open rather than something to warn about.
async function selectDevice(): Promise<DeviceSelection> {
    let devices: { serial: string; state: string }[];
    try {
        // Lines after the header are "<serial>\t<state>", e.g. state device, unauthorized, offline
        devices = (await adb(['devices']))
            .split('\n')
            .slice(1)
            .map((line) => line.trim().split(/\s+/))
            .filter((fields) => fields.length >= 2)
            .map(([serial, state]) => ({ serial, state }));
    } catch (e) {
        return { reason: describeAdbError(e), expected: false };
    }
    const serial = process.env.ANDROID_SERIAL;
    const candidates = serial ? devices.filter((d) => d.serial === serial) : devices;
    const ready = candidates.filter((d) => d.state === 'device');
    if (ready.length === 1) {
        return { serial: ready[0].serial };
    }
    if (ready.length > 1) {
        return {
            reason: `${ready.length} devices connected; set ANDROID_SERIAL to choose one`,
            expected: false
        };
    }
    if (candidates.length > 0) {
        const { serial: s, state } = candidates[0];
        const hint = state === 'unauthorized' ? '; accept the USB debugging prompt on it' : '';
        return { reason: `${s} is ${state}${hint}`, expected: false };
    }
    return serial
        ? { reason: `ANDROID_SERIAL ${serial} is not connected`, expected: false }
        : { reason: 'no device connected', expected: true };
}

// Ports this process has forwarded with `adb reverse`, by device serial. They are removed on
// exit, leaving any forwards set up outside this plugin alone. The removal is synchronous because
// 'exit' listeners can't wait on async work; failures (e.g. the device was unplugged) are ignored.
const reversedPorts = new Map<string, Set<string>>();

function removeReversedPorts() {
    for (const [serial, ports] of reversedPorts) {
        for (const port of ports) {
            try {
                execFileSync(findAdb(), ['-s', serial, 'reverse', '--remove', `tcp:${port}`], {
                    stdio: 'ignore',
                    timeout: ADB_CLEANUP_TIMEOUT_MS
                });
            } catch {
                // Nothing to clean up
            }
        }
    }
}

function trackReversedPort(serial: string, port: string) {
    // Registered on first use so processes that never forward a port (e.g. `vite build`) are
    // untouched. Ctrl+C (SIGINT) would otherwise terminate without running 'exit' listeners, so
    // it is turned into a normal exit with the conventional 128 + SIGINT(2) code.
    if (reversedPorts.size === 0) {
        process.on('exit', removeReversedPorts);
        process.on('SIGINT', () => process.exit(130));
    }
    let ports = reversedPorts.get(serial);
    if (!ports) {
        ports = new Set();
        reversedPorts.set(serial, ports);
    }
    ports.add(port);
}

// --no-rebind keeps a mapping owned by another tool (or a manual `adb reverse`) from being
// replaced here and then removed on exit. It also fails when the existing mapping is identical,
// so in that case the mapping is reused, but not tracked, since this process didn't create it.
async function ensureReversed(serial: string, port: string): Promise<void> {
    if (reversedPorts.get(serial)?.has(port)) {
        return;
    }
    const spec = `tcp:${port}`;
    try {
        await adbOn(serial, ['reverse', '--no-rebind', spec, spec]);
        trackReversedPort(serial, port);
    } catch (e) {
        const err = e as { stderr?: string };
        if (!err.stderr?.includes('cannot rebind')) {
            throw e;
        }
        // Each line of the list is "<transport> <device spec> <local spec>"
        const existing = (await adbOn(serial, ['reverse', '--list']))
            .split('\n')
            .map((line) => line.trim().split(/\s+/))
            .find((fields) => fields[1] === spec);
        if (existing?.[2] !== spec) {
            throw new Error(
                `${spec} on ${serial} is already forwarded to ${existing?.[2] ?? 'another port'}; ` +
                    `remove it with \`adb -s ${serial} reverse --remove ${spec}\``
            );
        }
    }
}

function describeAdbError(e: unknown): string {
    const err = e as NodeJS.ErrnoException & { stderr?: string; killed?: boolean };
    return err.code === 'ENOENT'
        ? `adb not found (tried ${findAdb()}); set ADB or ANDROID_HOME, or add it to PATH`
        : err.killed
          ? `adb did not respond within ${ADB_TIMEOUT_MS / 1000}s`
          : err.stderr?.trim() || err.message;
}

async function openOnDevice(server: ViteDevServer | PreviewServer, serial: string): Promise<void> {
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
        await ensureReversed(serial, port);
        await adbOn(serial, [
            'shell',
            'am',
            'start',
            '-a',
            'android.intent.action.VIEW',
            '-d',
            url.href
        ]);
        logger.info(`  Opened ${url.href} on Android device ${serial}`);
    } catch (e) {
        logger.error(`  Failed to open on Android device ${serial}: ${describeAdbError(e)}`);
    }
}

// The "d" shortcut: an explicit request, so not finding a device is reported as an error.
async function openOnSelectedDevice(server: ViteDevServer | PreviewServer): Promise<void> {
    const selection = await selectDevice();
    if ('serial' in selection) {
        await openOnDevice(server, selection.serial);
    } else {
        server.config.logger.error(`  Failed to open on Android device: ${selection.reason}`);
    }
}

// OPEN_ON_DEVICE: the server runs as usual when there is no device to open on.
async function openOnDeviceIfConnected(server: PreviewServer): Promise<void> {
    const selection = await selectDevice();
    if ('serial' in selection) {
        await openOnDevice(server, selection.serial);
    } else {
        const message = `  Not opening on Android device: ${selection.reason}`;
        if (selection.expected) {
            server.config.logger.info(message);
        } else {
            server.config.logger.warn(message);
        }
    }
}

export function androidDevice(): Plugin {
    const customShortcuts: CLIShortcut<ViteDevServer | PreviewServer>[] = [
        { key: 'd', description: 'open on Android device (adb)', action: openOnSelectedDevice }
    ];
    return {
        name: 'android-device',
        apply: 'serve',
        configureServer(server) {
            server.bindCLIShortcuts({ customShortcuts });
        },
        configurePreviewServer(server) {
            server.bindCLIShortcuts({ customShortcuts });
            if (process.env.OPEN_ON_DEVICE) {
                // resolvedUrls is set just after 'listening' fires, so wait a turn for it
                server.httpServer.once('listening', () => {
                    setImmediate(() => void openOnDeviceIfConnected(server));
                });
            }
        }
    };
}
