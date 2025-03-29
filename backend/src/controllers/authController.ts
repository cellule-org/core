import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { generateUniqueString } from '../utils/network';
import { events } from '..';
import { CoreEvents } from '../types/events';

const prisma = new PrismaClient();

export async function register(req: Request, res: Response): Promise<any> {
    const { username, password } = req.body;
    const existingUser = await prisma.user.findUnique({ where: { username: username } });
    if (existingUser) {
        return res.status(400).json({ success: false, message: 'User already exists' });
    }
    const hashedPassword = await bcrypt.hash(password, 12);
    let user = await prisma.user.create({
        data: {
            username: username,
            password: hashedPassword
        }
    });
    events.submitEvent(CoreEvents.USER_REGISTERED, user);
    return res.json({ success: true, message: 'User registered' });
}

export async function deleteAccount(req: Request, res: Response): Promise<any> {
    const { username, password } = req.body;
    const user = await prisma.user.findUnique({ where: { username: username } });
    if (!user) {
        return res.status(400).json({ success: false, message: 'User not found' });
    }
    if (!await bcrypt.compare(password, user.password)) {
        return res.status(400).json({ success: false, message: 'Invalid password' });
    }
    await prisma.user.delete({ where: { id: user.id } });
    events.submitEvent(CoreEvents.USER_DELETED, user);
    return res.json({ success: true, message: 'User deleted' });
}

export async function login(req: Request, res: Response): Promise<any> {
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
    const accessExpiry = Date.now() + 15 * 60 * 1000;
    const refreshExpiry = Date.now() + 7 * 24 * 60 * 60 * 1000;
    return res.json({
        type: "success_login",
        username: user.username,
        user_id: user.id,
        tokens: {
            accessToken,
            refreshToken
        },
        expiry: {
            accessExpiry,
            refreshExpiry
        }
    });
}

export async function getAccounts(req: Request, res: Response): Promise<any> {
    const users = await prisma.user.findMany({
        select: {
            username: true
        }
    });
    return res.json(users);
}
