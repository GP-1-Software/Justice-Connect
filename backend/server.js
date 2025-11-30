// Ensure environment variables are loaded before anything else
import "./config/env.js";

import express from "express";
import cors from "cors";

import justiceChatRoute from "./routes/justiceChatRoute.js";
import systemChatRouter from "./routes/systemChatRouter.js";
import messageRouter from "./routes/messageRouter.js";
import notificationRouter from "./routes/notificationRouter.js";
import authRouter from "./routes/authRoutes.js";
import { startNotificationScheduler } from "./services/notificationScheduler.js";


const app = express();
const PORT = process.env.PORT || 5000;


app.use(cors());
app.use(express.json());

// Route for JusticeAI
app.use("/api/justice-chat", justiceChatRoute);

// Route for SystemAI (Admin Chat)
app.use("/api/system-ai", systemChatRouter);

// Route for Messages
app.use("/api/messages", messageRouter);

// Route for Notifications
app.use("/api/notifications", notificationRouter);

// Route for Auth
app.use("/api/auth", authRouter);

app.get("/", (req, res) => {
    res.send("Justice-Connect Backend is running ✅");
});

app.listen(PORT, () => {
    console.log(`Backend running on http://localhost:${PORT}`);

    // Start notification scheduler
    startNotificationScheduler();
});
