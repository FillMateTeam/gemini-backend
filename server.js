import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import axios from "axios";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("✅ Backend OK - server.js is running");
});

app.post("/api/chat", async (req, res) => {
  try {
    const prompt = req.body.prompt || req.body.message;
    console.log("📨 Received:", prompt);
    if (!prompt) {
      return res.status(400).json({ error: "Thiếu prompt" });
    }

    console.log("🔑 HF_KEY:", process.env.HF_API_KEY?.slice(0, 10));
    const hfRes = await axios.post(
      "https://router.huggingface.co/hf-inference/models/google/gemma-2b-it",
      {
        inputs: prompt,
        parameters: {
          max_new_tokens: 200,
          temperature: 0.7,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.HF_API_KEY}`,
          "Content-Type": "application/json",
        },
        timeout: 60000, // cold start
      }
    );

    let reply = "";

    if (Array.isArray(hfRes.data)) {
      reply = hfRes.data[0]?.generated_text ?? "AI không trả lời";
    } else if (hfRes.data.generated_text) {
      reply = hfRes.data.generated_text;
    } else {
      reply = JSON.stringify(hfRes.data);
    }

    res.json({ reply });

  } catch (err) {
    console.error("❌ HF ERROR:", err.response?.data || err.message);
    res.status(500).json({
      error: err.response?.data || err.message,
    });
  }
});

app.listen(3000, () => {
  console.log("🔥 Backend running at http://localhost:3000");
});
