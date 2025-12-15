// backend/justiceAI/responseGenerator.js
import OpenAI from "openai";

export async function generateAnswer(prompt) {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
        throw new Error("OPENAI_API_KEY is not set in .env");
    }

    const openai = new OpenAI({ apiKey });

    const response = await openai.chat.completions.create({
        model: "gpt-4.1-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 2000,
    });

    const text =
        response.choices?.[0]?.message?.content ||
        "⚠️ لم أستطع توليد إجابة في هذه اللحظة.";

    return text;
}
