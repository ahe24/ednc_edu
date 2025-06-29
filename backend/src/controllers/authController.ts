import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { database } from '../models/database';
import { config } from '../config';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ error: '모든 필드를 입력해주세요' });
      return;
    }

    // Check if instructor already exists
    const db = database.getDb();
    db.get(
      'SELECT id FROM instructors WHERE email = ?',
      [email],
      async (err, row) => {
        if (err) {
          res.status(500).json({ error: '데이터베이스 오류가 발생했습니다' });
          return;
        }

        if (row) {
          res.status(400).json({ error: '이미 등록된 이메일입니다' });
          return;
        }

        // Hash password and create instructor (new instructors are not admin by default)
        const hashedPassword = await bcrypt.hash(password, 10);
        
        db.run(
          'INSERT INTO instructors (name, email, password, is_admin) VALUES (?, ?, ?, 0)',
          [name, email, hashedPassword],
          function (err) {
            if (err) {
              res.status(500).json({ error: '강사 등록에 실패했습니다' });
              return;
            }

            const token = jwt.sign(
              { id: this.lastID, email, name, is_admin: false },
              config.jwtSecret,
              { expiresIn: '24h' }
            );

            res.status(201).json({
              message: '강사 등록이 완료되었습니다',
              token,
              instructor: { id: this.lastID, name, email, is_admin: false }
            });
          }
        );
      }
    );
  } catch (error) {
    res.status(500).json({ error: '서버 오류가 발생했습니다' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: '이메일과 비밀번호를 입력해주세요' });
      return;
    }

    const db = database.getDb();
    db.get(
      'SELECT * FROM instructors WHERE email = ?',
      [email],
      async (err, row: any) => {
        if (err) {
          res.status(500).json({ error: '데이터베이스 오류가 발생했습니다' });
          return;
        }

        if (!row) {
          res.status(401).json({ error: '등록되지 않은 이메일입니다' });
          return;
        }

        const isValidPassword = await bcrypt.compare(password, row.password);
        if (!isValidPassword) {
          res.status(401).json({ error: '비밀번호가 올바르지 않습니다' });
          return;
        }

        const token = jwt.sign(
          { id: row.id, email: row.email, name: row.name, is_admin: !!row.is_admin },
          config.jwtSecret,
          { expiresIn: '24h' }
        );

        res.json({
          message: '로그인이 완료되었습니다',
          token,
          instructor: { 
            id: row.id, 
            name: row.name, 
            email: row.email, 
            is_admin: !!row.is_admin 
          }
        });
      }
    );
  } catch (error) {
    res.status(500).json({ error: '서버 오류가 발생했습니다' });
  }
}; 