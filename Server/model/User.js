import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: String,
    role: {
        type: String,
        enum: ['teacher', 'student']
    },
    roomId: String,
    socketId: String,
    kicked: {
        type: Boolean,
        default: false
    },
    lastKickedAt: {
        type: Date,
        default: null
    }
})
export default mongoose.model('User', userSchema);