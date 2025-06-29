import React, { useEffect, useState } from 'react';
import {
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Box,
  Chip,
  Alert,
  CircularProgress,
  TextField,
  InputAdornment,
  Collapse,
  Divider,
} from '@mui/material';
import { School, Schedule, Person, Search, ExpandMore, ExpandLess } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

interface Course {
  id: number;
  name: string;
  schedule?: string;
  start_date?: string;
  end_date?: string;
  instructor_name: string;
  created_at: string;
}

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://192.168.10.118:5000/api';

const Home: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAllCourses, setShowAllCourses] = useState(false);
  const [totalCourses, setTotalCourses] = useState(0);
  const [searchLoading, setSearchLoading] = useState(false);
  const navigate = useNavigate();

  const RECENT_COURSES_LIMIT = 6; // Show 6 most recent courses by default

  useEffect(() => {
    fetchRecentCourses();
    fetchTotalCount();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      searchCourses();
    } else if (showAllCourses) {
      fetchAllCourses();
    } else {
      fetchRecentCourses();
    }
  }, [searchTerm, showAllCourses]);

  const fetchRecentCourses = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/courses/public?limit=${RECENT_COURSES_LIMIT}`);
      setCourses(response.data.courses);
    } catch (error: any) {
      setError('과정 목록을 불러오는데 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllCourses = async () => {
    try {
      setSearchLoading(true);
      const response = await axios.get(`${API_BASE_URL}/courses/public`);
      setAllCourses(response.data.courses);
      setCourses(response.data.courses);
    } catch (error: any) {
      setError('과정 목록을 불러오는데 실패했습니다');
    } finally {
      setSearchLoading(false);
    }
  };

  const fetchTotalCount = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/courses/public/count`);
      setTotalCourses(response.data.total);
    } catch (error: any) {
      // Silent fail for count
    }
  };

  const searchCourses = async () => {
    try {
      setSearchLoading(true);
      const response = await axios.get(`${API_BASE_URL}/courses/public?search=${encodeURIComponent(searchTerm)}`);
      setCourses(response.data.courses);
    } catch (error: any) {
      setError('검색에 실패했습니다');
    } finally {
      setSearchLoading(false);
    }
  };

  const handleViewAllToggle = () => {
    setShowAllCourses(!showAllCourses);
    setSearchTerm(''); // Clear search when toggling view all
  };

  const handleApplyToCourse = (courseId: number) => {
    navigate(`/course/${courseId}/apply`);
  };

  const getCurrentCourses = (): Course[] => {
    if (searchTerm) {
      return courses; // Search results
    }
    if (showAllCourses) {
      return allCourses; // All courses
    }
    return courses; // Recent courses
  };

  const getDisplayedCourses = getCurrentCourses();

  const formatCourseSchedule = (course: Course): string => {
    if (course.start_date && course.end_date) {
      const start = new Date(course.start_date).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      const end = new Date(course.end_date).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      return `${start} ~ ${end}`;
    }
    return course.schedule || '일정 정보 없음';
  };

  const getCourseStatus = (course: Course): { label: string; color: 'success' | 'warning' | 'error' | 'default' } => {
    if (!course.start_date || !course.end_date) {
      return { label: '수강 신청 가능', color: 'success' };
    }
    
    const now = new Date();
    const start = new Date(course.start_date);
    const end = new Date(course.end_date);
    
    if (now < start) {
      return { label: '수강 신청 예정', color: 'default' };
    } else if (now > end) {
      return { label: '수강 신청 마감', color: 'error' };
    } else {
      return { label: '수강 신청 가능', color: 'success' };
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
      <Box textAlign="center" mb={6}>
        <Typography variant="h2" component="h1" gutterBottom color="primary">
          ED&C 교육 과정
        </Typography>
        <Typography variant="h6" color="text.secondary" maxWidth="600px" mx="auto">
          아래 과정 중 수강하신 과정을 선택하여 수료증 발급을 위한 정보를 입력해주세요
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Course Search */}
      {totalCourses > RECENT_COURSES_LIMIT && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>
              과정 검색
            </Typography>
            <TextField
              fullWidth
              placeholder="과정명 또는 강사명으로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 2 }}
            />
            
            {searchLoading && (
              <Box display="flex" justifyContent="center" py={2}>
                <CircularProgress size={24} />
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      {/* Student Lookup Section */}
      <Card sx={{ mb: 3, border: '2px solid', borderColor: 'primary.main' }}>
        <CardContent sx={{ py: 2 }}>
          <Box display="flex" alignItems="center" justifyContent="space-between" gap={2}>
            <Box display="flex" alignItems="center" flex={1}>
              <Search sx={{ mr: 1, color: 'primary.main' }} />
              <Box>
                <Typography variant="h6" color="primary.main">
                  이미 등록하신 분은 여기서 정보를 확인하세요
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  등록한 이메일로 모든 수강 과정을 한번에 조회하고 수정할 수 있습니다
                </Typography>
              </Box>
            </Box>
            <Button
              variant="contained"
              color="primary"
              onClick={() => navigate('/lookup')}
              sx={{ 
                py: 1,
                px: 3,
                minWidth: '200px',
                whiteSpace: 'nowrap',
              }}
            >
              📧 수강 정보 조회
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Course Grid */}
      <Box mb={3}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h5">
            {searchTerm ? `검색 결과 (${getDisplayedCourses.length}개)` : 
             showAllCourses ? `전체 과정 (${totalCourses}개)` : 
             `최근 과정 ${getDisplayedCourses.length > 0 ? `(${getDisplayedCourses.length}개)` : ''}`}
          </Typography>
          
          {!searchTerm && totalCourses > RECENT_COURSES_LIMIT && (
            <Button 
              variant="outlined" 
              onClick={handleViewAllToggle}
              startIcon={showAllCourses ? <ExpandLess /> : <ExpandMore />}
              size="small"
            >
              {showAllCourses ? '최근 과정만' : '모든 과정'}
            </Button>
          )}
        </Box>

        {getDisplayedCourses.length === 0 ? (
          <Box textAlign="center" py={6}>
            <School sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h5" color="text.secondary" gutterBottom>
              {searchTerm ? '검색 결과가 없습니다' : '등록된 과정이 없습니다'}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {searchTerm ? '다른 검색어를 시도해보세요' : '강사가 과정을 등록하면 여기에 표시됩니다'}
            </Typography>
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
            {getDisplayedCourses.map((course: Course) => (
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
                  <Box display="flex" alignItems="center" mb={2}>
                    <School color="primary" sx={{ mr: 1 }} />
                    <Typography variant="h6" component="h3" noWrap>
                      {course.name}
                    </Typography>
                  </Box>
                  
                  <Box display="flex" alignItems="center" mb={2}>
                    <Schedule color="action" sx={{ mr: 1, fontSize: 18 }} />
                    <Typography variant="body2" color="text.secondary">
                      {formatCourseSchedule(course)}
                    </Typography>
                  </Box>
                  
                  <Box display="flex" alignItems="center" mb={2}>
                    <Person color="action" sx={{ mr: 1, fontSize: 18 }} />
                    <Typography variant="body2" color="text.secondary">
                      강사: {course.instructor_name}
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
                    variant="contained"
                    fullWidth
                    onClick={() => handleApplyToCourse(course.id)}
                    sx={{ m: 1 }}
                  >
                    정보 입력하기
                  </Button>
                </CardActions>
              </Card>
            ))}
          </Box>
        )}
      </Box>

      <Box mt={6} p={3} bgcolor="background.paper" borderRadius={2}>
        <Typography variant="h6" gutterBottom>
          📋 안내사항
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          • 수강하신 과정을 선택하여 개인정보를 정확히 입력해주세요
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          • 입력된 정보는 수료증 발급 목적으로만 사용됩니다
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          • 정보 입력 후 수정이나 삭제가 가능합니다
        </Typography>
        <Typography variant="body2" color="text.secondary">
          • 문의사항이 있으시면 해당 강사에게 연락해주세요
        </Typography>
      </Box>
    </Box>
  );
};

export default Home; 