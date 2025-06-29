import React, { useState, useEffect } from 'react';
import {
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Box,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Divider,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Paper,
} from '@mui/material';
import { School, Person, Schedule, Email } from '@mui/icons-material';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import axios from 'axios';

interface StudentRegistration {
  student_id: number;
  name: string;
  english_name: string;
  email: string;
  affiliation: string;
  phone: string;
  birth_date: string;
  created_at: string;
  updated_at: string;
  course_id: number;
  course_name: string;
  schedule: string;
  start_date: string;
  end_date: string;
  instructor_name: string;
}

interface Student {
  id: number;
  name: string;
  english_name: string;
  email: string;
  affiliation: string;
  phone: string;
  birth_date: string;
  created_at: string;
  updated_at: string;
}

interface Course {
  id: number;
  name: string;
  schedule: string;
  instructor_name: string;
}

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://192.168.10.118:5000/api';

const StudentLookup: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState(searchParams.get('email') || '');
  
  // For new email-first flow
  const [registrations, setRegistrations] = useState<StudentRegistration[]>([]);
  
  // For old course-specific flow
  const [student, setStudent] = useState<Student | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  // Determine if this is the new flow (no courseId) or old flow (with courseId)
  const isNewFlow = !courseId;

  useEffect(() => {
    if (!isNewFlow) {
      // Old flow: fetch course info
      fetchCourse();
    }
    
    const emailFromUrl = searchParams.get('email');
    if (emailFromUrl) {
      setEmail(emailFromUrl);
      handleLookup(emailFromUrl);
    }
  }, [courseId, isNewFlow]);

  const fetchCourse = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/courses/public`);
      const courses = response.data.courses;
      const foundCourse = courses.find((c: Course) => c.id === parseInt(courseId || '0'));
      
      if (foundCourse) {
        setCourse(foundCourse);
      } else {
        setError('존재하지 않는 과정입니다');
      }
    } catch (error: any) {
      setError('과정 정보를 불러오는데 실패했습니다');
    }
  };

  const handleLookup = async (lookupEmail?: string) => {
    const emailToUse = lookupEmail || email;
    if (!emailToUse.trim()) {
      setError('이메일을 입력해주세요');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (isNewFlow) {
        // New flow: get all courses for email
        const response = await axios.get(`${API_BASE_URL}/students/courses/${encodeURIComponent(emailToUse)}`);
        setRegistrations(response.data.registrations);
      } else {
        // Old flow: get student for specific course
        const response = await axios.get(`${API_BASE_URL}/students/lookup/${encodeURIComponent(emailToUse)}/${courseId}`);
        setStudent(response.data.student);
      }
    } catch (error: any) {
      setError(error.response?.data?.error || '등록된 정보를 찾을 수 없습니다');
      if (isNewFlow) {
        setRegistrations([]);
      } else {
        setStudent(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCourseSelect = (registration: StudentRegistration) => {
    // Navigate to personal info page with course and student details
    navigate(`/course/${registration.course_id}/lookup?email=${encodeURIComponent(email)}`);
  };

  const handleEdit = () => {
    if (student) {
      navigate(`/course/${courseId}/apply?edit=${student.id}&email=${encodeURIComponent(email)}`);
    }
  };

  const formatCourseSchedule = (registration: StudentRegistration): string => {
    if (registration.start_date && registration.end_date) {
      const start = new Date(registration.start_date).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      const end = new Date(registration.end_date).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      return `${start} ~ ${end}`;
    }
    return registration.schedule || '일정 정보 없음';
  };

  const formatRegistrationDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatPhone = (phone: string) => {
    const numbers = phone.replace(/\D/g, '');
    if (numbers.length === 11) {
      return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7)}`;
    } else if (numbers.length === 10) {
      return `${numbers.slice(0, 3)}-${numbers.slice(3, 6)}-${numbers.slice(6)}`;
    }
    return phone;
  };

  // Render new email-first flow
  if (isNewFlow) {
    return (
      <Box maxWidth="800px" mx="auto">
        <Card>
          <CardContent sx={{ p: 4 }}>
            <Box textAlign="center" mb={4}>
              <Typography variant="h4" component="h1" gutterBottom>
                수강 정보 조회
              </Typography>
              <Typography variant="body1" color="text.secondary">
                등록한 이메일 주소를 입력하시면 수강 신청한 모든 과정을 확인할 수 있습니다
              </Typography>
            </Box>

            <Divider sx={{ mb: 4 }} />

            {registrations.length === 0 && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  <Email sx={{ mr: 1, verticalAlign: 'middle' }} />
                  이메일 주소 입력
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  수강 신청시 사용한 이메일 주소를 입력해주세요
                </Typography>

                <Box display="flex" gap={2} mb={3}>
                  <TextField
                    label="이메일 주소"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    fullWidth
                    placeholder="example@domain.com"
                    disabled={loading}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleLookup();
                      }
                    }}
                  />
                  <Button 
                    variant="contained" 
                    onClick={() => handleLookup()}
                    disabled={loading || !email.trim()}
                    sx={{ minWidth: '120px' }}
                  >
                    {loading ? <CircularProgress size={24} /> : '조회'}
                  </Button>
                </Box>
              </Box>
            )}

            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            {registrations.length > 0 && (
              <Box>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                  <Typography variant="h6">
                    <Person sx={{ mr: 1, verticalAlign: 'middle' }} />
                    {registrations[0].name}님의 수강 내역
                  </Typography>
                  <Button variant="outlined" onClick={() => { setRegistrations([]); setError(''); }}>
                    다시 조회
                  </Button>
                </Box>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  등록된 과정을 선택하시면 상세 정보를 확인하고 수정할 수 있습니다
                </Typography>

                <List>
                  {registrations.map((registration, index) => (
                    <React.Fragment key={registration.student_id}>
                      <ListItem disablePadding>
                        <ListItemButton 
                          onClick={() => handleCourseSelect(registration)}
                          sx={{ 
                            borderRadius: 1,
                            mb: 1,
                            border: '1px solid',
                            borderColor: 'divider',
                            '&:hover': {
                              borderColor: 'primary.main',
                              bgcolor: 'primary.50',
                            }
                          }}
                        >
                          <ListItemText
                            primary={
                              <Box display="flex" alignItems="center" gap={1}>
                                <School color="primary" />
                                <Typography variant="h6">{registration.course_name}</Typography>
                              </Box>
                            }
                            secondary={
                              <Box mt={1}>
                                <Box sx={{ mb: 1 }}>
                                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                                    <Schedule sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                                    {formatCourseSchedule(registration)}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    강사: {registration.instructor_name}
                                  </Typography>
                                </Box>
                                <Box display="flex" gap={1}>
                                  <Chip 
                                    label={`신청일: ${formatRegistrationDate(registration.created_at)}`}
                                    size="small"
                                    variant="outlined"
                                  />
                                  <Chip 
                                    label="정보 수정 가능"
                                    size="small"
                                    color="primary"
                                    variant="outlined"
                                  />
                                </Box>
                              </Box>
                            }
                          />
                        </ListItemButton>
                      </ListItem>
                      {index < registrations.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>

                <Box mt={3} p={2} bgcolor="grey.50" borderRadius={1}>
                  <Typography variant="body2" color="text.secondary">
                    💡 <strong>안내:</strong> 과정을 클릭하시면 해당 과정에서 등록한 개인정보를 확인하고 수정할 수 있습니다.
                  </Typography>
                </Box>
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>
    );
  }

  // Render old course-specific flow
  return (
    <Box maxWidth="800px" mx="auto">
      <Card>
        <CardContent sx={{ p: 4 }}>
          <Box textAlign="center" mb={4}>
            <Typography variant="h4" component="h1" gutterBottom>
              수강 정보 조회
            </Typography>
            {course && (
              <>
                <Typography variant="h6" color="primary" gutterBottom>
                  {course.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  강사: {course.instructor_name} | 일정: {course.schedule}
                </Typography>
              </>
            )}
          </Box>

          <Divider sx={{ mb: 4 }} />

          {!student && (
            <Box>
              <Typography variant="h6" gutterBottom>
                등록한 이메일로 정보 조회
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                수강 신청시 입력한 이메일 주소를 입력하시면 등록된 정보를 확인하고 수정할 수 있습니다.
              </Typography>

              <Box display="flex" gap={2} mb={3}>
                <TextField
                  label="이메일 주소"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  fullWidth
                  placeholder="example@domain.com"
                  disabled={loading}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleLookup();
                    }
                  }}
                />
                <Button 
                  variant="contained" 
                  onClick={() => handleLookup()}
                  disabled={loading || !email.trim()}
                  sx={{ minWidth: '120px' }}
                >
                  {loading ? <CircularProgress size={24} /> : '조회'}
                </Button>
              </Box>
            </Box>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {student && (
            <Box>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h6">
                  등록된 정보
                </Typography>
                <Box>
                  <Button variant="contained" onClick={handleEdit} sx={{ mr: 2 }}>
                    정보 수정
                  </Button>
                  <Button variant="outlined" onClick={() => setStudent(null)}>
                    다시 조회
                  </Button>
                </Box>
              </Box>

              <TableContainer component={Paper}>
                <Table>
                  <TableBody>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold', backgroundColor: 'grey.100' }}>이름</TableCell>
                      <TableCell>{student.name}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold', backgroundColor: 'grey.100' }}>영문명</TableCell>
                      <TableCell>{student.english_name}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold', backgroundColor: 'grey.100' }}>이메일</TableCell>
                      <TableCell>{student.email}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold', backgroundColor: 'grey.100' }}>소속</TableCell>
                      <TableCell>{student.affiliation}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold', backgroundColor: 'grey.100' }}>연락처</TableCell>
                      <TableCell>{formatPhone(student.phone)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold', backgroundColor: 'grey.100' }}>생년월일</TableCell>
                      <TableCell>{student.birth_date}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold', backgroundColor: 'grey.100' }}>등록일</TableCell>
                      <TableCell>{new Date(student.created_at).toLocaleString('ko-KR')}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default StudentLookup;
