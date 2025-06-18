import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, BookOpen, ArrowRight, Sparkles } from 'lucide-react';
import { useSocket } from '../context/SocketContext';

const LandingContainer = styled(motion.div)`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 2rem;
  position: relative;
  overflow: hidden;
`;

const GlassCard = styled(motion.div)`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 24px;
  padding: 3rem;
  width: 100%;
  max-width: 500px;
  box-shadow: 
    0 20px 25px -5px rgba(0, 0, 0, 0.1),
    0 10px 10px -5px rgba(0, 0, 0, 0.04),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  position: relative;
  z-index: 2;
`;

const Title = styled(motion.h1)`
  color: white;
  font-size: 2.5rem;
  font-weight: 800;
  text-align: center;
  margin-bottom: 0.5rem;
  background: linear-gradient(135deg, #ffffff 0%, #f0f0f0 100%);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 0 30px rgba(255, 255, 255, 0.3);
`;

const Subtitle = styled(motion.p)`
  color: rgba(255, 255, 255, 0.8);
  font-size: 1.1rem;
  text-align: center;
  margin-bottom: 2.5rem;
  line-height: 1.6;
`;

const RoleContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 2rem;
  
  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

const RoleCard = styled(motion.div)`
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid ${props => props.$selected ? '#4f46e5' : 'rgba(255, 255, 255, 0.2)'};
  border-radius: 16px;
  padding: 1.5rem;
  cursor: pointer;
  text-align: center;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  
  &:hover {
    background: rgba(255, 255, 255, 0.15);
    border-color: #4f46e5;
    transform: translateY(-2px);
  }
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, rgba(79, 70, 229, 0.1) 0%, rgba(124, 75, 162, 0.1) 100%);
    opacity: ${props => props.$selected ? 1 : 0};
    transition: opacity 0.3s ease;
  }
`;

const RoleIcon = styled.div`
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(135deg, #4f46e5 0%, #7c4dff 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem;
  color: white;
  position: relative;
  z-index: 1;
`;

const RoleTitle = styled.h3`
  color: white;
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  position: relative;
  z-index: 1;
`;

const RoleDescription = styled.p`
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.9rem;
  line-height: 1.4;
  position: relative;
  z-index: 1;
`;

const NameInput = styled(motion.input)`
  width: 100%;
  padding: 1rem 1.5rem;
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  font-size: 1rem;
  margin-bottom: 1.5rem;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.6);
  }
  
  &:focus {
    outline: none;
    border-color: #4f46e5;
    background: rgba(255, 255, 255, 0.15);
    box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.1);
  }
`;

const ContinueButton = styled(motion.button)`
  width: 100%;
  padding: 1rem 2rem;
  background: linear-gradient(135deg, #4f46e5 0%, #7c4dff 100%);
  border: none;
  border-radius: 12px;
  color: white;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 25px rgba(79, 70, 229, 0.3);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    transition: left 0.5s ease;
  }
  
  &:hover::before {
    left: 100%;
  }
`;

const FloatingElements = styled.div`
  position: absolute;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
`;

const FloatingIcon = styled(motion.div)`
  position: absolute;
  color: rgba(255, 255, 255, 0.1);
  font-size: ${props => props.$size || '2rem'};
`;

const LandingPage = ({ onUserLogin }) => {
  const [selectedRole, setSelectedRole] = useState('');
  const [name, setName] = useState('');
  const [roomId, setRoomId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { joinRoom, isConnected, user, socket } = useSocket();

  // Check for existing user data in sessionStorage on component mount
  useEffect(() => {
    const savedUser = sessionStorage.getItem('pollUser');
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setSelectedRole(userData.role);
        setName(userData.name);
        if (userData.roomId) setRoomId(userData.roomId);
      } catch (error) {
        // Error parsing saved user data
        sessionStorage.removeItem('pollUser');
      }
    }
  }, []);

  // Handle successful user join
  useEffect(() => {
    if (user && isLoading) {
      setIsLoading(false);
      onUserLogin(user);
    }
  }, [user, isLoading, onUserLogin]);

  // Handle join errors and reset loading state
  useEffect(() => {
    if (!socket) return;

    const handleJoinError = () => {
      setIsLoading(false);
    };

    socket.on('joinError', handleJoinError);
    socket.on('error', handleJoinError);

    return () => {
      socket.off('joinError', handleJoinError);
      socket.off('error', handleJoinError);
    };
  }, [socket]);

  const roles = [
    {
      id: 'teacher',
      title: "I'm a Teacher",
      description: 'Create polls, manage students, and view live results in your classroom.',
      icon: <Users size={24} />,
    },
    {
      id: 'student',
      title: "I'm a Student",
      description: 'Join a classroom with Room ID and participate in live polls.',
      icon: <BookOpen size={24} />,
    },
  ];

  const handleContinue = async () => {
    if (!name.trim() || !selectedRole) return;
    if (selectedRole === 'student' && !roomId.trim()) return;
    
    setIsLoading(true);
    
    try {
      // For teachers: don't pass roomId, let server generate one
      // For students: pass the roomId they entered
      const joinData = {
        name: name.trim(),
        role: selectedRole,
        roomId: selectedRole === 'student' ? roomId.trim().toUpperCase() : null,
      };
      
      // Join the socket room
      console.log('Attempting to join:', joinData);
      joinRoom(joinData.name, joinData.role, joinData.roomId);
      
      // Don't call onUserLogin immediately - wait for socket confirmation
      
    } catch (error) {
      // Error during join process
      setIsLoading(false);
    }
  };

  const floatingIcons = [
    { icon: <Sparkles />, size: '1.5rem', left: '10%', top: '20%', delay: 0 },
    { icon: <Users />, size: '2rem', left: '85%', top: '15%', delay: 0.5 },
    { icon: <BookOpen />, size: '1.8rem', left: '15%', top: '80%', delay: 1 },
    { icon: <Sparkles />, size: '1.2rem', left: '80%', top: '75%', delay: 1.5 },
  ];

  return (
    <LandingContainer
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.6 }}
    >
      <FloatingElements>
        {floatingIcons.map((item, index) => (
          <FloatingIcon
            key={index}
            $size={item.size}
            style={{ left: item.left, top: item.top }}
            animate={{
              y: [0, -20, 0],
              rotate: [0, 10, -10, 0],
            }}
            transition={{
              duration: 4,
              delay: item.delay,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            {item.icon}
          </FloatingIcon>
        ))}
      </FloatingElements>

      <GlassCard
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2, duration: 0.6 }}
      >
        <Title
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          Welcome to the Live Polling System
        </Title>
        
        <Subtitle
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          Please select the role that best describes you to begin using the live polling system.
        </Subtitle>

        <AnimatePresence mode="wait">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            <RoleContainer>
              {roles.map((role, index) => (
                <RoleCard
                  key={role.id}
                  $selected={selectedRole === role.id}
                  onClick={() => setSelectedRole(role.id)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + index * 0.1, duration: 0.5 }}
                >
                  <RoleIcon>{role.icon}</RoleIcon>
                  <RoleTitle>{role.title}</RoleTitle>
                  <RoleDescription>{role.description}</RoleDescription>
                </RoleCard>
              ))}
            </RoleContainer>

            {selectedRole && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <NameInput
                  type="text"
                  placeholder="Enter your Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.3 }}
                />
              </motion.div>
            )}

            {selectedRole === 'student' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <NameInput
                  type="text"
                  placeholder="Enter Room ID"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                  maxLength={6}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.3 }}
                />
              </motion.div>
            )}

            <ContinueButton
              onClick={handleContinue}
              disabled={
                !name.trim() || 
                !selectedRole || 
                (selectedRole === 'student' && !roomId.trim()) ||
                isLoading ||
                !isConnected
              }
              whileHover={!isLoading ? { scale: 1.02 } : {}}
              whileTap={!isLoading ? { scale: 0.98 } : {}}
            >
              {isLoading ? (
                'Connecting...'
              ) : (
                <>
                  Continue
                  <ArrowRight size={20} />
                </>
              )}
            </ContinueButton>
          </motion.div>
        </AnimatePresence>
      </GlassCard>
    </LandingContainer>
  );
};

export default LandingPage; 