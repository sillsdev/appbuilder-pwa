// `npm run preview:device`: the same as `npm run preview`, but also opens the app on a connected
// Android device (see vite-plugin-android-device.ts). This starts the preview through vite's API
// rather than spawning the CLI, so there is no child process to leave running if this is killed,
// and it sets OPEN_ON_DEVICE without depending on shell-specific syntax for env vars.
import { preview } from 'vite';

process.env.OPEN_ON_DEVICE = '1';

const server = await preview({ preview: { host: true } });
server.printUrls();
server.bindCLIShortcuts({ print: true });
