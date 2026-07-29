import { browser } from '$app/environment';
import { readable } from 'svelte/store';

export const appOnline = readable(true, (set) => {
    if (browser) {
        let fromNavigator = navigator.onLine;
        let fromWorker = true;

        function updateValue() {
            // if worker says we're offline, we're offline
            // if worker says we're online, check navigator.onLine
            // navigator more likely to have false positive than false negative
            set(!fromWorker || fromNavigator);
        }

        updateValue();

        function online() {
            fromNavigator = true;
            updateValue();
        }

        function offline() {
            fromNavigator = false;
            updateValue();
        }

        function message(msg: any) {
            if ('online' in msg) {
                fromWorker = !!msg.online;
                updateValue();
            }
        }
        window.addEventListener('online', online);
        window.addEventListener('offline', offline);
        navigator.serviceWorker.addEventListener('message', message);

        return () => {
            window.removeEventListener('online', online);
            window.removeEventListener('offline', offline);
            navigator.serviceWorker.removeEventListener('message', message);
        };
    }
});
