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
    // Debug override: add ?debug_safari=true to any URL to force-show the warning
    const hashQuery = window.location.hash.split('?')[1] ?? '';
    if (new URLSearchParams(hashQuery).get('debug_safari') === 'true') return true;
    if (!isSafariWithoutStandalone()) return false;
    const dismissed = localStorage.getItem(DISMISSED_KEY);
    if (!dismissed) return true;
    return Date.now() - parseInt(dismissed, 10) > DISMISS_DURATION_MS;
}

export function dismissSafariWarning(): void {
    localStorage.setItem(DISMISSED_KEY, Date.now().toString());
}
