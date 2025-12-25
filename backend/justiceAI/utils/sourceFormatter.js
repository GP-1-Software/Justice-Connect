// backend/justiceAI/utils/sourceFormatter.js

/**
 * يضيف قسم المصادر لنهاية الإجابة إذا لم يكن موجوداً
 */
export function ensureSourcesInAnswer(answer, sources) {
    // تحقق إذا الإجابة فيها قسم مصادر
    const hasSourcesSection = /📚\s*(المصادر|المراجع|مصادر|مراجع)/i.test(answer);

    // إذا في مصادر في الإجابة، خلص
    if (hasSourcesSection) {
        return answer;
    }

    // إذا ما في، أضف المصادر في النهاية
    let sourcesSection = "\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";

    if (sources && sources.length > 0) {
        sourcesSection += "📚 **المصادر المستخدمة:**\n\n";
        sources.forEach((source, i) => {
            sourcesSection += `[${i + 1}] ${source}\n`;
        });
    } else {
        sourcesSection += `📚 **المصادر الموصى بها للتحقق:**

⚠️ هذه الإجابة مبنية على المعرفة العامة بالقانون الفلسطيني. للحصول على معلومات دقيقة ومحدثة، يُرجى مراجعة:

1. موقع مقام للتشريعات الفلسطينية
   🔗 https://maqam.najah.edu

2. المجلس التشريعي الفلسطيني
   🔗 https://mjr.ogb.gov.ps

3. مقتفي - مركز المعلومات القانونية
   🔗 http://muqtafi.birzeit.edu

4. معهد الحقوق - جامعة بيرزيت
   🔗 https://lawcenter.birzeit.edu

💡 **نصيحة:** استشر محامياً متخصصاً للحصول على رأي قانوني ملزم لحالتك الخاصة.`;
    }

    return answer + sourcesSection;
}

/**
 * يستخرج المصادر من الإجابة (إذا كانت مذكورة داخل النص)
 */
export function extractSourcesFromAnswer(answer) {
    const sources = [];

    // البحث عن روابط في الإجابة
    const urlRegex = /https?:\/\/[^\s]+/g;
    const matches = answer.match(urlRegex);

    if (matches) {
        matches.forEach(url => {
            // تنظيف الروابط من علامات الترقيم
            const cleanUrl = url.replace(/[,;.)]+$/, '');
            if (!sources.includes(cleanUrl)) {
                sources.push(cleanUrl);
            }
        });
    }

    return sources;
}

/**
 * يضيف أرقام المراجع للمصادر المذكورة في النص
 */
export function addReferenceNumbers(answer, sources) {
    if (!sources || sources.length === 0) {
        return answer;
    }

    let modifiedAnswer = answer;

    sources.forEach((source, index) => {
        const refNumber = `[${index + 1}]`;

        // إذا كان الرابط مذكور في النص، أضف رقم المرجع بعده
        if (modifiedAnswer.includes(source)) {
            // تجنب التكرار إذا كان الرقم موجود
            if (!modifiedAnswer.includes(`${source} ${refNumber}`)) {
                modifiedAnswer = modifiedAnswer.replace(
                    source,
                    `${source} ${refNumber}`
                );
            }
        }
    });

    return modifiedAnswer;
}