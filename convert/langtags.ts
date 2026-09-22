const LANGTAGS_URL = 'https://ldml.api.sil.org/langtags.json';

type LangTagsEntry = {
    tag: string;
    iso639_3?: string;
    tags?: string[];
    name?: string;
    names?: string[];
};

let cachedLookup: Map<string, string> | undefined;

// Fetched once per conversion run; on failure returns an empty lookup so callers fall back
// to the collection's configured language code instead of failing the build.
export async function getLangTagLookup(verbose: number): Promise<Map<string, string>> {
    if (cachedLookup) {
        return cachedLookup;
    }
    const lookup = new Map<string, string>();
    try {
        const response = await fetch(LANGTAGS_URL);
        if (!response.ok) {
            throw new Error(`Request failed with status ${response.status}`);
        }
        const entries = (await response.json()) as LangTagsEntry[];
        for (const entry of entries) {
            const canonical = entry.iso639_3 ?? entry.tag;
            if (!canonical) {
                continue;
            }
            const keys = [
                entry.tag,
                entry.iso639_3,
                entry.name,
                ...(entry.tags ?? []),
                ...(entry.names ?? [])
            ];
            for (const key of keys) {
                if (key && !lookup.has(key.toLowerCase())) {
                    lookup.set(key.toLowerCase(), canonical);
                }
            }
        }
        if (verbose) {
            console.log(`Fetched ${entries.length} entries from ${LANGTAGS_URL}`);
        }
    } catch (e) {
        console.error(
            ` ⚠️ Could not fetch ${LANGTAGS_URL} (${e instanceof Error ? e.message : e}). Bloom book language resolution will fall back to each collection's configured language code.`
        );
    }
    cachedLookup = lookup;
    return lookup;
}

export function resolveLangTag(
    value: string | undefined,
    lookup: Map<string, string>
): string | undefined {
    if (!value) {
        return undefined;
    }
    return lookup.get(value.toLowerCase());
}
