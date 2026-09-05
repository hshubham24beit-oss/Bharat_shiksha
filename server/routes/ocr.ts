import { Router, Request, Response } from "express";
import multer from "multer";
import { authMiddleware } from "../auth.js";

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const OCR_API_KEY = process.env.OCR_SPACE_API_KEY || "K85589404588957";
const OCR_API_URL = "https://api.ocr.space/parse/image";

router.post("/scan", authMiddleware, upload.single("file"), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "No file uploaded" });
      return;
    }

    const { originalname, buffer, mimetype } = req.file;

    const formData = new FormData();
    formData.append("file", new Blob([buffer], { type: mimetype }), originalname);
    formData.append("apikey", OCR_API_KEY);
    formData.append("language", req.body.language || "eng");
    formData.append("isOverlayRequired", "false");
    formData.append("OCREngine", "2");

    const ocrResponse = await fetch(OCR_API_URL, {
      method: "POST",
      body: formData,
    });

    const ocrData = await ocrResponse.json();

    if (ocrData.IsErroredOnProcessing) {
      res.status(500).json({
        error: "OCR processing failed",
        details: ocrData.ErrorMessage || ["Unknown error"],
      });
      return;
    }

    const parsedResults = ocrData.ParsedResults || [];
    const extractedText = parsedResults
      .map((r: any) => r.ParsedText || "")
      .join("\n\n")
      .trim();

    const language = parsedResults[0]?.Language || "eng";

    res.json({
      success: true,
      text: extractedText,
      language,
      fileName: originalname,
      fileType: mimetype,
      wordCount: extractedText.split(/\s+/).filter(Boolean).length,
      confidence: parsedResults[0]?.FileParseExitCode === 1 ? "high" : "medium",
    });
  } catch (error: any) {
    console.error("OCR scan error:", error);
    res.status(500).json({ error: "Failed to scan document", details: error.message });
  }
});

router.post("/scan-url", authMiddleware, async (req: Request, res: Response) => {
  try {
    const { imageUrl, language } = req.body;
    if (!imageUrl) {
      res.status(400).json({ error: "No image URL provided" });
      return;
    }

    const formData = new FormData();
    formData.append("apikey", OCR_API_KEY);
    formData.append("url", imageUrl);
    formData.append("language", language || "eng");
    formData.append("isOverlayRequired", "false");
    formData.append("OCREngine", "2");

    const ocrResponse = await fetch(OCR_API_URL, {
      method: "POST",
      body: formData,
    });

    const ocrData = await ocrResponse.json();

    if (ocrData.IsErroredOnProcessing) {
      res.status(500).json({ error: "OCR processing failed" });
      return;
    }

    const parsedResults = ocrData.ParsedResults || [];
    const extractedText = parsedResults
      .map((r: any) => r.ParsedText || "")
      .join("\n\n")
      .trim();

    res.json({
      success: true,
      text: extractedText,
      language: parsedResults[0]?.Language || "eng",
      wordCount: extractedText.split(/\s+/).filter(Boolean).length,
    });
  } catch (error: any) {
    console.error("OCR URL scan error:", error);
    res.status(500).json({ error: "Failed to scan URL" });
  }
});

export default router;
