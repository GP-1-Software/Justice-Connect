// backend/routes/documentAnalysisRoute.js
import express from "express";
import multer from "multer";
import OpenAI from "openai";

const router = express.Router();

// Configure multer for memory storage (PDF only)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 20 * 1024 * 1024, // 20MB max
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype === "application/pdf") {
            cb(null, true);
        } else {
            cb(new Error("فقط ملفات PDF مسموحة"), false);
        }
    },
});

// POST /api/document-analysis/analyze
router.post("/analyze", upload.single("file"), async (req, res) => {
    try {
        const file = req.file;
        const question = req.body.question || "لخص هذا المستند القانوني بالتفصيل";

        if (!file) {
            return res.status(400).json({ error: "يرجى رفع ملف PDF" });
        }

        console.log(`📄 [DocumentAnalysis] Received file: ${file.originalname} (${(file.size / 1024).toFixed(2)} KB)`);

        // Convert file to base64
        const base64Content = file.buffer.toString("base64");
        const dataUrl = `data:application/pdf;base64,${base64Content}`;

        // Initialize OpenAI
        const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });

        console.log(`🤖 [DocumentAnalysis] Sending to GPT-4o Vision...`);

        // Send to GPT-4o with file
        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            max_tokens: 4000,
            messages: [
                {
                    role: "system",
                    content: `أنت محامٍ فلسطيني خبير متخصص في تحليل المستندات القانونية.

📋 مهامك:
1. حلل المستند المرفق بدقة
2. إذا طُلب تلخيص: قدم ملخصاً شاملاً يشمل النقاط الرئيسية
3. إذا طُلب سؤال محدد: أجب بناءً على محتوى المستند
4. أشر للمواد والبنود المهمة بأرقامها
5. نبّه لأي نقاط قانونية مهمة أو مخاطر محتملة

📝 تنسيق الإجابة:
- استخدم عناوين واضحة
- نقّط المعلومات المهمة
- أضف ملاحظات قانونية إذا لزم`
                },
                {
                    role: "user",
                    content: [
                        {
                            type: "file",
                            file: {
                                filename: file.originalname,
                                file_data: dataUrl,
                            },
                        },
                        {
                            type: "text",
                            text: question,
                        },
                    ],
                },
            ],
        });

        const answer = response.choices[0].message.content;

        // Log token usage
        const usage = response.usage;
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.log("📊 [Document Analysis Token Usage]:");
        console.log(`   📥 Prompt Tokens: ${usage.prompt_tokens}`);
        console.log(`   📤 Completion Tokens: ${usage.completion_tokens}`);
        console.log(`   📊 Total Tokens: ${usage.total_tokens}`);
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

        res.json({
            success: true,
            answer,
            fileName: file.originalname,
            fileSize: file.size,
            tokensUsed: usage.total_tokens,
        });

    } catch (error) {
        console.error("❌ [DocumentAnalysis] Error:", error.message);

        if (error.message?.includes("PDF")) {
            return res.status(400).json({ error: error.message });
        }

        res.status(500).json({
            error: "حدث خطأ أثناء تحليل المستند. يرجى المحاولة مرة أخرى.",
        });
    }
});

export default router;
