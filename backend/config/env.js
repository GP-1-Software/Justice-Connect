// backend/config/env.js
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from backend root
dotenv.config({ path: join(__dirname, "..", ".env") });

export const ENV = {
  PORT: process.env.PORT,
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
};

// One-time debug log to verify env load
if (process.env.NODE_ENV !== "test") {
  console.log("🔍 Environment Variables Check (from env.js):");
  console.log("PORT:", ENV.PORT || "(default 5000)");
  console.log("SUPABASE_URL:", ENV.SUPABASE_URL ? "✅ Set" : "❌ Not set");
  console.log(
    "SUPABASE_SERVICE_ROLE_KEY:",
    ENV.SUPABASE_SERVICE_ROLE_KEY ? "✅ Set" : "❌ Not set"
  );
  console.log("OPENAI_API_KEY:", ENV.OPENAI_API_KEY ? "✅ Set" : "❌ Not set");
  console.log("---");
}
