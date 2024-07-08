import {
    isErrorResponse,
    type Message,
    type MessageRequest,
    type MessageResponse
} from './message';

export interface MessageIO {
    /**
     * Post an outgoing message
     */
    postMessage: (message: Message) => void;

    /**
     * Allow the interface to set an onMessage event handler for this worker or window
     */
    setOnMessage(handler: (event: MessageEvent<Message>) => void): void;
}

export type RequestHandler = (request: MessageRequest) => Promise<MessageResponse>;

interface MessengerOptions {
    timeout?: number;
    inboundHandler?: RequestHandler;
}

/**
 * Communcates between threads using messages
 *
 * The built-in mechanism for communicating with a web worker
 * is through MessageEvent's, which only provide one-way communication.
 *
 * This class enables two-way communcation in a call-return format.
 */
export class Messenger {
    /**
     * Create a messenger for making and handling message requests
     * @param messageIO An interface for sending and recieving messages
     * @param inboundHandler Handles inbound requests
     * @param timeout Timeout for outbound requests, in milliseconds
     */
    constructor(messageIO: MessageIO, { timeout = 5000, inboundHandler }: MessengerOptions = {}) {
        this.requestHandler = inboundHandler;
        this.io = messageIO;
        this.timeout = timeout;
        messageIO.setOnMessage((m) => this.onMessage(m));
    }

    io: MessageIO;
    requestHandler: RequestHandler;
    timeout: number;

    pendingRequests = new Map<
        number,
        { resolve: (response: MessageResponse) => void; reject: (reason: Error) => void }
    >();
    lastRequest = -1;

    setInboundHandler(handler: RequestHandler) {
        this.requestHandler = handler;
    }

    /**
     * Get a function to handle outgoing request and response messages.
     */
    outboundHandler(): RequestHandler {
        return (request) => this.postRequest(request);
    }

    /**
     * Await the response for the given request
     */
    postRequest(request: MessageRequest): Promise<MessageResponse> {
        const id = ++this.lastRequest;
        const message: Message = {
            transactionId: id,
            type: 'request',
            payload: request
        };
        const requestPromise = new Promise<MessageResponse>((resolve, reject) => {
            this.pendingRequests.set(id, { resolve, reject });
            this.io.postMessage(message);
        });
        return this.addTimeout(requestPromise, request, id);
    }

    protected addTimeout(
        promise: Promise<MessageResponse>,
        request: MessageRequest,
        transactionId: number
    ): Promise<MessageResponse> {
        if (!this.timeout) {
            return promise;
        }
        const timeoutPromise = this.setRequestTimeout(request, transactionId);
        return Promise.race([promise, timeoutPromise]);
    }

    protected async setRequestTimeout(request: MessageRequest, id: number) {
        await new Promise<void>((resolve) => setTimeout(resolve, this.timeout));
        this.pendingRequests.delete(id);
        return await Promise.reject(
            new Error(
                `Message request timed out after ${this.timeout} ms. Request type: ${request.type}`
            )
        );
    }

    protected onMessage(event: MessageEvent<Message>) {
        const message = event.data;
        if (message?.type === 'request') {
            this.onRequest(message);
        } else if (message?.type === 'response') {
            this.onResponse(message);
        } else {
            throw new Error(`Invalid message from worker: ${message}`);
        }
    }

    protected async onRequest(message: Message) {
        if (!this.requestHandler) {
            throw new Error(
                'Messenger incoming request handler was undefined. Did you foget to call setInboundHandler?'
            );
        }
        const response = await this.requestHandler(message.payload);
        const outgoing: Message = {
            transactionId: message.transactionId,
            type: 'response',
            payload: response
        };
        this.io.postMessage(outgoing);
    }

    protected onResponse(message: Message) {
        const id = message.transactionId;
        if (!this.pendingRequests.has(id)) {
            throw new Error(`No callback to handle response for message transaction ${id}`);
        }
        const response = message.payload;
        const { resolve, reject } = this.pendingRequests.get(id);
        if (isErrorResponse(response)) {
            reject(new Error(response.message));
        } else {
            resolve(response);
        }
        this.pendingRequests.delete(id);
    }
}
