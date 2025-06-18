import { Server } from "socket.io";
import * as userController from "../controller/userController.js";
import * as pollController from "../controller/pollController.js";
import * as chatController from "../controller/chatController.js";

export default function setupSocket(server) {
    const io = new Server(server, {
        cors: {
            origin: [
                "http://localhost:3000", 
                "https://frontend-2zru.onrender.com", 
                "https://darling-taffy-a224d1.netlify.app",
                "https://live-polling-system-live-task.netlify.app",
                "https://*.netlify.app", 
                "https://*.vercel.app"
            ],
            methods: ["GET", "POST"]
        }
    });

    io.on('connection', (socket) => {
        console.log(`User connected: ${socket.id}`);

        // User joins room
        socket.on('join', async (data) => {
            try {
                const { name, role, roomId } = data;

                // Clean up expired bans before joining
                if (roomId) {
                    await userController.cleanupExpiredBans(roomId);
                }

                // Additional check for banned users
                if (role === 'student' && roomId) {
                    const isBanned = await userController.isUserBanned(name, roomId);
                    if (isBanned) {
                        socket.emit('joinError', 'You are currently banned from this room. Please wait before trying again.');
                        return;
                    }
                }

                const user = await userController.joinUser({
                    name,
                    role,
                    socketId: socket.id,
                    roomId
                });

                // Join socket room for isolation
                socket.join(user.roomId);
                socket.user = user;

                // Send user info back
                socket.emit('userJoined', user);

                // Send room information
                const roomInfo = await userController.getRoomInfo(user.roomId);
                const roomStats = await pollController.getRoomStats(user.roomId);

                socket.emit('roomInfo', {
                    roomId: user.roomId,
                    teacherName: roomInfo.teacherName,
                    ...roomStats
                });

                // Send active polls to user
                const activePolls = await pollController.getActivePolls(user.roomId);
                socket.emit('activePolls', activePolls);

                // Send students list to teacher
                if (role === 'teacher') {
                    const students = await userController.getAllStudents(user.roomId);
                    socket.emit('studentsList', students);

                    // Send poll results for all active polls
                    for (const poll of activePolls) {
                        const results = await pollController.getPollResults(poll._id);
                        socket.emit('pollResults', results);
                    }
                }

                // Send chat history
                const chatHistory = await chatController.getChatHistory(user.roomId);
                socket.emit('chatHistory', chatHistory);

                // Notify teacher about new student
                if (role === 'student') {
                    const teacher = await userController.getTeacher(user.roomId);
                    if (teacher && teacher.socketId) {
                        io.to(teacher.socketId).emit('studentJoined', user);
                        // Update students list for teacher
                        const students = await userController.getAllStudents(user.roomId);
                        io.to(teacher.socketId).emit('studentsList', students);
                    }
                }

                console.log(`${user.name} (${user.role}) joined room ${user.roomId}`);
            } catch (error) {
                console.error('Join error:', error);
                socket.emit('joinError', error.message);
            }
        });

        // Create poll (teacher only)
        socket.on('createPoll', async (data) => {
            try {
                if (!socket.user || socket.user.role !== 'teacher') {
                    socket.emit('error', 'Only teachers can create polls');
                    return;
                }

                const poll = await pollController.createPoll({
                    ...data,
                    roomId: socket.user.roomId,
                    createdBy: socket.user._id
                });

                // Send to all users in room
                io.to(socket.user.roomId).emit('newPoll', poll);

                // Update room stats
                const roomStats = await pollController.getRoomStats(socket.user.roomId);
                io.to(socket.user.roomId).emit('roomStats', roomStats);

                // Send initial poll results to teacher
                const results = await pollController.getPollResults(poll._id);
                socket.emit('pollResults', results);

                console.log(`Poll created: ${poll.question}`);
            } catch (error) {
                console.error('Create poll error:', error);
                socket.emit('pollError', error.message);
            }
        });

        // Submit poll answer
        socket.on('submitAnswer', async (data) => {
            try {
                if (!socket.user) {
                    socket.emit('error', 'User not authenticated');
                    return;
                }

                // Check if user is banned
                const banStatus = await userController.checkUserBanStatus(socket.user._id, socket.user.roomId);
                if (banStatus.isBanned) {
                    socket.emit('kicked', { message: banStatus.reason });
                    socket.disconnect(true);
                    return;
                }

                const { pollId, option } = data;
                await pollController.submitAnswer({
                    pollId,
                    userId: socket.user._id,
                    option,
                    roomId: socket.user.roomId
                });

                // Send confirmation to student
                socket.emit('answerSubmitted', {
                    pollId,
                    message: 'Answer submitted successfully!'
                });

                                // Get updated poll results
                const results = await pollController.getPollResults(pollId);
                
                // Send live results to teachers
                const teacher = await userController.getTeacher(socket.user.roomId);
                if (teacher && teacher.socketId) {
                    io.to(teacher.socketId).emit('pollResults', results);
                }
                
                // Send updated results to the student who just answered
                socket.emit('pollResults', results);

                console.log(`${socket.user.name} answered poll ${pollId}`);
            } catch (error) {
                console.error('Submit answer error:', error);
                socket.emit('answerError', error.message);
            }
        });

        // Get poll results (teacher only)
        socket.on('getPollResults', async (pollId) => {
            try {
                if (!socket.user || socket.user.role !== 'teacher') {
                    socket.emit('error', 'Only teachers can view results');
                    return;
                }

                const results = await pollController.getPollResults(pollId);
                socket.emit('pollResults', results);
            } catch (error) {
                console.error('Get results error:', error);
                socket.emit('error', error.message);
            }
        });

        // Close poll (teacher only)
        socket.on('closePoll', async (pollId) => {
            try {
                if (!socket.user || socket.user.role !== 'teacher') {
                    socket.emit('error', 'Only teachers can close polls');
                    return;
                }

                await pollController.closePoll(pollId);

                // Get final results
                const finalResults = await pollController.getPollResults(pollId);

                // Notify ALL users in room that poll is closed
                io.to(socket.user.roomId).emit('pollClosed', pollId);

                // Send poll results to ALL users (both teacher and students)
                io.to(socket.user.roomId).emit('pollResults', finalResults);

                console.log(`Poll closed: ${pollId}`);
            } catch (error) {
                console.error('Close poll error:', error);
                socket.emit('error', error.message);
            }
        });

        // Get all polls (teacher only)
        socket.on('getAllPolls', async () => {
            try {
                if (!socket.user || socket.user.role !== 'teacher') {
                    socket.emit('error', 'Only teachers can view all polls');
                    return;
                }

                const polls = await pollController.getAllPolls(socket.user.roomId);
                const pollsWithResults = await Promise.all(
                    polls.map(async (poll) => {
                        const results = await pollController.getPollResults(poll._id);
                        return results;
                    })
                );

                socket.emit('allPolls', pollsWithResults);
            } catch (error) {
                console.error('Get all polls error:', error);
                socket.emit('error', error.message);
            }
        });

        // Send message
        socket.on('sendMessage', async (data) => {
            try {
                if (!socket.user) {
                    socket.emit('error', 'User not authenticated');
                    return;
                }

                // Check if user is banned
                const banStatus = await userController.checkUserBanStatus(socket.user._id, socket.user.roomId);
                if (banStatus.isBanned) {
                    socket.emit('kicked', { message: banStatus.reason });
                    socket.disconnect(true);
                    return;
                }

                const { text } = data;
                const message = await chatController.saveMessage({
                    text,
                    sender: socket.user._id,
                    senderName: socket.user.name,
                    senderRole: socket.user.role,
                    roomId: socket.user.roomId
                });

                // Send to all users in room
                io.to(socket.user.roomId).emit('newMessage', message);

                console.log(`Message sent by ${socket.user.name} (${socket.user.role}): ${text}`);
            } catch (error) {
                console.error('Send message error:', error);
                socket.emit('error', error.message);
            }
        });

        // Clear messages (teacher only)
        socket.on('clearMessages', async () => {
            try {
                if (!socket.user || socket.user.role !== 'teacher') {
                    socket.emit('error', 'Only teachers can clear messages');
                    return;
                }

                await chatController.clearMessages(socket.user.roomId);
                io.to(socket.user.roomId).emit('messagesCleared');

                console.log(`Messages cleared in room ${socket.user.roomId}`);
            } catch (error) {
                console.error('Clear messages error:', error);
                socket.emit('error', error.message);
            }
        });

        // Kick student (teacher only)
        socket.on('kickStudent', async (studentId) => {
            try {
                if (!socket.user || socket.user.role !== 'teacher') {
                    socket.emit('error', 'Only teachers can kick students');
                    return;
                }

                const kickedUser = await userController.kickUser(studentId, socket.user.roomId);
                if (kickedUser && kickedUser.socketId) {
                    // Notify kicked student
                    io.to(kickedUser.socketId).emit('kicked', {
                        message: 'You have been removed from the room',
                        banDuration: 10 // minutes
                    });

                    // Force disconnect
                    const kickedSocket = io.sockets.sockets.get(kickedUser.socketId);
                    if (kickedSocket) {
                        kickedSocket.leave(socket.user.roomId);
                        kickedSocket.disconnect(true);
                    }
                }

                // Update students list for teacher
                const students = await userController.getAllStudents(socket.user.roomId);
                socket.emit('studentsList', students);

                console.log(`Student ${kickedUser?.name} kicked from room ${socket.user.roomId}`);
            } catch (error) {
                console.error('Kick student error:', error);
                socket.emit('error', error.message);
            }
        });

        // Handle disconnection
        socket.on('disconnect', () => {
            console.log(`User disconnected: ${socket.id}`);

            if (socket.user && socket.user.roomId) {
                // Just notify teacher if student disconnected
                if (socket.user.role === 'student') {
                    socket.to(socket.user.roomId).emit('studentDisconnected', {
                        name: socket.user.name,
                        userId: socket.user._id
                    });
                }
            }
        });

        // Periodic cleanup of expired polls and update
        setInterval(async () => {
            if (socket.user && socket.user.roomId) {
                try {
                    // Clean up expired polls
                    await pollController.cleanupExpiredPolls(socket.user.roomId);

                    // Send updated active polls
                    const activePolls = await pollController.getActivePolls(socket.user.roomId);
                    socket.emit('activePolls', activePolls);

                    // Send updated room stats
                    const roomStats = await pollController.getRoomStats(socket.user.roomId);
                    socket.emit('roomStats', roomStats);

                    // Send poll results for all active polls
                    for (const poll of activePolls) {
                        const results = await pollController.getPollResults(poll._id);
                        socket.emit('pollResults', results);
                    }
                } catch (error) {
                    console.error('Cleanup error:', error);
                }
            }
        }, 5000); // Every 5 seconds for real-time updates
    });

    return io;
}
