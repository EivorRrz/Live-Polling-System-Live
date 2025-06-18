import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Users, 
  MessageCircle, 
  BarChart3, 
  Clock, 
  LogOut, 
  Settings,
  UserX,
  Send,
  History,
  X,
  Copy
} from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from 'recharts';
import Confetti from 'react-confetti';
import toast from 'react-hot-toast';

const DashboardContainer = styled(motion.div)`
  min-height: 100vh;
  padding: 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  position: relative;
`;

const Header = styled(motion.header)`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  padding: 1.5rem 2rem;
`;

const WelcomeSection = styled.div`
  flex: 1;
`;

const WelcomeText = styled.h1`
  color: white;
  font-size: 2rem;
  font-weight: 700;
  margin: 0;
`;

const SubText = styled.p`
  color: rgba(255, 255, 255, 0.8);
  margin: 0.5rem 0 0 0;
  font-size: 1rem;
`;

const RoomIdDisplay = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.9rem;
  cursor: pointer;
  
  &:hover {
    color: white;
  }
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;
`;

const StatsCard = styled.div`
  display: flex;
  gap: 1rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 1rem;
`;

const StatsItem = styled.div`
  text-align: center;
  
  span {
    display: block;
    font-size: 1.5rem;
    font-weight: bold;
    color: white;
  }
  
  small {
    color: rgba(255, 255, 255, 0.7);
    font-size: 0.8rem;
  }
`;

const IconButton = styled(motion.button)`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 0.75rem;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: translateY(-2px);
  }
`;

const MainContent = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 2rem;
  margin-bottom: 2rem;
  
  @media (max-width: 1200px) {
    grid-template-columns: 1fr;
  }
`;

const Card = styled(motion.div)`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  padding: 2rem;
  color: white;
`;

const CardTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const CreatePollForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const Input = styled.input`
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 1rem;
  color: white;
  font-size: 1rem;
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.6);
  }
  
  &:focus {
    outline: none;
    border-color: #4f46e5;
    background: rgba(255, 255, 255, 0.15);
  }
`;

const OptionsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const OptionInput = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const AddOptionButton = styled(motion.button)`
  background: rgba(79, 70, 229, 0.3);
  border: 2px dashed rgba(79, 70, 229, 0.5);
  border-radius: 12px;
  padding: 1rem;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-weight: 500;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(79, 70, 229, 0.4);
    border-color: rgba(79, 70, 229, 0.7);
  }
`;

const TimeSelector = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const Select = styled.select`
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 0.75rem 1rem;
  color: white;
  font-size: 1rem;
  
  option {
    background: #1f2937;
    color: white;
  }
  
  &:focus {
    outline: none;
    border-color: #4f46e5;
  }
`;

const CreateButton = styled(motion.button)`
  background: linear-gradient(135deg, #4f46e5 0%, #7c4dff 100%);
  border: none;
  border-radius: 12px;
  padding: 1rem 2rem;
  color: white;
  cursor: pointer;
  font-size: 1.1rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
  
  &:hover {
    background: linear-gradient(135deg, #4338ca 0%, #6d28d9 100%);
    transform: translateY(-2px);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const PollDisplay = styled.div`
  text-align: center;
  min-height: 200px;
`;

const PollQuestion = styled.h3`
  font-size: 1.3rem;
  font-weight: 600;
  margin-bottom: 1rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  line-height: 1.4;
`;

const StudentsPanel = styled.div`
  max-height: 400px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const StudentItem = styled(motion.div)`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.15);
    transform: translateY(-2px);
  }
`;

const StudentInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const StudentAvatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #4f46e5 0%, #7c4dff 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 1.2rem;
`;

const StudentName = styled.span`
  font-weight: 500;
`;

const StudentStatus = styled.span`
  font-size: 0.8rem;
  opacity: 0.7;
`;

const KickButton = styled(motion.button)`
  background: rgba(239, 68, 68, 0.2);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 8px;
  padding: 0.5rem;
  color: #ef4444;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    background: rgba(239, 68, 68, 0.3);
  }
`;

// Chat Styles
const ChatContainer = styled.div`
  height: 500px;
  display: flex;
  flex-direction: column;
`;

const MessagesContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 1rem 0;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  
  /* Custom Scrollbar */
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.3);
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.5);
  }
`;

const Message = styled(motion.div)`
  display: flex;
  flex-direction: column;
  align-self: ${props => props.$isOwn ? 'flex-end' : 'flex-start'};
  max-width: 80%;
  background: ${props => props.$isOwn 
    ? 'linear-gradient(135deg, #4f46e5 0%, #7c4dff 100%)'
    : 'rgba(255, 255, 255, 0.15)'
  };
  border: 1px solid ${props => props.$isOwn 
    ? 'rgba(79, 70, 229, 0.3)'
    : 'rgba(255, 255, 255, 0.2)'
  };
  border-radius: 16px;
  padding: 1rem;
  position: relative;
  backdrop-filter: blur(10px);
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
`;

const MessageHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.5rem;
  gap: 1rem;
`;

const MessageSender = styled.span`
  font-weight: 600;
  font-size: 0.85rem;
  color: ${props => props.$isOwn ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.8)'};
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const UserRole = styled.span`
  font-size: 0.7rem;
  padding: 0.2rem 0.5rem;
  border-radius: 8px;
  font-weight: 500;
  background: ${props => props.$role === 'teacher' 
    ? 'linear-gradient(45deg, #f59e0b, #d97706)'
    : 'linear-gradient(45deg, #10b981, #059669)'
  };
  color: white;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const MessageTime = styled.span`
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.6);
  display: flex;
  align-items: center;
  gap: 0.3rem;
  white-space: nowrap;
`;

const MessageStatus = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${props => {
    switch(props.$status) {
      case 'delivered': return '#10b981';
      case 'read': return '#3b82f6';
      default: return '#6b7280';
    }
  }};
`;

const MessageText = styled.p`
  margin: 0;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.95);
  word-wrap: break-word;
`;

const MessageActions = styled.div`
  display: flex;
  gap: 0.25rem;
  margin-top: 0.5rem;
  opacity: 0;
  transition: opacity 0.2s ease;
  
  ${Message}:hover & {
    opacity: 1;
  }
`;

const ReactionButton = styled.button`
  background: none;
  border: none;
  font-size: 0.8rem;
  cursor: pointer;
  padding: 0.2rem;
  border-radius: 4px;
  transition: background 0.2s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
`;

const ChatInput = styled.div`
  display: flex;
  gap: 0.75rem;
  margin-top: 1rem;
`;

const ChatInputField = styled.input`
  flex: 1;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 0.75rem 1rem;
  color: white;
  font-size: 0.9rem;
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }
  
  &:focus {
    outline: none;
    border-color: #4f46e5;
    box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
  }
`;

const SendButton = styled(motion.button)`
  background: linear-gradient(135deg, #4f46e5 0%, #7c4dff 100%);
  border: none;
  border-radius: 12px;
  padding: 0.75rem;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 44px;
  
  &:hover {
    background: linear-gradient(135deg, #4338ca 0%, #6d28d9 100%);
  }
`;

const Modal = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
`;

const ModalContent = styled(motion.div)`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 20px;
  padding: 2rem;
  max-width: 80vw;
  max-height: 80vh;
  overflow-y: auto;
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.2);
`;

const TeacherDashboard = () => {
  const { 
    socket,
    isConnected,
    user: socketUser,
    activePolls,
    allPolls,
    students,
    messages,
    roomInfo,
    roomStats,
    pollResults,
    createPoll, 
    closePoll, 
    kickStudent, 
    sendMessage, 
    clearMessages,
    getAllPolls,
    getPollResults
  } = useSocket();

  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [timeLimit, setTimeLimit] = useState(60);
  const [chatMessage, setChatMessage] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  
  // Add ref for auto-scroll
  const messagesEndRef = React.useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    // Initial data loading handled by socket connection
    getAllPolls();
  }, [getAllPolls]);

  // Auto-scroll when messages change - Remove auto-scroll, users should control manually
  // useEffect(() => {
  //   scrollToBottom();
  // }, [messages]);

  // Show confetti when polls are created
  useEffect(() => {
    if (activePolls.length > 0) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    }
  }, [activePolls.length]);

  const handleAddOption = () => {
    setOptions([...options, '']);
  };

  const handleRemoveOption = (index) => {
    if (options.length > 2) {
      const newOptions = options.filter((_, i) => i !== index);
      setOptions(newOptions);
    }
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleCreatePoll = (e) => {
    e.preventDefault();
    if (!question.trim() || options.some(opt => !opt.trim())) return;

    createPoll({
      question: question.trim(),
      options: options.filter(opt => opt.trim()),
      duration: timeLimit,
    });

    // Reset form
    setQuestion('');
    setOptions(['', '']);
    setTimeLimit(60);
  };

  const handleClosePoll = (pollId) => {
    closePoll(pollId);
    getPollResults(pollId);
  };

  const handleKickStudent = (studentId) => {
    kickStudent(studentId);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;

    sendMessage(chatMessage.trim());
    setChatMessage('');
  };

  const copyRoomId = () => {
    if (roomInfo?.roomId) {
      navigator.clipboard.writeText(roomInfo.roomId);
      toast.success('Room ID copied to clipboard! 📋');
    }
  };

  const logout = () => {
    // Clear user data from session storage
    sessionStorage.removeItem('pollUser');
    // Disconnect socket and reload to reset app state
    if (socket) {
      socket.disconnect();
    }
    window.location.reload();
  };

  return (
    <DashboardContainer
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      {showConfetti && <Confetti />}
      
      <Header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.6 }}
      >
        <WelcomeSection>
          <WelcomeText>Teacher Dashboard</WelcomeText>
          <SubText>Manage your classroom polls and engage with students</SubText>
          {roomInfo && (
            <RoomIdDisplay onClick={copyRoomId}>
              <span>Room ID: <strong>{roomInfo.roomId}</strong></span>
              <Copy size={16} style={{ marginLeft: '0.5rem', cursor: 'pointer' }} />
            </RoomIdDisplay>
          )}
        </WelcomeSection>
        
        <HeaderActions>
          {/* Connection Status */}
          <div style={{
            padding: '0.5rem 1rem',
            borderRadius: '8px',
            fontSize: '0.85rem',
            fontWeight: '500',
            background: isConnected ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
            color: isConnected ? '#22c55e' : '#ef4444',
            border: `1px solid ${isConnected ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
          }}>
            {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
          </div>
          
          {roomStats && (
            <StatsCard>
              <StatsItem>
                <span>{roomStats.totalPolls}</span>
                <small>Total Polls</small>
              </StatsItem>
              <StatsItem>
                <span>{roomStats.activePolls}</span>
                <small>Active</small>
              </StatsItem>
              <StatsItem>
                <span>{roomStats.remainingPolls}</span>
                <small>Remaining</small>
              </StatsItem>
            </StatsCard>
          )}
          
          <IconButton onClick={() => setShowHistory(true)}>
            <History size={20} />
            History
          </IconButton>
          
          <IconButton onClick={logout}>
            <LogOut size={20} />
            Logout
          </IconButton>
        </HeaderActions>
      </Header>

      <MainContent>
        <Card
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <CardTitle>
            <Plus size={24} />
            Create New Poll
            {activePolls.length > 0 && (
              <span style={{ fontSize: '0.8rem', opacity: 0.8, marginLeft: '1rem' }}>
                {activePolls.length} active poll{activePolls.length > 1 ? 's' : ''}
              </span>
            )}
            {roomStats && roomStats.remainingPolls <= 0 && (
              <span style={{ color: '#ef4444', fontSize: '0.8rem', marginLeft: '1rem' }}>
                Poll limit reached ({roomStats.maxPolls} max)
              </span>
            )}
          </CardTitle>
          
          <CreatePollForm onSubmit={handleCreatePoll}>
            <Input
              type="text"
              placeholder="Enter your question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              required
            />
            
            <OptionsContainer>
              {options.map((option, index) => (
                <OptionInput key={index}>
                  <Input
                    type="text"
                    placeholder={`Option ${index + 1}`}
                    value={option}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    required
                  />
                  {options.length > 2 && (
                    <motion.button
                      type="button"
                      onClick={() => handleRemoveOption(index)}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      style={{
                        background: 'rgba(239, 68, 68, 0.2)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        borderRadius: '8px',
                        padding: '0.5rem',
                        color: '#ef4444',
                        cursor: 'pointer'
                      }}
                    >
                      <X size={16} />
                    </motion.button>
                  )}
                </OptionInput>
              ))}
              
              {options.length < 6 && (
                <AddOptionButton
                  type="button"
                  onClick={handleAddOption}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Plus size={16} />
                  Add Option
                </AddOptionButton>
              )}
            </OptionsContainer>
            
            <TimeSelector>
              <label style={{ color: 'rgba(255, 255, 255, 0.8)' }}>Duration:</label>
              <Select
                value={timeLimit}
                onChange={(e) => setTimeLimit(Number(e.target.value))}
              >
                <option value={30}>30 seconds</option>
                <option value={60}>1 minute</option>
                <option value={120}>2 minutes</option>
                <option value={300}>5 minutes</option>
                <option value={600}>10 minutes</option>
              </Select>
            </TimeSelector>
            
            <CreateButton
              type="submit"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={!question.trim() || options.some(opt => !opt.trim()) || (roomStats && roomStats.remainingPolls <= 0) || !isConnected}
            >
              <Plus size={20} />
              {!isConnected ? 'Reconnecting...' : 
               roomStats && roomStats.remainingPolls <= 0 ? 'Poll Limit Reached' : 
               'Create Poll'}
            </CreateButton>
          </CreatePollForm>
        </Card>

        <Card
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          <CardTitle>
            <BarChart3 size={24} />
            Active Polls & Results
          </CardTitle>
          
          {activePolls.length > 0 ? (
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {activePolls.map((poll, index) => (
                <PollDisplay key={poll._id} style={{ marginBottom: '1rem', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '12px', padding: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <PollQuestion style={{ margin: 0, fontSize: '1.1rem', textAlign: 'left' }}>{poll.question}</PollQuestion>
                    <motion.button
                      onClick={() => handleClosePoll(poll._id)}
                      style={{
                        background: 'rgba(239, 68, 68, 0.2)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        borderRadius: '8px',
                        padding: '0.5rem 1rem',
                        color: '#ef4444',
                        cursor: 'pointer',
                        fontSize: '0.8rem'
                      }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Close Poll
                    </motion.button>
                  </div>
                  
                  {pollResults[poll._id] && pollResults[poll._id].results?.totalAnswers > 0 ? (
                    <div style={{ height: '250px', marginBottom: '1rem' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={pollResults[poll._id].results.optionCounts.map((item, idx) => ({
                          name: `Option ${idx + 1}`,
                          option: item.option,
                          votes: item.count,
                          percentage: item.percentage,
                          fill: `hsl(${(idx * 60) % 360}, 70%, 60%)`
                        }))}>
                          <XAxis 
                            dataKey="name" 
                            tick={{ fill: 'white', fontSize: 10 }}
                            axisLine={{ stroke: 'rgba(255,255,255,0.3)' }}
                          />
                          <YAxis 
                            tick={{ fill: 'white', fontSize: 10 }}
                            axisLine={{ stroke: 'rgba(255,255,255,0.3)' }}
                          />
                          <Bar dataKey="votes" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                      
                      <div style={{ fontSize: '0.8rem', opacity: 0.8, textAlign: 'center' }}>
                        Total Responses: {pollResults[poll._id].results.totalAnswers} | 
                        Students who answered: {pollResults[poll._id].results.optionCounts.flatMap(opt => opt.users).map(u => u.userName).join(', ') || 'None yet'}
                      </div>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '1rem', opacity: 0.6, fontSize: '0.9rem' }}>
                      <BarChart3 size={32} style={{ margin: '0 auto 0.5rem' }} />
                      <p>Waiting for responses...</p>
                    </div>
                  )}
                </PollDisplay>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '3rem', opacity: 0.6 }}>
              <BarChart3 size={64} style={{ margin: '0 auto 1rem' }} />
              <h3>No Active Polls</h3>
              <p>Create a poll to start collecting responses from students</p>
              <p style={{ fontSize: '0.9rem' }}>Students can join with Room ID: <strong>{roomInfo?.roomId}</strong></p>
            </div>
          )}
        </Card>
      </MainContent>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        <Card
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
        >
          <CardTitle>
            <Users size={24} />
            Participants ({students.length})
          </CardTitle>
          
          <StudentsPanel>
            {students.map((student) => (
              <StudentItem
                key={student._id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                whileHover={{ scale: 1.02 }}
              >
                <StudentInfo>
                  <StudentAvatar>
                    {student.name.charAt(0).toUpperCase()}
                  </StudentAvatar>
                  <div>
                    <StudentName>{student.name}</StudentName>
                    <br />
                    <StudentStatus>
                      Online
                    </StudentStatus>
                  </div>
                </StudentInfo>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', opacity: 0.8 }}>
                    Action
                  </span>
                  <KickButton
                    onClick={() => handleKickStudent(student._id)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <UserX size={16} />
                  </KickButton>
                </div>
              </StudentItem>
            ))}
            
            {students.length === 0 && (
              <div style={{ textAlign: 'center', opacity: 0.6, padding: '2rem 0' }}>
                <Users size={48} style={{ margin: '0 auto 1rem' }} />
                <p>No students connected yet</p>
              </div>
            )}
          </StudentsPanel>
        </Card>

        <Card
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
        >
          <CardTitle>
            <MessageCircle size={24} />
            Chat
          </CardTitle>
          
          <ChatContainer>
            <MessagesContainer>
              {messages.map((message, index) => {
                const isOwn = message.sender === socketUser?._id;
                return (
                  <Message
                    key={`teacher-message-${index}`}
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ 
                      delay: index * 0.05,
                      type: "spring",
                      stiffness: 300,
                      damping: 30
                    }}
                    $isOwn={isOwn}
                  >
                    <MessageHeader>
                      <MessageSender $isOwn={isOwn}>
                        {message.senderName}
                        <UserRole $role={message.senderRole || 'student'}>
                          {message.senderRole || 'student'}
                        </UserRole>
                      </MessageSender>
                      <MessageTime>
                        {new Date(message.timestamp || message.createdAt).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit',
                          hour12: true 
                        })}
                        <MessageStatus $status="delivered" />
                      </MessageTime>
                    </MessageHeader>
                    <MessageText>{message.text}</MessageText>
                    
                    <MessageActions>
                      <ReactionButton>👍</ReactionButton>
                      <ReactionButton>❤️</ReactionButton>
                      <ReactionButton>😂</ReactionButton>
                    </MessageActions>
                  </Message>
                );
              })}
              
              {messages.length === 0 && (
                <div style={{ textAlign: 'center', opacity: 0.6, padding: '2rem 0' }}>
                  <MessageCircle size={48} style={{ margin: '0 auto 1rem' }} />
                  <p>No messages yet. Start the conversation!</p>
                </div>
              )}
              
              {/* Auto-scroll anchor */}
              <div ref={messagesEndRef} />
            </MessagesContainer>
            
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <motion.button
                onClick={clearMessages}
                style={{
                  background: 'rgba(239, 68, 68, 0.2)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '8px',
                  padding: '0.5rem 1rem',
                  color: '#ef4444',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: '500'
                }}
                whileHover={{ scale: 1.05, background: 'rgba(239, 68, 68, 0.3)' }}
                whileTap={{ scale: 0.95 }}
              >
                Clear Chat
              </motion.button>
            </div>
            
            <form onSubmit={handleSendMessage}>
              <ChatInput>
                <ChatInputField
                  type="text"
                  placeholder="Type a message..."
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                />
                <SendButton
                  type="submit"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Send size={16} />
                </SendButton>
              </ChatInput>
            </form>
          </ChatContainer>
        </Card>
      </div>

      <AnimatePresence>
        {showHistory && (
          <Modal
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowHistory(false)}
          >
            <ModalContent
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2>View Poll History</h2>
                <IconButton onClick={() => setShowHistory(false)}>
                  <X size={20} />
                </IconButton>
              </div>
              
              {allPolls.map((poll, index) => (
                <Card key={`poll-history-${poll._id}`} style={{ marginBottom: '1rem', padding: '1.5rem' }}>
                  <h4 style={{ marginBottom: '1rem' }}>Question {index + 1}</h4>
                  <PollQuestion style={{ fontSize: '1rem', padding: '0.75rem' }}>
                    {poll.question}
                  </PollQuestion>
                  <div style={{ marginTop: '1rem' }}>
                    <h5 style={{ marginBottom: '1rem', opacity: 0.8 }}>Results:</h5>
                    {poll.results && poll.results.optionCounts && poll.results.optionCounts.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {poll.results.optionCounts.map((result, resultIndex) => (
                          <div 
                            key={`${poll._id}-result-${resultIndex}`}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              padding: '0.75rem',
                              background: 'rgba(255, 255, 255, 0.1)',
                              borderRadius: '8px'
                            }}
                          >
                            <span>{result.option}</span>
                            <span>{result.count} votes ({result.percentage}%)</span>
                          </div>
                        ))}
                        <div 
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '0.75rem',
                            background: 'rgba(79, 70, 229, 0.2)',
                            borderRadius: '8px',
                            fontWeight: 'bold'
                          }}
                        >
                          <span>Total Responses</span>
                          <span>{poll.results.totalAnswers || 0}</span>
                        </div>
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', opacity: 0.6, padding: '1rem' }}>
                        <p>No responses yet</p>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
              
              {allPolls.length === 0 && (
                <div style={{ textAlign: 'center', opacity: 0.6, padding: '2rem 0' }}>
                  <History size={48} style={{ margin: '0 auto 1rem' }} />
                  <p>No poll history available</p>
                </div>
              )}
            </ModalContent>
          </Modal>
        )}
      </AnimatePresence>
    </DashboardContainer>
  );
};

export default TeacherDashboard;