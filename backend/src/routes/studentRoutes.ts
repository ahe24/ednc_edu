import { Router } from 'express';
import { createStudent, getStudentsByCourse, updateStudent, deleteStudent, getStudentByEmail, getStudentCoursesByEmail } from '../controllers/studentController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Public routes (students can register without login)
router.post('/', createStudent);
router.put('/:id', updateStudent);
router.delete('/:id', deleteStudent);
router.get('/lookup/:email/:courseId', getStudentByEmail);
router.get('/courses/:email', getStudentCoursesByEmail);

// Protected routes (instructor only)
router.get('/course/:courseId', authenticateToken, getStudentsByCourse);

export default router; 