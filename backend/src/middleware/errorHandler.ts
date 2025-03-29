import { Request, Response, NextFunction } from 'express';

export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction): void {
    console.error('Request error:', err);
    res.status(500).send({ error: 'Internal Server Error' });
}
