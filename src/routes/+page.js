import { redirect } from '@sveltejs/kit';

/** @type {import('./$types').PageLoad} */
export async function load({ url }) {
    try {
        const ref = url.searchParams.get('ref');
        const audio = url.searchParams.get('audio')

        if (!ref && !audio) {
            throw new Error('Missing required query parameters: "ref" or "audio".');
        };

        return { ref, audio };
    } catch (err) {
        // Redirect to your error page with message
        const message = err instanceof Error ? err.message : 'Unknown error';
        window.location.hash = `/error?message=${encodeURIComponent(message)}`;
    }
}
