import mongoose from "mongoose";

const roomSchema = new mongoose.Schema({
    roomId: {
        type: String,
        unique: true,
        required: true
    },
    teacherId: String,
    teacherName: String,
    isActive: {
        type: Boolean,
        default: true
    },
    maxPolls: {
        type: Number,
        default: 15
    },
    currentPollCount: {
        type: Number,
        default: 0
    },
    kickedUsers: [{
        userId: String,
        name: String,
        kickedAt: {
            type: Date,
            default: Date.now
        },
        canRejoinAt: {
            type: Date,
            default: function() {
                return new Date(Date.now() + 10 * 60 * 1000);
            }
        }
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.model("Room", roomSchema); 