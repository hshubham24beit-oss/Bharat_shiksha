import { jsPDF } from "jspdf";
import { SmartNotes, CheatSheet, Flashcard, VideoLecture } from "../types";

/**
 * Helper to clean Markdown and KaTeX math formulas into readable, polished text for standard PDF rendering.
 */
export function cleanMarkdownForPdf(md: string): string {
  if (!md) return "";
  return md
    // Replace LaTeX fractions \frac{a}{b} with (a / b)
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, "($1 / $2)")
    // Replace LaTeX sqrt
    .replace(/\\sqrt\{([^}]+)\}/g, "√($1)")
    // Replace Greek letters and math symbols
    .replace(/\\varepsilon_0/g, "ε₀")
    .replace(/\\varepsilon_r/g, "ε_r")
    .replace(/\\varepsilon/g, "ε")
    .replace(/\\mu/g, "μ")
    .replace(/\\pi/g, "π")
    .replace(/\\theta/g, "θ")
    .replace(/\\tau/g, "τ")
    .replace(/\\Delta/g, "Δ")
    .replace(/\\sigma/g, "σ")
    .replace(/\\lambda/g, "λ")
    .replace(/\\phi/g, "φ")
    .replace(/\\Phi/g, "Φ")
    .replace(/\\omega/g, "ω")
    .replace(/\\alpha/g, "α")
    .replace(/\\beta/g, "β")
    .replace(/\\gamma/g, "γ")
    .replace(/\\times/g, "×")
    .replace(/\\cdot/g, "·")
    .replace(/\\pm/g, "±")
    .replace(/\\leq/g, "≤")
    .replace(/\\geq/g, "≥")
    .replace(/\\neq/g, "≠")
    .replace(/\\approx/g, "≈")
    .replace(/\\propto/g, "∝")
    .replace(/\\in/g, "∈")
    .replace(/\\sum/g, "∑")
    .replace(/\\int/g, "∫")
    .replace(/\\oint/g, "∮")
    .replace(/\\to/g, "→")
    .replace(/\\vec\{([^}]+)\}/g, "vec($1)")
    .replace(/\\hat\{([^}]+)\}/g, "$1^")
    .replace(/\\text\{([^}]+)\}/g, "$1")
    .replace(/\\mathbf\{([^}]+)\}/g, "$1")
    .replace(/\\quad/g, "   ")
    .replace(/\\,/g, " ")
    .replace(/\\;/g, " ")
    // Remove inline and display math delimiters $$ and $
    .replace(/\$\$/g, "")
    .replace(/\$/g, "")
    // Remove markdown headers
    .replace(/^#{1,6}\s+/gm, "")
    // Remove markdown bold/italics
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/_([^_]+)_/g, "$1")
    // Remove markdown code blocks
    .replace(/```[\w]*\n/g, "")
    .replace(/```/g, "")
    .replace(/`([^`]+)`/g, "$1")
    // Clean up excessive backslashes
    .replace(/\\\\/g, "")
    .replace(/\\/g, "");
}

interface ExportPdfOptions {
  studentName?: string;
  targetExam?: string;
  subject?: string;
}

/**
 * Draws a standardized header on a jsPDF page.
 */
function drawHeader(
  doc: jsPDF,
  title: string,
  subtitle: string,
  badgeText: string = "SMART STUDY NOTES",
  accentColor: [number, number, number] = [79, 70, 229] // Indigo
) {
  const pageWidth = doc.internal.pageSize.getWidth();

  // Top color banner line
  doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.rect(0, 0, pageWidth, 6, "F");

  // App & Platform Branding
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139); // Slate 500
  doc.text("BHARAT SHIKSHAK AI • OFFLINE STUDY PACKET", 15, 14);

  // Date and Time
  const dateStr = new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  doc.setFont("helvetica", "normal");
  doc.text(`Generated: ${dateStr}`, pageWidth - 15, 14, { align: "right" });

  // Badge
  doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.roundedRect(15, 18, 55, 6, 2, 2, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.text(badgeText.toUpperCase(), 17, 22.5);

  // Main Document Title
  doc.setTextColor(15, 23, 42); // Slate 900
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  const titleLines = doc.splitTextToSize(title, pageWidth - 30);
  doc.text(titleLines, 15, 31);

  let currentY = 31 + titleLines.length * 6;

  // Subtitle / Topic
  if (subtitle) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(71, 85, 105); // Slate 600
    doc.text(subtitle, 15, currentY);
    currentY += 5;
  }

  // Thin separator divider
  doc.setDrawColor(226, 232, 240); // Slate 200
  doc.setLineWidth(0.5);
  doc.line(15, currentY + 1, pageWidth - 15, currentY + 1);

  return currentY + 7;
}

/**
 * Draws page numbers and footer notes across all pages.
 */
function drawFooters(doc: jsPDF, documentTitle: string) {
  const totalPages = doc.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    // Footer divider line
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.4);
    doc.line(15, pageHeight - 14, pageWidth - 15, pageHeight - 14);

    // Left: Document title watermark
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184); // Slate 400
    doc.text(
      `Bharat Shikshak AI • Socratic Adaptive Education • ${documentTitle.slice(0, 40)}`,
      15,
      pageHeight - 9
    );

    // Right: Page number
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - 15, pageHeight - 9, {
      align: "right",
    });
  }
}

/**
 * 1. Download Notion-Style Smart Notes as PDF
 */
export function downloadSmartNotesPdf(
  smartNotes: SmartNotes,
  options: ExportPdfOptions = {}
) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const topicTitle = smartNotes.topicTitle || smartNotes.topic || "Physics & STEM Topic";

  let y = drawHeader(
    doc,
    `${topicTitle} - Smart Notes`,
    options.targetExam
      ? `Tailored for ${options.targetExam} • High-Yield Revision Packet`
      : "Complete High-Yield Revision & First-Principles Guide",
    "Smart Revision Notes",
    [79, 70, 229] // Indigo
  );

  // Section 1: Core Conceptual Pillars
  if (smartNotes.keyTakeaways && smartNotes.keyTakeaways.length > 0) {
    // Section header
    doc.setFillColor(241, 245, 249); // Slate 100
    doc.roundedRect(15, y, pageWidth - 30, 8, 2, 2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(30, 41, 59);
    doc.text("CORE CONCEPTUAL PILLARS & FIRST PRINCIPLES", 19, y + 5.5);
    y += 12;

    smartNotes.keyTakeaways.forEach((takeaway, idx) => {
      const cleanText = cleanMarkdownForPdf(takeaway);
      const textLines = doc.splitTextToSize(cleanText, pageWidth - 42);
      const itemHeight = Math.max(8, textLines.length * 4.5 + 4);

      // Check for page overflow
      if (y + itemHeight > pageHeight - 20) {
        doc.addPage();
        y = 20;
      }

      // Pill badge for index
      doc.setFillColor(238, 242, 255); // Indigo 50
      doc.roundedRect(15, y, 6, 6, 1.5, 1.5, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(79, 70, 229);
      doc.text(`${idx + 1}`, 17, y + 4.2);

      // Takeaway Text
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(51, 65, 85);
      doc.text(textLines, 24, y + 4.2);

      y += itemHeight;
    });

    y += 4;
  }

  // Section 2: Summary Notes Breakdown (Markdown Content)
  if (smartNotes.summaryNotesMarkdown) {
    if (y > pageHeight - 40) {
      doc.addPage();
      y = 20;
    }

    doc.setFillColor(241, 245, 249);
    doc.roundedRect(15, y, pageWidth - 30, 8, 2, 2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(30, 41, 59);
    doc.text("DETAILED CONCEPTUAL BREAKDOWN", 19, y + 5.5);
    y += 12;

    const cleanedSummary = cleanMarkdownForPdf(smartNotes.summaryNotesMarkdown);
    const paragraphs = cleanedSummary.split("\n").filter((p) => p.trim());

    paragraphs.forEach((paragraph) => {
      const isHeader = paragraph.startsWith("##") || paragraph.startsWith("###");
      const cleanPara = paragraph.replace(/^#+\s*/, "").trim();

      if (isHeader) {
        if (y > pageHeight - 25) {
          doc.addPage();
          y = 20;
        }
        y += 2;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(79, 70, 229);
        doc.text(cleanPara, 15, y);
        y += 6;
      } else {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.5);
        doc.setTextColor(51, 65, 85);
        const lines = doc.splitTextToSize(cleanPara, pageWidth - 30);

        if (y + lines.length * 4.5 > pageHeight - 20) {
          doc.addPage();
          y = 20;
        }

        doc.text(lines, 15, y);
        y += lines.length * 4.5 + 2.5;
      }
    });

    y += 4;
  }

  // Section 3: High-Yield Flashcards Summary Table
  if (smartNotes.flashcards && smartNotes.flashcards.length > 0) {
    if (y > pageHeight - 50) {
      doc.addPage();
      y = 20;
    }

    doc.setFillColor(241, 245, 249);
    doc.roundedRect(15, y, pageWidth - 30, 8, 2, 2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(30, 41, 59);
    doc.text(`SPACED REPETITION FLASHCARDS (${smartNotes.flashcards.length} CARDS)`, 19, y + 5.5);
    y += 12;

    smartNotes.flashcards.forEach((card, idx) => {
      const frontClean = cleanMarkdownForPdf(card.front);
      const backClean = cleanMarkdownForPdf(card.back);
      const mnemonicClean = card.mnemonic ? cleanMarkdownForPdf(card.mnemonic) : "";

      const frontLines = doc.splitTextToSize(`Q: ${frontClean}`, pageWidth - 36);
      const backLines = doc.splitTextToSize(`Ans: ${backClean}`, pageWidth - 36);
      const mLines = mnemonicClean
        ? doc.splitTextToSize(`Mnemonic: ${mnemonicClean}`, pageWidth - 36)
        : [];

      const cardBoxHeight =
        (frontLines.length + backLines.length + mLines.length) * 4.5 + 10;

      if (y + cardBoxHeight > pageHeight - 20) {
        doc.addPage();
        y = 20;
      }

      // Card container
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(15, y, pageWidth - 30, cardBoxHeight, 2, 2, "FD");

      // Card Question
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      doc.text(frontLines, 18, y + 5);

      let innerY = y + 5 + frontLines.length * 4.5;

      // Card Answer
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(51, 65, 85);
      doc.text(backLines, 18, innerY);
      innerY += backLines.length * 4.5;

      // Mnemonic if available
      if (mnemonicClean) {
        doc.setFont("helvetica", "italic");
        doc.setFontSize(7.5);
        doc.setTextColor(180, 83, 9); // Amber 700
        doc.text(mLines, 18, innerY);
      }

      y += cardBoxHeight + 3.5;
    });
  }

  // Draw footers with page count
  drawFooters(doc, topicTitle);

  // Save the PDF
  const safeFilename = `${topicTitle.replace(/[^a-zA-Z0-9_-]/g, "_")}_Smart_Notes.pdf`;
  doc.save(safeFilename);
}

/**
 * 2. Download 1-Page Formula Cheat Sheet as PDF
 */
export function downloadCheatSheetPdf(
  smartNotes: SmartNotes,
  options: ExportPdfOptions = {}
) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const topicTitle = smartNotes.topicTitle || smartNotes.topic || "Formula Cheat Sheet";

  let y = drawHeader(
    doc,
    `${topicTitle} - Formula Cheat Sheet`,
    "High-Yield 1-Page Exam Reference • Governing Formulas & Golden Rules",
    "Formula Cheat Sheet",
    [16, 185, 129] // Emerald
  );

  const cheatSheet = smartNotes.cheatSheet;

  // Key Formulas Block
  if (cheatSheet?.keyFormulas && cheatSheet.keyFormulas.length > 0) {
    doc.setFillColor(236, 253, 245); // Emerald 50
    doc.setDrawColor(167, 243, 208); // Emerald 200
    doc.roundedRect(15, y, pageWidth - 30, 8, 2, 2, "FD");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(6, 95, 70); // Emerald 800
    doc.text("⚡ KEY GOVERNING FORMULAS & CONSTANTS", 19, y + 5.5);
    y += 12;

    cheatSheet.keyFormulas.forEach((item, idx) => {
      const formulaClean = cleanMarkdownForPdf(item.formula);
      const whereClean = cleanMarkdownForPdf(item.where);

      if (y + 16 > pageHeight - 20) {
        doc.addPage();
        y = 20;
      }

      // Formula Card box
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(203, 213, 225);
      doc.roundedRect(15, y, pageWidth - 30, 15, 2, 2, "FD");

      // Formula Name
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      doc.text(`${idx + 1}. ${item.name}`, 18, y + 5);

      // Equation box
      doc.setFont("courier", "bold");
      doc.setFontSize(9);
      doc.setTextColor(6, 95, 70);
      doc.text(formulaClean, 18, y + 10);

      // Where notes
      if (whereClean) {
        doc.setFont("helvetica", "italic");
        doc.setFontSize(7.5);
        doc.setTextColor(100, 116, 139);
        doc.text(`Where: ${whereClean}`, 18, y + 13.5);
      }

      y += 18;
    });

    y += 2;
  } else if (smartNotes.cheatSheetMarkdown) {
    // Fallback: Parse markdown cheat sheet text
    doc.setFillColor(236, 253, 245);
    doc.roundedRect(15, y, pageWidth - 30, 8, 2, 2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(6, 95, 70);
    doc.text("⚡ KEY GOVERNING FORMULAS & RULES", 19, y + 5.5);
    y += 12;

    const cleanedCheat = cleanMarkdownForPdf(smartNotes.cheatSheetMarkdown);
    const lines = doc.splitTextToSize(cleanedCheat, pageWidth - 30);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(51, 65, 85);
    doc.text(lines, 15, y);
    y += lines.length * 4.5 + 4;
  }

  // Golden Rules
  if (cheatSheet?.goldenRules && cheatSheet.goldenRules.length > 0) {
    if (y + 35 > pageHeight - 20) {
      doc.addPage();
      y = 20;
    }

    doc.setFillColor(254, 243, 199); // Amber 100
    doc.setDrawColor(253, 230, 138); // Amber 200
    doc.roundedRect(15, y, pageWidth - 30, 8, 2, 2, "FD");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(146, 64, 14); // Amber 800
    doc.text("🌟 GOLDEN MEMORY RULES (FIRST PRINCIPLES)", 19, y + 5.5);
    y += 12;

    cheatSheet.goldenRules.forEach((rule, idx) => {
      const cleanRule = cleanMarkdownForPdf(rule);
      const lines = doc.splitTextToSize(`• ${cleanRule}`, pageWidth - 34);

      if (y + lines.length * 4.5 > pageHeight - 20) {
        doc.addPage();
        y = 20;
      }

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      doc.text(lines, 17, y);
      y += lines.length * 4.5 + 2;
    });

    y += 3;
  }

  // Common Pitfalls / Exam Traps
  if (cheatSheet?.commonPitfallsToAvoid && cheatSheet.commonPitfallsToAvoid.length > 0) {
    if (y + 35 > pageHeight - 20) {
      doc.addPage();
      y = 20;
    }

    doc.setFillColor(255, 228, 230); // Rose 100
    doc.setDrawColor(254, 205, 211); // Rose 200
    doc.roundedRect(15, y, pageWidth - 30, 8, 2, 2, "FD");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(159, 18, 57); // Rose 800
    doc.text("⚠️ COMMON EXAM TRAPS & PITFALLS TO AVOID", 19, y + 5.5);
    y += 12;

    cheatSheet.commonPitfallsToAvoid.forEach((pitfall, idx) => {
      const cleanPitfall = cleanMarkdownForPdf(pitfall);
      const lines = doc.splitTextToSize(`! ${cleanPitfall}`, pageWidth - 34);

      if (y + lines.length * 4.5 > pageHeight - 20) {
        doc.addPage();
        y = 20;
      }

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(159, 18, 57);
      doc.text(lines, 17, y);
      y += lines.length * 4.5 + 2;
    });
  }

  // Draw footers
  drawFooters(doc, `${topicTitle} Cheat Sheet`);

  // Save the PDF
  const safeFilename = `${topicTitle.replace(/[^a-zA-Z0-9_-]/g, "_")}_Cheat_Sheet.pdf`;
  doc.save(safeFilename);
}

/**
 * 3. Download Complete Comprehensive Revision Packet (Notes + Cheat Sheet + Flashcards)
 */
export function downloadCompletePacketPdf(
  smartNotes: SmartNotes,
  options: ExportPdfOptions = {}
) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const topicTitle = smartNotes.topicTitle || smartNotes.topic || "Comprehensive STEM Study Packet";

  // Page 1: Cover Header & Cheat Sheet
  let y = drawHeader(
    doc,
    `${topicTitle} - Complete Master Packet`,
    "Comprehensive Offline Study Edition • Notion Notes, Cheat Sheet & Flashcard Deck",
    "Complete Master Packet",
    [99, 102, 241] // Indigo
  );

  // 1. Cheat Sheet section
  const cheatSheet = smartNotes.cheatSheet;
  if (cheatSheet?.keyFormulas && cheatSheet.keyFormulas.length > 0) {
    doc.setFillColor(236, 253, 245);
    doc.roundedRect(15, y, pageWidth - 30, 8, 2, 2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(6, 95, 70);
    doc.text("⚡ 1-PAGE EXAM CHEAT SHEET: KEY FORMULAS", 19, y + 5.5);
    y += 12;

    cheatSheet.keyFormulas.slice(0, 5).forEach((item, idx) => {
      const formulaClean = cleanMarkdownForPdf(item.formula);
      const whereClean = cleanMarkdownForPdf(item.where);

      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(203, 213, 225);
      doc.roundedRect(15, y, pageWidth - 30, 13, 2, 2, "FD");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42);
      doc.text(`${idx + 1}. ${item.name}`, 18, y + 4.5);

      doc.setFont("courier", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(6, 95, 70);
      doc.text(formulaClean, 18, y + 9);

      if (whereClean) {
        doc.setFont("helvetica", "italic");
        doc.setFontSize(7);
        doc.setTextColor(100, 116, 139);
        doc.text(whereClean, pageWidth - 20, y + 9, { align: "right" });
      }

      y += 15;
    });

    y += 2;
  }

  // Golden Rules & Pitfalls on Page 1
  if (cheatSheet?.goldenRules && cheatSheet.goldenRules.length > 0) {
    doc.setFillColor(254, 243, 199);
    doc.roundedRect(15, y, pageWidth - 30, 7, 2, 2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(146, 64, 14);
    doc.text("🌟 GOLDEN RULES", 19, y + 5);
    y += 10;

    cheatSheet.goldenRules.slice(0, 3).forEach((rule) => {
      const cleanRule = cleanMarkdownForPdf(rule);
      const lines = doc.splitTextToSize(`• ${cleanRule}`, pageWidth - 34);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(71, 85, 105);
      doc.text(lines, 17, y);
      y += lines.length * 4 + 1.5;
    });
  }

  // Page 2: Notion Notes & Flashcard Deck
  doc.addPage();
  y = 20;

  doc.setFillColor(241, 245, 249);
  doc.roundedRect(15, y, pageWidth - 30, 8, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(30, 41, 59);
  doc.text("NOTION-STYLE REVISION NOTES & CONCEPTUAL PILLARS", 19, y + 5.5);
  y += 13;

  if (smartNotes.keyTakeaways && smartNotes.keyTakeaways.length > 0) {
    smartNotes.keyTakeaways.forEach((takeaway, idx) => {
      const cleanText = cleanMarkdownForPdf(takeaway);
      const textLines = doc.splitTextToSize(cleanText, pageWidth - 40);

      doc.setFillColor(238, 242, 255);
      doc.roundedRect(15, y, 6, 6, 1.5, 1.5, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(79, 70, 229);
      doc.text(`${idx + 1}`, 17, y + 4.2);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(51, 65, 85);
      doc.text(textLines, 24, y + 4.2);

      y += Math.max(8, textLines.length * 4.2 + 3);
    });
    y += 3;
  }

  if (smartNotes.summaryNotesMarkdown) {
    const cleanedSummary = cleanMarkdownForPdf(smartNotes.summaryNotesMarkdown);
    const paras = cleanedSummary.split("\n").filter((p) => p.trim()).slice(0, 4);

    paras.forEach((p) => {
      const isHeader = p.startsWith("#");
      const cleanP = p.replace(/^#+\s*/, "").trim();

      if (isHeader) {
        y += 2;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(79, 70, 229);
        doc.text(cleanP, 15, y);
        y += 5.5;
      } else {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(51, 65, 85);
        const lines = doc.splitTextToSize(cleanP, pageWidth - 30);
        doc.text(lines, 15, y);
        y += lines.length * 4.2 + 2;
      }
    });
  }

  // Flashcards Grid
  if (smartNotes.flashcards && smartNotes.flashcards.length > 0) {
    y += 4;
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(15, y, pageWidth - 30, 8, 2, 2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(30, 41, 59);
    doc.text("FLASHCARD DECK FOR SPACED REPETITION", 19, y + 5.5);
    y += 12;

    smartNotes.flashcards.forEach((card) => {
      const q = cleanMarkdownForPdf(card.front);
      const a = cleanMarkdownForPdf(card.back);

      const qLines = doc.splitTextToSize(`Q: ${q}`, pageWidth - 36);
      const aLines = doc.splitTextToSize(`A: ${a}`, pageWidth - 36);
      const boxH = (qLines.length + aLines.length) * 4.2 + 8;

      if (y + boxH > pageHeight - 20) {
        doc.addPage();
        y = 20;
      }

      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(15, y, pageWidth - 30, boxH, 2, 2, "FD");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42);
      doc.text(qLines, 18, y + 4.5);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(51, 65, 85);
      doc.text(aLines, 18, y + 4.5 + qLines.length * 4.2);

      y += boxH + 3;
    });
  }

  // Draw footers
  drawFooters(doc, `${topicTitle} Master Packet`);

  const safeFilename = `${topicTitle.replace(/[^a-zA-Z0-9_-]/g, "_")}_Master_Packet.pdf`;
  doc.save(safeFilename);
}

/**
 * 4. Download Synchronized AI Video Lecture Deck & Script as PDF
 */
export function downloadVideoLecturePdf(
  videoLecture: VideoLecture,
  options: ExportPdfOptions = {}
) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const title = videoLecture.title || videoLecture.lectureTitle || "AI Video Masterclass";

  let y = drawHeader(
    doc,
    `${title}`,
    videoLecture.sourceDocTitle
      ? `Grounded on: ${videoLecture.sourceDocTitle} • Synchronized Slide Deck & Audio Script`
      : `Synchronized Multimodal AI Slide Deck & Audio Script`,
    "AI Video Lecture Deck",
    [147, 51, 234] // Purple
  );

  if (videoLecture.overview) {
    doc.setFillColor(250, 245, 255); // Purple 50
    doc.setDrawColor(233, 213, 255);
    doc.roundedRect(15, y, pageWidth - 30, 16, 2, 2, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(107, 33, 168);
    doc.text("LECTURE OVERVIEW & OBJECTIVES", 19, y + 5);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);
    const overviewLines = doc.splitTextToSize(videoLecture.overview, pageWidth - 38);
    doc.text(overviewLines.slice(0, 2), 19, y + 10);

    y += 21;
  }

  // Iterate over each slide
  videoLecture.slides.forEach((slide, idx) => {
    // Check page space
    if (y > pageHeight - 55) {
      doc.addPage();
      y = 20;
    }

    // Slide Header
    doc.setFillColor(243, 244, 246); // Gray 100
    doc.roundedRect(15, y, pageWidth - 30, 8, 2, 2, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    doc.text(`SLIDE ${slide.slideNumber}: ${slide.heading || slide.title || ""}`, 19, y + 5.5);

    if (slide.estimatedSeconds) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(`~${slide.estimatedSeconds}s duration`, pageWidth - 20, y + 5.5, { align: "right" });
    }

    y += 12;

    // Bullet points
    slide.bulletPoints.forEach((bp) => {
      const cleanBp = cleanMarkdownForPdf(bp);
      const bpLines = doc.splitTextToSize(`• ${cleanBp}`, pageWidth - 38);

      if (y + bpLines.length * 4.2 > pageHeight - 20) {
        doc.addPage();
        y = 20;
      }

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(30, 41, 59);
      doc.text(bpLines, 19, y + 4);
      y += bpLines.length * 4.2 + 1;
    });

    // Key Formula if present
    if (slide.keyFormula) {
      const cleanFormula = cleanMarkdownForPdf(slide.keyFormula);
      if (y + 12 > pageHeight - 20) {
        doc.addPage();
        y = 20;
      }

      doc.setFillColor(240, 253, 244); // Emerald 50
      doc.setDrawColor(187, 247, 208);
      doc.roundedRect(19, y + 2, pageWidth - 38, 7, 1.5, 1.5, "FD");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(21, 128, 61);
      doc.text(`Formula: ${cleanFormula}`, 22, y + 6.5);
      y += 11;
    }

    // Voiceover Narration Script
    const narration = slide.voiceoverNarration || slide.narrationScript;
    if (narration) {
      const cleanNarration = cleanMarkdownForPdf(narration);
      const narrationLines = doc.splitTextToSize(`" ${cleanNarration} "`, pageWidth - 42);
      const boxHeight = narrationLines.length * 4.2 + 8;

      if (y + boxHeight > pageHeight - 20) {
        doc.addPage();
        y = 20;
      }

      doc.setFillColor(250, 245, 255); // Purple 50
      doc.setDrawColor(233, 213, 255);
      doc.roundedRect(19, y + 2, pageWidth - 38, boxHeight, 1.5, 1.5, "FD");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(147, 51, 234);
      doc.text("SPOKEN AI TEACHER VOICEOVER NARRATION:", 22, y + 6.5);

      doc.setFont("helvetica", "italic");
      doc.setFontSize(8);
      doc.setTextColor(75, 85, 99);
      doc.text(narrationLines, 22, y + 11.5);

      y += boxHeight + 4;
    }

    // Document Citation
    if (slide.docCitation) {
      if (y + 8 > pageHeight - 20) {
        doc.addPage();
        y = 20;
      }
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(107, 114, 128);
      doc.text(`Citation: ${slide.docCitation.sourceDocTitle} (${slide.docCitation.pageOrSection || "Document Note"})`, 19, y + 3);
      y += 6;
    }

    y += 4;
  });

  drawFooters(doc, `${title} - Video Lecture Deck`);

  const safeFilename = `${title.replace(/[^a-zA-Z0-9_-]/g, "_")}_Video_Lecture_Deck.pdf`;
  doc.save(safeFilename);
}

