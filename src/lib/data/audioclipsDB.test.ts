import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { fetchWithProtocolFallback, resetProtocolPreferences } from './audioclipsDB';

describe('fetchWithProtocolFallback', () => {
    beforeEach(() => {
        resetProtocolPreferences();
        vi.stubGlobal('fetch', vi.fn());
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    test('HTTP URL succeeds -> only HTTP is used', async () => {
        const okResponse = new Response('ok');
        (fetch as any).mockResolvedValueOnce(okResponse);

        const response = await fetchWithProtocolFallback('http://example.com/audio.mp3', {});

        expect(response).toBe(okResponse);
        expect(fetch).toHaveBeenCalledTimes(1);
        expect(fetch).toHaveBeenCalledWith('http://example.com/audio.mp3', {});
    });

    test('HTTP fails and HTTPS succeeds -> HTTPS is subsequently used for that origin', async () => {
        const httpsResponse = new Response('ok');
        (fetch as any)
            .mockRejectedValueOnce(new TypeError('Failed to fetch'))
            .mockResolvedValueOnce(httpsResponse);

        const response = await fetchWithProtocolFallback('http://example.com/audio.mp3', {});

        expect(response).toBe(httpsResponse);
        expect(fetch).toHaveBeenCalledTimes(2);
        expect(fetch).toHaveBeenNthCalledWith(1, 'http://example.com/audio.mp3', {});
        expect(fetch).toHaveBeenNthCalledWith(2, 'https://example.com/audio.mp3', {});

        // Subsequent request to the same origin should go straight to HTTPS.
        const secondHttpsResponse = new Response('ok');
        (fetch as any).mockResolvedValueOnce(secondHttpsResponse);
        const secondResponse = await fetchWithProtocolFallback(
            'http://example.com/other.mp3',
            {}
        );

        expect(secondResponse).toBe(secondHttpsResponse);
        expect(fetch).toHaveBeenCalledTimes(3);
        expect(fetch).toHaveBeenNthCalledWith(3, 'https://example.com/other.mp3', {});
    });

    test('HTTPS URL succeeds -> no HTTP attempt', async () => {
        const httpsResponse = new Response('ok');
        (fetch as any).mockResolvedValueOnce(httpsResponse);

        const response = await fetchWithProtocolFallback('https://example.com/audio.mp3', {});

        expect(response).toBe(httpsResponse);
        expect(fetch).toHaveBeenCalledTimes(1);
        expect(fetch).toHaveBeenCalledWith('https://example.com/audio.mp3', {});
    });

    test('HTTP and HTTPS both fail -> the failure is propagated', async () => {
        const httpsError = new TypeError('Failed to fetch');
        (fetch as any)
            .mockRejectedValueOnce(new TypeError('Failed to fetch'))
            .mockRejectedValueOnce(httpsError);

        await expect(
            fetchWithProtocolFallback('http://example.com/audio.mp3', {})
        ).rejects.toBe(httpsError);
        expect(fetch).toHaveBeenCalledTimes(2);
    });

    test('different origins independently have different protocol preferences', async () => {
        const workingHttpResponse = new Response('ok');
        (fetch as any).mockResolvedValueOnce(workingHttpResponse);

        // origin-a works fine over plain HTTP (e.g. a MicroPi server).
        const responseA = await fetchWithProtocolFallback('http://origin-a.example/audio.mp3', {});
        expect(responseA).toBe(workingHttpResponse);
        expect(fetch).toHaveBeenLastCalledWith('http://origin-a.example/audio.mp3', {});

        // origin-b requires HTTPS.
        const httpsResponseB = new Response('ok');
        (fetch as any)
            .mockRejectedValueOnce(new TypeError('Failed to fetch'))
            .mockResolvedValueOnce(httpsResponseB);
        const responseB = await fetchWithProtocolFallback('http://origin-b.example/audio.mp3', {});
        expect(responseB).toBe(httpsResponseB);
        expect(fetch).toHaveBeenLastCalledWith('https://origin-b.example/audio.mp3', {});

        // origin-a should still be requested directly over HTTP afterwards.
        const secondHttpResponseA = new Response('ok');
        (fetch as any).mockResolvedValueOnce(secondHttpResponseA);
        const responseA2 = await fetchWithProtocolFallback(
            'http://origin-a.example/other.mp3',
            {}
        );
        expect(responseA2).toBe(secondHttpResponseA);
        expect(fetch).toHaveBeenLastCalledWith('http://origin-a.example/other.mp3', {});
    });
});
