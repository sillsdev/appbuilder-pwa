import type { MessageRequest } from '$lib/utils/worker-messenger/message';

export interface DocsetUrlRequest extends MessageRequest {
    type: 'docset-url-request';
    docSet: string;
}

export function isDocsetUrlRequest(request: MessageRequest): request is DocsetUrlRequest {
    return request.type === 'docset-url-request';
}
