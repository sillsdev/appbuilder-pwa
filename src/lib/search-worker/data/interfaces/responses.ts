import type { MessageResponse } from '$lib/utils/worker-messenger/message';

export interface DocsetUrlResponse extends MessageResponse {
    type: 'docset-url';
    url: string;
    base: string;
}

export function isDocsetUrlResponse(response: MessageResponse): response is DocsetUrlResponse {
    return response.type === 'docset-url';
}
