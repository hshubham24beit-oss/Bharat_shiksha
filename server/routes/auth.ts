import { Router } from "express";
import prisma from "../db.js";
import { generateToken, hashPassword, comparePassword, authMiddleware, AuthRequest } from "../auth.js";

const router = Router();

// Register
router.post("/register", async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: "Email, password, and name are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: "Email already registered" });
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash,
        profile: {
          create: {
            targetExam: "CBSE",
            learningStyle: "Socratic & Visual",
            level: "Intermediate",
          },
        },
      },
      include: { profile: true },
    });

    const token = generateToken(user.id);

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        profile: user.profile,
      },
    });
  } catch (error: any) {
    console.error("Register error:", error);
    res.status(500).json({ error: "Registration failed" });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { profile: true },
    });

    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const valid = await comparePassword(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Update last active
    if (user.profile) {
      await prisma.studentProfile.update({
        where: { userId: user.id },
        data: { lastActiveAt: new Date() },
      });
    }

    const token = generateToken(user.id);

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        profile: user.profile,
      },
    });
  } catch (error: any) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Login failed" });
  }
});

// Get current user
router.get("/me", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      include: { profile: true },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      profile: user.profile,
    });
  } catch (error: any) {
    console.error("Get me error:", error);
    res.status(500).json({ error: "Failed to get user" });
  }
});

// Update profile
router.put("/profile", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { targetExam, learningStyle, level, weakConcepts, strongConcepts } = req.body;

    const profile = await prisma.studentProfile.upsert({
      where: { userId: req.userId! },
      update: {
        ...(targetExam && { targetExam }),
        ...(learningStyle && { learningStyle }),
        ...(level && { level }),
        ...(weakConcepts && { weakConcepts: JSON.stringify(weakConcepts) }),
        ...(strongConcepts && { strongConcepts: JSON.stringify(strongConcepts) }),
      },
      create: {
        userId: req.userId!,
        targetExam: targetExam || "CBSE",
        learningStyle: learningStyle || "Socratic & Visual",
        level: level || "Intermediate",
      },
    });

    res.json(profile);
  } catch (error: any) {
    console.error("Update profile error:", error);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

export default router;
