import { Router } from "express";
import prisma from "../db.js";
import { authMiddleware, AuthRequest } from "../auth.js";
import { ai, GEMINI_MODEL } from "../gemini.js";

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

// Generate smart notes
router.post("/generate", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { topic, notesStyle = "Comprehensive Revision", language = "English", docId } = req.body;

    if (!topic) {
      return res.status(400).json({ error: "Topic is required" });
    }

    // Fetch document content if docId is provided
    let documentContent = "";
    let documentTitle = "";
    if (docId) {
      const doc = await prisma.ingestedDocument.findUnique({
        where: { id: docId },
        include: { chunks: { orderBy: { chunkIndex: "asc" }, take: 30 } },
      });
      if (doc) {
        documentTitle = doc.title;
        documentContent = doc.chunks.map((c) => c.text).join("\n\n");
      }
    }

    const documentBlock = documentContent
      ? `\n\n=== UPLOADED DOCUMENT CONTENT ===\nTitle: ${documentTitle}\n\n${documentContent.slice(0, 8000)}\n\n=== END DOCUMENT ===\n\nCRITICAL: The notes, flashcards, and cheat sheet MUST be based on the ABOVE document content. Extract key concepts, formulas, definitions, and examples DIRECTLY from the document.`
      : "";

    const prompt = `You are a Master Note-Taking & Spaced Repetition Engine for Bharat Academix.
Generate concise Notion-style smart revision notes, 6 high-yield Leitner flashcards, and a 1-page formula cheat sheet for "${topic}".
Language: ${language}.${documentBlock}

Return STRICTLY a JSON object:
{
  "topic": string,
  "topicTitle": string,
  "keyTakeaways": string[],
  "summaryNotesMarkdown": string (Rich Markdown with headers, bullet points, callout boxes, KaTeX math),
  "cheatSheetMarkdown": string (Clean Markdown cheat sheet with KaTeX formulas),
  "cheatSheet": {
    "keyFormulas": [{ "name": string, "formula": string, "where": string }],
    "goldenRules": string[],
    "commonPitfallsToAvoid": string[]
  },
  "flashcards": [
    {
      "id": string,
      "front": string,
      "back": string,
      "mnemonic": string,
      "category": string,
      "difficulty": "Easy" | "Medium" | "Hard"
    }
  ]
}`;

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: { responseMimeType: "application/json", temperature: 0.3 },
    });

    const notesData = cleanAndParseJSON(response.text || "{}", {
      topic,
      topicTitle: topic,
      keyTakeaways: [],
      summaryNotesMarkdown: "",
      cheatSheetMarkdown: "",
      cheatSheet: { keyFormulas: [], goldenRules: [], commonPitfallsToAvoid: [] },
      flashcards: [],
    });

    // Ensure consistent fields
    if (!notesData.topicTitle) notesData.topicTitle = topic;
    if (!notesData.topic) notesData.topic = topic;
    if (Array.isArray(notesData.flashcards)) {
      notesData.flashcards.forEach((fc: any, i: number) => {
        if (!fc.id) fc.id = `fc_${Date.now()}_${i + 1}`;
      });
    }

    // Save to database
    await prisma.smartNote.create({
      data: {
        userId: req.userId!,
        topic,
        content: JSON.stringify(notesData),
        noteType: "notes",
      },
    });

    // Update XP
    const profile = await prisma.studentProfile.findUnique({
      where: { userId: req.userId },
    });
    if (profile) {
      await prisma.studentProfile.update({
        where: { userId: req.userId },
        data: { xp: profile.xp + 20, lastActiveAt: new Date() },
      });
    }

    res.json(notesData);
  } catch (error: any) {
    console.error("Notes generate error:", error);
    res.status(500).json({ error: error.message || "Failed to generate notes" });
  }
});

// Get saved notes
router.get("/saved", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const notes = await prisma.smartNote.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    res.json({
      notes: notes.map((n) => ({
        id: n.id,
        topic: n.topic,
        noteType: n.noteType,
        content: JSON.parse(n.content || "{}"),
        createdAt: n.createdAt,
      })),
    });
  } catch (error: any) {
    console.error("Get notes error:", error);
    res.status(500).json({ error: "Failed to get notes" });
  }
});

// Generate video lecture script
router.post("/video/generate", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const {
      topic = "",
      language = "English",
      lectureStyle = "comprehensive",
      teacherPersona = "vikram",
      numberOfSlides = 5,
      docId,
    } = req.body;

    const effectiveTopic = topic || "Study Topic";
    const slideCount = Math.min(8, Math.max(3, numberOfSlides));

    const personaInstructions: Record<string, string> = {
      vikram: "Dr. Vikram AI: Socratic, rigorous, connects formulas to physical intuition.",
      ananya: "Prof. Ananya AI: Empathetic visual teacher, biological pathways, memory anchors.",
      chanakya: "Acharya Chanakya AI: Analytical strategist, first-principles logic.",
      tara: "Tara AI: Energetic peer mentor, Hinglish, exam shortcuts, mnemonics.",
    };
    const personaGuide = personaInstructions[teacherPersona] || personaInstructions.vikram;

    // Fetch document content if docId is provided
    let documentContent = "";
    let documentTitle = "";
    if (docId) {
      const doc = await prisma.ingestedDocument.findUnique({
        where: { id: docId },
        include: { chunks: { orderBy: { chunkIndex: "asc" }, take: 30 } },
      });
      if (doc) {
        documentTitle = doc.title;
        documentContent = doc.chunks.map((c) => c.text).join("\n\n");
      }
    }

    const documentBlock = documentContent
      ? `\n\n=== UPLOADED DOCUMENT CONTENT ===\nTitle: ${documentTitle}\n\n${documentContent.slice(0, 8000)}\n\n=== END DOCUMENT ===\n\nCRITICAL: The slides MUST be based on the ABOVE document content. Extract key concepts, formulas, definitions, processes, and examples DIRECTLY from the document. Do NOT generate generic content. Every slide should reference specific parts of this document.`
      : `\n\nNo specific document uploaded. Generate comprehensive slides on "${effectiveTopic}" using standard academic content.`;

    const prompt = `You are the Lead Video Producer & Pedagogical Scriptwriter for Bharat Academix AI.
You are embodying ${personaGuide}.
Create a synchronized ${slideCount}-slide interactive visual lecture for "${effectiveTopic}".
Language: ${language}. Style: ${lectureStyle}.
${documentBlock}

Each slide must have:
- "heading": Crisp title derived from the document content
- "bulletPoints": 3-4 bullet points with KaTeX notation, based on specific concepts from the document
- "voiceoverNarration": 3-5 sentences of natural spoken lecture explaining the document's concepts
- "diagramType": "mermaid" | "formula" | "badge" | "stats" | "callout"
- "diagramCode": Valid Mermaid graph or LaTeX equation from the document
- "feynmanAnalogy": Vivid real-life analogy for the document's concepts
- "socraticQuestion": 1-sentence thought experiment based on the document
- "keyTerms": 2-3 keywords from the document
- "checkpointQuiz": { "question": string, "options": string[], "answer": string, "explanation": string }
- "docCitation": { "sourceDocTitle": "${documentTitle || effectiveTopic}", "pageOrSection": "Relevant section from document", "snippet": "Exact quote or paraphrase from the document" }

Return STRICTLY a JSON object:
{
  "title": "${effectiveTopic} - AI Video Lecture",
  "lectureTitle": string,
  "totalDurationSeconds": number,
  "overview": string (summarizing what the lecture covers based on the document),
  "slides": [ ... ]
}`;

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: { responseMimeType: "application/json", temperature: 0.35 },
    });

    const videoData = cleanAndParseJSON(response.text || "{}", {
      title: `${effectiveTopic} - AI Video Lecture`,
      lectureTitle: `${effectiveTopic} - AI Video Lecture`,
      totalDurationSeconds: slideCount * 30,
      overview: `A structured visual masterclass on ${effectiveTopic}.`,
      slides: [],
    });

    // Ensure consistent fields
    if (!videoData.title) videoData.title = videoData.lectureTitle || `${effectiveTopic} Video`;
    if (Array.isArray(videoData.slides)) {
      videoData.slides.forEach((s: any, idx: number) => {
        if (!s.slideNumber) s.slideNumber = idx + 1;
        if (!s.heading && s.title) s.heading = s.title;
        if (!s.accentColor) {
          const colors = ["#6366f1", "#06b6d4", "#10b981", "#f59e0b", "#ec4899"];
          s.accentColor = colors[idx % colors.length];
        }
      });
    }

    // Save to database
    await prisma.videoSession.create({
      data: {
        userId: req.userId!,
        topic: effectiveTopic,
        documentId: docId || null,
        slideCount,
        content: JSON.stringify(videoData),
      },
    });

    // Update XP
    const profile = await prisma.studentProfile.findUnique({
      where: { userId: req.userId },
    });
    if (profile) {
      await prisma.studentProfile.update({
        where: { userId: req.userId },
        data: { xp: profile.xp + 30, lastActiveAt: new Date() },
      });
    }

    res.json(videoData);
  } catch (error: any) {
    console.error("Video generate error:", error);
    res.status(500).json({ error: error.message || "Failed to generate video lecture" });
  }
});

// Generate analytics report
router.post("/report/generate", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const profile = await prisma.studentProfile.findUnique({
      where: { userId: req.userId },
    });

    const quizResults = await prisma.quizResult.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    const studentProfile = profile
      ? {
          name: req.user?.name,
          targetExam: profile.targetExam,
          level: profile.level,
          xp: profile.xp,
          streak: profile.streak,
          totalStudyMinutes: profile.totalStudyMinutes,
          weakConcepts: JSON.parse(profile.weakConcepts || "[]"),
          strongConcepts: JSON.parse(profile.strongConcepts || "[]"),
        }
      : { name: req.user?.name };

    const recentSessions = quizResults.map((q) => ({
      topic: q.topic,
      score: q.scorePercent,
      date: q.createdAt,
      difficulty: q.difficulty,
    }));

    const prompt = `You are the Chief Academic Evaluator for Bharat Academix.
Generate a comprehensive mastery report for this student.

Student Profile: ${JSON.stringify(studentProfile)}
Recent Quiz Results: ${JSON.stringify(recentSessions)}

Return STRICTLY a JSON object:
{
  "studentName": string,
  "overallScore": number (out of 100),
  "masteryLevel": "Novice" | "Proficient" | "Master",
  "streakDays": number,
  "totalStudyHours": number,
  "subjectMasteryBreakdown": [
    { "subject": string, "score": number, "status": "Strong" | "Improving" | "Needs Attention" }
  ],
  "radarMetrics": [
    { "metric": string, "value": number }
  ],
  "topStrengths": string[],
  "weakAreas": string[],
  "aiRecommendations": [
    { "actionTitle": string, "reason": string, "priority": "High" | "Medium" }
  ],
  "weeklyStudyPlan": [
    { "day": string, "topic": string, "allocatedMinutes": number, "actionItem": string }
  ]
}`;

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: { responseMimeType: "application/json", temperature: 0.3 },
    });

    const reportData = cleanAndParseJSON(response.text || "{}", {
      studentName: req.user?.name || "Student",
      overallScore: 75,
      masteryLevel: "Proficient",
      streakDays: profile?.streak || 0,
      totalStudyHours: (profile?.totalStudyMinutes || 0) / 60,
      subjectMasteryBreakdown: [],
      radarMetrics: [],
      topStrengths: [],
      weakAreas: [],
      aiRecommendations: [],
      weeklyStudyPlan: [],
    });

    // Update study time
    if (profile) {
      await prisma.studentProfile.update({
        where: { userId: req.userId },
        data: { totalStudyMinutes: profile.totalStudyMinutes + 30, lastActiveAt: new Date() },
      });
    }

    res.json(reportData);
  } catch (error: any) {
    console.error("Report generate error:", error);
    res.status(500).json({ error: error.message || "Failed to generate report" });
  }
});

// Generate lesson plan
router.post("/lesson/generate", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { topic, gradeLevel = "Class 11-12 / College", language = "English", customGoal = "", docId } = req.body;

    if (!topic) {
      return res.status(400).json({ error: "Topic is required" });
    }

    // Fetch document content if docId is provided
    let documentContent = "";
    let documentTitle = "";
    if (docId) {
      const doc = await prisma.ingestedDocument.findUnique({
        where: { id: docId },
        include: { chunks: { orderBy: { chunkIndex: "asc" }, take: 30 } },
      });
      if (doc) {
        documentTitle = doc.title;
        documentContent = doc.chunks.map((c) => c.text).join("\n\n");
      }
    }

    const documentBlock = documentContent
      ? `\n\n=== UPLOADED DOCUMENT CONTENT ===\nTitle: ${documentTitle}\n\n${documentContent.slice(0, 8000)}\n\n=== END DOCUMENT ===\n\nCRITICAL: The lesson plan modules, concepts, and learning outcomes MUST be based on the ABOVE document content. Structure the curriculum around what's actually in the document.`
      : "";

    const prompt = `You are a Senior Curriculum Architect for Bharat Academix.
Create a comprehensive 4-to-6 module interactive lesson plan for: "${topic}".
Target: ${gradeLevel}. Language: ${language}.
${customGoal ? `Goal: ${customGoal}` : ""}${documentBlock}

Return STRICTLY a JSON object:
{
  "topicTitle": string,
  "subject": string,
  "difficultyLevel": "Beginner" | "Intermediate" | "Advanced",
  "estimatedTimeMinutes": number,
  "overview": string,
  "prerequisites": string[],
  "learningOutcomes": string[],
  "modules": [
    {
      "id": string,
      "moduleNumber": number,
      "title": string,
      "description": string,
      "estimatedMinutes": number,
      "keyConcepts": string[],
      "formulaOrKeywords": string[],
      "socraticPrompt": string
    }
  ]
}`;

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: { responseMimeType: "application/json", temperature: 0.4 },
    });

    const lessonData = cleanAndParseJSON(response.text || "{}", {
      topicTitle: topic,
      subject: "Science & Engineering",
      difficultyLevel: "Intermediate",
      estimatedTimeMinutes: 45,
      overview: `A comprehensive exploration of ${topic}.`,
      prerequisites: [],
      learningOutcomes: [],
      modules: [],
    });

    res.json(lessonData);
  } catch (error: any) {
    console.error("Lesson generate error:", error);
    res.status(500).json({ error: error.message || "Failed to generate lesson plan" });
  }
});

// Evaluate answer
router.post("/lesson/evaluate", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { conceptName, questionText, studentAnswer, language = "English" } = req.body;

    const prompt = `You are evaluating a student's answer.
Concept: "${conceptName}"
Question: "${questionText}"
Student Answer: "${studentAnswer}"
Language: ${language}

Evaluate with pedagogical warmth. Return STRICTLY JSON:
{
  "isCorrect": boolean,
  "scoreOutOf100": number,
  "feedback": string,
  "misconceptionDetected": string | null,
  "intuitiveCorrection": string,
  "adaptiveRecommendation": "increase" | "maintain" | "decrease",
  "xpEarned": number,
  "suggestedNextAction": "proceed" | "re_explain_visual" | "give_easier_example"
}`;

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: { responseMimeType: "application/json", temperature: 0.3 },
    });

    const evalData = cleanAndParseJSON(response.text || "{}", {
      isCorrect: true,
      scoreOutOf100: 80,
      feedback: "Good effort!",
      misconceptionDetected: null,
      intuitiveCorrection: "",
      adaptiveRecommendation: "maintain",
      xpEarned: 20,
      suggestedNextAction: "proceed",
    });

    // Update XP
    if (evalData.xpEarned) {
      const profile = await prisma.studentProfile.findUnique({
        where: { userId: req.userId },
      });
      if (profile) {
        await prisma.studentProfile.update({
          where: { userId: req.userId },
          data: { xp: profile.xp + evalData.xpEarned, lastActiveAt: new Date() },
        });
      }
    }

    res.json(evalData);
  } catch (error: any) {
    console.error("Evaluate error:", error);
    res.status(500).json({ error: error.message || "Failed to evaluate answer" });
  }
});

export default router;
