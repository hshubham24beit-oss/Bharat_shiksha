import { Router } from "express";
import prisma from "../db.js";
import { authMiddleware, AuthRequest } from "../auth.js";
import { ai, GEMINI_MODEL } from "../gemini.js";
import { ragStore } from "../ragEngine.js";

const router = Router();

function cleanAndParseJSON(rawText: string, fallback: any = {}) {
  try {
    if (!rawText) return fallback;
    const cleaned = rawText
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();
    return JSON.parse(cleaned);
  } catch {
    try {
      const match = rawText.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
      if (match) return JSON.parse(match[0]);
    } catch {}
    return fallback;
  }
}

// Create new chat session
router.post("/session", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { topic, documentId, language, persona } = req.body;

    const session = await prisma.chatSession.create({
      data: {
        userId: req.userId!,
        topic: topic || "General STEM",
        documentId: documentId || null,
        language: language || "English",
        persona: persona || "vikram",
      },
    });

    res.json({ sessionId: session.id, topic: session.topic });
  } catch (error: any) {
    console.error("Create session error:", error);
    res.status(500).json({ error: "Failed to create session" });
  }
});

// Send message and get AI response
router.post("/message", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { sessionId, message, useRAG, selectedDocId } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    // Get or create session
    let session;
    if (sessionId) {
      session = await prisma.chatSession.findUnique({
        where: { id: sessionId },
        include: { messages: { orderBy: { createdAt: "asc" }, take: 20 } },
      });
    }

    if (!session) {
      session = await prisma.chatSession.create({
        data: {
          userId: req.userId!,
          topic: "General STEM",
          language: "English",
          persona: "vikram",
        },
        include: { messages: { orderBy: { createdAt: "asc" } } },
      });
    }

    // Get student profile
    const profile = await prisma.studentProfile.findUnique({
      where: { userId: req.userId },
    });

    const studentProfile = profile
      ? {
          name: req.user?.name || "Student",
          targetExam: profile.targetExam,
          learningStyle: profile.learningStyle,
          weakConcepts: JSON.parse(profile.weakConcepts || "[]"),
          strongConcepts: JSON.parse(profile.strongConcepts || "[]"),
          masteryLevel: profile.level,
        }
      : { name: req.user?.name || "Student" };

    // RAG context
    let ragContext = "";
    let citations: any[] = [];

    if (useRAG || selectedDocId) {
      const searchResults = ragStore.searchChunks(message || session.topic, selectedDocId || undefined, 3);
      if (searchResults.length > 0) {
        ragContext = searchResults
          .map((r, i) => `[Citation ${i + 1} from "${r.chunk.docTitle}" (Section: ${r.chunk.metadata.sectionTitle})]:\n${r.chunk.text}`)
          .join("\n\n");
        citations = searchResults.map((r, i) => ({
          id: i + 1,
          docTitle: r.chunk.docTitle,
          sectionTitle: r.chunk.metadata.sectionTitle,
          relevance: Math.round(r.score * 100),
          snippet: r.chunk.text.slice(0, 140) + "...",
        }));
      }
    }

    const systemPrompt = `You are Bharat Shikshak AI, an empathetic, world-class Socratic AI Teacher & Mentor.
Your goal is to teach like a master educator (Khan Academy clarity + Duolingo engagement + Coursera depth + Socratic pedagogy).

TEACHING PRINCIPLES:
1. Socratic & Adaptive: Break complex ideas into digestible bites. Do not lecture in walls of text.
2. Teach in: ${session.language}.
3. Connect abstract theory to vivid real-world Indian & universal analogies (cricket, Indian railways, UPI, cellular biology).
4. Use formatting: **Bold key terms**, KaTeX math ($F = ma$), Markdown lists.
5. Provide a "Check for Understanding" micro-question at the end.
6. If student is confused, re-explain using a different visual metaphor.

STUDENT PROFILE:
- Name: ${studentProfile.name}
- Target: ${studentProfile.targetExam || "CBSE/JEE/NEET"}
- Learning Style: ${studentProfile.learningStyle || "Socratic & Visual"}
- Weak Concepts: ${JSON.stringify(studentProfile.weakConcepts || [])}
- Strong Concepts: ${JSON.stringify(studentProfile.strongConcepts || [])}
- Level: ${studentProfile.masteryLevel || "Intermediate"}

${ragContext ? `GROUNDED CURRICULUM MATERIAL:\n${ragContext}\nReference this material and cite it.` : ""}
`;

    // Build conversation contents
    const formattedContents: any[] = [];
    formattedContents.push({
      role: "user",
      parts: [{ text: `[System Instruction]: ${systemPrompt}` }],
    });
    formattedContents.push({
      role: "model",
      parts: [{ text: `Namaste! I am ready to guide you step-by-step in ${session.language}. Let's learn together.` }],
    });

    // Add chat history
    if (session.messages) {
      session.messages.slice(-8).forEach((msg) => {
        formattedContents.push({
          role: msg.role === "user" ? "user" : "model",
          parts: [{ text: msg.content }],
        });
      });
    }

    formattedContents.push({
      role: "user",
      parts: [{ text: message }],
    });

    // Save user message
    await prisma.chatMessage.create({
      data: {
        sessionId: session.id,
        role: "user",
        content: message,
        citations: JSON.stringify(citations),
      },
    });

    // Call Gemini
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: formattedContents,
      config: { temperature: 0.7 },
    });

    const teacherReply = response.text || "Let's explore this step by step. What part would you like to start with?";

    // Save assistant message
    await prisma.chatMessage.create({
      data: {
        sessionId: session.id,
        role: "assistant",
        content: teacherReply,
        citations: JSON.stringify(citations),
      },
    });

    res.json({
      reply: teacherReply,
      sessionId: session.id,
      citations,
      suggestedQuestions: [
        "Can you give me a real-world example?",
        "Why does this happen mathematically?",
        "Test me on this with a quick question!",
        "Explain this in simpler terms",
      ],
    });
  } catch (error: any) {
    console.error("Chat error:", error);
    res.status(500).json({ error: error.message || "Failed to generate response" });
  }
});

// Get chat history
router.get("/history/:sessionId", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { sessionId } = req.params;

    const session = await prisma.chatSession.findFirst({
      where: { id: sessionId, userId: req.userId },
      include: { messages: { orderBy: { createdAt: "asc" } } },
    });

    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    res.json({
      session: {
        id: session.id,
        topic: session.topic,
        language: session.language,
        persona: session.persona,
      },
      messages: session.messages.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        citations: JSON.parse(m.citations || "[]"),
        createdAt: m.createdAt,
      })),
    });
  } catch (error: any) {
    console.error("Get history error:", error);
    res.status(500).json({ error: "Failed to get history" });
  }
});

// Get all chat sessions for user
router.get("/sessions", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const sessions = await prisma.chatSession.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: "desc" },
      include: { messages: { take: 1, orderBy: { createdAt: "desc" } } },
    });

    res.json({
      sessions: sessions.map((s) => ({
        id: s.id,
        topic: s.topic,
        language: s.language,
        persona: s.persona,
        messageCount: s.messages.length,
        createdAt: s.createdAt,
      })),
    });
  } catch (error: any) {
    console.error("Get sessions error:", error);
    res.status(500).json({ error: "Failed to get sessions" });
  }
});

export default router;
