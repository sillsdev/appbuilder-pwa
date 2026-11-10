import config from '$assets/config';
import manifestHref from '$assets/manifestUrl.json';
import type { PageLoad } from './$types';

interface ManifestIcon {
    src: string;
    sizes?: string;
}

const PREFERRED_ICON_SIZE = 192;

// Pick the icon closest to PREFERRED_ICON_SIZE, preferring larger icons so the image
// stays sharp when displayed. Icons with sizes "any" are only used as a last resort.
function pickIcon(icons: ManifestIcon[]): ManifestIcon | undefined {
    const sized = icons
        .map((icon) => ({ icon, size: parseInt(icon.sizes?.split('x')[0] ?? '', 10) }))
        .filter(({ size }) => !isNaN(size));
    const larger = sized.filter(({ size }) => size >= PREFERRED_ICON_SIZE);
    const candidates = larger.length > 0 ? larger : sized;
    candidates.sort((a, b) => (larger.length > 0 ? a.size - b.size : b.size - a.size));
    return candidates[0]?.icon ?? icons[0];
}

export const load: PageLoad = async ({ fetch }) => {
    // The manifest and icon names are hashed at build time, so read the icon from the manifest
    const manifestUrl = new URL(manifestHref.url, document.baseURI);
    let name = config.name;
    let shortName = '';
    let iconUrl = '';
    try {
        const response = await fetch(manifestUrl);
        const manifest = await response.json();
        name = manifest.name || name;
        shortName = manifest.short_name || '';
        const icon = pickIcon(manifest.icons ?? []);
        if (icon) {
            // Icon paths are relative to the manifest
            iconUrl = new URL(icon.src, manifestUrl).href;
        }
    } catch (e) {
        console.error('Unable to read manifest for install page', e);
    }

    // Mobile home screens label the icon with short_name, falling back to name
    return { name, shortName: shortName || name, iconUrl };
};
