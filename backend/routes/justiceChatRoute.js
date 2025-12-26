import express from "express";
import { runJusticeAI } from "../justiceAI/index.js";

const router = express.Router();

router.post("/", async (req, res) => {
    try {
        const { message } = req.body;
        const authHeader = req.headers.authorization || null;

        if (!message || typeof message !== "string") {
            return res.status(400).json({ error: "message field is required" });
        }

        const result = await runJusticeAI(message, authHeader);

        res.json(result); // { reply, usage }
    } catch (err) {
        console.error("JusticeAI Error:", err);
        res.status(500).json({ error: "حدث خطأ أثناء توليد الرد القانوني." });
    }
});

export default router;
