// backend/justiceAI/web/fetchLegalText.js - Enhanced Version
import axios from "axios";
import * as cheerio from "cheerio";

// User agents متنوعة عشان نتجنب البلوك
const USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0"
];

function getRandomUserAgent() {
    return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

export async function fetchLegalText(url) {
    try {
        // محاولة 1: Axios عادي مع headers محسّنة
        const response = await fetchWithRetry(url, 2);

        if (response && response.data) {
            const $ = cheerio.load(response.data);

            // إزالة العناصر غير المرغوبة
            $("script, style, nav, footer, header, .ads, .sidebar, .menu, .navigation").remove();

            let text = "";

            // استراتيجيات مختلفة حسب الموقع
            if (url.includes("muqtafi.birzeit.edu")) {
                text = extractMuqtafiContent($);
            } else if (url.includes("mjr.ogb.gov.ps")) {
                text = extractMJRContent($);
            } else if (url.includes("maqam.najah.edu")) {
                text = extractMaqamContent($);
            } else {
                text = extractGenericContent($);
            }

            const cleaned = cleanLegalText(text);

            if (cleaned.length < 100) {
                throw new Error(`محتوى قصير جداً: ${cleaned.length} حرف`);
            }

            console.log(`[fetchLegalText] ✅ نجح: ${url} (${cleaned.length} حرف)`);
            return cleaned;
        }

        throw new Error("لم يتم الحصول على بيانات");

    } catch (error) {
        console.error(`[fetchLegalText] ❌ خطأ في ${url}:`, error.message);
        throw new Error(`فشل سكرابة ${url}: ${error.message}`);
    }
}

async function fetchWithRetry(url, retries = 2) {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await axios.get(url, {
                timeout: 20000,
                maxRedirects: 5,
                validateStatus: (status) => status < 500, // قبول حتى 4xx
                headers: {
                    "User-Agent": getRandomUserAgent(),
                    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
                    "Accept-Language": "ar,en-US;q=0.7,en;q=0.3",
                    "Accept-Encoding": "gzip, deflate, br",
                    "DNT": "1",
                    "Connection": "keep-alive",
                    "Upgrade-Insecure-Requests": "1",
                    "Sec-Fetch-Dest": "document",
                    "Sec-Fetch-Mode": "navigate",
                    "Sec-Fetch-Site": "none",
                    "Cache-Control": "max-age=0",
                    "Referer": new URL(url).origin
                }
            });

            if (response.status === 403) {
                console.warn(`[fetchLegalText] 403 على ${url} - محاولة ${i + 1}/${retries}`);
                if (i < retries - 1) {
                    await sleep(2000 * (i + 1)); // انتظار تصاعدي
                    continue;
                }
            }

            if (response.status === 200 && response.data) {
                return response;
            }

        } catch (err) {
            if (i === retries - 1) throw err;
            await sleep(1500);
        }
    }
    return null;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ======== Extractors حسب كل موقع ========

function extractMuqtafiContent($) {
    // موقع muqtafi له structure معين
    const selectors = [
        ".LegislationContent",
        ".legal-text",
        "table td",
        ".content",
        "div[align='right']"
    ];

    for (const selector of selectors) {
        const content = $(selector).text();
        if (content && content.length > 200) {
            return content;
        }
    }

    return $("body").text();
}

function extractMJRContent($) {
    // موقع المجلس التشريعي
    const selectors = [
        ".decree-content",
        ".law-text",
        "article",
        "main",
        ".content-area"
    ];

    for (const selector of selectors) {
        const content = $(selector).text();
        if (content && content.length > 200) {
            return content;
        }
    }

    return $("body").text();
}

function extractMaqamContent($) {
    // موقع مقام
    const selectors = [
        ".legislation-text",
        ".law-content",
        "article",
        ".page-content"
    ];

    for (const selector of selectors) {
        const content = $(selector).text();
        if (content && content.length > 200) {
            return content;
        }
    }

    return $("body").text();
}

function extractGenericContent($) {
    const mainSelectors = [
        "article",
        "main",
        ".content",
        "#content",
        ".post-content",
        ".entry-content",
        ".legal-text",
        ".law-content"
    ];

    for (const selector of mainSelectors) {
        const mainContent = $(selector).text();
        if (mainContent && mainContent.length > 200) {
            return mainContent;
        }
    }

    return $("body").text();
}

function cleanLegalText(text) {
    return text
        // إزالة المسافات الزائدة
        .replace(/\s+/g, " ")
        // إزالة Zero-width characters
        .replace(/[\u200B-\u200D\uFEFF]/g, "")
        // إزالة أحرف التحكم
        .replace(/[\x00-\x1F\x7F]/g, "")
        // إزالة نصوص شائعة غير مفيدة
        .replace(/(JavaScript must be enabled|Enable JavaScript|Cookie|Privacy Policy)/gi, "")
        // trim
        .trim()
        // حد أقصى للمحتوى
        .slice(0, 15000);
}