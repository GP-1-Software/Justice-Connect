// import fs from "fs/promises";
// import path from "path";
// import { fileURLToPath } from "url";
// import dotenv from "dotenv";
// import OpenAI from "openai";

// dotenv.config();

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// const ROOT_DIR = path.resolve(__dirname, "../..");
// const METADATA_PATH = path.resolve(ROOT_DIR, "public/legislation/metadata.json");
// const PDF_DIR = path.resolve(ROOT_DIR, "public/legislation");
// const OUTPUT_PATH = path.resolve(ROOT_DIR, "backend/data/legislation_index.json");

// const MAX_CHARS = 1400;
// const OVERLAP_CHARS = 200;
// const EMBEDDING_MODEL = "text-embedding-3-small";

// function chunkText(text) {
//     const chunks = [];
//     let start = 0;
//     while (start < text.length) {
//         const end = Math.min(text.length, start + MAX_CHARS);
//         const slice = text.slice(start, end).trim();
//         if (slice.length > 0) {
//             chunks.push(slice);
//         }
//         start = end - OVERLAP_CHARS; // overlap for better recall
//         if (start < 0) start = 0;
//     }
//     return chunks;
// }

// async function ensureDirExists(filePath) {
//     const dir = path.dirname(filePath);
//     await fs.mkdir(dir, { recursive: true });
// }

// async function loadMetadata() {
//     const raw = await fs.readFile(METADATA_PATH, "utf8");
//     const parsed = JSON.parse(raw);
//     if (!Array.isArray(parsed)) {
//         throw new Error("metadata.json is not an array");
//     }
//     return parsed;
// }

// async function readPdfText(filename) {
//     const pdfModule = await import("pdf-parse");
//     const pdfParse = pdfModule.default || pdfModule;
//     const pdfPath = path.resolve(PDF_DIR, filename);
//     const buffer = await fs.readFile(pdfPath);
//     const { text } = await pdfParse(buffer);
//     return text.replace(/\s+/g, " ").trim();
// }

// async function embedChunks(chunks, openai) {
//     const embeddings = [];
//     for (const chunk of chunks) {
//         const res = await openai.embeddings.create({
//             model: EMBEDDING_MODEL,
//             input: chunk,
//         });
//         const vector = res.data?.[0]?.embedding;
//         if (!vector) throw new Error("Failed to get embedding");
//         embeddings.push(vector);
//     }
//     return embeddings;
// }

// async function main() {
//     console.log("Reading metadata...");
//     const items = await loadMetadata();

//     const apiKey = process.env.OPENAI_API_KEY;
//     const canEmbed = Boolean(apiKey);
//     const openai = canEmbed ? new OpenAI({ apiKey }) : null;

//     const allChunks = [];
//     for (const item of items) {
//         if (!item.filename) continue;
//         console.log(`Extracting ${item.filename} ...`);
//         const text = await readPdfText(item.filename);
//         const chunks = chunkText(text);
//         let embeddings = [];

//         if (canEmbed) {
//             console.log(`Embedding ${chunks.length} chunks for ${item.filename} ...`);
//             embeddings = await embedChunks(chunks, openai);
//         }

//         chunks.forEach((chunkText, idx) => {
//             allChunks.push({
//                 id: item.id,
//                 title: item.title,
//                 category: item.category,
//                 filename: item.filename,
//                 sourceUrl: item.pdfUrl || item.url,
//                 chunkIndex: idx,
//                 chunkText,
//                 embedding: embeddings[idx] || null,
//             });
//         });
//     }

//     await ensureDirExists(OUTPUT_PATH);

//     const payload = {
//         generatedAt: new Date().toISOString(),
//         embeddingModel: canEmbed ? EMBEDDING_MODEL : null,
//         chunks: allChunks,
//     };

//     await fs.writeFile(OUTPUT_PATH, JSON.stringify(payload, null, 2), "utf8");
//     console.log(
//         `Saved ${allChunks.length} chunks to ${OUTPUT_PATH} ` +
//             (canEmbed ? "with embeddings." : "without embeddings (will embed on the fly).")
//     );
// }

// main().catch((err) => {
//     console.error(err);
//     process.exit(1);
// });

