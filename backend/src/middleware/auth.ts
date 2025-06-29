import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';

export interface AuthRequest extends Request {
  instructor?: {
    id: number;
    email: string;
    name: string;
    is_admin: boolean;
  };
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    res.status(401).json({ error: '액세스 토큰이 필요합니다' });
    return;
  }

  jwt.verify(token, config.jwtSecret, (err: any, instructor: any) => {
    if (err) {
      res.status(403).json({ error: '유효하지 않은 토큰입니다' });
      return;
    }
    req.instructor = instructor;
    next();
  });
}; 