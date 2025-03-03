import Fastify from 'fastify';
import websocket from '@fastify/websocket'

interface CreateEventData {
    id: string;
    name: string;
}

interface RegisterEventData {
    id: string;
}

interface SubmitEventData {
    id: string;
    data: any;
}

interface Message<T> {
    type: "create" | "register" | "submit";
    data: T;
}

const server = Fastify({
    logger: {
        level: 'info'
    }
});

server.register(websocket)

const EVENTS: { [key: string]: Set<WebSocket> } = {};

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
    },
    websocket: true
}, (socket, req) => {
    socket.on('message', (message: Message<CreateEventData | RegisterEventData | SubmitEventData>) => {
        switch (message.type) {
            case 'create':
                console.log('create', message.data);
                EVENTS[message.data.id] = new Set();
                break;
            case 'register':
                console.log('register', message.data);
                EVENTS[message.data.id].add(socket);
                break;
            case 'submit':
                console.log('submit', message.data);
                EVENTS[message.data.id].forEach((ws) => {
                    const submitData = message.data as SubmitEventData;
                    ws.send(JSON.stringify({ id: submitData.id, data: submitData.data }));
                });
                break;
        }
    });
});

// Fonction pour démarrer le serveur
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
