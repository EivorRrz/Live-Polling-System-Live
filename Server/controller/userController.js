//Logic for the User-Part!
import User from "../model/User.js";
import Room from "../model/Room.js";

// Generate unique room ID
function generateRoomId() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export async function joinUser({ name, role, socketId, roomId }) {
    // First check if user exists with this socketId (reconnection)
    let user = await User.findOne({ socketId });

    if (!user) {
        if (role === 'teacher') {
            // Create new room for teacher
            const newRoomId = generateRoomId();
            const room = new Room({
                roomId: newRoomId,
                teacherId: socketId,
                teacherName: name
            });
            await room.save();
            
            // Create teacher user
            user = new User({ name, role, roomId: newRoomId, socketId });
            await user.save();
            
            return { ...user.toObject(), roomId: newRoomId };
        } else {
            // Student joining existing room
            if (!roomId) {
                throw new Error("Students must provide a room ID");
            }
            
            const room = await Room.findOne({ roomId, isActive: true });
            if (!room) {
                throw new Error("Room not found or inactive");
            }
            
            // Check if user is kicked and ban hasn't expired
            const kickedUser = room.kickedUsers.find(ku => 
                ku.name.toLowerCase() === name.toLowerCase() && 
                new Date() < ku.canRejoinAt
            );
            
            if (kickedUser) {
                const timeLeft = Math.ceil((kickedUser.canRejoinAt - new Date()) / (1000 * 60));
                throw new Error(`You are temporarily banned from this room. Try again in ${timeLeft} minutes.`);
            }
            
            // Check if name already exists in this room (among active users)
            const existingUser = await User.findOne({ name, roomId, role: 'student', kicked: false });
            if (existingUser) {
                existingUser.socketId = socketId;
                await existingUser.save();
                return existingUser;
            }
            
            // Create new student user
            user = new User({ name, role, roomId, socketId });
            await user.save();
        }
    } else {
        // Update existing user's info
        user.name = name;
        user.role = role;
        user.socketId = socketId;
        user.kicked = false;
        if (roomId) user.roomId = roomId;
        await user.save();
    }
    return user;
}

export async function getAllStudents(roomId) {
    return User.find({ role: 'student', roomId, kicked: false });
}

export async function kickUser(userId, roomId) {
    const user = await User.findByIdAndUpdate(
        userId,
        { 
            kicked: true, 
            socketId: null,
            lastKickedAt: new Date()
        },
        { new: true }
    );
    
    if (user) {
        // Add to room's kicked users list with immediate ban
        await Room.findOneAndUpdate(
            { roomId },
            { 
                $push: { 
                    kickedUsers: {
                        userId: user._id,
                        name: user.name,
                        socketId: user.socketId, // Store socket ID for immediate disconnection
                        kickedAt: new Date(),
                        canRejoinAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
                    }
                }
            }
        );
    }
    
    return user;
}

// Check if user is currently banned
export async function isUserBanned(name, roomId) {
    const room = await Room.findOne({ roomId });
    if (!room) return false;
    
    const kickedUser = room.kickedUsers.find(ku => 
        ku.name.toLowerCase() === name.toLowerCase() && 
        new Date() < ku.canRejoinAt
    );
    
    return !!kickedUser;
}

// Enhanced ban check that also prevents actions
export async function checkUserBanStatus(userId, roomId) {
    const user = await User.findById(userId);
    if (!user || user.kicked) {
        return { isBanned: true, reason: 'User has been kicked from the room' };
    }
    
    const room = await Room.findOne({ roomId });
    if (room) {
        const kickedUser = room.kickedUsers.find(ku => 
            ku.userId.toString() === userId && 
            new Date() < ku.canRejoinAt
        );
        
        if (kickedUser) {
            const timeLeft = Math.ceil((kickedUser.canRejoinAt - new Date()) / (1000 * 60));
            return { 
                isBanned: true, 
                reason: `You are banned from this room. Try again in ${timeLeft} minutes.` 
            };
        }
    }
    
    return { isBanned: false };
}

export async function getRoomInfo(roomId) {
    return Room.findOne({ roomId });
}

export async function getTeacher(roomId) {
    return User.findOne({ role: 'teacher', roomId });
}

export async function cleanupExpiredBans(roomId) {
    // Remove expired bans from room
    await Room.findOneAndUpdate(
        { roomId },
        { 
            $pull: { 
                kickedUsers: { 
                    canRejoinAt: { $lt: new Date() } 
                }
            }
        }
    );
}