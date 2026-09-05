import React, { useState } from "react";
import {
  Layers,
  Sparkles,
  RotateCw,
  CheckCircle2,
  XCircle,
  FileText,
  Copy,
  Check,
  Printer,
  BookOpen,
  RefreshCw,
  Brain,
  Download,
  FileDown,
  Sparkle,
  Zap,
} from "lucide-react";
import { SmartNotes, Flashcard, StudentProfile, ActiveView } from "../types";
import { MarkdownMathRenderer } from "../components/MarkdownMathRenderer";
import {
  downloadSmartNotesPdf,
  downloadCheatSheetPdf,
  downloadCompletePacketPdf,
} from "../utils/pdfExport";

interface Props {
  smartNotes: SmartNotes;
  setSmartNotes: React.Dispatch<React.SetStateAction<SmartNotes>>;
  studentProfile: StudentProfile;
  setActiveView: (view: ActiveView) => void;
  addXp: (amount: number, reason?: string) => void;
}

export const FlashcardsStudioView: React.FC<Props> = ({
  smartNotes,
  setSmartNotes,
  studentProfile,
  setActiveView,
  addXp,
}) => {
  const [activeTab, setActiveTab] = useState<"flashcards" | "cheatsheet" | "notes">("flashcards");
  const [currentCardIdx, setCurrentCardIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [topicInput, setTopicInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  const cards = smartNotes.flashcards || [];
  const currentCard = cards[currentCardIdx] || cards[0];

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleNextCard = (result: "easy" | "good" | "hard") => {
    setIsFlipped(false);
    if (result === "easy" || result === "good") {
      addXp(20, "Spaced Repetition Flashcard Reviewed");
    }

    if (currentCardIdx < cards.length - 1) {
      setCurrentCardIdx((prev) => prev + 1);
    } else {
      setCurrentCardIdx(0);
    }
  };

  const handleCopyCheatSheet = () => {
    navigator.clipboard.writeText(smartNotes.cheatSheetMarkdown || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPdf = (type: "notes" | "cheatsheet" | "packet") => {
    const opts = {
      studentName: studentProfile.name,
      targetExam: studentProfile.targetExam,
      subject: studentProfile.targetExam,
    };

    if (type === "notes") {
      downloadSmartNotesPdf(smartNotes, opts);
      setDownloadSuccess("Smart Notes PDF downloaded!");
    } else if (type === "cheatsheet") {
      downloadCheatSheetPdf(smartNotes, opts);
      setDownloadSuccess("Formula Cheat Sheet PDF downloaded!");
    } else {
      downloadCompletePacketPdf(smartNotes, opts);
      setDownloadSuccess("Complete Offline Study Bundle downloaded!");
    }

    addXp(15, "Downloaded Offline Study PDF");
    setTimeout(() => setDownloadSuccess(null), 3000);
  };

  const handleGenerateNotes = async () => {
    if (!topicInput.trim() || isGenerating) return;

    setIsGenerating(true);
    try {
      const { apiPost } = await import("../services/api");
      const data: SmartNotes = await apiPost("/api/notes/generate", {
        topic: topicInput.trim(),
        language: studentProfile.preferredLanguage,
      });
      if (data.flashcards && data.flashcards.length > 0) {
        setSmartNotes(data);
        setCurrentCardIdx(0);
        setIsFlipped(false);
        addXp(30, "Generated Smart Notes & Flashcards");
      }
    } catch (e) {
      console.error("Notes generate error:", e);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner */}
      <div className="p-6 sm:p-8 rounded-2xl card-warm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-saffron-50 text-saffron-700 text-xs font-bold border border-saffron-100">
            <Brain className="w-3.5 h-3.5" />
            <span>Leitner Spaced Repetition & Revision Hub</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-ink-900 font-display">
            Smart Notes & Flashcards
          </h1>
          <p className="text-ink-600 text-xs sm:text-sm">
            Topic: <span className="text-ink-900 font-semibold">{smartNotes.topicTitle || smartNotes.topic}</span>
          </p>
        </div>

        {/* Generate Custom Flashcards & PDF Quick Bundle */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={topicInput}
              onChange={(e) => setTopicInput(e.target.value)}
              placeholder="Generate for topic..."
              className="px-3.5 py-2.5 rounded-xl bg-ink-50 border border-ink-200 text-xs sm:text-sm text-ink-900 focus:outline-none focus:border-saffron-500 focus:bg-white w-full sm:w-48"
            />
            <button
              onClick={handleGenerateNotes}
              disabled={!topicInput.trim() || isGenerating}
              className="px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-saffron-500 to-saffron-600 hover:from-saffron-600 hover:to-saffron-700 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-saffron-100 transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              {isGenerating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              <span>Generate</span>
            </button>
          </div>

          <button
            onClick={() => handleDownloadPdf("packet")}
            className="px-4 py-2.5 rounded-xl bg-deep-600 hover:bg-deep-700 text-white font-bold text-xs shadow-md shadow-deep-100 transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
            title="Download Complete Offline Study PDF Bundle (Notes + Cheat Sheet + Flashcards)"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download All (PDF)</span>
          </button>
        </div>
      </div>

      {/* Success notification banner for PDF download */}
      {downloadSuccess && (
        <div className="p-3.5 rounded-xl bg-deep-50 border border-deep-200 text-deep-800 text-xs font-bold flex items-center justify-between animate-fade-in shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-deep-600" />
            <span>{downloadSuccess}</span>
          </div>
          <span className="text-[11px] font-mono text-deep-600">+15 XP earned</span>
        </div>
      )}

      {/* Mode Switcher Tabs */}
      <div className="flex items-center justify-between border-b border-ink-200 pb-3 gap-4 flex-wrap">
        <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto">
          <button
            onClick={() => setActiveTab("flashcards")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === "flashcards"
                ? "bg-gradient-to-r from-saffron-500 to-saffron-600 text-white shadow-xs"
                : "bg-ink-100 text-ink-700 hover:bg-ink-200 border border-ink-200"
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Interactive Flashcards ({cards.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("cheatsheet")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === "cheatsheet"
                ? "bg-gradient-to-r from-saffron-500 to-saffron-600 text-white shadow-xs"
                : "bg-ink-100 text-ink-700 hover:bg-ink-200 border border-ink-200"
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>1-Page Formula Cheat Sheet</span>
          </button>

          <button
            onClick={() => setActiveTab("notes")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === "notes"
                ? "bg-gradient-to-r from-saffron-500 to-saffron-600 text-white shadow-xs"
                : "bg-ink-100 text-ink-700 hover:bg-ink-200 border border-ink-200"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Notion-Style Summary Notes</span>
          </button>
        </div>

        {/* Tab-Specific Quick Export Action */}
        <div className="flex items-center gap-2">
          {activeTab === "cheatsheet" && (
            <button
              onClick={() => handleDownloadPdf("cheatsheet")}
              className="px-3.5 py-1.5 rounded-lg bg-deep-600 hover:bg-deep-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>Download Cheat Sheet PDF</span>
            </button>
          )}

          {activeTab === "notes" && (
            <button
              onClick={() => handleDownloadPdf("notes")}
              className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-saffron-500 to-saffron-600 hover:from-saffron-600 hover:to-saffron-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>Download Smart Notes PDF</span>
            </button>
          )}
        </div>
      </div>

      {/* Tab 1: Interactive Flashcards */}
      {activeTab === "flashcards" && currentCard && (
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex items-center justify-between text-xs text-ink-500 font-mono">
            <span>Card {currentCardIdx + 1} of {cards.length}</span>
            <span className="px-2.5 py-0.5 rounded-full bg-saffron-50 text-saffron-700 font-bold border border-saffron-200">
              Leitner Box {currentCard.boxLevel}/5
            </span>
          </div>

          {/* Flip Card with Smooth CSS 3D Effect */}
          <div
            onClick={handleFlip}
            className="cursor-pointer min-h-[300px] p-8 sm:p-12 rounded-2xl card-warm hover:border-saffron-300 flex flex-col justify-between items-center text-center transition-all hover:shadow-md relative select-none"
          >
            <div className="w-full flex items-center justify-between text-xs text-ink-400">
              <span className="uppercase tracking-wider font-bold text-saffron-600">
                {isFlipped ? "Answer & Intuition" : "Question Prompt"}
              </span>
              <span className="flex items-center gap-1 text-ink-500 font-medium">
                <RotateCw className="w-3.5 h-3.5" /> Tap to Flip
              </span>
            </div>

            <div className="my-auto text-base sm:text-xl font-bold text-ink-900 leading-relaxed py-6">
              {!isFlipped ? (
                <MarkdownMathRenderer content={currentCard.front} />
              ) : (
                <div className="space-y-3">
                  <MarkdownMathRenderer content={currentCard.back} />
                  {currentCard.mnemonic && (
                    <div className="mt-3 p-2.5 rounded-xl bg-saffron-50 text-xs text-saffron-800 border border-saffron-200 font-medium">
                      💡 Mnemonic: {currentCard.mnemonic}
                    </div>
                  )}
                </div>
              )}
            </div>

            <span className="text-xs text-ink-400 font-medium">
              {isFlipped ? "Rate your memory below to adjust spaced intervals" : "Click anywhere to reveal solution"}
            </span>
          </div>

          {/* Spaced Repetition Rating Buttons */}
          {isFlipped && (
            <div className="grid grid-cols-3 gap-3 animate-in fade-in">
              <button
                onClick={() => handleNextCard("hard")}
                className="py-3 rounded-xl bg-red-50 border border-red-200 hover:bg-red-100 text-red-700 text-xs font-bold transition-colors cursor-pointer"
              >
                Hard (Again in 1d)
              </button>
              <button
                onClick={() => handleNextCard("good")}
                className="py-3 rounded-xl bg-saffron-50 border border-saffron-200 hover:bg-saffron-100 text-saffron-700 text-xs font-bold transition-colors cursor-pointer"
              >
                Good (In 3d)
              </button>
              <button
                onClick={() => handleNextCard("easy")}
                className="py-3 rounded-xl bg-deep-50 border border-deep-200 hover:bg-deep-100 text-deep-700 text-xs font-bold transition-colors cursor-pointer"
              >
                Easy (+20 XP)
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: 1-Page Formula Cheat Sheet */}
      {activeTab === "cheatsheet" && (
        <div className="p-6 sm:p-8 rounded-2xl card-warm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-ink-100 pb-4 gap-3">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-ink-900 font-display">1-Page Formula Cheat Sheet</h2>
              <p className="text-xs text-ink-500">Condensed formula reference, golden rules, and high-frequency exam traps</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => handleDownloadPdf("cheatsheet")}
                className="px-3.5 py-1.5 rounded-lg bg-deep-600 hover:bg-deep-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
              >
                <FileDown className="w-3.5 h-3.5" />
                <span>Download PDF</span>
              </button>
              <button
                onClick={handleCopyCheatSheet}
                className="px-3 py-1.5 rounded-lg bg-ink-100 hover:bg-ink-200 text-ink-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-deep-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "Copied!" : "Copy KaTeX"}</span>
              </button>
              <button
                onClick={() => window.print()}
                className="px-3 py-1.5 rounded-lg bg-ink-100 hover:bg-ink-200 text-ink-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print</span>
              </button>
            </div>
          </div>

          {/* Structured formulas display if present */}
          {smartNotes.cheatSheet?.keyFormulas && smartNotes.cheatSheet.keyFormulas.length > 0 && (
            <div className="space-y-3">
              <span className="text-xs font-bold text-ink-700 uppercase tracking-wider block">
                ⚡ Key Governing Equations & Constants
              </span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {smartNotes.cheatSheet.keyFormulas.map((item, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-ink-50 border border-ink-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-ink-800">{item.name}</span>
                      <span className="text-[10px] font-mono text-deep-700 px-1.5 py-0.5 rounded bg-deep-50 border border-deep-200">
                        Eq #{idx + 1}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-white border border-ink-200 font-mono text-sm text-deep-800">
                      <MarkdownMathRenderer content={`$$${item.formula}$$`} />
                    </div>
                    {item.where && (
                      <p className="text-[11px] text-ink-500 italic">
                        Where: {item.where}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Golden Rules & Pitfalls grid */}
          {smartNotes.cheatSheet && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {smartNotes.cheatSheet.goldenRules && smartNotes.cheatSheet.goldenRules.length > 0 && (
                <div className="p-4 rounded-xl bg-saffron-50/70 border border-saffron-200 space-y-2.5">
                  <span className="text-xs font-bold text-saffron-900 uppercase tracking-wider block">
                    🌟 Golden Memory Rules
                  </span>
                  <ul className="space-y-1.5 text-xs text-saffron-900/90 leading-relaxed">
                    {smartNotes.cheatSheet.goldenRules.map((rule, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-saffron-600 font-bold">•</span>
                        <span>{rule}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {smartNotes.cheatSheet.commonPitfallsToAvoid && smartNotes.cheatSheet.commonPitfallsToAvoid.length > 0 && (
                <div className="p-4 rounded-xl bg-red-50/70 border border-red-200 space-y-2.5">
                  <span className="text-xs font-bold text-red-900 uppercase tracking-wider block">
                    ⚠️ Common Exam Traps & Pitfalls
                  </span>
                  <ul className="space-y-1.5 text-xs text-red-900/90 leading-relaxed">
                    {smartNotes.cheatSheet.commonPitfallsToAvoid.map((pitfall, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-red-600 font-bold">!</span>
                        <span>{pitfall}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Raw / KaTeX Markdown cheat sheet */}
          {smartNotes.cheatSheetMarkdown && (
            <div className="p-6 rounded-xl bg-ink-50 border border-ink-200 leading-relaxed font-mono text-sm text-ink-800">
              <MarkdownMathRenderer content={smartNotes.cheatSheetMarkdown} />
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Summary Notes */}
      {activeTab === "notes" && (
        <div className="p-6 sm:p-8 rounded-2xl card-warm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-ink-100 pb-4 gap-3">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-ink-900 font-display">Notion-Style Summary Notes</h2>
              <p className="text-xs text-ink-500">First-principles breakdown with core conceptual pillars</p>
            </div>
            <button
              onClick={() => handleDownloadPdf("notes")}
              className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-saffron-500 to-saffron-600 hover:from-saffron-600 hover:to-saffron-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs self-start sm:self-auto cursor-pointer"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>Download Smart Notes PDF</span>
            </button>
          </div>

          {smartNotes.keyTakeaways && smartNotes.keyTakeaways.length > 0 && (
            <div className="space-y-3">
              <span className="text-xs font-bold text-ink-700 uppercase tracking-wider block">
                Core Conceptual Pillars
              </span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {smartNotes.keyTakeaways.map((note, idx) => (
                  <div key={idx} className="p-5 rounded-xl bg-ink-50 border border-ink-200 space-y-2">
                    <span className="w-6 h-6 rounded-full bg-saffron-100 text-saffron-700 font-bold text-xs flex items-center justify-center font-mono">
                      {idx + 1}
                    </span>
                    <div className="text-xs sm:text-sm text-ink-700 leading-relaxed">
                      <MarkdownMathRenderer content={note} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {smartNotes.summaryNotesMarkdown && (
            <div className="p-6 rounded-xl bg-ink-50 border border-ink-200 leading-relaxed text-sm text-ink-800 space-y-4">
              <MarkdownMathRenderer content={smartNotes.summaryNotesMarkdown} />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
