import { base } from '$app/paths';

/** @type {import('./$types').PageLoad} */
export async function load({ fetch }) {
    // Load the first letter of the alphabet's data by default
    const alphabet = [
        'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm',
        'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'
    ];

    let initialReversalData = {};
    try {
        const response = await fetch(`${base}/reversal/language/english/${alphabet[0]}.json`);
        if (response.ok) {
            initialReversalData = await response.json();
        }
    } catch (error) {
        console.error('Error loading initial reversal data:', error);
    }

    return {
        alphabet,
        initialReversalData
    };
}