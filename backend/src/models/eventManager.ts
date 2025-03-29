import { WebSocket } from 'ws';
import { EventData } from '../types/events';

export class EventManager {
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
