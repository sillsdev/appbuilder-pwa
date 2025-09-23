// src/hooks.client.ts
import { goto } from '$app/navigation';

export function handleError({ error, event }) {
    if (error instanceof Error) {
        console.error('Client error:', error.message);
    } else {
        console.error('Client error (unknown type):', error);
    }
}
