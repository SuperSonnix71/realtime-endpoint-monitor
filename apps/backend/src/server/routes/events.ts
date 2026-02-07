import type { FastifyPluginCallback } from 'fastify';
import { subscribe } from '../event-bus.js';

export const eventsRoutes: FastifyPluginCallback = (fastify, _opts, done) => {
    fastify.get('/events', async (request, reply): Promise<void> => {
        reply.sse(
            (async function* (): AsyncGenerator<{ event: string; data: string }> {
                const subscription = subscribe();
                try {
                    for await (const event of subscription) {
                        yield {
                            event: event.type,
                            data: JSON.stringify(event.payload),
                        };
                    }
                } finally {
                    // iterator cleanup handles unsubscribe
                }
            })()
        );
    });
    done();
};
