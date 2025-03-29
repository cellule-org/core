import express, { NextFunction } from 'express';
import bodyParser from 'body-parser';
import { Request, Response } from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

import os from 'os';
import crypto from 'crypto';
import bcrypt from 'bcrypt';

enum CoreEvents {
    USER_REGISTERED = 'core_user_registered',
    USER_DELETED = 'core_user_deleted',
    USER_LOGIN = 'core_user_login'
}

function getLocalIP(): string {
    const networkInterfaces = os.networkInterfaces();
    for (const interfaceName in networkInterfaces) {
        const interfaces = networkInterfaces[interfaceName];
        if (!interfaces) continue;
        for (const interfaceDetails of interfaces) {
            if (interfaceDetails.family === 'IPv4' && !interfaceDetails.internal) {
                return interfaceDetails.address;
            }
        }
    }
    return '127.0.0.1';
}

function generateUniqueString(): string {
    if (process.env.SECRET) {
        return process.env.SECRET;
    }
    const ipAddress = getLocalIP();
    const hostname = os.hostname();

    const rawData = `${ipAddress}-${hostname}`;

    const hash = crypto.createHash('sha256');
    hash.update(rawData);
    return hash.digest('hex');
}

const prisma = new PrismaClient();

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

interface RegisterUserData {
    username: string;
    password: string;
}

interface Message<T> {
    type: "create" | "register" | "submit" | "register_user" | "login_user" | "message";
    data: T;
    tokens?: {
        accessToken: string;
        refreshToken: string;
    };
}

const app = express();

app.use(express.json());
app.use(bodyParser.json());

const server = createServer(app);
const wss = new WebSocketServer({ server });

interface EventData {
    name: string;
    creator: WebSocket | null;
    clients: Set<WebSocket>;
    public: boolean;
}

class EventManager {
    private events: { [key: string]: EventData } = {};

    createEvent(id: string, name: string, ws: WebSocket | null, publicEvent: boolean): void {
        this.events[id] = {
            name,
            creator: ws,
            clients: new Set(),
            public: publicEvent
        };
    }

    registerEvent(id: string, ws: WebSocket): void {
        this.events[id].clients.add(ws);
    }

    submitEvent(id: string, data: any): void {
        const event = this.events[id];
        event.clients.forEach((client) => {
            client.send(JSON.stringify({ id, data }));
        });
    }

    exist(id: string): boolean {
        return !!this.events[id];
    }

    get(id: string): EventData {
        return this.events[id];
    }

    getAll(): { id: string, name: string, public: boolean, clients: number }[] {
        return Object.keys(this.events).map((id) => ({
            id,
            name: this.events[id].name,
            public: this.events[id].public,
            clients: this.events[id].clients.size
        }));
    }
}

const events = new EventManager();

wss.on('connection', async (ws: WebSocket) => {
    console.log('New WebSocket connection');

    ws.send(JSON.stringify({
        type: "core_users", users: (await prisma.user.findMany()).map((user) => {
            const { password, ...userWithoutPassword } = user;
            return userWithoutPassword;
        })
    }));

    ws.on('message', (message: string) => {
        const parsedMessage: Message<CreateEventData | RegisterEventData | SubmitEventData | RegisterUserData> = JSON.parse(message.toString());
        let event_id = '';
        switch (parsedMessage.type) {
            case 'create':
                event_id = (parsedMessage.data as CreateEventData).id;
                events.createEvent(event_id, (parsedMessage.data as CreateEventData).name, ws, (parsedMessage.data as CreateEventData).public || false);
                ws.send(JSON.stringify({ type: "message", success: true, message: `Event ${(parsedMessage.data as CreateEventData).name} created` }));
                break;
            case 'register':
                event_id = (parsedMessage.data as RegisterEventData).id;
                if (!events.exist(event_id)) {
                    ws.send(JSON.stringify({ type: "message", success: false, message: `Event ${(parsedMessage.data as RegisterEventData).id} not found` }));
                    return;
                }
                events.registerEvent(event_id, ws);
                ws.send(JSON.stringify({ type: "message", success: true, message: `Registered to event ${(parsedMessage.data as RegisterEventData).id}` }));
                break;
            case 'submit':
                event_id = (parsedMessage.data as SubmitEventData).id;
                if (!events.exist(event_id)) {
                    ws.send(JSON.stringify({ type: "message", success: false, message: `Event ${(parsedMessage.data as SubmitEventData).id} not found` }));
                    return;
                }
                const event = events.get(event_id);
                if (event.creator === ws || event.public || event.creator === null) {
                    events.submitEvent(event_id, (parsedMessage.data as SubmitEventData).data);
                } else {
                    ws.send(JSON.stringify({ type: "message", success: false, message: 'You are not authorized to submit to this event' }));
                }
                break;
            default:
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

app.use((err: Error, req: Request, res: Response, next: NextFunction): void => {
    console.error('Request error:', err);
    res.status(500).send({ error: 'Internal Server Error' });
});

app.get("/assets/:filename", (req: Request, res: Response) => {
    const { filename } = req.params;
    res.sendFile(path.join(__dirname, 'dist', 'assets', filename));
});

app.get('/events', (req: Request, res: Response) => {
    /*
    const events = Object.keys(EVENTS).map((id) => ({
        id,
        name: EVENTS[id].name,
        public: EVENTS[id].public,
        clients: EVENTS[id].clients.size
    }));*/
    res.json(events.getAll());
});

app.post('/api/auth/register', async (req: Request, res: Response): Promise<any> => {
    const { username, password } = req.body;
    const existingUser = await prisma.user.findUnique({ where: { username: username } });
    if (existingUser) {
        return res.status(400).json({ success: false, message: 'User already exists' });
    }
    const hashedPassword = await bcrypt.hash(password, 12);
    await prisma.user.create({
        data: {
            username: username,
            password: hashedPassword
        }
    });
    return res.json({ success: true, message: 'User registered' });
});

app.post('/api/auth/login', async (req: Request, res: Response): Promise<any> => {
    const { username, password } = req.body;
    const user = await prisma.user.findUnique({ where: { username: username } });
    if (!user) {
        return res.status(400).json({ success: false, message: 'User not found' });
    }
    if (!await bcrypt.compare(password, user.password)) {
        return res.status(400).json({ success: false, message: 'Invalid password' });
    }
    const accessToken = jwt.sign({ id: user.id, username: user.username }, generateUniqueString(), { expiresIn: '15m' });
    const refreshToken = jwt.sign({ id: user.id, username: user.username }, generateUniqueString(), { expiresIn: '7d' });
    //accessExpiry is the epoch time in milliseconds when the access token expires
    const accessExpiry = Date.now() + 15 * 60 * 1000;
    //refreshExpiry is the epoch time in milliseconds when the refresh token expires
    const refreshExpiry = Date.now() + 7 * 24 * 60 * 60 * 1000;
    return res.json({ type: "success_login", username: user.username, user_id: user.id, tokens: { accessToken, refreshToken }, expiry: { accessExpiry, refreshExpiry } });
});

app.get('/api/auth/accounts', async (req: Request, res: Response): Promise<any> => {
    const users = await prisma.user.findMany({
        select: {
            username: true
        }
    });
    return res.json(users);
});

app.get('*', (req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const start = async () => {
    try {

        events.createEvent(CoreEvents.USER_REGISTERED, 'User Registered', null, true);
        events.createEvent(CoreEvents.USER_DELETED, 'User Deleted', null, true);
        events.createEvent(CoreEvents.USER_LOGIN, 'User Login', null, true);

        console.log('Default system events created');
        server.listen(3000, () => {
            console.log('Server is running on http://localhost:3000');
            console.log('WebSocket is running on ws://localhost:3000');
        });
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

start();


/*
Events examples:

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