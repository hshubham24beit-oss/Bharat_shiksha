import { Router, Request, Response } from "express";
import { authMiddleware } from "../auth.js";
import { ai, GEMINI_MODEL } from "../gemini.js";

const router = Router();

interface PodcastSegment {
  speaker: "host" | "teacher";
  speakerName: string;
  text: string;
  timestamp: string;
}

interface PodcastScript {
  title: string;
  introduction: string;
  segments: PodcastSegment[];
  conclusion: string;
  durationEstimate: string;
  keyTopics: string[];
}

router.post("/generate", authMiddleware, async (req: Request, res: Response) => {
  try {
    const { topic, language, style, documentContext, studentProfile } = req.body;

    if (!topic) {
      res.status(400).json({ error: "Topic is required" });
      return;
    }

    const langInstruction = language && language !== "English"
      ? `Respond in ${language} language. Mix English technical terms naturally.`
      : "Respond in English.";

    const styleInstruction = style === "quick"
      ? "Make it a 3-minute quick-fire podcast episode."
      : style === "deep-dive"
      ? "Make it a 15-minute deep-dive podcast episode with detailed explanations."
      : "Make it a 7-10 minute podcast episode.";

    const contextBlock = documentContext
      ? `\n\nDocument Context to base the lesson on:\n${documentContext}`
      : "";

    const prompt = `You are generating a podcast script for an educational podcast called "Shikshak Podcast" for Indian students.

Topic: ${topic}
${styleInstruction}
${langInstruction}
${contextBlock}

Generate a JSON podcast script with this EXACT structure:
{
  "title": "Episode title (catchy, educational)",
  "introduction": "Host intro (2-3 sentences setting up the topic)",
  "segments": [
    {
      "speaker": "host",
      "speakerName": "Prachi",
      "text": "Host dialogue introducing a concept or asking a question",
      "timestamp": "0:00"
    },
    {
      "speaker": "teacher",
      "speakerName": "Vikram Sir",
      "text": "Teacher explanation with examples, analogies, and formulas",
      "timestamp": "0:15"
    }
  ],
  "conclusion": "Wrap-up with key takeaways and teaser for next episode",
  "durationEstimate": "7 minutes",
  "keyTopics": ["topic1", "topic2", "topic3"]
}

Rules:
- Host (Prachi) asks student-like questions, expresses confusion, makes relatable analogies
- Teacher (Vikram Sir) explains clearly with Indian examples, daily life analogies
- Include at least 8-12 segments for a good conversation flow
- Use conversational Hindi-English mix (Hinglish) naturally
- Include mnemonic devices and memory tricks
- Add "Did you know?" moments
- Make timestamps sequential (estimate based on ~150 words per minute speaking pace)
- Return ONLY the JSON, no markdown formatting`;

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        temperature: 0.8,
        maxOutputTokens: 4096,
      },
    });

    const responseText = response.text || response.candidates?.[0]?.content?.parts?.[0]?.text || "";
    
    let podcast: PodcastScript;
    try {
      podcast = JSON.parse(responseText);
    } catch {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        podcast = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Could not parse podcast JSON");
      }
    }

    res.json({
      success: true,
      podcast,
      topic,
      language: language || "English",
    });
  } catch (error: any) {
    console.error("Podcast generation error:", error);
    res.status(500).json({ error: "Failed to generate podcast", details: error.message });
  }
});

router.post("/generate-audio-script", authMiddleware, async (req: Request, res: Response) => {
  try {
    const { topic, segments, language } = req.body;

    if (!segments || !Array.isArray(segments)) {
      res.status(400).json({ error: "Segments array is required" });
      return;
    }

    const audioScript = segments.map((seg: PodcastSegment, idx: number) => ({
      index: idx,
      speaker: seg.speaker,
      speakerName: seg.speakerName,
      text: seg.text,
      voiceConfig: seg.speaker === "host"
        ? { lang: language === "Hindi" ? "hi-IN" : "en-IN", rate: 0.95, pitch: 1.2, gender: "female" }
        : { lang: language === "Hindi" ? "hi-IN" : "en-IN", rate: 0.9, pitch: 0.95, gender: "male" },
      timestamp: seg.timestamp,
    }));

    res.json({
      success: true,
      script: audioScript,
      totalSegments: audioScript.length,
    });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to generate audio script" });
  }
});

export default router;
