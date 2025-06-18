//Schema for the Message Model!
import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
    sender: String,//userId
    senderName: String,
    senderRole: String,
    roomId: String,
    text: String,
    createdAt: {
        type: Date,
        default: Date.now
    }
})

export default mongoose.model("Message", messageSchema)