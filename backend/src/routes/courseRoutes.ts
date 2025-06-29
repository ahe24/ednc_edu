import { Router } from 'express';
import { createCourse, getCourses, updateCourse, deleteCourse, getPublicCourses, getPublicCoursesCount } from '../controllers/courseController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Public routes
router.get('/public', getPublicCourses);
router.get('/public/count', getPublicCoursesCount);

// Protected routes (instructor only)
router.post('/', authenticateToken, createCourse);
router.get('/', authenticateToken, getCourses);
router.put('/:id', authenticateToken, updateCourse);
router.delete('/:id', authenticateToken, deleteCourse);

export default router; 