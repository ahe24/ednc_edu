import React, { useState, useEffect } from 'react';
import {
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  Alert,
  CircularProgress,
  Button,
  IconButton,
  Tooltip,
} from '@mui/material';
import { Download, ArrowBack } from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import * as XLSX from 'xlsx';

interface Student {
  id: number;
  name: string;
  english_name: string;
  email: string;
  affiliation: string;
  phone: string;
  birth_date: string;
  created_at: string;
}

interface Course {
  id: number;
  name: string;
  schedule: string;
  instructor_name: string;
}

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://192.168.10.118:5000/api';

const StudentList: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { instructor } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (instructor) {
      fetchData();
    }
  }, [courseId, instructor]);

  const fetchData = async () => {
    try {
      // Fetch course info
      const coursesResponse = await axios.get(`${API_BASE_URL}/courses`);
      const courses = coursesResponse.data.courses;
      const foundCourse = courses.find((c: Course) => c.id === parseInt(courseId || '0'));
      
      if (foundCourse) {
        setCourse(foundCourse);
        
        // Fetch students for this course
        const studentsResponse = await axios.get(`${API_BASE_URL}/students/course/${courseId}`);
        setStudents(studentsResponse.data.students || []);
      } else {
        setError('존재하지 않는 과정입니다');
      }
    } catch (error: any) {
      setError(error.response?.data?.error || '데이터를 불러오는데 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = async () => {
    try {
      // Create data for Excel with proper formatting
      const excelData = [
        ['이름', '영문명', '이메일', '소속', '전화번호', '생년월일', '등록일'], // Header row
        ...students.map(student => [
          student.name,
          student.english_name,
          student.email,
          student.affiliation,
          student.phone, // Keep as string - we'll format it properly in Excel
          student.birth_date,
          new Date(student.created_at).toLocaleDateString('ko-KR')
        ])
      ];

      // Create a new workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(excelData);

      // Set column widths for better readability
      const colWidths = [
        { wch: 12 }, // 이름
        { wch: 15 }, // 영문명
        { wch: 25 }, // 이메일
        { wch: 20 }, // 소속
        { wch: 15 }, // 전화번호
        { wch: 12 }, // 생년월일
        { wch: 12 }  // 등록일
      ];
      ws['!cols'] = colWidths;

      // Format phone number cells as text to prevent Excel from treating them as numbers
      students.forEach((student, index) => {
        const rowIndex = index + 2; // +2 because Excel is 1-indexed and we have a header row
        const phoneCell = `E${rowIndex}`; // Phone number is in column E
        
        if (ws[phoneCell]) {
          // Set cell type to string and add the phone number with proper formatting
          ws[phoneCell] = {
            t: 's', // string type
            v: student.phone, // value
            w: student.phone  // displayed value
          };
        }
      });

      // Add the worksheet to the workbook
      XLSX.utils.book_append_sheet(wb, ws, '수강생목록');

      // Generate Excel file and trigger download
      const fileName = `${course?.name}_수강생목록.xlsx`;
      XLSX.writeFile(wb, fileName);
      
    } catch (error) {
      console.error('Excel export failed:', error);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box textAlign="center" py={6}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={() => navigate('/dashboard')}>
          대시보드로 돌아가기
        </Button>
      </Box>
    );
  }

  return (
    <Box maxWidth="1200px" mx="auto">
      <Card>
        <CardContent sx={{ p: 4 }}>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={4}>
            <Box display="flex" alignItems="center" gap={2}>
              <IconButton onClick={() => navigate('/dashboard')} color="primary">
                <ArrowBack />
              </IconButton>
              <Box>
                <Typography variant="h4" component="h1">
                  수강생 목록
                </Typography>
                <Typography variant="h6" color="primary" sx={{ mt: 1 }}>
                  {course?.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  강사: {course?.instructor_name} | 일정: {course?.schedule}
                </Typography>
              </Box>
            </Box>
            
            <Box>
              <Tooltip title="Excel로 내보내기">
                <Button
                  variant="outlined"
                  startIcon={<Download />}
                  onClick={handleExportExcel}
                  disabled={students.length === 0}
                >
                  Excel 내보내기
                </Button>
              </Tooltip>
            </Box>
          </Box>

          {students.length === 0 ? (
            <Alert severity="info">
              아직 등록된 수강생이 없습니다.
            </Alert>
          ) : (
            <>
              <Typography variant="h6" gutterBottom>
                총 {students.length}명의 수강생이 등록되었습니다
              </Typography>
              
              <TableContainer component={Paper} sx={{ mt: 2 }}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: 'primary.main' }}>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>이름</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>영문명</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>이메일</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>소속</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>전화번호</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>생년월일</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>등록일</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {students.map((student) => (
                      <TableRow key={student.id} hover>
                        <TableCell>{student.name}</TableCell>
                        <TableCell>{student.english_name}</TableCell>
                        <TableCell>{student.email}</TableCell>
                        <TableCell>{student.affiliation}</TableCell>
                        <TableCell>{student.phone}</TableCell>
                        <TableCell>{student.birth_date}</TableCell>
                        <TableCell>
                          {new Date(student.created_at).toLocaleDateString('ko-KR')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default StudentList; 