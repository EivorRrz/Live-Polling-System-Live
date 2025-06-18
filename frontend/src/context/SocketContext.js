import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import toast from 'react-hot-toast';

const SocketContext = createContext();

export const useSocket = () => {
    const context = useContext(SocketContext);
    if (!context) {
        throw new Error('useSocket must be used within a SocketProvider');
    }
    return context;
};

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [user, setUser] = useState(null);
    const [messages, setMessages] = useState([]);
    const [activePolls, setActivePolls] = useState([]);
    const [allPolls, setAllPolls] = useState([]);
    const [students, setStudents] = useState([]);
    const [roomInfo, setRoomInfo] = useState(null);
    const [roomStats, setRoomStats] = useState({ totalPolls: 0, activePolls: 0, maxPolls: 15, remainingPolls: 15 });
    const [pollResults, setPollResults] = useState({});
    const [isKicked, setIsKicked] = useState(false);
    const [kickMessage, setKickMessage] = useState('');

    useEffect(() => {
        const newSocket = io('http://localhost:5000', {
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 5,
            timeout: 20000,
            forceNew: true
        });
        setSocket(newSocket);

        newSocket.on('connect', () => {
            setIsConnected(true);
            
            // Rejoin room if user data exists in session
            const savedUser = sessionStorage.getItem('pollUser');
            if (savedUser) {
                const userData = JSON.parse(savedUser);
                console.log('Reconnecting user:', userData);
                newSocket.emit('join', {
                    name: userData.name,
                    role: userData.role,
                    roomId: userData.roomId
                });
            }
        });

        newSocket.on('disconnect', () => {
            setIsConnected(false);
        });

        newSocket.on('reconnect', () => {
            console.log('Socket reconnected');
            setIsConnected(true);
        });

        newSocket.on('reconnect_error', (error) => {
            console.error('Reconnection failed:', error);
        });

        // User events
        newSocket.on('userJoined', (userData) => {
            console.log('User joined successfully:', userData);
            setUser(userData);
            
            // Save user data to session storage for reconnection
            sessionStorage.setItem('pollUser', JSON.stringify(userData));
        });

        newSocket.on('joinError', (error) => {
            console.error('Join error received:', error);
            toast.error(error);
            setIsKicked(false); // Reset any kicked state
            setUser(null); // Clear user data on join error
        });

        // Room events
        newSocket.on('roomInfo', (info) => {
            setRoomInfo(info);
            setRoomStats(info);
        });

        newSocket.on('roomStats', (stats) => {
            setRoomStats(stats);
        });

        // Student management
        newSocket.on('studentsList', (studentsList) => {
            setStudents(studentsList);
        });

        newSocket.on('studentJoined', (student) => {
            // Could show notification to teacher
        });

        newSocket.on('studentDisconnected', (student) => {
            // Could show notification to teacher
        });

        // Poll events
        newSocket.on('activePolls', (polls) => {
            setActivePolls(polls);
        });

        newSocket.on('newPoll', (poll) => {
            setActivePolls(prev => [...prev, poll]);
            toast.success('New poll created! 📊');
        });

        newSocket.on('pollClosed', (pollId) => {
            setActivePolls(prev => prev.map(poll => 
                poll._id === pollId ? { ...poll, isActive: false } : poll
            ));
            toast.success('Poll closed 📊');
        });

        newSocket.on('allPolls', (polls) => {
            setAllPolls(polls);
        });

        newSocket.on('pollResults', (results) => {
            setPollResults(prev => ({
                ...prev,
                [results._id]: results
            }));
        });

        newSocket.on('answerSubmitted', (response) => {
            toast.success('Answer submitted successfully! ✅');
        });

        newSocket.on('answerError', (error) => {
            toast.error(error);
        });

        newSocket.on('pollError', (error) => {
            toast.error(error);
        });

        // Chat events
        newSocket.on('chatHistory', (messageHistory) => {
            setMessages(messageHistory);
        });

        newSocket.on('newMessage', (message) => {
            setMessages(prev => [...prev, message]);
        });

        newSocket.on('messagesCleared', () => {
            setMessages([]);
            toast.success('Chat cleared');
        });

        // Kick events
        newSocket.on('kicked', (data) => {
            setIsKicked(true);
            setKickMessage(data.message);
            toast.error('You have been kicked from the room');
        });

        // Error events
        newSocket.on('error', (error) => {
            toast.error(error);
        });

        return () => {
            newSocket.close();
        };
    }, []);

    // Socket methods
    const joinRoom = (name, role, roomId = null) => {
        if (socket) {
            console.log('Emitting join event:', { name, role, roomId });
            socket.emit('join', { name, role, roomId });
        } else {
            console.error('Socket not connected when trying to join');
        }
    };

    const createPoll = (pollData) => {
        if (socket && isConnected && user?.role === 'teacher') {
            console.log('Creating poll:', pollData);
            socket.emit('createPoll', pollData);
        } else {
            console.error('Cannot create poll:', { 
                hasSocket: !!socket, 
                isConnected, 
                userRole: user?.role 
            });
            if (!isConnected) {
                toast.error('Connection lost. Please wait for reconnection...');
            } else if (user?.role !== 'teacher') {
                toast.error('Only teachers can create polls');
            }
        }
    };

    const submitAnswer = (pollId, option) => {
        if (socket && user?.role === 'student') {
            socket.emit('submitAnswer', { pollId, option });
        }
    };

    const getPollResults = (pollId) => {
        if (socket && user?.role === 'teacher') {
            socket.emit('getPollResults', pollId);
        }
    };

    const closePoll = (pollId) => {
        if (socket && user?.role === 'teacher') {
            socket.emit('closePoll', pollId);
        }
    };

    const getAllPolls = () => {
        if (socket && user?.role === 'teacher') {
            socket.emit('getAllPolls');
        }
    };

    const sendMessage = (text) => {
        if (socket && user) {
            socket.emit('sendMessage', { text });
        }
    };

    const clearMessages = () => {
        if (socket && user?.role === 'teacher') {
            socket.emit('clearMessages');
        }
    };

    const kickStudent = (studentId) => {
        if (socket && user?.role === 'teacher') {
            socket.emit('kickStudent', studentId);
        }
    };

    const value = {
        socket,
        isConnected,
        user,
        messages,
        activePolls,
        allPolls,
        students,
        roomInfo,
        roomStats,
        pollResults,
        isKicked,
        kickMessage,
        // Methods
        joinRoom,
        createPoll,
        submitAnswer,
        getPollResults,
        closePoll,
        getAllPolls,
        sendMessage,
        clearMessages,
        kickStudent
    };

    return (
        <SocketContext.Provider value={value}>
            {children}
        </SocketContext.Provider>
    );
};

export default SocketContext; 