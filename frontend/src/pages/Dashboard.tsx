import React, { useEffect, useState } from 'react';
import {
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Box,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import {
  Add,
  School,
  Schedule,
  People,
  MoreVert,
  Edit,
  Delete,
  Visibility,

} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useForm, Controller } from 'react-hook-form';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import dayjs from 'dayjs';

interface Course {
  id: number;
  name: string;
  schedule?: string;
  start_date?: string;
  end_date?: string;
  instructor_id: number;
  instructor_name?: string; // For admin view
  created_at: string;
}

interface CourseFormData {
  name: string;
  schedule?: string;
  start_date?: Date | null;
  end_date?: Date | null;
  use_dates: boolean;
}

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://192.168.10.118:5000/api';

const Dashboard: React.FC = () => {
  const { instructor } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [endDateDefaultMonth, setEndDateDefaultMonth] = useState<dayjs.Dayjs | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
    control,
  } = useForm<CourseFormData>({
    defaultValues: {
      name: '',
      schedule: '',
      start_date: null,
      end_date: null,
      use_dates: true, // Default to using date pickers
    },
  });

  const useDates = watch('use_dates');

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/courses`);
      setCourses(response.data.courses);
    } catch (error: any) {
      setError('과정 목록을 불러오는데 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  const formatDateRange = (course: Course): string => {
    if (course.start_date && course.end_date) {
      const start = dayjs(course.start_date).format('YYYY년 M월 D일');
      const end = dayjs(course.end_date).format('YYYY년 M월 D일');
      return `${start} ~ ${end}`;
    }
    return course.schedule || '일정 정보 없음';
  };

  const getCourseStatus = (course: Course): { label: string; color: 'success' | 'warning' | 'error' | 'default' } => {
    if (!course.start_date || !course.end_date) {
      return { label: '활성', color: 'success' };
    }
    
    const now = dayjs();
    const start = dayjs(course.start_date);
    const end = dayjs(course.end_date);
    
    if (now.isBefore(start)) {
      return { label: '예정', color: 'default' };
    } else if (now.isAfter(end)) {
      return { label: '종료', color: 'error' };
    } else {
      return { label: '진행중', color: 'success' };
    }
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, course: Course) => {
    setAnchorEl(event.currentTarget);
    setSelectedCourse(course);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedCourse(null);
  };

  const handleCreateCourse = () => {
    setEditingCourse(null);
    setEndDateDefaultMonth(null); // Reset end date default month
    reset({
      name: '',
      schedule: '',
      start_date: null,
      end_date: null,
      use_dates: true,
    });
    setOpenDialog(true);
  };

  const handleEditCourse = () => {
    if (selectedCourse) {
      setEditingCourse(selectedCourse);
      setValue('name', selectedCourse.name);
      
      // Check if course uses dates or text schedule
      const usesDates = selectedCourse.start_date && selectedCourse.end_date;
      setValue('use_dates', !!usesDates);
      
      if (usesDates) {
        const startDate = new Date(selectedCourse.start_date!);
        const endDate = new Date(selectedCourse.end_date!);
        setValue('start_date', startDate);
        setValue('end_date', endDate);
        setValue('schedule', '');
        // Set the default month to the start date's month
        setEndDateDefaultMonth(dayjs(startDate));
      } else {
        setValue('schedule', selectedCourse.schedule || '');
        setValue('start_date', null);
        setValue('end_date', null);
        setEndDateDefaultMonth(null);
      }
      
      setOpenDialog(true);
    }
    handleMenuClose();
  };

  const handleDeleteCourse = async () => {
    if (selectedCourse) {
      try {
        await axios.delete(`${API_BASE_URL}/courses/${selectedCourse.id}`);
        fetchCourses();
      } catch (error: any) {
        setError('과정 삭제에 실패했습니다');
      }
    }
    handleMenuClose();
  };

  const handleViewStudents = () => {
    if (selectedCourse) {
      navigate(`/course/${selectedCourse.id}/students`);
    }
    handleMenuClose();
  };

  const onSubmit = async (data: CourseFormData) => {
    try {
      // Manual validation
      if (data.use_dates) {
        if (!data.start_date) {
          setError('시작 날짜를 선택해주세요');
          return;
        }
        if (!data.end_date) {
          setError('종료 날짜를 선택해주세요');
          return;
        }
        if (data.end_date < data.start_date) {
          setError('종료 날짜는 시작 날짜보다 늦어야 합니다');
          return;
        }
      } else {
        if (!data.schedule || data.schedule.trim() === '') {
          setError('일정을 입력해주세요');
          return;
        }
      }

      const submitData = {
        name: data.name,
        schedule: data.use_dates ? null : data.schedule,
        start_date: data.use_dates && data.start_date ? dayjs(data.start_date).format('YYYY-MM-DD') : null,
        end_date: data.use_dates && data.end_date ? dayjs(data.end_date).format('YYYY-MM-DD') : null,
      };

      if (editingCourse) {
        await axios.put(`${API_BASE_URL}/courses/${editingCourse.id}`, submitData);
      } else {
        await axios.post(`${API_BASE_URL}/courses`, submitData);
      }
      fetchCourses();
      setOpenDialog(false);
      reset();
      setError(''); // Clear any validation errors
    } catch (error: any) {
      setError(editingCourse ? '과정 수정에 실패했습니다' : '과정 생성에 실패했습니다');
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Box display="flex" alignItems="center" gap={2}>
            <Typography variant="h3" component="h1" gutterBottom>
              안녕하세요, {instructor?.name}님! 👋
            </Typography>
            {instructor?.is_admin && (
              <Chip 
                label="관리자" 
                color="error" 
                size="small" 
                variant="filled"
                sx={{ mb: 1 }}
              />
            )}
          </Box>
          <Typography variant="h6" color="text.secondary">
            {instructor?.is_admin 
              ? '모든 과정을 관리하고 강사 계정을 관리하세요' 
              : '과정을 관리하고 학생 정보를 확인하세요'
            }
          </Typography>
        </Box>
        <Fab color="primary" aria-label="add" onClick={handleCreateCourse}>
          <Add />
        </Fab>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {courses.length === 0 ? (
        <Box textAlign="center" py={8}>
          <School sx={{ fontSize: 100, color: 'text.secondary', mb: 3 }} />
          <Typography variant="h4" color="text.secondary" gutterBottom>
            첫 번째 과정을 만들어보세요
          </Typography>
          <Typography variant="body1" color="text.secondary" mb={4}>
            과정을 생성하면 학생들이 수강 정보를 입력할 수 있습니다
          </Typography>
          <Button variant="contained" size="large" onClick={handleCreateCourse}>
            과정 만들기
          </Button>
        </Box>
      ) : (
        <Box 
          sx={{ 
            display: 'grid', 
            gridTemplateColumns: { 
              xs: '1fr', 
              md: 'repeat(2, 1fr)', 
              lg: 'repeat(3, 1fr)' 
            }, 
            gap: 3 
          }}
        >
          {courses.map((course) => (
            <Card 
              key={course.id}
              sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                transition: 'transform 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-4px)',
                }
              }}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                  <Box>
                    <Box display="flex" alignItems="center" mb={1}>
                      <School color="primary" sx={{ mr: 1 }} />
                      <Typography variant="h6" component="h3">
                        {course.name}
                      </Typography>
                    </Box>
                    {instructor?.is_admin && course.instructor_name && (
                      <Typography variant="body2" color="text.secondary" sx={{ ml: 3 }}>
                        강사: {course.instructor_name}
                      </Typography>
                    )}
                  </Box>
                  <IconButton
                    size="small"
                    onClick={(e) => handleMenuClick(e, course)}
                  >
                    <MoreVert />
                  </IconButton>
                </Box>
                
                <Box display="flex" alignItems="center" mb={2}>
                  <Schedule color="action" sx={{ mr: 1, fontSize: 18 }} />
                  <Typography variant="body2" color="text.secondary">
                    {formatDateRange(course)}
                  </Typography>
                </Box>

                <Chip 
                  label={getCourseStatus(course).label} 
                  color={getCourseStatus(course).color} 
                  size="small" 
                  sx={{ mt: 1 }}
                />
              </CardContent>
              
              <CardActions>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<People />}
                  onClick={() => navigate(`/course/${course.id}/students`)}
                  sx={{ m: 1 }}
                >
                  학생 목록 보기
                </Button>
              </CardActions>
            </Card>
          ))}
        </Box>
      )}

      {/* Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleViewStudents}>
          <Visibility sx={{ mr: 1 }} />
          학생 목록
        </MenuItem>
        <MenuItem onClick={handleEditCourse}>
          <Edit sx={{ mr: 1 }} />
          수정
        </MenuItem>
        <MenuItem onClick={handleDeleteCourse} sx={{ color: 'error.main' }}>
          <Delete sx={{ mr: 1 }} />
          삭제
        </MenuItem>
      </Menu>

      {/* Course Dialog */}
      <Dialog open={openDialog} onClose={() => {
        setOpenDialog(false);
        setEndDateDefaultMonth(null); // Reset default month when dialog closes
      }} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingCourse ? '과정 수정' : '새 과정 만들기'}
        </DialogTitle>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogContent>
            <TextField
              {...register('name')}
              label="과정명"
              fullWidth
              margin="normal"
              error={!!errors.name}
              helperText={errors.name?.message}
            />
            <FormControlLabel
              control={<Checkbox {...register('use_dates')} />}
              label="날짜를 사용하여 일정 설정"
            />
            {useDates ? (
              <>
                <Controller
                  control={control}
                  name="start_date"
                  render={({ field }) => (
                    <DatePicker
                      label="시작 날짜"
                      value={field.value ? dayjs(field.value) : null}
                      onChange={(newValue) => {
                        field.onChange(newValue ? newValue.toDate() : null);
                        // Set the end date picker to focus on the selected start date's month
                        if (newValue) {
                          setEndDateDefaultMonth(newValue);
                        }
                      }}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          margin: 'normal',
                          error: !!errors.start_date,
                          helperText: errors.start_date?.message,
                        },
                      }}
                    />
                  )}
                />
                <Controller
                  control={control}
                  name="end_date"
                  render={({ field }) => (
                    <DatePicker
                      key={endDateDefaultMonth ? endDateDefaultMonth.format('YYYY-MM') : 'no-default'}
                      label="종료 날짜"
                      value={field.value ? dayjs(field.value) : null}
                      onChange={(newValue) => {
                        field.onChange(newValue ? newValue.toDate() : null);
                      }}
                      referenceDate={endDateDefaultMonth || undefined}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          margin: 'normal',
                          error: !!errors.end_date,
                          helperText: errors.end_date?.message,
                        },
                      }}
                    />
                  )}
                />
              </>
            ) : (
              <TextField
                {...register('schedule')}
                label="일정"
                fullWidth
                margin="normal"
                multiline
                rows={3}
                error={!!errors.schedule}
                helperText={errors.schedule?.message}
                placeholder="예: 2024년 1월 15일 ~ 2월 15일, 매주 월수금 14:00-17:00"
              />
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => {
              setOpenDialog(false);
              setEndDateDefaultMonth(null);
            }}>취소</Button>
            <Button type="submit" variant="contained">
              {editingCourse ? '수정' : '생성'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default Dashboard; 