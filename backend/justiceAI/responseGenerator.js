// backend/justiceAI/responseGenerator.js
import fetch from "node-fetch";

export async function generateAnswer(prompt) {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        throw new Error("GEMINI_API_KEY is not set in .env");
    }

    const url =
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" +
        apiKey;

    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            contents: [
                {
                    parts: [{ text: prompt }],
                },
            ],
        }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error("Gemini API Error:", errorText);
        throw new Error("Gemini API request failed");
    }

    const data = await response.json();
    const text =
        data.candidates?.[0]?.content?.parts?.[0]?.text ||
        "⚠️ لم أستطع توليد إجابة في هذه اللحظة.";

    return text;
}
