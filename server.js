import express from "express";
import cors from "cors";
import dotenv from "dotenv";


dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("✅ Backend OK - OpenRouter running");
});

app.post("/api/chat", async (req, res) => {
  try {
    const prompt = req.body.message;
    if (!prompt) {
      return res.status(400).json({ error: "Missing message" });
    }

    console.log("📨 Question:", prompt);

    const MODELS = [
      "tngtech/deepseek-r1t-chimera:free",
    ];

    let reply = null;
    let lastError = null;

    for (const model of MODELS) {
      try {
        console.log("🤖 Trying model:", model);

        const response = await fetch(
          "https://openrouter.ai/api/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
              "Content-Type": "application/json",
              "HTTP-Referer": "https://fillmate.app",
              "X-Title": "FillMate AI",
            },
            body: JSON.stringify({
              model,
              messages: [
                {
                  role: "system",
                  content:
                    "Bạn là trợ lý học tập Y Dược. Chỉ phục vụ mục đích giáo dục.",
                },
                { role: "user", content: prompt },
              ],
            }),
          }
        );

        const data = await response.json();

        reply = data?.choices?.[0]?.message?.content;
        if (reply) break;

      } catch (err) {
        lastError = err;
        console.warn("⚠️ Model failed:", model);
      }
    }

    if (!reply) {
      return res.status(500).json({
        error: "All models failed",
        detail: lastError?.message,
      });
    }

    // remove thinking tags
    reply = reply.replace(/<think>[\s\S]*?<\/think>/g, "").trim();

    res.json({ reply });

  } catch (err) {
    console.error("❌ Backend error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log("🔥 Backend running on port", PORT);
});
