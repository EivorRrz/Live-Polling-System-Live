import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { useSocket } from '../context/SocketContext';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip } from 'recharts';

const DashboardContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #312e81 0%, #7c2d92 50%, #ec4899 100%);
  padding: 1rem;
  box-sizing: border-box;
`;

const ContainerWrapper = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
  box-sizing: border-box;
  
  @media (max-width: 768px) {
    padding: 0 0.5rem;
  }
`;

const Header = styled(motion.div)`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  padding: 2rem;
  margin-bottom: 2rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  width: 100%;
  box-sizing: border-box;
`;

const MainGrid = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 1.5rem;
  width: 100%;
  
  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
`;

const PollsCard = styled(motion.div)`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  border-radius: 1rem;
  padding: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  height: fit-content;
  width: 100%;
  box-sizing: border-box;
`;

const ChatCard = styled(motion.div)`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  border-radius: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  height: 600px;
  display: flex;
  flex-direction: column;
  width: 100%;
  box-sizing: border-box;
`;

const PollCard = styled(motion.div)`
  background: rgba(255, 255, 255, 0.1);
  border-radius: 0.75rem;
  padding: 1.25rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  margin-bottom: 1rem;
`;

const StudentDashboard = () => {
    const { 
        socket,
        user, 
        isConnected,
        messages, 
        activePolls, 
        roomInfo, 
        pollResults,
        submitAnswer, 
        sendMessage, 
        isKicked, 
        kickMessage 
    } = useSocket();

    const [messageInput, setMessageInput] = useState('');
    const [answeredPolls, setAnsweredPolls] = useState(new Set());
    const [submissionStatus, setSubmissionStatus] = useState({});
    const messagesEndRef = useRef(null);

    if (isKicked) {
        return (
            <div style={{
                minHeight: '100vh',
                background: 'linear-gradient(135deg, #7f1d1d 0%, #991b1b 50%, #7f1d1d 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '1rem'
            }}>
                <div style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '1rem',
                    padding: '2rem',
                    textAlign: 'center',
                    color: 'white'
                }}>
                    <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🚫</div>
                    <h2 style={{ color: 'white', marginBottom: '1rem' }}>Access Denied</h2>
                    <p style={{ color: 'rgba(254, 202, 202, 1)' }}>{kickMessage}</p>
                </div>
            </div>
        );
    }

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (messageInput.trim()) {
            sendMessage(messageInput.trim());
            setMessageInput('');
        }
    };

    const handleSubmitAnswer = async (pollId, option) => {
        if (answeredPolls.has(pollId)) return;

        setSubmissionStatus(prev => ({ ...prev, [pollId]: 'submitting' }));
        
        try {
            await submitAnswer(pollId, option);
            setAnsweredPolls(prev => new Set([...prev, pollId]));
            setSubmissionStatus(prev => ({ ...prev, [pollId]: 'success' }));
            
            setTimeout(() => {
                setSubmissionStatus(prev => {
                    const newStatus = { ...prev };
                    delete newStatus[pollId];
                    return newStatus;
                });
            }, 3000);
        } catch (error) {
            setSubmissionStatus(prev => ({ ...prev, [pollId]: 'error' }));
            setTimeout(() => {
                setSubmissionStatus(prev => {
                    const newStatus = { ...prev };
                    delete newStatus[pollId];
                    return newStatus;
                });
            }, 3000);
        }
    };

    const getRemainingTime = (endTime) => {
        const remaining = Math.max(0, Math.floor((new Date(endTime) - new Date()) / 1000));
        const totalMinutes = Math.floor(remaining / 60);
        const seconds = remaining % 60;
        return `${totalMinutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const logout = () => {
        sessionStorage.removeItem('pollUser');
        if (socket) socket.disconnect();
        window.location.reload();
    };

    return (
        <DashboardContainer>
            <ContainerWrapper>
                <Header initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <div>
                            <h1 style={{ color: 'white', margin: '0 0 0.5rem 0' }}>Student Dashboard</h1>
                            <p style={{ color: 'rgba(196, 181, 253, 1)', margin: 0 }}>Welcome back, {user?.name}! 👋</p>
                        </div>
                        <div style={{
                            padding: '0.5rem 1rem',
                            borderRadius: '8px',
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            background: isConnected ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                            color: isConnected ? '#22c55e' : '#ef4444',
                            border: `2px solid ${isConnected ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
                        }}>
                            {isConnected ? '🟢 Connected' : '🔴 Reconnecting...'}
                        </div>
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
                        <div>
                            <div style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', padding: '0.5rem 1rem', borderRadius: '8px', fontWeight: '600', marginBottom: '0.5rem' }}>
                                🏫 Room: {roomInfo?.roomId}
                            </div>
                            <p style={{ color: 'rgba(196, 181, 253, 1)', fontSize: '0.875rem', margin: 0 }}>
                                👨‍🏫 Teacher: {roomInfo?.teacherName}
                            </p>
                        </div>
                        <button
                            onClick={logout}
                            style={{
                                background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                                color: 'white',
                                padding: '0.75rem 1.25rem',
                                borderRadius: '12px',
                                border: 'none',
                                cursor: 'pointer',
                                fontWeight: '600'
                            }}
                        >
                            🚪 Logout
                        </button>
                    </div>
                </Header>

                <MainGrid>
                    <PollsCard initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                            <div style={{ background: 'linear-gradient(to right, #3b82f6, #8b5cf6)', padding: '0.5rem', borderRadius: '0.5rem' }}>
                                <span style={{ fontSize: '1.25rem' }}>📊</span>
                            </div>
                            <div>
                                <h2 style={{ color: 'white', margin: 0 }}>Active Polls</h2>
                                <p style={{ color: 'rgba(196, 181, 253, 1)', fontSize: '0.875rem', margin: 0 }}>{activePolls.length} polls available</p>
                            </div>
                        </div>

                        {activePolls.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '3rem 0' }}>
                                <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>⏳</div>
                                <p style={{ color: 'rgba(196, 181, 253, 1)', marginBottom: '0.5rem' }}>No active polls at the moment</p>
                                <p style={{ color: 'rgba(147, 125, 253, 1)', fontSize: '0.875rem', margin: 0 }}>Your teacher will create polls soon!</p>
                            </div>
                        ) : (
                            activePolls.map((poll, index) => {
                                const results = pollResults[poll._id];
                                const isPollClosed = !poll.isActive || (poll.endTime && new Date() > new Date(poll.endTime));
                                
                                return (
                                    <PollCard key={poll._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                            <h3 style={{ color: 'white', margin: 0 }}>{poll.question}</h3>
                                            {isPollClosed ? (
                                                <div style={{ background: 'rgba(34, 197, 94, 0.2)', color: '#22c55e', padding: '0.25rem 0.75rem', borderRadius: '12px', fontSize: '0.75rem' }}>
                                                    ✅ Closed
                                                </div>
                                            ) : (
                                                <div style={{ textAlign: 'right' }}>
                                                    <div style={{ background: 'rgba(249, 115, 22, 0.3)', color: 'rgba(253, 186, 116, 1)', padding: '0.5rem 1rem', borderRadius: '12px', fontWeight: '600' }}>
                                                        {getRemainingTime(poll.endTime)}
                                                    </div>
                                                    <p style={{ color: 'rgba(253, 186, 116, 0.8)', fontSize: '0.75rem', margin: '0.25rem 0 0 0' }}>remaining</p>
                                                </div>
                                            )}
                                        </div>

                                        {(isPollClosed || answeredPolls.has(poll._id)) && results && results.results ? (
                                            <div style={{ marginTop: '1rem' }}>
                                                <h4 style={{ color: 'rgba(196, 181, 253, 1)', textAlign: 'center', marginBottom: '1rem' }}>
                                                    {isPollClosed ? 'Final Results' : 'Live Results'} ({results.results.totalAnswers} votes)
                                                </h4>
                                                
                                                <div style={{ background: 'rgba(255, 255, 255, 0.05)', borderRadius: '12px', padding: '1rem' }}>
                                                    <div style={{ height: '300px' }}>
                                                        <ResponsiveContainer width="100%" height="100%">
                                                            <BarChart data={results.results.optionCounts.map((item, idx) => ({
                                                                name: `Option ${idx + 1}`,
                                                                option: item.option,
                                                                votes: item.count,
                                                                percentage: item.percentage
                                                            }))}>
                                                                <XAxis dataKey="name" tick={{ fill: 'white', fontSize: 10 }} />
                                                                <YAxis tick={{ fill: 'white', fontSize: 10 }} />
                                                                <Tooltip contentStyle={{ backgroundColor: 'rgba(0, 0, 0, 0.9)', border: '1px solid rgba(255, 255, 255, 0.2)', borderRadius: '8px', color: 'white' }} />
                                                                <Bar dataKey="votes" radius={[4, 4, 0, 0]}>
                                                                    {results.results.optionCounts.map((entry, idx) => (
                                                                        <Cell key={`cell-${idx}`} fill={`hsl(${(idx * 60) % 360}, 70%, 60%)`} />
                                                                    ))}
                                                                </Bar>
                                                            </BarChart>
                                                        </ResponsiveContainer>
                                                    </div>
                                                    <div style={{ fontSize: '0.8rem', opacity: 0.8, textAlign: 'center', marginTop: '1rem' }}>
                                                        Total Responses: {results.results.totalAnswers}
                                                    </div>
                                                </div>
                                            </div>
                                        ) : answeredPolls.has(poll._id) ? (
                                            <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                                                <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✅</div>
                                                <p style={{ color: 'rgba(34, 197, 94, 1)', fontWeight: '600', marginBottom: '0.5rem' }}>Answer Submitted!</p>
                                                <p style={{ color: 'rgba(147, 125, 253, 1)', margin: 0 }}>Results are loading...</p>
                                            </div>
                                        ) : !isPollClosed ? (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                                {poll.options.map((option, optionIndex) => (
                                                    <button
                                                        key={optionIndex}
                                                        onClick={() => handleSubmitAnswer(poll._id, optionIndex)}
                                                        disabled={submissionStatus[poll._id] === 'submitting'}
                                                        style={{
                                                            background: 'rgba(255, 255, 255, 0.1)',
                                                            border: '1px solid rgba(255, 255, 255, 0.2)',
                                                            borderRadius: '0.75rem',
                                                            padding: '1rem',
                                                            color: 'white',
                                                            cursor: 'pointer',
                                                            display: 'flex',
                                                            justifyContent: 'space-between',
                                                            alignItems: 'center'
                                                        }}
                                                    >
                                                        <span>{option}</span>
                                                        <span>{submissionStatus[poll._id] === 'submitting' ? '⏳' : '→'}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        ) : (
                                            <div style={{ textAlign: 'center', padding: '2rem 0', color: 'rgba(147, 125, 253, 1)' }}>
                                                Poll closed - Results loading...
                                            </div>
                                        )}

                                        {submissionStatus[poll._id] === 'success' && (
                                            <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(34, 197, 94, 0.2)', color: 'rgba(34, 197, 94, 1)', borderRadius: '0.5rem', textAlign: 'center' }}>
                                                ✨ Answer submitted successfully!
                                            </div>
                                        )}

                                        {submissionStatus[poll._id] === 'error' && (
                                            <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(239, 68, 68, 0.2)', color: 'rgba(239, 68, 68, 1)', borderRadius: '0.5rem', textAlign: 'center' }}>
                                                ❌ Failed to submit answer. Please try again.
                                            </div>
                                        )}
                                    </PollCard>
                                );
                            })
                        )}
                    </PollsCard>

                    <ChatCard initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                        <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255, 255, 255, 0.2)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div style={{ background: 'linear-gradient(to right, #10b981, #14b8a6)', padding: '0.5rem', borderRadius: '0.5rem' }}>
                                    <span style={{ fontSize: '1.25rem' }}>💬</span>
                                </div>
                                <div>
                                    <h2 style={{ color: 'white', margin: 0 }}>Class Chat</h2>
                                    <p style={{ color: 'rgba(196, 181, 253, 1)', fontSize: '0.875rem', margin: 0 }}>{messages.length} messages</p>
                                </div>
                            </div>
                        </div>

                        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {messages.map((message, index) => (
                                <div
                                    key={index}
                                    style={{
                                        display: 'flex',
                                        justifyContent: message.sender === user?._id ? 'flex-end' : 'flex-start'
                                    }}
                                >
                                    <div
                                        style={{
                                            maxWidth: '80%',
                                            background: message.sender === user?._id 
                                                ? 'linear-gradient(to right, #3b82f6, #8b5cf6)'
                                                : 'rgba(255, 255, 255, 0.2)',
                                            color: 'white',
                                            padding: '0.75rem',
                                            borderRadius: '1rem'
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                            <span style={{
                                                padding: '0.125rem 0.5rem',
                                                borderRadius: '9999px',
                                                fontSize: '0.75rem',
                                                fontWeight: '500',
                                                background: message.senderRole === 'teacher' 
                                                    ? 'linear-gradient(to right, #f59e0b, #d97706)'
                                                    : 'linear-gradient(to right, #10b981, #059669)',
                                                color: 'white'
                                            }}>
                                                {message.senderRole || 'student'}
                                            </span>
                                            <span style={{ fontSize: '0.75rem', opacity: 0.75 }}>
                                                {new Date(message.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                                            </span>
                                        </div>
                                        <p style={{ fontWeight: '500', fontSize: '0.875rem', margin: 0 }}>{message.senderName}</p>
                                        <p style={{ margin: '0.25rem 0 0 0' }}>{message.text}</p>
                                    </div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>

                        <form onSubmit={handleSendMessage} style={{ padding: '1rem', borderTop: '1px solid rgba(255, 255, 255, 0.2)' }}>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <input
                                    type="text"
                                    value={messageInput}
                                    onChange={(e) => setMessageInput(e.target.value)}
                                    placeholder="Type your message..."
                                    style={{
                                        flex: 1,
                                        background: 'rgba(255, 255, 255, 0.1)',
                                        border: '1px solid rgba(255, 255, 255, 0.2)',
                                        borderRadius: '0.5rem',
                                        padding: '0.5rem 1rem',
                                        color: 'white'
                                    }}
                                />
                                <button
                                    type="submit"
                                    style={{
                                        background: 'linear-gradient(to right, #8b5cf6, #ec4899)',
                                        color: 'white',
                                        padding: '0.5rem 1rem',
                                        borderRadius: '0.5rem',
                                        border: 'none',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Send
                                </button>
                            </div>
                        </form>
                    </ChatCard>
                </MainGrid>
            </ContainerWrapper>
        </DashboardContainer>
    );
};

export default StudentDashboard; 