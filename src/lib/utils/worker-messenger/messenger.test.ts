import { describe, expect, test, vi } from 'vitest';
import type { ErrorResponse, Message, MessageResponse } from './message';
import { Messenger, type MessageIO, type RequestHandler } from './messenger';

const incomingRequestHandler: RequestHandler = async (request) => ({ type: 'outgoing-response' });

const testMessageResponse: MessageResponse = {
    type: 'test-response'
};

const testMessageRequest: MessageResponse = {
    type: 'test-request'
};

function testResponseEvent(outgoing: Message, response?: MessageResponse) {
    response ??= testMessageResponse;
    const responseMessage: Message = {
        transactionId: outgoing.transactionId,
        type: 'response',
        payload: response
    };
    return new MessageEvent('message', { data: responseMessage });
}

function testRequestEvent() {
    const reqeust = testMessageRequest;
    const message: Message = {
        transactionId: 42,
        type: 'request',
        payload: reqeust
    };
    return new MessageEvent('message', { data: message });
}

class TestMessageIO implements MessageIO {
    constructor(autoResponse?: MessageResponse) {
        this.autoResponse = autoResponse;
    }

    autoResponse: MessageResponse;
    lastPosted: Message;

    postMessage(message: Message) {
        this.lastPosted = message;
        if (message.type === 'request') {
            // Simulate an incoming message in response to our request
            const event = testResponseEvent(message, this.autoResponse);
            this.onMessage(event);
        }
    }

    onMessage: (event: MessageEvent<Message>) => void;

    setOnMessage(handler: (event: MessageEvent<Message>) => void): void {
        this.onMessage = handler;
    }
}

class BrokenMessageIO implements MessageIO {
    postMessage(message: Message): void {}

    setOnMessage(handler: (event: MessageEvent<Message>) => void): void {}
}

class DelayedMessageIO extends TestMessageIO {
    constructor(ms: number) {
        super();
        this.delay = ms;
    }

    delay: number;

    postMessage(message: Message): void {
        new Promise((resolve) => setTimeout(resolve, this.delay)).then(() =>
            super.postMessage(message)
        );
    }
}

test('sets client onMessage', () => {
    const io = new TestMessageIO();
    new Messenger(io, { inboundHandler: incomingRequestHandler });
    expect(io.onMessage).toBeDefined();
});

describe('postRequest', () => {
    test('posts request', async () => {
        const io = new TestMessageIO();
        const messenger = new Messenger(io, { inboundHandler: incomingRequestHandler });
        let requestSent: Message;
        const spy = vi.spyOn(io, 'postMessage');

        spy.mockImplementationOnce((message) => {
            requestSent = message;
            io.postMessage(message);
        });

        const request = { type: 'my-request' };
        await messenger.postRequest(request);

        expect(spy).toHaveBeenCalled();
        expect(requestSent.type).toBe('request');
    });

    test('posts correct payload', async () => {
        const io = new TestMessageIO();
        const messenger = new Messenger(io, { inboundHandler: incomingRequestHandler });

        let requestSent: Message;
        const spy = vi.spyOn(io, 'postMessage');

        spy.mockImplementationOnce((message) => {
            requestSent = message;
            io.postMessage(message);
        });

        const request = { type: 'my-request' };
        await messenger.postRequest(request);

        expect(spy).toHaveBeenCalled();
        expect(requestSent.payload).toBe(request);
    });

    test('returns response from other client', async () => {
        const io = new TestMessageIO();
        const messenger = new Messenger(io, { inboundHandler: incomingRequestHandler });
        const request = { type: 'test-request' };
        const response = await messenger.postRequest(request);
        expect(response).toBe(testMessageResponse);
    });

    test('two transactions have different ids', async () => {
        const io = new TestMessageIO();
        const messenger = new Messenger(io, { inboundHandler: incomingRequestHandler });

        const sent: Message[] = [];
        const spy = vi.spyOn(io, 'postMessage');

        spy.mockImplementation((message) => {
            sent.push(message);
            const event = testResponseEvent(message);
            io.onMessage(event);
        });

        const request = { type: 'test-request' };
        await messenger.postRequest(request);
        await messenger.postRequest(request);

        expect(sent[0].transactionId == sent[1].transactionId).toBe(false);
    });

    test('unexpected response throws reasonable error', () => {
        const io = new TestMessageIO();
        new Messenger(io, { inboundHandler: incomingRequestHandler });
        const response = testMessageResponse;
        const responseMessage: Message = {
            transactionId: 0,
            type: 'response',
            payload: response
        };
        const event = new MessageEvent('message', { data: responseMessage });
        expect(() => io.onMessage(event)).toThrow('response');
    });

    test('no memory leaks in pendingRequest', async () => {
        const io = new TestMessageIO();
        const messenger = new Messenger(io, { inboundHandler: incomingRequestHandler });
        const request = { type: 'test' };
        await messenger.postRequest(request);
        await messenger.postRequest(request);
        await messenger.postRequest(request);
        expect(Array.from(messenger.pendingRequests.keys())).toEqual([]);
    });

    test('timeout exceeded rejects promise', async () => {
        const io = new BrokenMessageIO();
        const messenger = new Messenger(io, { inboundHandler: incomingRequestHandler, timeout: 5 });
        const request = { type: 'test' };
        expect(async () => await messenger.postRequest(request)).rejects.toThrow('time');
    });

    test('null timeout indicates no timeout', async () => {
        const io = new DelayedMessageIO(100);
        const messenger = new Messenger(io, {
            inboundHandler: incomingRequestHandler,
            timeout: null
        });
        const request = { type: 'test' };
        await messenger.postRequest(request);
    });

    test('timeout exceeded does not cause memory leak', async () => {
        const io = new BrokenMessageIO();
        const messenger = new Messenger(io, { inboundHandler: incomingRequestHandler, timeout: 5 });
        const request = { type: 'test' };
        try {
            await messenger.postRequest(request);
        } catch {
            const keys = messenger.pendingRequests.keys();
            expect(Array.from(keys)).toEqual([]);
        }
    });

    test('error response rejects promise', () => {
        const response: ErrorResponse = {
            type: 'error',
            message: 'this is a test'
        };
        const io = new TestMessageIO(response);
        const messenger = new Messenger(io, { inboundHandler: incomingRequestHandler });
        expect(() => messenger.postRequest({ type: 'test' })).rejects.toThrow('test');
    });
});

describe('incoming request', () => {
    const io = new TestMessageIO();
    new Messenger(io, { inboundHandler: incomingRequestHandler });

    let response: Message;
    vi.spyOn(io, 'postMessage').mockImplementation((message) => {
        response = message;
    });

    const event = testRequestEvent();
    io.onMessage(event);

    test('client posts response', () => {
        expect(response.type).toBe('response');
    });

    test('client response has correct transaction id', () => {
        expect(response.transactionId).toBe(event.data.transactionId);
    });

    test('client response has correct payload', () => {
        expect(response.payload).toEqual({ type: 'outgoing-response' });
    });
});

test('Invalid message throws reasonable error', () => {
    const io = new TestMessageIO();
    new Messenger(io, { inboundHandler: incomingRequestHandler });
    const message = new MessageEvent<any>('message');
    expect(() => io.onMessage(message)).toThrow('message');
});

test('setIncomingRequestHandler', async () => {
    const io = new TestMessageIO();
    const messenger = new Messenger(io);
    messenger.setInboundHandler(incomingRequestHandler);
    io.onMessage(testRequestEvent());
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(io.lastPosted).toBeDefined;
});
