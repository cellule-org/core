import { Request, Response } from 'express';
import { EventManager } from '../models/eventManager';

export function getEvents(events: EventManager) {
    return (req: Request, res: Response): void => {
        res.json(events.getAll());
    };
}
