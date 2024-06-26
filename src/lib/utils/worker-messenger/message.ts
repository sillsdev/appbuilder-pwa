export interface Message {
    transactionId: number;
    type: 'request' | 'response';
    payload: MessageRequest | MessageResponse;
}

export interface MessageRequest {
    type: string;
}

export interface MessageResponse {
    type: string;
}

export interface ErrorResponse extends MessageResponse {
    type: 'error';
    message: string;
}

export function isErrorResponse(response: MessageResponse): response is ErrorResponse {
    return response.type === 'error';
}

export interface TimeoutResponse extends MessageResponse {
    type: 'timeout-error';
}

export function isTimeoutResponse(response: MessageResponse): response is TimeoutResponse {
    return response.type === 'timeout-error';
}
