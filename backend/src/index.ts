import express from 'express';
import bodyParser from 'body-parser';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import path from 'path';

import { CoreEvents } from './types/events';
import { EventManager } from './models/eventManager';
import { errorHandler } from './middleware/errorHandler';
import { setupWebSocketHandlers } from './websocket/wsHandler';
import { getEvents } from './controllers/eventController';
import authRoutes from './routes/auth';

export const events = new EventManager();
const app = express();

// Middleware
app.use(express.json());
app.use(bodyParser.json());
app.use(errorHandler);

// WebSocket setup
const server = createServer(app);
const wss = new WebSocketServer({ server });
setupWebSocketHandlers(wss, events);

// Routes
app.use('/api/auth', authRoutes);
app.get('/events', getEvents(events));

// Static files
app.get("/assets/:filename", (req, res) => {
    const { filename } = req.params;
    res.sendFile(path.join(__dirname, 'dist', 'assets', filename));
});

// Catch-all route
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const start = async () => {
    try {
        // Create default system events
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