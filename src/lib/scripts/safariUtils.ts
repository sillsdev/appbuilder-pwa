const DISMISSED_KEY = 'safari_annotation_warning_dismissed';
const DISMISS_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

function isSafariWithoutStandalone(): boolean {
    if (typeof window === 'undefined') return false;
    const ua = navigator.userAgent;
    const isSafari = /Safari/.test(ua) && !/Chrome|CriOS|FxiOS|EdgiOS/.test(ua);
    const isStandalone = (navigator as Navigator & { standalone?: boolean }).standalone === true;
    return isSafari && !isStandalone;
}

export function shouldShowSafariWarning(): boolean {
    if (typeof window === 'undefined') return false;
    // Debug override: because the app uses hash routing, append ?debug_safari=true
    // inside the hash, e.g. /#/bookmarks?debug_safari=true
    const hashQuery = window.location.hash.split('?')[1] ?? '';
    if (new URLSearchParams(hashQuery).get('debug_safari') === 'true') return true;
    if (!isSafariWithoutStandalone()) return false;
    try {
        const dismissed = localStorage.getItem(DISMISSED_KEY);
        if (!dismissed) return true;
        const dismissedAt = parseInt(dismissed, 10);
        if (isNaN(dismissedAt)) return true;
        return Date.now() - dismissedAt > DISMISS_DURATION_MS;
    } catch {
        return true;
    }
}

export function dismissSafariWarning(): void {
    try {
        localStorage.setItem(DISMISSED_KEY, Date.now().toString());
    } catch {
        // If storage is unavailable, silently ignore — the warning will reappear next visit
    }
}
