import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));

// Lazy initializer for Gemini client
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// API Health Check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// AI Memory Reflection Endpoint
app.post("/api/memory/reflect", async (req, res) => {
  try {
    const { title, content, mood, tags, mediaTypes, location, date } = req.body;

    const ai = getGeminiClient();
    if (!ai) {
      // Return a graceful simulated poetic reflection if no API key is configured
      return res.json({
        success: true,
        reflection: `This memory captured on ${date || "a special day"} holds a ${mood || "reflective"} presence. The layers of ${mediaTypes?.join(", ") || "written notes"} preserve a sacred snapshot of time—a reminder of how feelings settle like soft light across our personal history.`,
        suggestedTags: ["Nostalgia", "Chronicle", mood || "Personal", "Echoes"].filter(Boolean),
        resonanceScore: 88,
        poeticSummary: `“Moments woven in quiet threads remain vibrant across time.”`,
        writingPrompt: `What would your future self cherish most about this exact moment?`,
        isOfflineFallback: true,
      });
    }

    const prompt = `You are a thoughtful memory curator and poetic archivist for a high-end personal memory journal app.
Analyze this user memory:
- Title: "${title || "Untitled Memory"}"
- Date: "${date || "Undated"}"
- Location: "${location || "Unspecified"}"
- Mood/Emotion: "${mood || "Neutral"}"
- Tags: "${(tags || []).join(", ")}"
- Attached Media Types: "${(mediaTypes || []).join(", ")}"
- Written Notes / Reflections:
"""
${content || "No detailed notes written yet."}
"""

Please provide a JSON response with:
1. "reflection": A deep, empathetic, and beautifully written 2-3 paragraph reflection or synthesis of this memory, highlighting sensory details, nostalgic value, and emotional depth.
2. "poeticSummary": A 1-2 line poetic quote capturing the essence of this memory.
3. "suggestedTags": An array of 3-5 evocative tags or categories.
4. "writingPrompt": A thoughtful journal prompt to help the author reflect deeper on this experience.
5. "resonanceScore": An integer from 70 to 100 representing the emotional warmth and resonance.
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("No text response from Gemini");
    }

    const parsed = JSON.parse(text);
    return res.json({
      success: true,
      ...parsed,
      isOfflineFallback: false,
    });
  } catch (error: any) {
    console.error("Gemini reflection error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to generate reflection",
    });
  }
});

// AI Memory Prompts Endpoint
app.post("/api/memory/prompts", async (req, res) => {
  try {
    const { category = "general" } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      const fallbackPrompts = [
        "What is a subtle sound or scent from this day you never want to forget?",
        "If this moment were a song or a painting, what atmosphere would it hold?",
        "Who shared this space with you, and what unspoken feeling was in the air?",
        "What tiny unexpected detail made you pause and take notice today?",
        "How has your perspective shifted since this moment took place?",
      ];
      return res.json({ success: true, prompts: fallbackPrompts });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: `Provide 5 evocative, deeply mindful journal prompts for curating a personal memory under category: "${category}". Return JSON array of strings under key "prompts".`,
      config: {
        responseMimeType: "application/json",
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    return res.json({ success: true, prompts: parsed.prompts || [] });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Memoria Notes server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
