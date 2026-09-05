import { Router } from "express";
import prisma from "../db.js";
import { authMiddleware, AuthRequest } from "../auth.js";
import { ai, GEMINI_MODEL } from "../gemini.js";

const router = Router();

export function cleanAndParseJSON(rawText: string, fallback: any = {}) {
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

async function fetchDocumentContent(docId: string) {
  const doc = await prisma.ingestedDocument.findUnique({
    where: { id: docId },
    include: { chunks: { orderBy: { chunkIndex: "asc" }, take: 30 } },
  });
  if (!doc) return { documentContent: "", documentTitle: "" };
  return {
    documentContent: doc.chunks.map((c) => c.text).join("\n\n"),
    documentTitle: doc.title,
  };
}

function documentBlock(documentContent: string, documentTitle: string) {
  return documentContent
    ? `\n\n=== SOURCE DOCUMENT ===\nTitle: ${documentTitle}\n\n${documentContent.slice(0, 8000)}\n\n=== END ===\n\nCRITICAL: Every question MUST test a concept that appears in the source document above. Do not invent questions from general knowledge if the document is provided.`
    : "";
}

// Generate quiz
router.post("/generate", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const {
      topic,
      docId,
      numberOfQuestions = 4,
      difficulty = "Adaptive (Medium-Hard)",
      language = "English",
      questionTypes = ["mcq", "numerical", "short_answer", "true_false"],
    } = req.body;

    if (!topic) {
      return res.status(400).json({ error: "Topic is required" });
    }

    let docContent = "";
    let docTitle = "";
    if (docId) {
      const result = await fetchDocumentContent(docId);
      docContent = result.documentContent;
      docTitle = result.documentTitle;
    }

    const count = Math.min(20, Math.max(1, numberOfQuestions));

    const prompt = `You are the Lead Examination & Assessment AI for Bharat Academix.
Create an adaptive, high-yield practice quiz for topic: "${topic}".
Number of questions: ${count}.
Difficulty: ${difficulty}.
Language: ${language}.
Requested Question Types: ${JSON.stringify(questionTypes)}.
${documentBlock(docContent, docTitle)}

Return STRICTLY a JSON object:
{
  "title": string,
  "topic": string,
  "totalTimeMinutes": number,
  "passingScorePercent": number,
  "questions": [
    {
      "id": string,
      "questionNumber": number,
      "type": "mcq" | "numerical" | "short_answer" | "true_false",
      "questionText": string (supports KaTeX e.g. $F = qE$),
      "options": string[] (for mcq, 4 items; for true_false, ["True", "False"]; for others, empty array),
      "correctAnswer": string,
      "solutionExplanation": string,
      "conceptTested": string,
      "difficulty": "Easy" | "Medium" | "Hard",
      "points": number,
      "xpReward": number,
      "misconceptionTriggers": {
        "distractor_option_text": "diagnostic note"
      }
    }
  ]
}`;

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: { responseMimeType: "application/json", temperature: 0.4 },
    });

    const quizData = cleanAndParseJSON(response.text || "{}", {
      title: `${topic} Adaptive Mastery Quiz`,
      topic,
      totalTimeMinutes: 10,
      passingScorePercent: 75,
      questions: [],
    });

    if (!quizData.title) quizData.title = `${topic} Quiz`;
    if (Array.isArray(quizData.questions)) {
      quizData.questions.forEach((q: any, i: number) => {
        if (!q.id) q.id = `q_${Date.now()}_${i + 1}`;
        if (!q.points) q.points = 100;
        if (!q.xpReward) q.xpReward = 30;
      });
    }

    // Persist quiz result with documentId
    await prisma.quizResult.create({
      data: {
        userId: req.userId!,
        topic,
        difficulty,
        totalQuestions: quizData.questions?.length || 0,
        correctAnswers: 0,
        scorePercent: 0,
        xpEarned: 0,
        questions: JSON.stringify(quizData.questions || []),
        ...(docId ? { documentId: docId } : {}),
      },
    });

    res.json({ ...quizData, documentId: docId || null });
  } catch (error: any) {
    console.error("Quiz generate error:", error);
    res.status(500).json({ error: error.message || "Failed to generate quiz" });
  }
});

// Submit quiz results (persist to DB)
router.post("/submit", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { topic, difficulty, questions, correctAnswers, totalQuestions, scorePercent, xpEarned, documentId } = req.body;

    const result = await prisma.quizResult.create({
      data: {
        userId: req.userId!,
        topic: topic || "General",
        difficulty: difficulty || "Medium",
        totalQuestions: totalQuestions || 0,
        correctAnswers: correctAnswers || 0,
        scorePercent: scorePercent || 0,
        xpEarned: xpEarned || 0,
        questions: JSON.stringify(questions || []),
        ...(documentId ? { documentId } : {}),
      },
    });

    // Update student profile XP and streak
    const profile = await prisma.studentProfile.findUnique({
      where: { userId: req.userId },
    });

    if (profile) {
      const newStreak = calculateStreak(profile.lastActiveAt, profile.streak);
      await prisma.studentProfile.update({
        where: { userId: req.userId },
        data: {
          xp: profile.xp + (xpEarned || 0),
          streak: newStreak,
          lastActiveAt: new Date(),
        },
      });
    }

    res.json({ success: true, resultId: result.id });
  } catch (error: any) {
    console.error("Quiz submit error:", error);
    res.status(500).json({ error: "Failed to save quiz results" });
  }
});

// Get quiz history
router.get("/history", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const results = await prisma.quizResult.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    res.json({
      quizzes: results.map((r) => ({
        id: r.id,
        topic: r.topic,
        difficulty: r.difficulty,
        totalQuestions: r.totalQuestions,
        correctAnswers: r.correctAnswers,
        scorePercent: r.scorePercent,
        xpEarned: r.xpEarned,
        createdAt: r.createdAt,
      })),
    });
  } catch (error: any) {
    console.error("Quiz history error:", error);
    res.status(500).json({ error: "Failed to get quiz history" });
  }
});

function calculateStreak(lastActive: Date, currentStreak: number): number {
  const now = new Date();
  const last = new Date(lastActive);
  const diffHours = (now.getTime() - last.getTime()) / (1000 * 60 * 60);

  if (diffHours < 24) return currentStreak;
  if (diffHours < 48) return currentStreak + 1;
  return 1; // Streak broken
}

export default router;
