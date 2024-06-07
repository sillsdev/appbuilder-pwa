import { derived, writable } from 'svelte/store';
import { initializeApp } from 'firebase/app';
import { getAnalytics, type Analytics, logEvent } from 'firebase/analytics';
import { firebaseConfig } from '$lib/data/firebase-config';
import { firstLaunch } from '$lib/data/stores/view';

interface AnalyticsStore {
    initialized: boolean;
}

export const analyticsStore = () => {
    let analytics: Analytics = null;
    const internal = writable<AnalyticsStore>();

    const external = derived(internal, ($internal: object) => ({ ...$internal }) as AnalyticsStore);

    const init = () => {
        if (firebaseConfig) {
            console.log(
                `Analytics: Initializing Firebase: projectId=${firebaseConfig.projectId}, appId=${firebaseConfig.appId}`
            );
            const app = initializeApp(firebaseConfig);
            analytics = getAnalytics(app);
        }
        internal.set({ initialized: true });
    };

    const log = (eventName: string, eventParams?: any) => {
        if (analytics) {
            console.log('Analytics: Event:', eventName, eventParams);
            logEvent(analytics, eventName, eventParams);
        }
    };

    return {
        init,
        subscribe: external.subscribe,
        log
    };
};

export const analytics = analyticsStore();

firstLaunch.subscribe((value: boolean) => {
    if (!value) {
        analytics.log('ab_first_run');
    }
});
