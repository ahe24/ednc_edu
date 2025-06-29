import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { theme } from './theme';
import { AuthProvider } from './contexts/AuthContext';

// Import components (we'll create these next)
import Layout from './components/Layout';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import StudentForm from './pages/StudentForm';
import StudentList from './pages/StudentList';
import StudentLookup from './pages/StudentLookup';
import ProtectedRoute from './components/ProtectedRoute';

import 'dayjs/locale/ko';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="ko">
        <AuthProvider>
          <Router>
            <Layout>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route 
                  path="/dashboard" 
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  } 
                />
                <Route path="/course/:courseId/apply" element={<StudentForm />} />
                <Route path="/course/:courseId/lookup" element={<StudentLookup />} />
                <Route path="/lookup" element={<StudentLookup />} />
                <Route 
                  path="/course/:courseId/students" 
                  element={
                    <ProtectedRoute>
                      <StudentList />
                    </ProtectedRoute>
                  } 
                />
              </Routes>
            </Layout>
          </Router>
        </AuthProvider>
      </LocalizationProvider>
    </ThemeProvider>
  );
}

export default App;
