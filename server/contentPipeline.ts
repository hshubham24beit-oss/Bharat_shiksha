import prisma from "./db.js";
import { ai, GEMINI_MODEL } from "./gemini.js";
import { generateDiagramForDoc } from "./routes/diagrams.js";
import { renderVideoFromScript } from "./videoRenderer.js";

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

async function fetchDocumentContent(docId: string) {
  const doc = await prisma.ingestedDocument.findUnique({
    where: { id: docId },
    include: { chunks: { orderBy: { chunkIndex: "asc" }, take: 30 } },
  });
  if (!doc) return { documentContent: "", documentTitle: "", doc: null };
  return {
    documentContent: doc.chunks.map((c) => c.text).join("\n\n"),
    documentTitle: doc.title,
    doc,
  };
}

// ─── Notes Generator ───
async function generateNotesForDoc(userId: string, docId: string) {
  const { documentContent, documentTitle } = await fetchDocumentContent(docId);

  const documentBlock = documentContent
    ? `\n\n=== UPLOADED DOCUMENT CONTENT ===\nTitle: ${documentTitle}\n\n${documentContent.slice(0, 8000)}\n\n=== END DOCUMENT ===\n\nCRITICAL: The notes, flashcards, and cheat sheet MUST be based on the ABOVE document content. Extract key concepts, formulas, definitions, and examples DIRECTLY from the document.`
    : "";

  const prompt = `You are a Master Note-Taking & Spaced Repetition Engine for Bharat Academix.
Generate concise Notion-style smart revision notes, 6 high-yield Leitner flashcards, and a 1-page formula cheat sheet for "${documentTitle}".
Language: English.${documentBlock}

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
    topic: documentTitle,
    topicTitle: documentTitle,
    keyTakeaways: [],
    summaryNotesMarkdown: "",
    cheatSheetMarkdown: "",
    cheatSheet: { keyFormulas: [], goldenRules: [], commonPitfallsToAvoid: [] },
    flashcards: [],
  });

  if (!notesData.topicTitle) notesData.topicTitle = documentTitle;
  if (!notesData.topic) notesData.topic = documentTitle;

  const note = await prisma.smartNote.create({
    data: { userId, topic: documentTitle, content: JSON.stringify(notesData), noteType: "notes" },
  });

  return note;
}

// ─── Quiz Generator ───
async function generateQuizForDoc(userId: string, docId: string) {
  const { documentContent, documentTitle } = await fetchDocumentContent(docId);

  const documentBlock = documentContent
    ? `\n\n=== SOURCE DOCUMENT ===\nTitle: ${documentTitle}\n\n${documentContent.slice(0, 8000)}\n\n=== END ===\n\nCRITICAL: Every question MUST test a concept that appears in the source document above.`
    : "";

  const prompt = `You are the Lead Examination & Assessment AI for Bharat Academix.
Create an adaptive, high-yield practice quiz for topic: "${documentTitle}".
Number of questions: 6.
Difficulty: Adaptive (Medium-Hard).
Language: English.
${documentBlock}

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
      "questionText": string,
      "options": string[],
      "correctAnswer": string,
      "solutionExplanation": string,
      "conceptTested": string,
      "difficulty": "Easy" | "Medium" | "Hard",
      "points": number,
      "xpReward": number,
      "misconceptionTriggers": { "distractor_option_text": "diagnostic note" }
    }
  ]
}`;

  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: prompt,
    config: { responseMimeType: "application/json", temperature: 0.4 },
  });

  const quizData = cleanAndParseJSON(response.text || "{}", {
    title: `${documentTitle} Quiz`,
    topic: documentTitle,
    totalTimeMinutes: 10,
    passingScorePercent: 75,
    questions: [],
  });

  if (!quizData.title) quizData.title = `${documentTitle} Quiz`;
  if (Array.isArray(quizData.questions)) {
    quizData.questions.forEach((q: any, i: number) => {
      if (!q.id) q.id = `q_${Date.now()}_${i + 1}`;
      if (!q.points) q.points = 100;
      if (!q.xpReward) q.xpReward = 30;
    });
  }

  const result = await prisma.quizResult.create({
    data: {
      userId,
      topic: documentTitle,
      difficulty: "Medium",
      totalQuestions: quizData.questions?.length || 0,
      correctAnswers: 0,
      scorePercent: 0,
      xpEarned: 0,
      questions: JSON.stringify(quizData.questions || []),
      documentId: docId,
    },
  });

  return result;
}

// ─── Video Lecture Script Generator ───
async function generateVideoForDoc(userId: string, docId: string) {
  const { documentContent, documentTitle } = await fetchDocumentContent(docId);

  const documentBlock = documentContent
    ? `\n\n=== UPLOADED DOCUMENT CONTENT ===\nTitle: ${documentTitle}\n\n${documentContent.slice(0, 8000)}\n\n=== END DOCUMENT ===\n\nCRITICAL: The slides MUST be based on the ABOVE document content. Extract key concepts, formulas, definitions, processes, and examples DIRECTLY from the document.`
    : "";

  const prompt = `You are the Lead Video Producer & Pedagogical Scriptwriter for Bharat Academix AI.
Create a synchronized 5-slide interactive visual lecture for "${documentTitle}".
Language: English. Style: comprehensive.
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

Return STRICTLY a JSON object:
{
  "title": "${documentTitle} - AI Video Lecture",
  "lectureTitle": string,
  "totalDurationSeconds": number,
  "overview": string,
  "slides": [ ... ]
}`;

  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: prompt,
    config: { responseMimeType: "application/json", temperature: 0.5 },
  });

  const videoData = cleanAndParseJSON(response.text || "{}", {
    title: `${documentTitle} - AI Video Lecture`,
    lectureTitle: documentTitle,
    totalDurationSeconds: 300,
    overview: "",
    slides: [],
  });

  const session = await renderVideoFromScript(videoData, docId, userId);
  return session;
}

// ─── Main Orchestrator ───
export async function generateStudyPack(userId: string, docId: string) {
  const doc = await prisma.ingestedDocument.findUnique({ where: { id: docId } });
  if (!doc) throw new Error("Document not found");

  // Run fast generators concurrently (notes, quiz, diagram)
  const [note, quiz, diagram] = await Promise.all([
    generateNotesForDoc(userId, docId),
    generateQuizForDoc(userId, docId),
    generateDiagramForDoc(userId, docId),
  ]);

  // Video script generation (slightly slower due to larger prompt)
  const videoSessionId = await generateVideoForDoc(userId, docId);

  // Create the study pack linking all four outputs
  const pack = await prisma.studyPack.create({
    data: {
      userId,
      documentId: docId,
      notesId: note.id,
      quizId: quiz.id,
      diagramId: diagram.id,
      videoSessionId,
      videoStatus: "ready",
    },
  });

  return pack;
}
