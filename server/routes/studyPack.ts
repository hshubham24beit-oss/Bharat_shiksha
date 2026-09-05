import { Router } from "express";
import prisma from "../db.js";
import { authMiddleware, AuthRequest } from "../auth.js";
import { generateStudyPack } from "../contentPipeline.js";

const router = Router();

// Generate a full study pack from a document
router.post("/generate", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { docId } = req.body;
    if (!docId) {
      res.status(400).json({ error: "docId is required" });
      return;
    }

    // Check if a study pack already exists for this doc
    const existing = await prisma.studyPack.findFirst({
      where: { documentId: docId, userId: req.userId },
    });

    let pack;
    if (existing) {
      pack = existing;
    } else {
      pack = await generateStudyPack(req.userId!, docId);
    }

    // Fetch full pack with relations
    const fullPack = await prisma.studyPack.findUnique({
      where: { id: pack.id },
      include: {
        document: true,
      },
    });

    res.json({ success: true, pack: fullPack });
  } catch (error: any) {
    console.error("Study pack generation error:", error);
    res.status(500).json({ error: error.message || "Failed to generate study pack" });
  }
});

// Get study pack for a document
router.get("/:docId", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const pack = await prisma.studyPack.findFirst({
      where: { documentId: req.params.docId, userId: req.userId },
      include: { document: true },
    });

    if (!pack) {
      res.status(404).json({ error: "No study pack found for this document" });
      return;
    }

    res.json({ success: true, pack });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to get study pack" });
  }
});

// Get all study packs for user
router.get("/", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const packs = await prisma.studyPack.findMany({
      where: { userId: req.userId },
      include: { document: true },
      orderBy: { createdAt: "desc" },
    });

    res.json({ packs });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to get study packs" });
  }
});

export default router;
