// backend/justiceAI/index.js - V3 النسخة الذكية
import { googleSearch } from "./web/search.js";
import { fetchLegalText } from "./web/fetchLegalText.js";
import {
    buildPrompt,
    buildPromptWithoutSources,
    buildAnalysisPrompt
} from "./utils/promptBuilder.js";
import { generateAnswer } from "./responseGenerator.js";
import { ensureSourcesInAnswer } from "./utils/sourceFormatter.js";

export async function runJusticeAI(question) {
    try {
        console.log("[JusticeAI] بدء البحث عن:", question);

        // 1. تصنيف السؤال: هل يحتاج بحث أم تحليل عام؟
        const questionType = classifyQuestion(question);
        console.log(`[JusticeAI] نوع السؤال: ${questionType}`);

        let legalText = "";
        let sources = [];

        // 2. محاولة البحث في Google
        const searchResults = await googleSearch(question);

        if (searchResults.length > 0) {
            console.log(`[JusticeAI] تم إيجاد ${searchResults.length} نتيجة`);

            // 3. سكرابة المحتوى الكامل
            const scrapedData = await Promise.allSettled(
                searchResults.map(async (result) => {
                    try {
                        console.log(`[JusticeAI] جاري سكرابة: ${result.link}`);
                        const fullText = await fetchLegalText(result.link);
                        return {
                            link: result.link,
                            title: result.title,
                            content: fullText,
                            snippet: result.snippet
                        };
                    } catch (err) {
                        console.warn(`[JusticeAI] فشل سكرابة ${result.link}:`, err.message);
                        return {
                            link: result.link,
                            title: result.title,
                            content: result.snippet,
                            snippet: result.snippet
                        };
                    }
                })
            );

            // 4. تجميع المحتوى الناجح
            const successfulScrapes = scrapedData
                .filter(result => result.status === "fulfilled")
                .map(result => result.value);

            if (successfulScrapes.length > 0) {
                legalText = successfulScrapes
                    .map((data, i) => {
                        return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📄 المصدر [${i + 1}]: ${data.title}
🔗 ${data.link}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${data.content}
`;
                    })
                    .join("\n\n");

                sources = successfulScrapes.map(d => d.link);
                console.log(`[JusticeAI] تم تجميع ${legalText.length} حرف من المحتوى القانوني`);
            }
        }

        // 5. إذا ما في مصادر، استخدم المعرفة العامة للـ AI
        if (!legalText || legalText.trim().length < 100) {
            console.log("[JusticeAI] لا توجد مصادر كافية، استخدام المعرفة العامة...");

            // للأسئلة العامة أو التحليلية
            if (questionType === "general" || questionType === "analysis") {
                return await generateGeneralAnswer(question);
            }

            // للأسئلة المحددة بدون مصادر
            return await generateAnswerWithoutSources(question);
        }

        // 6. بناء الـ prompt وتوليد الإجابة مع المصادر
        const prompt = buildPrompt(question, legalText, sources);
        const answer = await generateAnswer(prompt);

        // 7. التأكد من وجود المصادر في الإجابة
        const finalAnswer = ensureSourcesInAnswer(answer, sources);
        return finalAnswer;

    } catch (error) {
        console.error("[runJusticeAI] خطأ:", error);
        return "⚠️ حدث خطأ أثناء معالجة سؤالك. يرجى المحاولة مرة أخرى.";
    }
}

// ============================================
// وظائف مساعدة
// ============================================

function classifyQuestion(question) {
    const q = question.toLowerCase();

    // أسئلة تحتاج مواد قانونية محددة
    const specificKeywords = [
        "مادة", "رقم", "قانون رقم", "المادة", "القانون",
        "نص", "نص المادة", "ينص", "المرسوم"
    ];

    // أسئلة تحليلية أو استشارية عامة
    const generalKeywords = [
        "كيف", "ماذا", "هل يمكن", "هل يجوز", "ما هي",
        "اشرح", "وضح", "فسر", "ما الفرق", "قارن"
    ];

    // أسئلة إجرائية
    const proceduralKeywords = [
        "إجراءات", "خطوات", "كيفية", "طريقة",
        "شروط", "متطلبات", "وثائق مطلوبة"
    ];

    if (specificKeywords.some(kw => q.includes(kw))) {
        return "specific"; // يحتاج بحث في مصادر
    }

    if (proceduralKeywords.some(kw => q.includes(kw))) {
        return "procedural"; // يحتاج بحث في مصادر
    }

    if (generalKeywords.some(kw => q.includes(kw))) {
        return "general"; // ممكن يجاوب من معرفة عامة
    }

    return "analysis"; // سؤال تحليلي
}

async function generateGeneralAnswer(question) {
    const prompt = buildPromptWithoutSources(question);
    const answer = await generateAnswer(prompt);

    // التأكد من وجود المصادر الموصى بها
    return ensureSourcesInAnswer(answer, []);
}

async function generateAnswerWithoutSources(question) {
    const prompt = buildPromptWithoutSources(question);
    const answer = await generateAnswer(prompt);

    // التأكد من وجود المصادر الموصى بها
    return ensureSourcesInAnswer(answer, []);
}