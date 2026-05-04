import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { prisma } from './prisma.js';
export const authenticate = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ message: 'Authorization header missing or invalid' });
        return;
    }
    const token = authHeader.substring(7);
    try {
        const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);
        if (typeof decoded === 'string' || !('sub' in decoded) || !('role' in decoded)) {
            res.status(401).json({ message: 'Invalid token payload' });
            return;
        }
        const user = await prisma.user.findUnique({ where: { id: decoded.sub } });
        if (!user) {
            res.status(401).json({ message: 'User not found' });
            return;
        }
        req.user = { id: user.id, email: user.email, role: user.role };
        next();
    }
    catch {
        res.status(401).json({ message: 'Invalid token' });
    }
};
export const requireAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== 'ADMIN') {
        res.status(403).json({ message: 'Admin access required' });
        return;
    }
    next();
};
