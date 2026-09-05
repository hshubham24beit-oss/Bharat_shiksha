import { Router } from "express";
import multer from "multer";
import prisma from "../db.js";
import { authMiddleware, AuthRequest } from "../auth.js";
import { ragStore, IngestedDocument } from "../ragEngine.js";

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });

// Extract text from uploaded file (PDF, DOCX, TXT)
router.post("/extract-text", authMiddleware, upload.single("file"), async (req: AuthRequest, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "No file uploaded" });
      return;
    }

    const { originalname, buffer, mimetype } = req.file;
    let extractedText = "";

    if (mimetype === "application/pdf" || originalname.endsWith(".pdf")) {
      const pdfParse = (await import("pdf-parse")).default;
      const pdfData = await pdfParse(buffer);
      extractedText = pdfData.text || "";
    } else if (
      mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      originalname.endsWith(".docx") ||
      originalname.endsWith(".doc")
    ) {
      const mammoth = await import("mammoth");
      const result = await mammoth.extractRawText({ buffer });
      extractedText = result.value || "";
    } else if (
      mimetype === "application/vnd.openxmlformats-officedocument.presentationml.presentation" ||
      originalname.endsWith(".pptx") ||
      originalname.endsWith(".ppt")
    ) {
      // PPTX: try mammoth fallback, or return metadata
      try {
        const mammoth = await import("mammoth");
        const result = await mammoth.extractRawText({ buffer });
        extractedText = result.value || "";
      } catch {
        extractedText = `[Presentation: ${originalname}] Content requires specialized PPTX parser.`;
      }
    } else if (mimetype.startsWith("text/") || originalname.endsWith(".txt") || originalname.endsWith(".md")) {
      extractedText = buffer.toString("utf-8");
    } else {
      extractedText = `[Document: ${originalname}] File type ${mimetype} recognized.`;
    }

    // Clean up excessive whitespace
    extractedText = extractedText.replace(/\n{3,}/g, "\n\n").trim();

    const wordCount = extractedText.split(/\s+/).filter(Boolean).length;

    res.json({
      success: true,
      text: extractedText,
      fileName: originalname,
      fileType: mimetype,
      wordCount,
      charCount: extractedText.length,
    });
  } catch (error: any) {
    console.error("Text extraction error:", error);
    res.status(500).json({ error: "Failed to extract text", details: error.message });
  }
});

// Upload via text content
router.post("/upload", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { title, textContent, fileType = "txt" } = req.body;

    if (!title || !textContent) {
      return res.status(400).json({ error: "Title and text content are required" });
    }

    const docId = `doc_${Date.now()}`;
    const chunks = ragStore.chunkText(textContent, docId, title, 350, 60);

    let summary = `Document with ${chunks.length} indexed chunks.`;
    let keyTopics = ["General Topics"];

    try {
      const { ai, GEMINI_MODEL } = await import("../gemini.js");
      const summaryPrompt = `Analyze this document excerpt and provide a 2-sentence summary and 5 key topic tags:\n"${textContent.slice(0, 1500)}"\n\nReturn JSON: {"summary": string, "keyTopics": string[]}`;
      const summaryRes = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: summaryPrompt,
        config: { responseMimeType: "application/json" },
      });
      const parsed = JSON.parse(summaryRes.text || "{}");
      if (parsed.summary) summary = parsed.summary;
      if (parsed.keyTopics) keyTopics = parsed.keyTopics;
    } catch (e) {
      console.warn("Auto summary generation failed:", e);
    }

    const doc = await prisma.ingestedDocument.create({
      data: {
        userId: req.userId!,
        title,
        fileType,
        fileSizeBytes: textContent.length * 2,
        totalChunks: chunks.length,
        summary,
        keyTopics: JSON.stringify(keyTopics),
      },
    });

    for (const chunk of chunks) {
      await prisma.documentChunk.create({
        data: {
          documentId: doc.id,
          chunkIndex: chunk.chunkIndex,
          text: chunk.text,
          tokenCount: chunk.tokenCount,
          sectionTitle: chunk.metadata.sectionTitle || "",
          pageOrSlide: chunk.metadata.pageOrSlide,
          keywords: JSON.stringify(chunk.metadata.keywords || []),
        },
      });
    }

    const ingestedDoc: IngestedDocument = {
      id: doc.id,
      title,
      fileType: fileType as any,
      uploadedAt: doc.createdAt.toISOString(),
      totalChunks: chunks.length,
      fileSizeBytes: textContent.length * 2,
      summary,
      keyTopics,
    };
    ragStore.addDocument(ingestedDoc, chunks);

    res.json({
      success: true,
      document: {
        id: doc.id,
        title,
        fileType,
        totalChunks: chunks.length,
        summary,
        keyTopics,
        uploadedAt: doc.createdAt,
      },
    });
  } catch (error: any) {
    console.error("Upload error:", error);
    res.status(500).json({ error: error.message || "Upload failed" });
  }
});

// Debug: show document chunks text
router.get("/debug/chunks/:docId", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { docId } = req.params;
    const doc = await prisma.ingestedDocument.findUnique({
      where: { id: docId },
      include: { chunks: { orderBy: { chunkIndex: "asc" } } },
    });
    if (!doc) {
      res.status(404).json({ error: "Document not found" });
      return;
    }
    res.json({
      documentId: doc.id,
      title: doc.title,
      totalChunks: doc.chunks.length,
      chunks: doc.chunks.map((c) => ({
        chunkIndex: c.chunkIndex,
        textPreview: c.text.slice(0, 200),
        textLength: c.text.length,
        fullText: c.text,
      })),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get user's documents
router.get("/documents", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const docs = await prisma.ingestedDocument.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: "desc" },
    });

    res.json({
      documents: docs.map((d) => ({
        id: d.id,
        title: d.title,
        fileType: d.fileType,
        totalChunks: d.totalChunks,
        fileSizeBytes: d.fileSizeBytes,
        summary: d.summary,
        keyTopics: JSON.parse(d.keyTopics || "[]"),
        uploadedAt: d.createdAt,
      })),
    });
  } catch (error: any) {
    console.error("Get documents error:", error);
    res.status(500).json({ error: "Failed to get documents" });
  }
});

// Search documents
router.post("/query", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { query, docId, topK = 4 } = req.body;

    if (!query) {
      return res.status(400).json({ error: "Query is required" });
    }

    const results = ragStore.searchChunks(query, docId, topK);

    res.json({
      query,
      resultsCount: results.length,
      chunks: results.map((r, idx) => ({
        rank: idx + 1,
        id: r.chunk.id,
        docTitle: r.chunk.docTitle,
        sectionTitle: r.chunk.metadata.sectionTitle,
        score: Math.round(r.score * 100),
        text: r.chunk.text,
      })),
    });
  } catch (error: any) {
    console.error("Query error:", error);
    res.status(500).json({ error: "Search failed" });
  }
});

// Delete document
router.delete("/document/:id", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const doc = await prisma.ingestedDocument.findFirst({
      where: { id, userId: req.userId },
    });

    if (!doc) {
      return res.status(404).json({ error: "Document not found" });
    }

    await prisma.documentChunk.deleteMany({ where: { documentId: id } });
    await prisma.ingestedDocument.delete({ where: { id } });
    ragStore.deleteDocument(id);

    res.json({ success: true });
  } catch (error: any) {
    console.error("Delete error:", error);
    res.status(500).json({ error: "Failed to delete document" });
  }
});

export default router;
