import { EventEmitter } from 'node:events';

type EventPayload = {
    type: string;
    payload: unknown;
};

const emitter = new EventEmitter({ captureRejections: true });
emitter.setMaxListeners(0);

export function publish(event: EventPayload): void {
    emitter.emit('event', event);
}

export function subscribe(): AsyncIterable<EventPayload> {
    const asyncIterator = (async function* (): AsyncGenerator<EventPayload> {
        const queue: EventPayload[] = [];
        let resolve: (() => void) | null = null;

        const handler = (evt: EventPayload): void => {
            queue.push(evt);
            resolve?.();
            resolve = null;
        };

        emitter.on('event', handler);

        try {
            while (true) {
                if (queue.length === 0) {
                    await new Promise<void>((r) => {
                        resolve = r;
                    });
                }
                const item = queue.shift();
                if (item) yield item;
            }
        } finally {
            emitter.off('event', handler);
        }
    })();

    return asyncIterator;
}
