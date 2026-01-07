// import fetch from "node-fetch";
//
// const ALLOWED_DOMAINS = [
//     "maqam.najah.edu",
//     "mjr.ogb.gov.ps",
//     "www.courts.gov.ps",
//     "www.pji.pna.ps",
//     "security-legislation.ps",
//     "muqtafi.birzeit.edu",
// ];
//
// async function duckDuckGoSearch(query, domain) {
//     const q = encodeURIComponent(`${query} site:${domain}`);
//     const url = `https://api.duckduckgo.com/?q=${q}&format=json&no_redirect=1&no_html=1`;
//     const res = await fetch(url);
//     if (!res.ok) throw new Error(`DuckDuckGo search failed for ${domain}`);
//     return res.json();
// }
//
// export async function webSearch(query, { perDomain = 2, maxTotal = 5 } = {}) {
//     const results = [];
//
//     for (const domain of ALLOWED_DOMAINS) {
//         try {
//             const data = await duckDuckGoSearch(query, domain);
//             const topics = data?.RelatedTopics || [];
//             for (const item of topics) {
//                 if (results.length >= maxTotal) break;
//                 if (!item.FirstURL || !item.Text) continue;
//                 results.push({
//                     source: domain,
//                     url: item.FirstURL,
//                     snippet: item.Text,
//                 });
//                 if (results.filter((r) => r.source === domain).length >= perDomain) break;
//             }
//         } catch (err) {
//             // Soft-fail per domain
//             console.warn(`[webSearch] domain ${domain} failed:`, err.message);
//         }
//         if (results.length >= maxTotal) break;
//     }
//
//     return results;
// }
//
// export function formatWebResults(results) {
//     if (!results.length) return "لم يتم العثور على نتائج مناسبة من البحث في المواقع المسموح بها.";
//     return results
//         .map(
//             (r, idx) =>
//                 `[ويب-${idx + 1}] المصدر: ${r.source}\nالرابط: ${r.url}\nمقتطف: ${r.snippet}`
//         )
//         .join("\n\n");
// }
//
