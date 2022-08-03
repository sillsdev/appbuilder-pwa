//added handle function because of an SSR issue that was breaking the app
/** @type {import('@sveltejs/kit').Handle} */
export async function handle({ event, resolve }) {
    const response = await resolve(event, {
        ssr: false
    });

    return response;
}
