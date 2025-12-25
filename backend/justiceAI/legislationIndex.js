// import fs from "fs/promises";
// import path from "path";
// import { fileURLToPath } from "url";
// import OpenAI from "openai";

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);
// const INDEX_PATH = path.resolve(__dirname, "../data/legislation_index.json");

// let cachedIndex = null;

// function cosineSimilarity(a, b) {
//     const len = Math.min(a.length, b.length);
//     let dot = 0;
//     let normA = 0;
//     let normB = 0;
//     for (let i = 0; i < len; i++) {
//         dot += a[i] * b[i];
//         normA += a[i] * a[i];
//         normB += b[i] * b[i];
//     }
//     return dot / (Math.sqrt(normA) * Math.sqrt(normB));
// }

// async function loadIndex() {
//     if (cachedIndex) return cachedIndex;
//     const raw = await fs.readFile(INDEX_PATH, "utf8");
//     const data = JSON.parse(raw);
//     cachedIndex = data;
//     return data;
// }

// async function getOpenAI() {
//     const apiKey = process.env.OPENAI_API_KEY;
//     if (!apiKey) throw new Error("OPENAI_API_KEY is not set");
//     return new OpenAI({ apiKey });
// }

// async function embedText(text, openai) {
//     const client = openai || (await getOpenAI());
//     const res = await client.embeddings.create({
//         model: "text-embedding-3-small",
//         input: text,
//     });
//     return res.data?.[0]?.embedding;
// }

// export async function findRelevantChunks(query, { topK = 5, minScore = 0.2 } = {}) {
//     const index = await loadIndex();
//     if (!index?.chunks?.length) return [];

//     const openai = await getOpenAI();
//     const queryEmbedding = await embedText(query, openai);

//     const scored = [];
//     for (const chunk of index.chunks) {
//         let chunkEmbedding = chunk.embedding;
//         if (!chunkEmbedding) {
//             // fall back to on-the-fly embedding if index was built without embeddings
//             chunkEmbedding = await embedText(chunk.chunkText, openai);
//         }
//         const score = cosineSimilarity(queryEmbedding, chunkEmbedding);
//         if (score >= minScore) {
//             scored.push({ ...chunk, score });
//         }
//     }

//     scored.sort((a, b) => b.score - a.score);
//     return scored.slice(0, topK);
// }

// export function formatChunksForContext(chunks) {
//     if (!chunks.length) return "لا يوجد نص قانوني محلي مطابق في الفهرس.";
//     return chunks
//         .map(
//             (c, idx) =>
//                 `[${idx + 1}] ${c.title || "نص قانوني"} (${c.category || "بدون تصنيف"})\n` +
//                 `المصدر: ${c.sourceUrl || "غير محدد"} | الملف: ${c.filename}\n` +
//                 `${c.chunkText}`
//         )
//         .join("\n\n");
// }

