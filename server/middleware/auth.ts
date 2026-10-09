import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { userStore } from '../services/users.js';
import { User } from '../models/types.js';

if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  console.warn('⚠️ JWT_SECRET is not set; using the built-in default. Set JWT_SECRET in production.');
}
export const JWT_SECRET = process.env.JWT_SECRET || 'absolute_secret_key_2026_jwt_token_auth';

export interface AuthenticatedRequest extends Request {
  user?: User;
}

export async function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization token required' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
    const user = await userStore.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ error: 'User no longer exists' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired session token' });
  }
}
