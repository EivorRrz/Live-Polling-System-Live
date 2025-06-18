//imports!
import express from "express";
import http from "http";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/DB.js";
import setupSocket from "./socket/index.js";

//init!
dotenv.config();

// Connect to database
connectDB()
    .then(() => {
        console.log("Connected To Database Successfully!!")
    })
    .catch((err) => {
        console.log("Something went wrong while connecting to the database!! : ", err)
        // Don't exit process in serverless environment
        // process.exit(1);
    });

//inits!
const app = express();
app.use(cors({
    origin: [
        "http://localhost:3000", 
        "https://frontend-2zru.onrender.com", 
        "https://darling-taffy-a224d1.netlify.app",
        "https://live-polling-system-live-task.netlify.app",
        "https://live-polling-system-task-1.netlify.app",
        "https://*.netlify.app", 
        "https://*.vercel.app"
    ],
    credentials: true
}));
app.use(express.json());

// Basic health check route
app.get("/", (req, res) => {
    res.json({ 
        message: "Polling App Server is running!",
        status: "OK",
        timestamp: new Date().toISOString()
    });
});

// REST API route for poll history (optional, mainly using sockets)
app.get("/api/polls/history", async (req, res) => {
    try {
        const { getPollHistory } = await import("./controller/pollController.js");
        const history = await getPollHistory();
        res.json({ success: true, data: history });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Create server and setup socket.io
const server = http.createServer(app);
const io = setupSocket(server);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 Socket.IO ready for connections`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// For Vercel deployment, export the app
export default app;
