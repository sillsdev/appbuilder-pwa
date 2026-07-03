const DISMISSED_KEY = 'safari_annotation_warning_dismissed';
const ANNOTATION_HINT_KEY = 'safari_annotation_hint_shown';
const DISMISS_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export type SafariWarningContext = 'ios' | 'macos' | null;

function isIOS(): boolean {
    if (/iPhone|iPod/.test(navigator.userAgent)) {
        return true;
    }
    if (/iPad/.test(navigator.userAgent)) {
        return true;
    }
    // iPad on iOS 13+ reports as MacIntel but has touch support
    if (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) {
        return true;
    }
    return false;
}

function isMacOSSafari(): boolean {
    if (isIOS()) {
        return false;
    }
    const ua = navigator.userAgent;
    return /Safari/.test(ua) && !/Chrome|CriOS|FxiOS|EdgiOS/.test(ua) && /Macintosh/.test(ua);
}

function getContext(): SafariWarningContext {
    const isStandalone = (navigator as Navigator & { standalone?: boolean }).standalone === true;
    if (isStandalone) {
        return null;
    }
    if (isIOS()) {
        return 'ios';
    }
    if (isMacOSSafari()) {
        return 'macos';
    }
    return null;
}

export function getSafariWarningContext(): SafariWarningContext {
    if (typeof window === 'undefined') {
        return null;
    }
    // Debug override: because the app uses hash routing, append ?debug_safari=true
    // inside the hash, e.g. /#/bookmarks?debug_safari=true
    const hashQuery = window.location.hash.split('?')[1] ?? '';
    if (new URLSearchParams(hashQuery).get('debug_safari') === 'true') {
        return 'ios';
    }
    const context = getContext();
    if (!context) {
        return null;
    }
    try {
        const dismissed = localStorage.getItem(DISMISSED_KEY);
        if (!dismissed) {
            return context;
        }
        const dismissedAt = parseInt(dismissed, 10);
        if (isNaN(dismissedAt)) {
            return context;
        }
        if (Date.now() - dismissedAt > DISMISS_DURATION_MS) {
            return context;
        }
        return null;
    } catch {
        return context;
    }
}

export function dismissSafariWarning(): void {
    try {
        localStorage.setItem(DISMISSED_KEY, Date.now().toString());
    } catch {
        // If storage is unavailable, silently ignore — the warning will reappear next visit
    }
}

export function shouldShowAnnotationHint(): boolean {
    if (typeof window === 'undefined') {
        return false;
    }
    if (!getContext()) {
        return false;
    }
    try {
        return !localStorage.getItem(ANNOTATION_HINT_KEY);
    } catch {
        return false;
    }
}

export function markAnnotationHintShown(): void {
    try {
        localStorage.setItem(ANNOTATION_HINT_KEY, '1');
    } catch {
        // silently ignore
    }
}
