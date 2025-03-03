import Fastify from 'fastify';
import pino from 'pino';

const server = Fastify({
    logger: {
        level: 'info'
    }
});

server.get('/', {
    schema: {
        response: {
            200: {
                type: 'object',
                properties: {
                    message: { type: 'string' }
                }
            }
        }
    }
}, async () => {
    return { message: 'Hello from Fastify with TypeScript!' };
});

const start = async () => {
    try {
        await server.listen({ port: 3001 });
        console.log('Server is running on http://localhost:3001');
    } catch (err) {
        server.log.error(err);
        process.exit(1);
    }
};

start();
