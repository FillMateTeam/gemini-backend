import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { OpenRouter } from "@openrouter/sdk";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// =====================
// OpenRouter client
// =====================
const openrouter = new OpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

if (!process.env.OPENROUTER_API_KEY) {
  console.error("❌ OPENROUTER_API_KEY is missing");
}

// =====================
// Utils: extract reply (IMPORTANT)
// =====================
function extractReply(content) {
  if (!content) return null;

  // Case 1: string
  if (typeof content === "string") {
    return content.trim();
  }

  // Case 2: array (thinking / reasoning models)
  if (Array.isArray(content)) {
    return content
      .map((c) => c?.text || "")
      .join("\n")
      .trim();
  }

  return null;
}

// =====================
// Health check
// =====================
app.get("/", (req, res) => {
  res.send("✅ Backend OK - OpenRouter ready");
});

// =====================
// Chat API
// =====================
app.post("/api/chat", async (req, res) => {
  try {
    const prompt = req.body?.message || req.body?.prompt;

    if (!prompt) {
      return res.status(400).json({ error: "Thiếu nội dung câu hỏi" });
    }

    console.log("📨 Question:", prompt);

    const systemPrompt = `
Bạn là trợ lý học tập Y Dược.
Chỉ trả lời với mục đích GIÁO DỤC.
Không đưa liều dùng điều trị cụ thể.
Không chẩn đoán hay thay thế bác sĩ.
Giải thích rõ ràng, dễ hiểu, có cơ chế.
`.trim();

    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: prompt },
    ];

    // 👉 Model list (ổn định trước, thinking sau)
    const MODELS = [
       "tngtech/deepseek-r1t-chimera:free",
    ];

    let reply = null;
    let lastError = null;

    for (const model of MODELS) {
      try {
        console.log(`🤖 Trying model: ${model}`);

        const completion =
          await openrouter.chat.completions.create({
            model,
            messages,
          });

        reply = extractReply(
          completion?.choices?.[0]?.message?.content
        );

        // Remove <think> if any
        if (reply) {
          reply = reply
            .replace(/<think>[\s\S]*?<\/think>/g, "")
            .trim();

          if (reply) break;
        }
      } catch (err) {
        lastError = err;
        console.warn(`⚠️ Model failed: ${model}`);
        console.error(
          err?.error?.message || err?.message || err
        );
      }
    }

    if (!reply) {
      console.error("❌ All models failed", lastError);
      return res.status(500).json({
        error: "AI không phản hồi được",
        detail:
          lastError?.error?.message ||
          lastError?.message ||
          "Unknown error",
      });
    }

    console.log("✅ Reply OK");
    res.json({ reply });
  } catch (err) {
    console.error(
      "❌ Backend CRASH:",
      err?.error?.message || err?.message || err
    );
    res.status(500).json({
      error:
        err?.error?.message ||
        err?.message ||
        "Backend error",
    });
  }
});

// =====================
// Start server (Render)
// =====================
const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🔥 Backend running on port ${PORT}`);
});
