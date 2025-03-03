import express, { Request, Response, NextFunction } from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';

interface CreateEventData {
    id: string;
    name: string;
    public?: boolean;
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

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

interface EventData {
    creator: WebSocket;
    clients: Set<WebSocket>;
    public: boolean;
}

const EVENTS: { [key: string]: EventData } = {};

wss.on('connection', (ws: WebSocket) => {
    console.log('New WebSocket connection');

    ws.on('message', (message: string) => {
        const parsedMessage: Message<CreateEventData | RegisterEventData | SubmitEventData> = JSON.parse(message);
        switch (parsedMessage.type) {
            case 'create':
                console.log('create', parsedMessage.data);
                EVENTS[parsedMessage.data.id] = {
                    creator: ws,
                    clients: new Set(),
                    public: (parsedMessage.data as CreateEventData).public || false
                };
                ws.send(JSON.stringify({ success: true, message: `Event ${(parsedMessage.data as CreateEventData).name} created` }));
                break;
            case 'register':
                console.log('register', parsedMessage.data);
                EVENTS[parsedMessage.data.id].clients.add(ws);
                ws.send(JSON.stringify({ success: true, message: `Registered to event ${(parsedMessage.data as RegisterEventData).id}` }));
                break;
            case 'submit':
                console.log('submit', parsedMessage.data);
                const event = EVENTS[parsedMessage.data.id];
                if (event.creator === ws || event.public) {
                    event.clients.forEach((client) => {
                        const submitData = parsedMessage.data as SubmitEventData;
                        client.send(JSON.stringify({ id: submitData.id, data: submitData.data }));
                    });
                } else {
                    ws.send(JSON.stringify({ success: false, message: 'You are not authorized to submit to this event' }));
                }
                break;
        }
    });

    ws.on('close', () => {
        console.log('WebSocket connection closed');
    });

    ws.on('error', (err: Error) => {
        console.error('WebSocket error:', err);
    });

    ws.send(JSON.stringify({ connected: true }));
});

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error('Request error:', err);
    res.status(500).send({ error: 'Internal Server Error' });
});

const start = async () => {
    try {
        server.listen(3001, () => {
            console.log('Server is running on http://localhost:3001');
            console.log('WebSocket is running on ws://localhost:3001');
        });
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

start();


/*
Events:

{
    "type": "create",
    "data": {
        "id": "new_email",
        "name": "New Email",
        "public": false
    }
}

{
    "type": "register",
    "data": {
        "id": "new_email"
    }
}

{
    "type": "submit",
    "data": {
        "id": "new_email",
        "data": {
            "from": "me",
            "to": "you",
            "subject": "Hello",
            "body": "Hello, how are you?"
        }
    }
}

*/