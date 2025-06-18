//Schema for the Poll Model!

import mongoose from "mongoose";

const pollSchema = new mongoose.Schema({
    //it will have question,options,correctOptions,createdBy,IsActive,answer,createdAt,Duration!
    question: String,
    options: [String],
    correctOptions: Number,
    createdBy: String,//teacher Id!
    isActive: {
        type: Boolean,
        default: true
    },
    answers: [{
        userId: String,
        userName: String,  // Add user name for easier display
        option: Number,
        optionText: String,  // Add the actual option text
        answeredAt: {
            type: Date,
            default: Date.now
        }
    }],
    roomId: String,
    createdAt: {
        type: Date,
        default: Date.now
    },
    duration: {
        type: Number,
        default: 60//secs!
    },
    endTime: Date
})

export default mongoose.model("Poll", pollSchema)