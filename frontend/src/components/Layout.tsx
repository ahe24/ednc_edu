import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Container,
  IconButton,
  Menu,
  MenuItem,
  Chip,
} from '@mui/material';
import { AccountCircle, Dashboard, People, Search } from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { instructor, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleClose();
    navigate('/');
  };

  const handleDashboard = () => {
    navigate('/dashboard');
    handleClose();
  };

  // Get course ID from URL if present
  const getCourseIdFromPath = () => {
    const match = location.pathname.match(/\/course\/(\d+)/);
    return match ? match[1] : null;
  };

  return (
    <Box sx={{ flexGrow: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <AppBar position="static" elevation={0}>
        <Toolbar>
          <Typography 
            variant="h6" 
            component="div" 
            sx={{ flexGrow: 1, cursor: 'pointer' }}
            onClick={() => navigate('/')}
          >
            ED&C 교육 수강 정보
          </Typography>
          
          {instructor ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="body2" color="inherit">
                {instructor.name}님 안녕하세요
              </Typography>
              <IconButton
                size="large"
                aria-label="account of current user"
                aria-controls="menu-appbar"
                aria-haspopup="true"
                onClick={handleMenu}
                color="inherit"
              >
                <AccountCircle />
              </IconButton>
              <Menu
                id="menu-appbar"
                anchorEl={anchorEl}
                anchorOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                keepMounted
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                open={Boolean(anchorEl)}
                onClose={handleClose}
              >
                <MenuItem onClick={handleDashboard}>대시보드</MenuItem>
                <MenuItem onClick={handleLogout}>로그아웃</MenuItem>
              </Menu>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', gap: 1 }}>
              {location.pathname !== '/login' && (
                <Button 
                  color="inherit" 
                  onClick={() => navigate('/login')}
                >
                  강사 로그인
                </Button>
              )}
              {location.pathname !== '/register' && (
                <Button 
                  color="inherit" 
                  onClick={() => navigate('/register')}
                >
                  강사 등록
                </Button>
              )}
            </Box>
          )}
        </Toolbar>
      </AppBar>

      {/* Secondary Navigation for Instructors */}
      {instructor && (
        <Box sx={{ bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider' }}>
          <Container maxWidth="lg">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1.5 }}>
              <Button
                startIcon={<Dashboard />}
                variant={location.pathname === '/dashboard' ? 'contained' : 'text'}
                size="small"
                onClick={() => navigate('/dashboard')}
                color={location.pathname === '/dashboard' ? 'primary' : 'inherit'}
              >
                과정 관리
              </Button>
              
              {location.pathname.includes('/course/') && (
                <>
                  <Box sx={{ mx: 1, color: 'text.secondary' }}>•</Box>
                  
                  {getCourseIdFromPath() && (
                    <>
                      <Chip 
                        label={`과정 ID: ${getCourseIdFromPath()}`} 
                        size="small" 
                        variant="outlined"
                        color="primary"
                      />
                      <Box sx={{ mx: 1, color: 'text.secondary' }}>•</Box>
                    </>
                  )}
                  
                  {location.pathname.includes('/students') && (
                    <Button
                      startIcon={<People />}
                      variant="outlined"
                      size="small"
                      color="primary"
                    >
                      수강생 목록
                    </Button>
                  )}
                  
                  {location.pathname.includes('/lookup') && (
                    <Button
                      startIcon={<Search />}
                      variant="outlined"
                      size="small"
                      color="primary"
                    >
                      정보 조회
                    </Button>
                  )}
                </>
              )}
              
              <Box sx={{ flexGrow: 1 }} />
              
              {location.pathname !== '/dashboard' && location.pathname !== '/' && (
                <Button
                  variant="text"
                  size="small"
                  onClick={() => navigate('/dashboard')}
                  sx={{ color: 'text.secondary' }}
                >
                  ← 대시보드로 돌아가기
                </Button>
              )}
            </Box>
          </Container>
        </Box>
      )}
      
      <Box component="main" sx={{ flexGrow: 1, py: 3 }}>
        <Container maxWidth="lg">
          {children}
        </Container>
      </Box>
    </Box>
  );
};

export default Layout; 