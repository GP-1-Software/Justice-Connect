import express from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();

import justiceChatRoute from "./routes/justiceChatRoute.js";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Route for JusticeAI
app.use("/api/justice-chat", justiceChatRoute);

app.get("/", (req, res) => {
    res.send("Justice-Connect Backend is running ✅");
});

app.listen(PORT, () => {
    console.log(`Backend running on http://localhost:${PORT}`);
});
