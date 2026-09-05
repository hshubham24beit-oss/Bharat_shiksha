import express from "express";
import path from "path";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { createServer as createViteServer } from "vite";
import { ai, GEMINI_MODEL } from "./server/gemini.js";
import { ragStore, IngestedDocument } from "./server/ragEngine.js";

// Route imports
import authRoutes from "./server/routes/auth.js";
import ragRoutes from "./server/routes/rag.js";
import chatRoutes from "./server/routes/chat.js";
import quizRoutes from "./server/routes/quiz.js";
import contentRoutes from "./server/routes/content.js";
import ocrRoutes from "./server/routes/ocr.js";
import podcastRoutes from "./server/routes/podcast.js";
import diagramRoutes from "./server/routes/diagrams.js";
import studyPackRoutes from "./server/routes/studyPack.js";

const app = express();
const PORT = parseInt(process.env.PORT || "3001", 10);

// Security middleware
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: { error: "Too many requests, please try again later" },
});
app.use("/api/", limiter);

// Auth rate limiting (stricter)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: "Too many auth attempts, please try again later" },
});
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);

// ===== API ROUTES =====

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    platform: "Bharat Shikshak AI Teacher Platform",
    aiModel: GEMINI_MODEL,
    version: "3.0.0",
    hackathon: "Bharat Academix 2026",
  });
});

// Auth routes
app.use("/api/auth", authRoutes);

// RAG routes
app.use("/api/rag", ragRoutes);

// Chat routes
app.use("/api/chat", chatRoutes);

// Quiz routes
app.use("/api/quiz", quizRoutes);

// Content routes (notes, video, lessons, reports)
app.use("/api", contentRoutes);

// OCR routes (notes scanning)
app.use("/api/ocr", ocrRoutes);

// Podcast routes (audio generation)
app.use("/api/podcast", podcastRoutes);

// Diagram routes (flowchart generation)
app.use("/api/diagrams", diagramRoutes);

// Study Pack routes (unified document → study pack pipeline)
app.use("/api/study-pack", studyPackRoutes);

// ===== LEGACY ROUTES (backward compatibility) =====

function cleanAndParseJSON(rawText: string, fallback: any = {}) {
  try {
    if (!rawText) return fallback;
    const cleaned = rawText
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();
    return JSON.parse(cleaned);
  } catch (err) {
    try {
      const match = rawText.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
      if (match) return JSON.parse(match[0]);
    } catch {}
    return fallback;
  }
}

// Legacy chat endpoint (unauthenticated, for backward compatibility)
app.post("/api/chat/legacy", async (req, res) => {
  try {
    const { message, history = [], studentProfile = {}, activeTopic = "General STEM", language = "English", useRAG = false, selectedDocId = null } = req.body;

    let ragContext = "";
    let citations: any[] = [];

    if (useRAG || selectedDocId) {
      const searchResults = ragStore.searchChunks(message || activeTopic, selectedDocId || undefined, 3);
      if (searchResults.length > 0) {
        ragContext = searchResults.map((r, i) => `[Citation ${i + 1}]: ${r.chunk.text}`).join("\n\n");
        citations = searchResults.map((r, i) => ({
          id: i + 1, docTitle: r.chunk.docTitle, sectionTitle: r.chunk.metadata.sectionTitle,
          relevance: Math.round(r.score * 100), snippet: r.chunk.text.slice(0, 140) + "...",
        }));
      }
    }

    const systemPrompt = `You are Bharat Shikshak AI, an empathetic Socratic AI Teacher.
Teach in ${language}. Use KaTeX math, bold terms, Markdown lists.
Student: ${studentProfile.name || "Student"}, Target: ${studentProfile.targetExam || "CBSE/JEE/NEET"}
${ragContext ? `GROUNDED MATERIAL:\n${ragContext}` : ""}`;

    const formattedContents: any[] = [
      { role: "user", parts: [{ text: `[System]: ${systemPrompt}` }] },
      { role: "model", parts: [{ text: `Namaste! Ready to guide you in ${language}.` }] },
    ];

    if (Array.isArray(history)) {
      history.slice(-6).forEach((h: any) => {
        formattedContents.push({ role: h.role === "user" ? "user" : "model", parts: [{ text: h.content }] });
      });
    }

    formattedContents.push({ role: "user", parts: [{ text: message }] });

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL, contents: formattedContents, config: { temperature: 0.7 },
    });

    res.json({
      reply: response.text || "Let's explore this step by step.",
      citations,
      suggestedQuestions: ["Give me a real-world example?", "Why mathematically?", "Test me!", "Simpler terms?"],
    });
  } catch (error: any) {
    console.error("Legacy chat error:", error);
    res.status(500).json({ error: error.message || "Failed" });
  }
});

// Legacy lesson endpoints
app.post("/api/lesson/generate", async (req, res) => {
  try {
    const { topic, gradeLevel = "Class 11-12", language = "English", customGoal = "" } = req.body;
    const prompt = `Create a 4-6 module lesson plan for "${topic}". Target: ${gradeLevel}. Language: ${language}. ${customGoal ? `Goal: ${customGoal}` : ""}
Return JSON: { "topicTitle": string, "subject": string, "difficultyLevel": string, "estimatedTimeMinutes": number, "overview": string, "prerequisites": string[], "learningOutcomes": string[], "modules": [{ "id": string, "moduleNumber": number, "title": string, "description": string, "estimatedMinutes": number, "keyConcepts": string[], "formulaOrKeywords": string[], "socraticPrompt": string }] }`;

    const response = await ai.models.generateContent({ model: GEMINI_MODEL, contents: prompt, config: { responseMimeType: "application/json", temperature: 0.4 } });
    res.json(cleanAndParseJSON(response.text || "{}", { topicTitle: topic, modules: [] }));
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});

app.post("/api/lesson/step", async (req, res) => {
  try {
    const { topicTitle, moduleTitle, conceptName, stepNumber = 1, totalSteps = 4, language = "English", difficulty = "Intermediate", previousEvaluation = null, docId = null, teacherPersona = "vikram" } = req.body;

    let ragContext = "";
    if (docId) { const r = ragStore.searchChunks(conceptName || topicTitle || "", docId, 3); if (r.length > 0) ragContext = r.map(x => x.chunk.text).join("\n\n"); }

    const prompt = `Teaching "${conceptName}" in module "${moduleTitle}" of "${topicTitle}". Step ${stepNumber}/${totalSteps}. Difficulty: ${difficulty}. Language: ${language}. ${ragContext ? `\nSOURCE:\n${ragContext}` : ""} ${previousEvaluation ? `\nPrev eval: ${JSON.stringify(previousEvaluation)}` : ""}
Return JSON: { "conceptName": string, "stepNumber": number, "title": string, "explanationMarkdown": string, "analogy": string, "diagramType": "mermaid"|"ascii"|"chart"|"formula", "diagramCode": string, "diagramCaption": string, "keyTakeaway": string, "checkpointQuestion": { "questionText": string, "questionType": "mcq"|"short_answer", "options": string[], "hint": string } }`;

    const response = await ai.models.generateContent({ model: GEMINI_MODEL, contents: prompt, config: { responseMimeType: "application/json", temperature: 0.5 } });
    res.json(cleanAndParseJSON(response.text || "{}", { conceptName, stepNumber, title: conceptName }));
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});

// Legacy document teaching
app.post("/api/teach/document-session", async (req, res) => {
  try {
    const { docId, documentTitle = "Document", studentProfile = {}, teacherPersona = "vikram", language = "English" } = req.body;
    let docSummary = "", extractedText = documentTitle, title = documentTitle, citations: any[] = [];
    if (docId) {
      const doc = ragStore.getDocument(docId);
      if (doc) { title = doc.title; docSummary = doc.summary; const c = ragStore.getChunksForDocument(docId); if (c.length > 0) { extractedText = c.map(x => x.text).join("\n\n").slice(0, 10000); } }
    }
    const prompt = `Generate a 4-step Socratic teaching sequence from "${title}". Summary: ${docSummary}. Content: ${extractedText.slice(0, 6000)}. Language: ${language}.
Return JSON: { "docTitle": string, "teacherGreeting": string, "overview": string, "keyTopics": string[], "keyFormulas": string[], "steps": [{ "stepNumber": number, "conceptName": string, "title": string, "explanationMarkdown": string, "analogy": string, "diagramType": string, "diagramCode": string, "diagramCaption": string, "keyTakeaway": string, "checkpointQuestion": { "questionText": string, "questionType": string, "options": string[], "hint": string } }] }`;
    const response = await ai.models.generateContent({ model: GEMINI_MODEL, contents: prompt, config: { responseMimeType: "application/json", temperature: 0.4 } });
    res.json({ ...cleanAndParseJSON(response.text || "{}", { docTitle: title, steps: [] }), docId: docId || "custom", citations });
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});

app.post("/api/teach/simplify-concept", async (req, res) => {
  try {
    const { conceptName = "Concept", rawText = "", docTitle = "Document", language = "English", explanationStyle = "feynman" } = req.body;
    const prompt = `Simplify "${conceptName}" from "${docTitle}" in ${language} using ${explanationStyle} style. Context: ${rawText.slice(0, 3000)}.
Return JSON: { "conceptName": string, "style": string, "avatarGreeting": string, "simpleExplanation": string, "feynmanPoints": string[], "everydayAnalogy": string, "mentalModelPicture": string, "commonExamTrap": string, "plainEnglishFormula": string, "avatarPromptQuestion": string }`;
    const response = await ai.models.generateContent({ model: GEMINI_MODEL, contents: prompt, config: { responseMimeType: "application/json", temperature: 0.4 } });
    res.json(cleanAndParseJSON(response.text || "{}", { conceptName }));
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});

// Legacy quiz
app.post("/api/quiz/generate-legacy", async (req, res) => {
  try {
    const { topic, numberOfQuestions = 4, difficulty = "Medium", language = "English", questionTypes = ["mcq"] } = req.body;
    const prompt = `Create ${numberOfQuestions} quiz questions for "${topic}". Difficulty: ${difficulty}. Language: ${language}. Types: ${JSON.stringify(questionTypes)}.
Return JSON: { "title": string, "topic": string, "questions": [{ "id": string, "type": string, "questionText": string, "options": string[], "correctAnswer": string, "solutionExplanation": string, "conceptTested": string, "difficulty": string, "points": number, "xpReward": number }] }`;
    const response = await ai.models.generateContent({ model: GEMINI_MODEL, contents: prompt, config: { responseMimeType: "application/json", temperature: 0.4 } });
    res.json(cleanAndParseJSON(response.text || "{}", { title: `${topic} Quiz`, questions: [] }));
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});

// Legacy notes
app.post("/api/notes/generate-legacy", async (req, res) => {
  try {
    const { topic, language = "English" } = req.body;
    const prompt = `Generate smart notes, 6 flashcards, and a cheat sheet for "${topic}" in ${language}.
Return JSON: { "topic": string, "topicTitle": string, "keyTakeaways": string[], "summaryNotesMarkdown": string, "cheatSheetMarkdown": string, "flashcards": [{ "id": string, "front": string, "back": string, "mnemonic": string, "category": string, "difficulty": string }] }`;
    const response = await ai.models.generateContent({ model: GEMINI_MODEL, contents: prompt, config: { responseMimeType: "application/json", temperature: 0.3 } });
    res.json(cleanAndParseJSON(response.text || "{}", { topic }));
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});

// Legacy video
app.post("/api/video/generate-legacy", async (req, res) => {
  try {
    const { topic = "Topic", language = "English", numberOfSlides = 5, lectureStyle = "comprehensive", teacherPersona = "vikram" } = req.body;
    const slideCount = Math.min(8, Math.max(3, numberOfSlides));
    const prompt = `Create a ${slideCount}-slide video lecture for "${topic}" in ${language}. Style: ${lectureStyle}. Persona: ${teacherPersona}.
Each slide: heading, bulletPoints, voiceoverNarration, diagramType, diagramCode, feynmanAnalogy, socraticQuestion, keyTerms, checkpointQuiz.
Return JSON: { "title": string, "lectureTitle": string, "totalDurationSeconds": number, "overview": string, "slides": [{ "slideNumber": number, "title": string, "heading": string, "bulletPoints": string[], "voiceoverNarration": string, "diagramType": string, "diagramCode": string, "accentColor": string, "feynmanAnalogy": string, "socraticQuestion": string, "keyTerms": string[], "checkpointQuiz": { "question": string, "options": string[], "answer": string, "explanation": string } }] }`;
    const response = await ai.models.generateContent({ model: GEMINI_MODEL, contents: prompt, config: { responseMimeType: "application/json", temperature: 0.35 } });
    res.json(cleanAndParseJSON(response.text || "{}", { title: `${topic} Video Lecture`, slides: [] }));
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});

app.post("/api/video/ask-doubt", async (req, res) => {
  try {
    const { question, slideHeading, slideContent, lectureTitle, language = "English" } = req.body;
    const prompt = `Student asks about "${slideHeading}" during lecture "${lectureTitle}": "${question}" in ${language}. Answer in 2-3 paragraphs with KaTeX math.
Return JSON: { "answer": string, "spokenExplanation": string, "relatedConcept": string, "suggestedFollowUp": string }`;
    const response = await ai.models.generateContent({ model: GEMINI_MODEL, contents: prompt, config: { responseMimeType: "application/json", temperature: 0.4 } });
    res.json(cleanAndParseJSON(response.text || "{}", { answer: "Great question!" }));
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});

// Legacy report
app.post("/api/report/generate-legacy", async (req, res) => {
  try {
    const { studentProfile = {}, recentSessions = [] } = req.body;
    const prompt = `Generate a mastery report. Profile: ${JSON.stringify(studentProfile)}. Sessions: ${JSON.stringify(recentSessions)}.
Return JSON: { "studentName": string, "overallScore": number, "masteryLevel": string, "radarMetrics": [{ "metric": string, "value": number }], "topStrengths": string[], "weakAreas": string[], "aiRecommendations": [{ "actionTitle": string, "reason": string, "priority": string }] }`;
    const response = await ai.models.generateContent({ model: GEMINI_MODEL, contents: prompt, config: { responseMimeType: "application/json", temperature: 0.3 } });
    res.json(cleanAndParseJSON(response.text || "{}", { studentName: "Student" }));
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});

// Document upload (text-based, for backward compatibility)
app.post("/api/upload-text", async (req, res) => {
  try {
    const { title, textContent, fileType = "txt" } = req.body;
    if (!title || !textContent) return res.status(400).json({ error: "Title and text required" });

    const docId = `doc_${Date.now()}`;
    const chunks = ragStore.chunkText(textContent, docId, title, 350, 60);

    let summary = `Document with ${chunks.length} chunks.`;
    let keyTopics = ["General"];
    try {
      const r = await ai.models.generateContent({ model: GEMINI_MODEL, contents: `Summarize: "${textContent.slice(0, 1500)}"\nReturn JSON: {"summary": string, "keyTopics": string[]}`, config: { responseMimeType: "application/json" } });
      const p = JSON.parse(r.text || "{}"); if (p.summary) summary = p.summary; if (p.keyTopics) keyTopics = p.keyTopics;
    } catch {}

    const ingestedDoc: IngestedDocument = { id: docId, title, fileType: fileType as any, uploadedAt: new Date().toISOString(), totalChunks: chunks.length, fileSizeBytes: textContent.length * 2, summary, keyTopics };
    ragStore.addDocument(ingestedDoc, chunks);

    res.json({ success: true, document: ingestedDoc, chunkSample: chunks.slice(0, 2), message: `Indexed ${chunks.length} chunks` });
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});

// RAG document operations (in-memory, for backward compatibility)
app.get("/api/rag/documents-legacy", (req, res) => {
  res.json({ documents: ragStore.getDocuments() });
});

app.post("/api/rag/query-legacy", (req, res) => {
  try {
    const { query, docId, topK = 4 } = req.body;
    if (!query) return res.status(400).json({ error: "Query required" });
    const results = ragStore.searchChunks(query, docId, topK);
    res.json({ query, resultsCount: results.length, chunks: results.map((r, i) => ({ rank: i + 1, id: r.chunk.id, docTitle: r.chunk.docTitle, sectionTitle: r.chunk.metadata.sectionTitle, score: Math.round(r.score * 100), text: r.chunk.text })) });
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});

app.delete("/api/rag/document-legacy/:id", (req, res) => {
  const { id } = req.params;
  ragStore.deleteDocument(id);
  res.json({ success: true });
});

// ===== VITE MIDDLEWARE =====
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`\n🎓 Bharat Shikshak AI Teacher Platform v3.0`);
    console.log(`   Server: http://localhost:${PORT}`);
    console.log(`   AI Model: ${GEMINI_MODEL}`);
    console.log(`   Database: SQLite + Prisma ORM`);
    console.log(`   Auth: JWT-based authentication\n`);
  });
}

startServer();
