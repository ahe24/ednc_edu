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
  Divider,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import dayjs from 'dayjs';

interface StudentFormData {
  name: string;
  english_name: string;
  email: string;
  affiliation: string;
  phone: string;
  birth_date: Date | null;
}

interface Course {
  id: number;
  name: string;
  schedule: string;
  instructor_name: string;
}

const schema: yup.ObjectSchema<StudentFormData> = yup.object({
  name: yup.string().required('이름을 입력해주세요'),
  english_name: yup.string().required('영문명을 입력해주세요'),
  email: yup.string().email('올바른 이메일 형식을 입력해주세요').required('이메일을 입력해주세요'),
  affiliation: yup.string().required('소속을 입력해주세요'),
  phone: yup.string()
    .required('전화번호를 입력해주세요')
    .test('phone-format', '올바른 전화번호 형식을 입력해주세요 (예: 010-1234-5678)', 
      (value) => {
        if (!value) return false;
        const numbers = value.replace(/\D/g, '');
        return numbers.length >= 10 && numbers.length <= 11;
      }
    ),
  birth_date: yup.date().nullable().required('생년월일을 입력해주세요'),
});

const formatPhoneNumber = (value: string): string => {
  const numbers = value.replace(/\D/g, '');
  
  if (numbers.length <= 3) {
    return numbers;
  } else if (numbers.length <= 7) {
    return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
  } else {
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
  }
};

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://192.168.10.118:5000/api';

const StudentForm: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  
  // Edit mode state
  const editId = searchParams.get('edit');
  const editEmail = searchParams.get('email');
  const isEditMode = editId && editEmail;

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<StudentFormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      name: '',
      english_name: '',
      email: '',
      affiliation: '',
      phone: '',
      birth_date: null,
    },
  });

  useEffect(() => {
    fetchCourse();
    if (isEditMode) {
      fetchStudentData();
    }
  }, [courseId, isEditMode]);

  const fetchStudentData = async () => {
    if (!editEmail || !courseId) return;
    
    try {
      const response = await axios.get(`${API_BASE_URL}/students/lookup/${encodeURIComponent(editEmail)}/${courseId}`);
      const student = response.data.student;
      
      // Populate form with existing data
      setValue('name', student.name);
      setValue('english_name', student.english_name);
      setValue('email', student.email);
      setValue('affiliation', student.affiliation);
      setValue('phone', formatPhoneNumber(student.phone));
      setValue('birth_date', student.birth_date ? new Date(student.birth_date) : null);
    } catch (error: any) {
      setError('기존 정보를 불러오는데 실패했습니다');
    }
  };

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
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: StudentFormData) => {
    setSubmitting(true);
    setError('');

    try {
      const formattedData = {
        ...data,
        phone: data.phone.replace(/\D/g, ''),
        birth_date: data.birth_date ? dayjs(data.birth_date).format('YY/MM/DD') : '',
        course_id: parseInt(courseId || '0'),
      };

      if (isEditMode && editId) {
        // Update existing student
        await axios.put(`${API_BASE_URL}/students/${editId}`, formattedData);
        setSuccess('학생 정보가 성공적으로 수정되었습니다!');
      } else {
        // Create new student
        await axios.post(`${API_BASE_URL}/students`, formattedData);
        setSuccess('학생 정보가 성공적으로 등록되었습니다!');
      }
      
      setTimeout(() => {
        if (isEditMode) {
          navigate(`/course/${courseId}/lookup`);
        } else {
          navigate(`/course/${courseId}/lookup?email=${encodeURIComponent(data.email)}`);
        }
      }, 2000);
      
    } catch (error: any) {
      setError(error.response?.data?.error || (isEditMode ? '정보 수정에 실패했습니다' : '정보 등록에 실패했습니다'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (!course) {
    return (
      <Box textAlign="center" py={6}>
        <Alert severity="error">
          {error || '과정을 찾을 수 없습니다'}
        </Alert>
        <Button variant="contained" onClick={() => navigate('/')} sx={{ mt: 2 }}>
          홈으로 돌아가기
        </Button>
      </Box>
    );
  }

  return (
    <Box maxWidth="600px" mx="auto">
      <Card>
        <CardContent sx={{ p: 4 }}>
          <Box textAlign="center" mb={4}>
            <Typography variant="h4" component="h1" gutterBottom>
              {isEditMode ? '수강 정보 수정' : '수강 정보 입력'}
            </Typography>
            <Typography variant="h6" color="primary" gutterBottom>
              {course.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              강사: {course.instructor_name} | 일정: {course.schedule}
            </Typography>
          </Box>

          <Divider sx={{ mb: 4 }} />

          {isEditMode && (
            <Alert severity="info" sx={{ mb: 3 }}>
              등록된 정보를 수정할 수 있습니다. 수정 후 저장 버튼을 눌러주세요.
            </Alert>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 3 }}>
              {success}
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)}>
            <Box 
              sx={{ 
                display: 'grid', 
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, 
                gap: 3 
              }}
            >
              <TextField
                {...register('name')}
                label="이름"
                fullWidth
                error={!!errors.name}
                helperText={errors.name?.message}
                disabled={submitting}
              />

              <TextField
                {...register('english_name')}
                label="영문명"
                fullWidth
                error={!!errors.english_name}
                helperText={errors.english_name?.message}
                disabled={submitting}
                placeholder="Hong Gildong"
              />

              <Box sx={{ gridColumn: { xs: '1', sm: '1 / -1' } }}>
                <TextField
                  {...register('email')}
                  label="이메일"
                  type="email"
                  fullWidth
                  error={!!errors.email}
                  helperText={errors.email?.message}
                  disabled={submitting}
                  placeholder="example@domain.com"
                />
              </Box>

              <Box sx={{ gridColumn: { xs: '1', sm: '1 / -1' } }}>
                <TextField
                  {...register('affiliation')}
                  label="소속"
                  fullWidth
                  error={!!errors.affiliation}
                  helperText={errors.affiliation?.message}
                  disabled={submitting}
                  placeholder="회사명 또는 소속 기관"
                />
              </Box>

              <Controller
                name="phone"
                control={control}
                render={({ field }) => (
                  <TextField
                    label="전화번호"
                    fullWidth
                    value={field.value}
                    onChange={(e) => {
                      const formatted = formatPhoneNumber(e.target.value);
                      field.onChange(formatted);
                    }}
                    error={!!errors.phone}
                    helperText={errors.phone?.message}
                    disabled={submitting}
                    placeholder="010-1234-5678"
                    inputProps={{
                      maxLength: 13,
                    }}
                  />
                )}
              />

              <Controller
                name="birth_date"
                control={control}
                render={({ field }) => (
                  <DatePicker
                    label="생년월일"
                    value={field.value ? dayjs(field.value) : null}
                    onChange={(date) => field.onChange(date ? date.toDate() : null)}
                    format="YY/MM/DD"
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        error: !!errors.birth_date,
                        helperText: errors.birth_date?.message,
                        disabled: submitting,
                      },
                    }}
                  />
                )}
              />
            </Box>

            <Box mt={4}>
              <Button
                type="submit"
                variant="contained"
                size="large"
                fullWidth
                disabled={submitting}
              >
                {submitting ? <CircularProgress size={24} /> : (isEditMode ? '정보 수정하기' : '정보 등록하기')}
              </Button>
            </Box>

            <Box mt={2} textAlign="center">
              <Button
                variant="text"
                onClick={() => navigate(isEditMode ? `/course/${courseId}/lookup` : '/')}
                disabled={submitting}
              >
                취소
              </Button>
            </Box>
          </form>

          <Box mt={4} p={2} bgcolor="background.default" borderRadius={1}>
            <Typography variant="caption" color="text.secondary">
              ※ 입력하신 개인정보는 수료증 발급 목적으로만 사용되며, 관련 법령에 따라 안전하게 관리됩니다.
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default StudentForm; 