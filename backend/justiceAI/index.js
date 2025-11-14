// backend/justiceAI/index.js
import { extractUserRole } from "./utils/roleExtractor.js";
import { buildPrompt } from "./utils/promptBuilder.js";
import { generateAnswer } from "./responseGenerator.js";

export async function runJusticeAI(userMessage, authHeader) {
    // حالياً بس بنرجع role ثابت، بعدين بنربطه مع JWT
    const { role, userId } = extractUserRole(authHeader);

    // مبدئياً ما في RAG ولا Vector DB
    const context =
        "لا يوجد سياق قانوني محلي مخزّن حالياً. سيتم الاعتماد على المعرفة القانونية العامة قدر الإمكان.";

    const prompt = buildPrompt(userMessage, context, role, userId);

    const answer = await generateAnswer(prompt);

    return answer;
}
