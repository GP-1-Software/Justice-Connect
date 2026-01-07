// backend/justiceAI/web/search.js
import axios from "axios";

const SERP_API_KEY = process.env.SERP_API_KEY;

const ALLOWED_DOMAINS = [
    "maqam.najah.edu",
    "mjr.ogb.gov.ps",
    "www.pji.pna.ps",
    "muqtafi.birzeit.edu",
    "www.courts.gov.ps",
    "security-legislation.ps"
];

export async function googleSearch(query) {
    try {
        if (!SERP_API_KEY) {
            console.warn("[googleSearch] SERP_API_KEY not set");
            return [];
        }

        const { data } = await axios.get("https://serpapi.com/search", {
            params: {
                q: `${query} قانون فلسطيني`,
                hl: "ar",
                gl: "ps",
                engine: "google",
                api_key: SERP_API_KEY,
            },
            timeout: 10000,
        });

        const results = (data.organic_results || [])
            .filter(r => ALLOWED_DOMAINS.some(domain => r.link.includes(domain)))
            .slice(0, 5)
            .map(r => ({
                title: r.title || "",
                link: r.link,
                snippet: r.snippet || ""
            }));

        return results;
    } catch (error) {
        console.error("[googleSearch] Error:", error.message);
        return [];
    }
}
