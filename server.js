import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { OpenRouter } from "@openrouter/sdk";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// 🔑 OpenRouter client
const openrouter = new OpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

// ✅ Health check
app.get("/", (req, res) => {
  res.send("✅ Backend OK - OpenRouter is running");
});

// 🧠 AI học Y Dược
app.post("/api/chat", async (req, res) => {
  try {
    const prompt = req.body.message || req.body.prompt;
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
`;

    // ❌ KHÔNG STREAM
    const completion = await openrouter.chat.send({
      model: "deepseek/deepseek-r1-0528:free",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ],
    });

    let reply =
      completion.choices?.[0]?.message?.content ??
      "AI không trả lời được 😢";

    // 🧹 Lọc think token
    reply = reply.replace(/<think>[\s\S]*?<\/think>/g, "").trim();

    console.log("🤖 Reply:", reply);

    res.json({ reply });

  } catch (err) {
    console.error("❌ OpenRouter ERROR:", err);
    res.status(500).json({ error: "AI lỗi rồi 😭" });
  }
});

// 🚀 Start server

const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🔥 Backend running on all interfaces :${PORT}`);
});
