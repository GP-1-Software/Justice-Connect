// backend/justiceAI/responseGenerator.js
import OpenAI from "openai";

export async function generateAnswer(prompt) {
    const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
    });

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o", // ✅ النموذج الصحيح (أو gpt-4-turbo)
            temperature: 0.3,
            max_tokens: 2000, // زودت الحد للإجابات المفصلة
            messages: [
                {
                    role: "system",
                    content: `أنت محامٍ فلسطيني خبير متخصص في القانون الفلسطيني.

📋 مهامك:
1. قدم إجابات قانونية مفصلة وشاملة (ليست مختصرة)
2. استشهد بالمواد القانونية بأرقامها الصحيحة
3. اشرح كيف تنطبق هذه المواد على سؤال المستخدم
4. إذا كان هناك إجراءات قانونية، اذكرها خطوة بخطوة
5. أضف ملاحظات قانونية مهمة إذا لزم الأمر
6. استخدم النصوص القانونية المُقدمة لك فقط
7. إذا لم تجد معلومات كافية، اذكر ذلك بوضوح

📝 تنسيق الإجابة:
- استخدم فقرات واضحة
- نقّط الإجراءات إذا كانت متعددة
- أشر للمصادر بالأرقام [1], [2], إلخ

🔴 **قاعدة إلزامية - ذكر المصادر:**
- في نهاية كل إجابة، يجب إضافة قسم "📚 المصادر:" أو "📚 المراجع:"
- إذا كانت هناك مصادر خارجية مقدمة، اذكرها بروابطها
- إذا لم تكن هناك مصادر خارجية، اذكر المصادر الموصى بها للتحقق
- لا تترك أي إجابة بدون ذكر المصادر أو توجيه للمصادر`
                },
                { role: "user", content: prompt }
            ],
        });

        return response.choices[0].message.content;

    } catch (error) {
        console.error("[generateAnswer] خطأ في OpenAI:", error.message);

        if (error.code === "insufficient_quota") {
            throw new Error("⚠️ انتهى رصيد OpenAI API");
        }
        if (error.code === "invalid_api_key") {
            throw new Error("⚠️ مفتاح OpenAI غير صالح");
        }

        throw new Error("⚠️ حدث خطأ في توليد الإجابة");
    }
}