// Ensure environment variables are loaded before anything else
import "./config/env.js";

import express from "express";
import cors from "cors";

import justiceChatRoute from "./routes/justiceChatRoute.js";
import systemChatRouter from "./routes/systemChatRouter.js";
import messageRouter from "./routes/messageRouter.js";
import notificationRouter from "./routes/notificationRouter.js";
import authRouter from "./routes/authRoutes.js";
import courtClerkRouter from "./routes/courtClerkRoutes.js";
import documentAnalysisRouter from "./routes/documentAnalysisRoute.js";
import newsRouter from "./routes/newsRoutes.js";
// import legislationRouter from "./routes/legislationRoute.js";
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

// Route for Court Clerk
app.use("/api/court-clerk", courtClerkRouter);

// Route for Document Analysis (PDF upload)
app.use("/api/document-analysis", documentAnalysisRouter);

// Route for News
app.use("/api/news", newsRouter);

// // Route for Legislation
// app.use("/api/law", legislationRouter);

// // Route for News
// app.use("/api/news", newsRouter);

app.get("/", (req, res) => {
    res.send("Justice-Connect Backend is running ✅");
});


app.listen(PORT, '0.0.0.0', () => {
    console.log(`Backend running on http://0.0.0.0:${PORT}`);
    console.log(`Also accessible at http://192.168.1.10:${PORT}`);

    // Start notification scheduler
    startNotificationScheduler();
});


// app.listen(PORT, () => {
//     console.log(`Backend running on http://localhost:${PORT}`);
//     // Start notification scheduler
//     startNotificationScheduler();
// });
