import { WebSocket, WebSocketServer } from 'ws';
import { PrismaClient } from '@prisma/client';
import { EventManager } from '../models/eventManager';
import { CreateEventData, RegisterEventData, SubmitEventData, RegisterUserData, Message } from '../types/events';

const prisma = new PrismaClient();

export function setupWebSocketHandlers(wss: WebSocketServer, events: EventManager): void {
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
                    events.createEvent(
                        event_id,
                        (parsedMessage.data as CreateEventData).name,
                        ws,
                        (parsedMessage.data as CreateEventData).public || false
                    );
                    ws.send(JSON.stringify({
                        type: "message",
                        success: true,
                        message: `Event ${(parsedMessage.data as CreateEventData).name} created`
                    }));
                    break;
                case 'register':
                    event_id = (parsedMessage.data as RegisterEventData).id;
                    if (!events.exist(event_id)) {
                        ws.send(JSON.stringify({
                            type: "message",
                            success: false,
                            message: `Event ${(parsedMessage.data as RegisterEventData).id} not found`
                        }));
                        return;
                    }
                    events.registerEvent(event_id, ws);
                    ws.send(JSON.stringify({
                        type: "message",
                        success: true,
                        message: `Registered to event ${(parsedMessage.data as RegisterEventData).id}`
                    }));
                    break;
                case 'submit':
                    event_id = (parsedMessage.data as SubmitEventData).id;
                    if (!events.exist(event_id)) {
                        ws.send(JSON.stringify({
                            type: "message",
                            success: false,
                            message: `Event ${(parsedMessage.data as SubmitEventData).id} not found`
                        }));
                        return;
                    }
                    const event = events.get(event_id);
                    if (event.creator === ws || event.public || event.creator === null) {
                        events.submitEvent(event_id, (parsedMessage.data as SubmitEventData).data);
                    } else {
                        ws.send(JSON.stringify({
                            type: "message",
                            success: false,
                            message: 'You are not authorized to submit to this event'
                        }));
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
}
