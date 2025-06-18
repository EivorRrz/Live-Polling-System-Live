import Message from "../model/Message.js"

//logic!
export async function saveMessage({ sender, senderName, senderRole, roomId, text }) {
    const msg = new Message({ sender, senderName, senderRole, roomId, text });
    await msg.save();
    return msg;
}

export async function getRoomMessages(roomId) {
    return Message.find({ roomId }).sort({
        createdAt: 1
    });
}

export async function clearRoomMessages(roomId) {
    await Message.deleteMany({ roomId });
}

// Main functions used by socket
export async function sendMessage({ sender, senderName, roomId, text }) {
    const msg = new Message({ 
        sender, 
        senderName, 
        senderRole: 'user', // Default role
        roomId, 
        text 
    });
    await msg.save();
    return msg;
}

export async function getChatHistory(roomId) {
    return Message.find({ roomId }).sort({
        createdAt: 1
    });
}

export async function clearMessages(roomId) {
    await Message.deleteMany({ roomId });
}