import { json } from '@sveltejs/kit';
import { catalog } from '$lib/data/catalog';

export async function GET() {
    return json(catalog);
}
