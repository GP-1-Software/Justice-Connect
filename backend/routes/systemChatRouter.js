// backend/routes/systemChatRouter.js

import express from "express";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";
import { SYSTEM_PROMPT, SYSTEM_ANALYSIS_PROMPT } from "../systemAI/systemPrompt.js";
import { SYSTEM_SCHEMA_TEXT } from "../systemAI/systemSchema.js";
import { ENV } from "../config/env.js";

const router = express.Router();

// Lazy singletons to avoid null during module evaluation
let supabase = null;

function getSupabase() {
  if (!supabase) {
    if (!ENV.SUPABASE_URL || !ENV.SUPABASE_SERVICE_ROLE_KEY) return null;
    supabase = createClient(ENV.SUPABASE_URL, ENV.SUPABASE_SERVICE_ROLE_KEY);
  }
  return supabase;
}

// OpenAI helper function
async function callOpenAI(prompt, systemPrompt = "") {
  if (!ENV.OPENAI_API_KEY) {
    throw new Error("OpenAI API key not configured");
  }

  const openai = new OpenAI({ apiKey: ENV.OPENAI_API_KEY });

  const messages = [];
  if (systemPrompt) {
    messages.push({ role: "system", content: systemPrompt });
  }
  messages.push({ role: "user", content: prompt });

  const response = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    messages,
    temperature: 0.1,
    max_tokens: 2000,
  });

  return response.choices[0].message.content;
}

// ============================================================
// ENDPOINT 1: Get all conversations for an admin
// GET /api/system-ai/conversations/:adminId
// ============================================================
router.get("/conversations/:adminId", async (req, res) => {
  try {
    const sb = getSupabase();
    if (!sb) {
      return res.status(500).json({
        success: false,
        error: "Supabase is not configured. Please check .env file.",
      });
    }

    const { adminId } = req.params;

    const { data, error } = await sb
      .from("system_ai_conversations")
      .select("*")
      .eq("admin_id", adminId)
      .order("last_message_at", { ascending: false });

    if (error) throw error;

    res.status(200).json({
      success: true,
      conversations: data || [],
    });
  } catch (error) {
    console.error("❌ Error fetching conversations:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ============================================================
// ENDPOINT 2: Create new conversation
// POST /api/system-ai/conversations
// Body: { adminId, title }
// ============================================================
router.post("/conversations", async (req, res) => {
  try {
    const sb = getSupabase();
    if (!sb) {
      return res.status(500).json({
        success: false,
        error: "Supabase is not configured. Please check .env file.",
      });
    }
    const { adminId, title } = req.body;

    if (!adminId) {
      return res.status(400).json({
        success: false,
        error: "adminId is required",
      });
    }

    const { data, error } = await sb
      .from("system_ai_conversations")
      .insert([
        {
          admin_id: adminId,
          title: title || "محادثة جديدة",
        },
      ])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      conversation: data,
    });
  } catch (error) {
    console.error("❌ Error creating conversation:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ============================================================
// ENDPOINT 2b: Update conversation title
// PATCH /api/system-ai/conversations/:conversationId
// Body: { title }
// ============================================================
router.patch("/conversations/:conversationId", async (req, res) => {
  try {
    const sb = getSupabase();
    if (!sb) {
      return res.status(500).json({
        success: false,
        error: "Supabase is not configured. Please check .env file.",
      });
    }

    const { conversationId } = req.params;
    const { title } = req.body || {};

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        error: "title is required",
      });
    }

    const cleanTitle = title.trim().slice(0, 100);

    const { data, error } = await sb
      .from("system_ai_conversations")
      .update({ title: cleanTitle, updated_at: new Date().toISOString() })
      .eq("id", conversationId)
      .select()
      .single();

    if (error) throw error;

    res.status(200).json({
      success: true,
      conversation: data,
    });
  } catch (error) {
    console.error("❌ Error updating conversation title:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ============================================================
// ENDPOINT 3: Get messages for a conversation
// GET /api/system-ai/conversations/:conversationId/messages
// ============================================================
router.get("/conversations/:conversationId/messages", async (req, res) => {
  try {
    const sb = getSupabase();
    if (!sb) {
      return res.status(500).json({
        success: false,
        error: "Supabase is not configured. Please check .env file.",
      });
    }
    const { conversationId } = req.params;

    const { data, error } = await sb
      .from("system_ai_messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (error) throw error;

    res.status(200).json({
      success: true,
      messages: data || [],
    });
  } catch (error) {
    console.error("❌ Error fetching messages:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ============================================================
// ENDPOINT 4: Send message (RAG Flow)
// POST /api/system-ai/conversations/:conversationId/messages
// Body: { message }
// ============================================================
router.post("/conversations/:conversationId/messages", async (req, res) => {
  try {
    const sb = getSupabase();
    if (!sb) {
      return res.status(500).json({ success: false, error: "Supabase is not configured. Please check .env file." });
    }
    if (!ENV.OPENAI_API_KEY) {
      return res.status(500).json({ success: false, error: "OpenAI API is not configured. Please check .env file." });
    }
    const { conversationId } = req.params;
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        error: "message is required",
      });
    }

    // 1️⃣ Save user message
    const { data: userMessage, error: userMessageError } = await sb
      .from("system_ai_messages")
      .insert([
        {
          conversation_id: conversationId,
          sender: "user",
          message: message,
        },
      ])
      .select()
      .single();

    if (userMessageError) throw userMessageError;

    // 2️⃣ Generate SQL query using OpenAI
    let sqlQuery;
    try {
      const systemPrompt = SYSTEM_PROMPT + "\n\n" + SYSTEM_SCHEMA_TEXT;
      const sqlResponse = await callOpenAI(message, systemPrompt);

      sqlQuery = sqlResponse.trim();

      // Clean up SQL query (remove markdown code blocks if present)
      sqlQuery = sqlQuery
        .replace(/```sql\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();

      // Remove trailing semicolon (Supabase exec_sql doesn't accept it)
      sqlQuery = sqlQuery.replace(/;+\s*$/g, "");

    } catch (aiError) {
      console.error("❌ OpenAI SQL Generation Error:", aiError);
      throw new Error("Failed to generate SQL query");
    }

    // 3️⃣ Execute SQL query on Supabase
    let queryResults = [];
    let queryError = null;

    try {
      const { data, error } = await sb.rpc("exec_sql", {
        sql_query: sqlQuery,
      });

      if (error) {
        queryError = error.message;
        console.error("❌ SQL Execution Error:", error);
      } else {
        queryResults = data || [];
      }
    } catch (execError) {
      queryError = execError.message;
      console.error("❌ SQL Execution Error:", execError);
    }

    // 4️⃣ Generate AI analysis using OpenAI
    let aiAnalysis;
    try {
      const analysisPrompt = `
SQL Query Executed:
${sqlQuery}

Query Results (JSON):
${JSON.stringify(queryResults, null, 2)}

${queryError ? `\nError during execution: ${queryError}` : ""}
`;

      aiAnalysis = await callOpenAI(analysisPrompt, SYSTEM_ANALYSIS_PROMPT);
      aiAnalysis = aiAnalysis.trim();
    } catch (aiError) {
      console.error("❌ OpenAI Analysis Error:", aiError);
      aiAnalysis = queryError
        ? `حدث خطأ أثناء تنفيذ الاستعلام: ${queryError}`
        : "تم تنفيذ الاستعلام بنجاح ولكن فشل التحليل.";
    }

    // 5️⃣ Save AI response
    const { data: aiMessage, error: aiMessageError } = await sb
      .from("system_ai_messages")
      .insert([
        {
          conversation_id: conversationId,
          sender: "ai",
          message: aiAnalysis,
          sql_query: sqlQuery,
          raw_result: queryResults,
        },
      ])
      .select()
      .single();

    if (aiMessageError) throw aiMessageError;

    // 6️⃣ Update conversation's last_message_at
    await sb
      .from("system_ai_conversations")
      .update({ last_message_at: new Date().toISOString() })
      .eq("id", conversationId);

    // 7️⃣ Return response
    res.status(200).json({
      success: true,
      userMessage,
      aiMessage,
      sqlQuery,
      queryResults,
    });
  } catch (error) {
    console.error("❌ Error in RAG flow:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ============================================================
// ENDPOINT 5: Delete conversation
// DELETE /api/system-ai/conversations/:conversationId
// ============================================================
router.delete("/conversations/:conversationId", async (req, res) => {
  try {
    const sb = getSupabase();
    if (!sb) {
      return res.status(500).json({
        success: false,
        error: "Supabase is not configured. Please check .env file.",
      });
    }
    const { conversationId } = req.params;

    const { error } = await sb
      .from("system_ai_conversations")
      .delete()
      .eq("id", conversationId);

    if (error) throw error;

    res.status(200).json({
      success: true,
      message: "Conversation deleted successfully",
    });
  } catch (error) {
    console.error("❌ Error deleting conversation:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
