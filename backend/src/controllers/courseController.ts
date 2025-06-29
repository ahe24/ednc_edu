import { Response } from 'express';
import { database } from '../models/database';
import { AuthRequest } from '../middleware/auth';

export const createCourse = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, schedule, start_date, end_date } = req.body;
    const instructorId = req.instructor?.id;

    if (!name || (!schedule && (!start_date || !end_date))) {
      res.status(400).json({ error: '과정명과 일정(또는 시작/종료 날짜)을 입력해주세요' });
      return;
    }

    const db = database.getDb();
    db.run(
      'INSERT INTO courses (name, schedule, start_date, end_date, instructor_id) VALUES (?, ?, ?, ?, ?)',
      [name, schedule || null, start_date || null, end_date || null, instructorId],
      function (err) {
        if (err) {
          res.status(500).json({ error: '과정 생성에 실패했습니다' });
          return;
        }

        res.status(201).json({
          message: '과정이 생성되었습니다',
          course: { 
            id: this.lastID, 
            name, 
            schedule, 
            start_date, 
            end_date, 
            instructor_id: instructorId 
          }
        });
      }
    );
  } catch (error) {
    res.status(500).json({ error: '서버 오류가 발생했습니다' });
  }
};

export const getCourses = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const instructorId = req.instructor?.id;
    const isAdmin = req.instructor?.is_admin;

    const db = database.getDb();
    
    // Admins can see all courses with instructor names, regular instructors see only their own
    if (isAdmin) {
      db.all(
        `SELECT c.*, i.name as instructor_name 
         FROM courses c 
         JOIN instructors i ON c.instructor_id = i.id
         ORDER BY 
           CASE 
             WHEN c.start_date IS NULL THEN 0
             WHEN c.start_date >= date('now') THEN 1
             ELSE 2
           END,
           c.start_date ASC,
           c.created_at DESC`,
        [],
        (err, rows) => {
          if (err) {
            res.status(500).json({ error: '과정 목록을 불러오는데 실패했습니다' });
            return;
          }

          res.json({ courses: rows });
        }
      );
    } else {
      db.all(
        `SELECT * FROM courses 
         WHERE instructor_id = ? 
         ORDER BY 
           CASE 
             WHEN start_date IS NULL THEN 0
             WHEN start_date >= date('now') THEN 1
             ELSE 2
           END,
           start_date ASC,
           created_at DESC`,
        [instructorId],
        (err, rows) => {
          if (err) {
            res.status(500).json({ error: '과정 목록을 불러오는데 실패했습니다' });
            return;
          }

          res.json({ courses: rows });
        }
      );
    }
  } catch (error) {
    res.status(500).json({ error: '서버 오류가 발생했습니다' });
  }
};

export const updateCourse = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, schedule, start_date, end_date } = req.body;
    const instructorId = req.instructor?.id;

    // Debug logging
    console.log('Update course request:', {
      id,
      name,
      schedule,
      start_date,
      end_date,
      instructorId
    });

    // Validate that we have either a schedule text OR both start_date and end_date
    if (!name) {
      res.status(400).json({ error: '과정명을 입력해주세요' });
      return;
    }
    
    if ((!schedule || schedule.trim() === '') && (!start_date || !end_date)) {
      res.status(400).json({ error: '일정 텍스트 또는 시작/종료 날짜를 입력해주세요' });
      return;
    }

    const db = database.getDb();
    db.run(
      'UPDATE courses SET name = ?, schedule = ?, start_date = ?, end_date = ? WHERE id = ? AND instructor_id = ?',
      [name, schedule || null, start_date || null, end_date || null, id, instructorId],
      function (err) {
        if (err) {
          console.error('Database error updating course:', err);
          res.status(500).json({ error: '과정 수정에 실패했습니다' });
          return;
        }

        console.log('Update result - changes:', this.changes);
        
        if (this.changes === 0) {
          res.status(404).json({ error: '과정을 찾을 수 없습니다' });
          return;
        }

        res.json({ message: '과정이 수정되었습니다' });
      }
    );
  } catch (error) {
    res.status(500).json({ error: '서버 오류가 발생했습니다' });
  }
};

export const deleteCourse = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const instructorId = req.instructor?.id;
    const isAdmin = req.instructor?.is_admin;

    const db = database.getDb();
    
    // First delete all students from this course
    db.run('DELETE FROM students WHERE course_id = ?', [id], (err) => {
      if (err) {
        res.status(500).json({ error: '과정 삭제에 실패했습니다' });
        return;
      }

      // Admin can delete any course, regular instructors can only delete their own
      const deleteQuery = isAdmin 
        ? 'DELETE FROM courses WHERE id = ?' 
        : 'DELETE FROM courses WHERE id = ? AND instructor_id = ?';
      
      const deleteParams = isAdmin ? [id] : [id, instructorId];

      // Then delete the course
      db.run(
        deleteQuery,
        deleteParams,
        function (err) {
          if (err) {
            res.status(500).json({ error: '과정 삭제에 실패했습니다' });
            return;
          }

          if (this.changes === 0) {
            res.status(404).json({ error: '과정을 찾을 수 없습니다' });
            return;
          }

          res.json({ message: '과정이 삭제되었습니다' });
        }
      );
    });
  } catch (error) {
    res.status(500).json({ error: '서버 오류가 발생했습니다' });
  }
};

export const getPublicCourses = async (req: any, res: Response): Promise<void> => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
    const search = req.query.search as string;
    
    const db = database.getDb();
    
    let query = `SELECT c.*, i.name as instructor_name 
                 FROM courses c 
                 JOIN instructors i ON c.instructor_id = i.id`;
    
    const params: any[] = [];
    
    if (search) {
      query += ` WHERE c.name LIKE ? OR i.name LIKE ?`;
      params.push(`%${search}%`, `%${search}%`);
    }
    
    // Smart sorting: Future courses first, then ongoing, then past courses
    query += ` ORDER BY 
                CASE 
                  WHEN c.start_date IS NULL THEN 1
                  WHEN c.start_date > date('now') THEN 0
                  WHEN c.end_date IS NULL OR c.end_date >= date('now') THEN 1
                  ELSE 2
                END,
                c.start_date ASC,
                c.created_at DESC`;
    
    if (limit) {
      query += ` LIMIT ?`;
      params.push(limit);
    }
    
    db.all(query, params, (err, rows) => {
      if (err) {
        res.status(500).json({ error: '과정 목록을 불러오는데 실패했습니다' });
        return;
      }

      res.json({ courses: rows });
    });
  } catch (error) {
    res.status(500).json({ error: '서버 오류가 발생했습니다' });
  }
};

// Add a new function to get total count
export const getPublicCoursesCount = async (req: any, res: Response): Promise<void> => {
  try {
    const search = req.query.search as string;
    
    const db = database.getDb();
    
    let query = `SELECT COUNT(*) as total 
                 FROM courses c 
                 JOIN instructors i ON c.instructor_id = i.id`;
    
    const params: any[] = [];
    
    if (search) {
      query += ` WHERE c.name LIKE ? OR i.name LIKE ?`;
      params.push(`%${search}%`, `%${search}%`);
    }
    
    db.get(query, params, (err, row: any) => {
      if (err) {
        res.status(500).json({ error: '과정 수를 불러오는데 실패했습니다' });
        return;
      }

      res.json({ total: row.total });
    });
  } catch (error) {
    res.status(500).json({ error: '서버 오류가 발생했습니다' });
  }
}; 