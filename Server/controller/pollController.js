//Logic for the Polling-Part!
import Poll from "../model/Poll.js"
import Room from "../model/Room.js"
import User from "../model/User.js"


//created A poll!!
export async function createPoll({ question, options, duration, roomId, createdBy }) {
    // Check room poll limit
    const room = await Room.findOne({ roomId })
    if (!room) {
        throw new Error("Room not found")
    }
    
    if (room.currentPollCount >= room.maxPolls) {
        throw new Error(`Room has reached maximum poll limit of ${room.maxPolls}`)
    }
    
    // Check if there are active polls that haven't been answered by all students
    const activePolls = await Poll.find({ 
        roomId, 
        isActive: true,
        endTime: { $gt: new Date() }
    })
    
    if (activePolls.length > 0) {
        // Get all students in the room
        const students = await User.find({ roomId, role: 'student' })
        
        // Check if all students have answered all active polls
        for (const poll of activePolls) {
            const unansweredStudents = students.filter(student => 
                !poll.answers.some(answer => answer.userId === student._id.toString())
            )
            
            if (unansweredStudents.length > 0) {
                throw new Error(`Cannot create new poll: ${unansweredStudents.length} student(s) haven't answered the current poll yet`)
            }
        }
    }
    
    const poll = new Poll({
        question,
        options,
        duration: duration || 60,
        endTime: new Date(Date.now() + (duration || 60) * 1000),
        roomId,
        createdBy
    })
    await poll.save()
    
    // Increment poll count in room
    await Room.findOneAndUpdate(
        { roomId },
        { $inc: { currentPollCount: 1 } }
    )
    
    return poll
}


//get Active Poll!
export async function getActivePolls(roomId) {
    // First clean up expired polls
    await cleanupExpiredPolls(roomId);
    
    const activePolls = await Poll.find({ 
        roomId, 
        isActive: true,
        endTime: { $gt: new Date() }
    }).sort({ createdAt: 1 })
    
    return activePolls
}

export async function getAllPolls(roomId) {
    return Poll.find({ roomId }).sort({ createdAt: -1 })
}

//answering the poll it will take the  userId and the option!
export async function submitAnswer({ pollId, userId, option, roomId }) {
    const poll = await Poll.findById(pollId)
    if (!poll || !poll.isActive || new Date() > poll.endTime) {
        throw new Error("Poll is not active or has expired")
    }
    
    // Get user info for enhanced tracking
    const user = await User.findById(userId)
    if (!user) {
        throw new Error("User not found")
    }
    
    // Check if user already answered
    const existingAnswer = poll.answers.find(a => a.userId === userId)
    if (existingAnswer) {
        throw new Error("You have already answered this poll")
    }
    
    // Get option text
    const optionText = poll.options[option]
    if (!optionText) {
        throw new Error("Invalid option selected")
    }
    
    // Add enhanced answer
    poll.answers.push({
        userId,
        userName: user.name,
        option,
        optionText,
        answeredAt: new Date()
    })
    
    await poll.save()
    return poll
}


//end-The-Pool!
export async function closePoll(pollId) {
    const poll = await Poll.findByIdAndUpdate(
        pollId,
        { isActive: false },
        { new: true }
    )
    return poll
}


//get the results of the poll!
export async function getPollResults(pollId) {
    const poll = await Poll.findById(pollId)
    if (!poll) {
        throw new Error("Poll not found")
    }
    
    // Enhanced results with detailed analytics
    const totalAnswers = poll.answers.length
    const optionCounts = poll.options.map((option, index) => ({
        option,
        index,
        count: poll.answers.filter(a => a.option === index).length,
        percentage: totalAnswers > 0 ? 
            Math.round((poll.answers.filter(a => a.option === index).length / totalAnswers) * 100) : 0,
        users: poll.answers
            .filter(a => a.option === index)
            .map(a => ({
                userId: a.userId,
                userName: a.userName,
                answeredAt: a.answeredAt
            }))
    }))
    
    return {
        ...poll.toObject(),
        results: {
            totalAnswers,
            optionCounts,
            isActive: poll.isActive && new Date() < poll.endTime
        }
    }
}


//get the history of the poll!
export async function getPollHistory(roomId) {
    const polls = await Poll.find({ roomId }).sort({ createdAt: -1 })
    
    const history = await Promise.all(polls.map(async (poll) => {
        const results = poll.options.map((option, index) => ({
            option,
            count: poll.answers.filter(answer => answer.option === index).length,
            percentage: poll.answers.length > 0 ? 
                Math.round((poll.answers.filter(answer => answer.option === index).length / poll.answers.length) * 100) : 0
        }))
        
        return {
            _id: poll._id,
            question: poll.question,
            options: poll.options,
            totalAnswers: poll.answers.length,
            results,
            isActive: poll.isActive,
            createdAt: poll.createdAt,
            endTime: poll.endTime
        }
    }))
    
    return history
}

export async function getRoomStats(roomId) {
    const room = await Room.findOne({ roomId })
    const totalPolls = await Poll.countDocuments({ roomId })
    const activePolls = await Poll.countDocuments({ 
        roomId, 
        isActive: true,
        endTime: { $gt: new Date() }
    })
    
    return {
        totalPolls,
        activePolls,
        maxPolls: room?.maxPolls || 15,
        remainingPolls: Math.max(0, (room?.maxPolls || 15) - totalPolls)
    }
}

export async function hasUserAnswered(pollId, userId) {
    const poll = await Poll.findById(pollId)
    if (!poll) return false
    
    return poll.answers.some(answer => answer.userId === userId)
}

// Clean up expired polls
export async function cleanupExpiredPolls(roomId) {
    // Mark expired polls as inactive
    const result = await Poll.updateMany(
        { 
            roomId, 
            isActive: true,
            endTime: { $lte: new Date() }
        },
        { isActive: false }
    )
    
    return result.modifiedCount;
}