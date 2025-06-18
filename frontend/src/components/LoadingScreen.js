import React from 'react';
import styled, { keyframes } from 'styled-components';
import { motion } from 'framer-motion';

const pulse = keyframes`
  0%, 100% { transform: scale(1); opacity: 0.7; }
  50% { transform: scale(1.1); opacity: 1; }
`;

const float = keyframes`
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-20px); }
`;

const gradient = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

const LoadingContainer = styled(motion.div)`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(-45deg, #667eea, #764ba2, #f093fb, #f5576c);
  background-size: 400% 400%;
  animation: ${gradient} 15s ease infinite;
  color: white;
  position: relative;
  overflow: hidden;
`;

const LoadingIcon = styled(motion.div)`
  width: 80px;
  height: 80px;
  border: 4px solid rgba(255, 255, 255, 0.2);
  border-top: 4px solid white;
  border-radius: 50%;
  animation: ${pulse} 2s ease-in-out infinite;
  margin-bottom: 30px;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: -4px;
    left: -4px;
    right: -4px;
    bottom: -4px;
    border: 2px solid rgba(255, 255, 255, 0.1);
    border-radius: 50%;
    animation: ${pulse} 2s ease-in-out infinite reverse;
  }
`;

const LoadingText = styled(motion.h1)`
  font-size: 2.5rem;
  font-weight: 800;
  margin-bottom: 15px;
  text-align: center;
  animation: ${float} 3s ease-in-out infinite;
  background: linear-gradient(45deg, #ffffff, #f0f0f0);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 0 30px rgba(255, 255, 255, 0.5);
`;

const LoadingSubtext = styled(motion.p)`
  font-size: 1.1rem;
  font-weight: 400;
  opacity: 0.8;
  text-align: center;
  max-width: 400px;
  line-height: 1.6;
`;

const FloatingParticles = styled.div`
  position: absolute;
  width: 100%;
  height: 100%;
  pointer-events: none;
`;

const Particle = styled.div`
  position: absolute;
  width: 10px;
  height: 10px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  animation: ${float} ${props => props.$duration}s ease-in-out infinite;
  animation-delay: ${props => props.$delay}s;
  left: ${props => props.$left}%;
  top: ${props => props.$top}%;
`;

const LoadingScreen = () => {
  // Generate random particles
  const particles = Array.from({ length: 15 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    top: Math.random() * 100,
    duration: 2 + Math.random() * 3,
    delay: Math.random() * 2,
  }));

  return (
    <LoadingContainer
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <FloatingParticles>
        {particles.map(particle => (
          <Particle
            key={particle.id}
            $left={particle.left}
            $top={particle.top}
            $duration={particle.duration}
            $delay={particle.delay}
          />
        ))}
      </FloatingParticles>
      
      <LoadingIcon
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
      />
      
      <LoadingText
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.8 }}
      >
        Live Polling System
      </LoadingText>
      
      <LoadingSubtext
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.8 }}
      >
        Real-time interactive polls and seamless collaboration
      </LoadingSubtext>
    </LoadingContainer>
  );
};

export default LoadingScreen; 