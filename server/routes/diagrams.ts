import { Router, Request, Response } from "express";
import prisma from "../db.js";
import { authMiddleware, AuthRequest } from "../auth.js";
import { ai, GEMINI_MODEL } from "../gemini.js";

const router = Router();

interface GeneratedDiagram {
  type: "mermaid" | "flowchart" | "concept-map" | "comparison" | "sequence";
  title: string;
  code: string;
  description: string;
  visualPrompt: string;
  alternativeFormats: {
    ascii?: string;
    description?: string;
  };
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

export async function generateDiagramForDoc(userId: string, docId: string, topicOverride?: string) {
  const { documentContent, documentTitle } = await fetchDocumentContent(docId);
  const topic = topicOverride || documentTitle;

  const documentBlock = documentContent
    ? `\n\n=== SOURCE DOCUMENT ===\nTitle: ${documentTitle}\n\n${documentContent.slice(0, 6000)}\n\n=== END ===\n\nCRITICAL: Base the diagram strictly on the source material above.`
    : "";

  const prompt = `Generate a detailed educational diagram for the topic: "${topic}"
${documentBlock}

Return a JSON object with this EXACT structure:
{
  "type": "flowchart",
  "title": "Diagram title",
  "code": "Mermaid diagram code using proper syntax (flowchart TD, graph LR, etc.)",
  "description": "Brief explanation of what the diagram shows",
  "visualPrompt": "DALL-E style prompt for generating a visual version of this diagram",
  "alternativeFormats": {
    "ascii": "Simple ASCII art version of the diagram",
    "description": "Step-by-step textual walkthrough of the diagram flow"
  }
}

Mermaid code rules:
- Use flowchart TD (top-down) or LR (left-right) for flowcharts
- Use proper node shapes: [] for rectangles, () for rounded, {} for diamonds
- Use --> for arrows, -->|label| for labeled arrows
- Use subgraph for grouped sections
- Keep it clear and educational
- Maximum 15 nodes for readability

Return ONLY the JSON, no markdown formatting.`;

  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: { responseMimeType: "application/json", temperature: 0.7, maxOutputTokens: 2048 },
  });

  const responseText = response.text || response.candidates?.[0]?.content?.parts?.[0]?.text || "";
  let diagram: GeneratedDiagram;
  try {
    diagram = JSON.parse(responseText);
  } catch {
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) diagram = JSON.parse(jsonMatch[0]);
    else throw new Error("Could not parse diagram JSON");
  }

  // Persist to DB
  const result = await prisma.diagramResult.create({
    data: {
      userId,
      documentId: docId,
      topic,
      content: JSON.stringify(diagram),
    },
  });

  return { ...diagram, id: result.id };
}

router.post("/generate", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { topic, docId, diagramType, language, context, complexity } = req.body;

    if (!topic) {
      res.status(400).json({ error: "Topic is required" });
      return;
    }

    let docContent = "";
    let docTitle = "";
    if (docId) {
      const result = await fetchDocumentContent(docId);
      docContent = result.documentContent;
      docTitle = result.documentTitle;
    }

    const complexityLevel = complexity || "intermediate";
    const typeInstruction = diagramType
      ? `Generate a ${diagramType} diagram.`
      : "Generate the most appropriate diagram type (flowchart, concept map, sequence diagram, or comparison table).";

    const documentBlock = docContent
      ? `\n\n=== SOURCE DOCUMENT ===\nTitle: ${docTitle}\n\n${docContent.slice(0, 6000)}\n\n=== END ===\n\nCRITICAL: Base the diagram strictly on the source material above.`
      : "";

    const prompt = `Generate a detailed educational diagram for the topic: "${topic}"

${typeInstruction}
Complexity level: ${complexityLevel}
${context ? `Context: ${context}` : ""}
${documentBlock}

Return a JSON object with this EXACT structure:
{
  "type": "flowchart",
  "title": "Diagram title",
  "code": "Mermaid diagram code using proper syntax (flowchart TD, graph LR, etc.)",
  "description": "Brief explanation of what the diagram shows",
  "visualPrompt": "DALL-E style prompt for generating a visual version of this diagram",
  "alternativeFormats": {
    "ascii": "Simple ASCII art version of the diagram",
    "description": "Step-by-step textual walkthrough of the diagram flow"
  }
}

Mermaid code rules:
- Use flowchart TD (top-down) or LR (left-right) for flowcharts
- Use proper node shapes: [] for rectangles, () for rounded, {} for diamonds, [] for stadium
- Use --> for arrows, -->|label| for labeled arrows
- Use subgraph for grouped sections
- Keep it clear and educational
- Include decision points where appropriate
- Maximum 15 nodes for readability

Return ONLY the JSON, no markdown formatting.`;

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: { responseMimeType: "application/json", temperature: 0.7, maxOutputTokens: 2048 },
    });

    const responseText = response.text || response.candidates?.[0]?.content?.parts?.[0]?.text || "";

    let diagram: GeneratedDiagram;
    try {
      diagram = JSON.parse(responseText);
    } catch {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        diagram = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Could not parse diagram JSON");
      }
    }

    // Persist to DB
    const result = await prisma.diagramResult.create({
      data: {
        userId: req.userId!,
        documentId: docId || null,
        topic,
        content: JSON.stringify(diagram),
      },
    });

    res.json({ success: true, diagram: { ...diagram, id: result.id }, topic, documentId: docId || null });
  } catch (error: any) {
    console.error("Diagram generation error:", error);
    res.status(500).json({ error: "Failed to generate diagram", details: error.message });
  }
});

router.post("/generate-multiple", authMiddleware, async (req: Request, res: Response) => {
  try {
    const { topic, count, language, context } = req.body;

    if (!topic) {
      res.status(400).json({ error: "Topic is required" });
      return;
    }

    const numDiagrams = Math.min(count || 3, 5);

    const prompt = `Generate ${numDiagrams} different educational diagrams for the topic: "${topic}"

${context ? `Context: ${context}` : ""}

Each diagram should show a DIFFERENT aspect or visualization of the topic:
- One flowchart showing process/steps
- One concept map showing relationships
- One comparison or summary table
- Additional diagrams as appropriate

Return a JSON array with this structure:
[
  {
    "type": "flowchart",
    "title": "Diagram title",
    "code": "Mermaid code",
    "description": "What this diagram shows"
  }
]

Rules:
- Use proper Mermaid syntax
- Each diagram should be unique and show different information
- Keep each diagram focused and clear
- Maximum 12 nodes per diagram

Return ONLY the JSON array, no markdown formatting.`;

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        temperature: 0.7,
        maxOutputTokens: 2048,
      },
    });

    const responseText = response.text || response.candidates?.[0]?.content?.parts?.[0]?.text || "";
    
    let diagrams: GeneratedDiagram[];
    try {
      diagrams = JSON.parse(responseText);
    } catch {
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        diagrams = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Could not parse diagrams JSON");
      }
    }

    res.json({
      success: true,
      diagrams,
      topic,
      count: diagrams.length,
    });
  } catch (error: any) {
    console.error("Multi-diagram generation error:", error);
    res.status(500).json({ error: "Failed to generate diagrams", details: error.message });
  }
});

router.post("/from-text", authMiddleware, async (req: Request, res: Response) => {
  try {
    const { text, diagramType, language } = req.body;

    if (!text) {
      res.status(400).json({ error: "Text content is required" });
      return;
    }

    const prompt = `Convert the following educational text into a visual diagram:

"${text.slice(0, 2000)}"

${diagramType ? `Diagram type: ${diagramType}` : "Choose the best diagram type."}

Analyze the text and extract:
1. Key concepts and their relationships
2. Process steps if any
3. Cause-effect chains
4. Comparisons if any

Return a JSON object:
{
  "type": "flowchart",
  "title": "Diagram title based on content",
  "code": "Mermaid diagram code",
  "description": "What the diagram visualizes",
  "keyConcepts": ["concept1", "concept2"],
  "relationships": [{"from": "A", "to": "B", "label": "relationship"}]
}

Return ONLY the JSON, no markdown formatting.`;

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        temperature: 0.7,
        maxOutputTokens: 2048,
      },
    });

    const responseText = response.text || response.candidates?.[0]?.content?.parts?.[0]?.text || "";
    
    let diagram: any;
    try {
      diagram = JSON.parse(responseText);
    } catch {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        diagram = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Could not parse diagram JSON");
      }
    }

    res.json({
      success: true,
      diagram,
    });
  } catch (error: any) {
    console.error("Text-to-diagram error:", error);
    res.status(500).json({ error: "Failed to generate diagram from text" });
  }
});

export default router;
