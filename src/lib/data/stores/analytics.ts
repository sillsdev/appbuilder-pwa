import { derived, writable } from 'svelte/store';
import config from '$lib/data/config';

interface AnalyticsStore {
    initialized: boolean;
}

export const analyticsStore = () => {
    let firebaseAnalytics = null;
    let firebaseLogEvent = null;
    const internal = writable<AnalyticsStore>({ initialized: false });

    const external = derived(internal, ($internal: AnalyticsStore) => ({ ...$internal }));

    const init = async () => {
        if (config.firebase.features['firebase-analytics'] && config.analytics.enabled) {
            try {
                // Dynamically import Firebase modules
                const { initializeApp } = await import('firebase/app');
                const { getAnalytics, logEvent } = await import('firebase/analytics');
                const { firebaseConfig } = await import('$lib/data/firebase-config');
                if (firebaseConfig) {
                    console.log(
                        `Analytics: Initializing Firebase: projectId=${firebaseConfig.projectId}, appId=${firebaseConfig.appId}`
                    );
                    const app = initializeApp(firebaseConfig);
                    firebaseAnalytics = getAnalytics(app);
                    firebaseLogEvent = logEvent;
                }
                internal.set({ initialized: true });
            } catch (error) {
                console.error('Failed to initialize Firebase Analytics:', error);
                // Optionally handle error or retry initialization
            }
        } else {
            internal.set({ initialized: true }); // Mark as initialized even if not initialized
        }
    };

    const log = (eventName: string, eventParams?: any) => {
        if (firebaseAnalytics) {
            console.log('Analytics: Event:', eventName, eventParams);
            firebaseLogEvent(firebaseAnalytics, eventName, eventParams);
        }
    };

    return {
        init,
        subscribe: external.subscribe,
        log
    };
};

export const analytics = analyticsStore();
