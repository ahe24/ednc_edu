import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { config } from './config';
import authRoutes from './routes/authRoutes';
import courseRoutes from './routes/courseRoutes';
import studentRoutes from './routes/studentRoutes';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: config.corsOrigin,
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Logging
app.use(morgan('combined'));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/students', studentRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'ED&C 교육 수강 정보 시스템 서버가 정상 작동 중입니다' });
});

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: '서버 내부 오류가 발생했습니다' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: '요청한 리소스를 찾을 수 없습니다' });
});

const PORT = parseInt(config.port as string) || 5000;
const HOST = '0.0.0.0'; // Bind to all interfaces

app.listen(PORT, HOST, () => {
  console.log(`🚀 ED&C 교육 수강 정보 시스템 서버가 포트 ${PORT}에서 실행 중입니다`);
  console.log(`🌐 Server accessible on: http://0.0.0.0:${PORT}`);
  console.log(`🌐 Local access: http://localhost:${PORT}`);
  console.log(`🌐 Network access: http://192.168.10.118:${PORT} and http://192.168.56.101:${PORT}`);
  console.log(`🌐 CORS Origin: ${config.corsOrigin}`);
  console.log(`📊 Environment: ${config.nodeEnv}`);
}); 