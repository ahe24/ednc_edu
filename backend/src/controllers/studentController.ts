import { Request, Response } from 'express';
import { database } from '../models/database';
import * as XLSX from 'xlsx';
import { AuthRequest } from '../middleware/auth';

export const createStudent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, english_name, email, affiliation, phone, birth_date, course_id } = req.body;

    if (!name || !english_name || !email || !affiliation || !phone || !birth_date || !course_id) {
      res.status(400).json({ error: '모든 필드를 입력해주세요' });
      return;
    }

    const db = database.getDb();
    db.run(
      `INSERT INTO students (name, english_name, email, affiliation, phone, birth_date, course_id) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [name, english_name, email, affiliation, phone, birth_date, course_id],
      function (err) {
        if (err) {
          res.status(500).json({ error: '학생 정보 등록에 실패했습니다' });
          return;
        }

        res.status(201).json({
          message: '학생 정보가 등록되었습니다',
          student: { 
            id: this.lastID, 
            name, 
            english_name, 
            email, 
            affiliation, 
            phone, 
            birth_date, 
            course_id 
          }
        });
      }
    );
  } catch (error) {
    res.status(500).json({ error: '서버 오류가 발생했습니다' });
  }
};

export const getStudentsByCourse = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { courseId } = req.params;
    const instructorId = req.instructor?.id;

    const db = database.getDb();
    
    db.get(
      'SELECT id FROM courses WHERE id = ? AND instructor_id = ?',
      [courseId, instructorId],
      (err, courseRow) => {
        if (err) {
          res.status(500).json({ error: '데이터베이스 오류가 발생했습니다' });
          return;
        }

        if (!courseRow) {
          res.status(403).json({ error: '접근 권한이 없습니다' });
          return;
        }

        db.all(
          'SELECT * FROM students WHERE course_id = ? ORDER BY created_at DESC',
          [courseId],
          (err, rows) => {
            if (err) {
              res.status(500).json({ error: '학생 목록을 불러오는데 실패했습니다' });
              return;
            }

            res.json({ students: rows });
          }
        );
      }
    );
  } catch (error) {
    res.status(500).json({ error: '서버 오류가 발생했습니다' });
  }
};

export const updateStudent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, english_name, email, affiliation, phone, birth_date } = req.body;

    if (!name || !english_name || !email || !affiliation || !phone || !birth_date) {
      res.status(400).json({ error: '모든 필드를 입력해주세요' });
      return;
    }

    const db = database.getDb();
    db.run(
      `UPDATE students 
       SET name = ?, english_name = ?, email = ?, affiliation = ?, phone = ?, birth_date = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [name, english_name, email, affiliation, phone, birth_date, id],
      function (err) {
        if (err) {
          res.status(500).json({ error: '학생 정보 수정에 실패했습니다' });
          return;
        }

        if (this.changes === 0) {
          res.status(404).json({ error: '학생 정보를 찾을 수 없습니다' });
          return;
        }

        res.json({ message: '학생 정보가 수정되었습니다' });
      }
    );
  } catch (error) {
    res.status(500).json({ error: '서버 오류가 발생했습니다' });
  }
};

export const deleteStudent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const db = database.getDb();
    db.run('DELETE FROM students WHERE id = ?', [id], function (err) {
      if (err) {
        res.status(500).json({ error: '학생 정보 삭제에 실패했습니다' });
        return;
      }

      if (this.changes === 0) {
        res.status(404).json({ error: '학생 정보를 찾을 수 없습니다' });
        return;
      }

      res.json({ message: '학생 정보가 삭제되었습니다' });
    });
  } catch (error) {
    res.status(500).json({ error: '서버 오류가 발생했습니다' });
  }
};

export const getStudentByEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, courseId } = req.params;

    if (!email || !courseId) {
      res.status(400).json({ error: '이메일과 과정 ID가 필요합니다' });
      return;
    }

    const db = database.getDb();
    
    db.get(
      'SELECT * FROM students WHERE email = ? AND course_id = ?',
      [email, courseId],
      (err, row) => {
        if (err) {
          res.status(500).json({ error: '데이터베이스 오류가 발생했습니다' });
          return;
        }

        if (!row) {
          res.status(404).json({ error: '등록된 정보를 찾을 수 없습니다' });
          return;
        }

        res.json({ student: row });
      }
    );
  } catch (error) {
    res.status(500).json({ error: '서버 오류가 발생했습니다' });
  }
};

export const getStudentCoursesByEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.params;

    if (!email) {
      res.status(400).json({ error: '이메일이 필요합니다' });
      return;
    }

    const db = database.getDb();
    
    db.all(
      `SELECT 
        s.id as student_id,
        s.name,
        s.english_name,
        s.email,
        s.affiliation,
        s.phone,
        s.birth_date,
        s.created_at,
        s.updated_at,
        c.id as course_id,
        c.name as course_name,
        c.schedule,
        c.start_date,
        c.end_date,
        i.name as instructor_name
      FROM students s
      JOIN courses c ON s.course_id = c.id
      LEFT JOIN instructors i ON c.instructor_id = i.id
      WHERE s.email = ?
      ORDER BY s.created_at DESC`,
      [email],
      (err, rows) => {
        if (err) {
          res.status(500).json({ error: '데이터베이스 오류가 발생했습니다' });
          return;
        }

        if (!rows || rows.length === 0) {
          res.status(404).json({ error: '등록된 정보를 찾을 수 없습니다' });
          return;
        }

        res.json({ registrations: rows });
      }
    );
  } catch (error) {
    res.status(500).json({ error: '서버 오류가 발생했습니다' });
  }
}; 