import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env
dotenv.config({ path: join(__dirname, "..", ".env") });

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function runMigration() {
    try {
        console.log("🔄 Running migration: add_deleted_for_column.sql");
        
        const sql = readFileSync(
            join(__dirname, "..", "..", "server", "supabase", "migrations", "add_deleted_for_column.sql"),
            "utf8"
        );

        const { data, error } = await supabase.rpc("exec_sql", { sql_query: sql });

        if (error) {
            console.error("❌ Migration failed:", error);
            process.exit(1);
        }

        console.log("✅ Migration completed successfully!");
        console.log("Added 'deleted_for' column to messages table");
    } catch (error) {
        console.error("❌ Error:", error.message);
        process.exit(1);
    }
}

runMigration();
