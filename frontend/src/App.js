import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

// Components
import LandingPage from './components/LandingPage';
import TeacherDashboard from './components/TeacherDashboard';
import StudentDashboard from './components/StudentDashboard';
import LoadingScreen from './components/LoadingScreen';

// Socket & Context
import { SocketProvider } from './context/SocketContext';
import { UserProvider } from './context/UserContext';

const AppContainer = styled(motion.div)`
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  position: relative;
  overflow-x: hidden;
`;

const BackgroundDecoration = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
  
  &::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(circle at center, rgba(255, 255, 255, 0.1) 0%, transparent 70%);
    animation: rotate 20s linear infinite;
  }
  
  @keyframes rotate {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

const ContentWrapper = styled.div`
  position: relative;
  z-index: 1;
  min-height: 100vh;
`;

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Check for existing user in sessionStorage first
    const savedUser = sessionStorage.getItem('pollUser');
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
        // Reduce loading time if user exists
        setTimeout(() => setIsLoading(false), 1000);
      } catch (error) {
        console.error('Error parsing saved user:', error);
        sessionStorage.removeItem('pollUser');
        setTimeout(() => setIsLoading(false), 2000);
      }
    } else {
      // Simulate loading time for new users
      setTimeout(() => setIsLoading(false), 2000);
    }
  }, []);

  const handleUserLogin = (userData) => {
    setUser(userData);
    sessionStorage.setItem('pollUser', JSON.stringify(userData));
    toast.success(`Welcome ${userData.name}! 🎉`, {
      icon: userData.role === 'teacher' ? '👨‍🏫' : '👨‍🎓',
    });
  };

  const handleUserLogout = () => {
    setUser(null);
    sessionStorage.removeItem('pollUser');
    toast.success('Logged out successfully! 👋');
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <UserProvider value={{ user, setUser: handleUserLogin, logout: handleUserLogout }}>
      <SocketProvider>
        <Router>
          <AppContainer
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <BackgroundDecoration />
            <ContentWrapper>
              <AnimatePresence mode="wait">
                <Routes>
                  <Route
                    path="/"
                    element={
                      user ? (
                        <Navigate
                          to={user.role === 'teacher' ? '/teacher' : '/student'}
                          replace
                        />
                      ) : (
                        <LandingPage onUserLogin={handleUserLogin} />
                      )
                    }
                  />
                  <Route
                    path="/teacher"
                    element={
                      user && user.role === 'teacher' ? (
                        <TeacherDashboard />
                      ) : (
                        <Navigate to="/" replace />
                      )
                    }
                  />
                  <Route
                    path="/student"
                    element={
                      user && user.role === 'student' ? (
                        <StudentDashboard />
                      ) : (
                        <Navigate to="/" replace />
                      )
                    }
                  />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </AnimatePresence>
            </ContentWrapper>
          </AppContainer>
        </Router>
      </SocketProvider>
    </UserProvider>
  );
}

export default App; 