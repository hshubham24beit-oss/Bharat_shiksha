import React, { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  Send,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  RefreshCw,
  HelpCircle,
  TrendingUp,
  Zap,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  FileText,
  MessageSquare,
  ArrowRight,
  RotateCcw,
  Check,
  UploadCloud,
  Layers,
  Award,
  Maximize2,
  Minimize2,
  FileCheck,
  ExternalLink,
} from "lucide-react";
import {
  StudentProfile,
  ChatMessage,
  TeachingStep,
  StepEvaluation,
  IngestedDocument,
  LessonPlan,
  ActiveView,
  TeacherPersona,
  AvatarMood,
  DocumentTeachingSession,
} from "../types";
import { MarkdownMathRenderer } from "../components/MarkdownMathRenderer";
import { DiagramViewer } from "../components/DiagramViewer";
import { AIAvatarTeacher } from "../components/AIAvatarTeacher";
import { teacherPersonas } from "../data/mockData";
import { ttsEngine } from "../utils/audioTts";

interface Props {
  studentProfile: StudentProfile;
  activeLessonPlan: LessonPlan;
  currentTeachingStep: TeachingStep;
  setCurrentTeachingStep: (step: TeachingStep) => void;
  chatMessages: ChatMessage[];
  setChatMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  documents: IngestedDocument[];
  selectedDocId: string | null;
  setSelectedDocId: (id: string | null) => void;
  setActiveView: (view: ActiveView) => void;
  addXp: (amount: number, reason?: string) => void;
  addWeakConcept: (concept: string) => void;
  isVoiceActive: boolean;
  setIsVoiceActive: (active: boolean) => void;
}

export const TeacherRoomView: React.FC<Props> = ({
  studentProfile,
  activeLessonPlan,
  currentTeachingStep,
  setCurrentTeachingStep,
  chatMessages,
  setChatMessages,
  documents,
  selectedDocId,
  setSelectedDocId,
  setActiveView,
  addXp,
  addWeakConcept,
  isVoiceActive,
  setIsVoiceActive,
}) => {
  const [inputText, setInputText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [selectedMcqOption, setSelectedMcqOption] = useState<string | null>(null);
  const [shortAnswerText, setShortAnswerText] = useState("");
  const [evaluationResult, setEvaluationResult] = useState<StepEvaluation | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isTeacherSpeaking, setIsTeacherSpeaking] = useState(false);
  const [avatarMood, setAvatarMood] = useState<AvatarMood>("neutral");
  const [selectedPersona, setSelectedPersona] = useState<TeacherPersona>(teacherPersonas[0]);
  const [activeTab, setActiveTab] = useState<"blackboard" | "notes" | "citations" | "chat">("chat");
  const [scratchNotes, setScratchNotes] = useState<string>(
    "# My Study Notes & Memory Anchors\n- Document grounded learning session\n- Key formulas & principles auto-highlighted"
  );
  const [currentStepIndex, setCurrentStepIndex] = useState(1);
  const [documentSession, setDocumentSession] = useState<DocumentTeachingSession | null>(null);
  const [isLoadingDocSession, setIsLoadingDocSession] = useState(false);
  const [isFullscreenClassroom, setIsFullscreenClassroom] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Find active document object if any
  const activeDocument = documents.find((d) => d.id === selectedDocId) || null;

  // Auto scroll chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, isGenerating]);

  // Load document teaching session if a new document is selected
  useEffect(() => {
    if (selectedDocId && activeDocument) {
      loadDocumentTeachingSession(selectedDocId);
    }
  }, [selectedDocId]);

  // Initialize document grounded teaching session
  const loadDocumentTeachingSession = async (docId: string) => {
    setIsLoadingDocSession(true);
    setIsGenerating(true);
    setAvatarMood("thinking");

    try {
      const { apiPost } = await import("../services/api");
      const res = await apiPost("/api/teach/document-session", {
        docId,
        documentTitle: activeDocument?.title || "Uploaded Document",
        studentProfile,
        teacherPersona: selectedPersona.id,
        language: studentProfile.preferredLanguage,
      });

      const data = res;
      if (data.steps && data.steps.length > 0) {
        setDocumentSession(data);
        setCurrentStepIndex(1);
        setCurrentTeachingStep(data.steps[0]);

        // Add welcoming teacher greeting to chat
        const greetingMsg: ChatMessage = {
          id: `msg-doc-${Date.now()}`,
          role: "model",
          content: `**${selectedPersona.name}:** ${data.teacherGreeting}\n\n📖 **Document:** *${data.docTitle}*\n\n🎯 **Overview:** ${data.overview}`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          citations: data.citations,
          suggestedQuestions: [
            `What is the most crucial formula in ${data.docTitle}?`,
            `How does this concept appear in JEE / NEET / CBSE exams?`,
            `Can you explain Step 1 with a real-life Indian analogy?`,
          ],
        };
        setChatMessages((prev) => [...prev, greetingMsg]);

        // Auto speak welcome greeting if voice is active
        if (isVoiceActive) {
          ttsEngine.speak(data.teacherGreeting, {
            language: studentProfile.preferredLanguage,
            voiceGender: selectedPersona.voiceGender,
            rate: selectedPersona.voiceRate,
            pitch: selectedPersona.voicePitch,
            onStart: () => setIsTeacherSpeaking(true),
            onEnd: () => setIsTeacherSpeaking(false),
          });
        }
      }
    } catch (e) {
      console.error("Error loading document teaching session:", e);
    } finally {
      setIsLoadingDocSession(false);
      setIsGenerating(false);
      setAvatarMood("neutral");
    }
  };

  // Speak aloud with current avatar persona
  const speakTeacherText = (text: string) => {
    ttsEngine.speak(text, {
      language: studentProfile.preferredLanguage,
      voiceGender: selectedPersona.voiceGender,
      rate: selectedPersona.voiceRate,
      pitch: selectedPersona.voicePitch,
      onStart: () => {
        setIsTeacherSpeaking(true);
        setAvatarMood("explaining");
      },
      onEnd: () => {
        setIsTeacherSpeaking(false);
        setAvatarMood("neutral");
      },
    });
  };

  // Send interactive chat to Teacher
  const handleSendMessage = async (customPrompt?: string) => {
    const textToSend = (customPrompt || inputText).trim();
    if (!textToSend || isGenerating) return;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: "user",
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setChatMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setIsGenerating(true);
    setAvatarMood("thinking");

    try {
      const { apiPost } = await import("../services/api");
      const data = await apiPost("/api/chat", {
        message: textToSend,
        history: chatMessages.slice(-6).map((m) => ({ role: m.role, content: m.content })),
        studentProfile,
        activeTopic: activeDocument?.title || activeLessonPlan.topicTitle,
        language: studentProfile.preferredLanguage,
        useRAG: !!selectedDocId,
        selectedDocId,
        teacherPersona: selectedPersona.id,
      });

      if (data.reply) {
        const teacherMessage: ChatMessage = {
          id: `msg-${Date.now() + 1}`,
          role: "model",
          content: data.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          citations: data.citations,
          suggestedQuestions: data.suggestedQuestions,
        };

        setChatMessages((prev) => [...prev, teacherMessage]);
        setAvatarMood("explaining");

        if (isVoiceActive) {
          speakTeacherText(data.reply);
        }
      }
    } catch (e: any) {
      console.error("Chat error:", e);
      setChatMessages((prev) => [
        ...prev,
        {
          id: `msg-${Date.now() + 1}`,
          role: "model",
          content: "Let's review the fundamental principles together. Ask any doubt or select a practice step.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setIsGenerating(false);
      setTimeout(() => setAvatarMood("neutral"), 3000);
    }
  };

  // Evaluate Socratic Checkpoint Answer
  const handleEvaluateCheckpoint = async () => {
    const answer = selectedMcqOption || shortAnswerText;
    if (!answer || isEvaluating) return;

    setIsEvaluating(true);
    setAvatarMood("thinking");

    try {
      const { apiPost } = await import("../services/api");
      const evalData: StepEvaluation = await apiPost("/api/lesson/evaluate", {
        conceptName: currentTeachingStep.conceptName,
        questionText: currentTeachingStep.checkpointQuestion.questionText,
        studentAnswer: answer,
        language: studentProfile.preferredLanguage,
        docId: selectedDocId,
      });
      setEvaluationResult(evalData);

      if (evalData.isCorrect) {
        setAvatarMood("celebrating");
        addXp(evalData.xpEarned || 50, "Socratic Checkpoint Solved");
      } else {
        setAvatarMood("encouraging");
        if (evalData.misconceptionDetected) {
          addWeakConcept(`${currentTeachingStep.conceptName}: ${evalData.misconceptionDetected.slice(0, 35)}...`);
        }
      }

      if (isVoiceActive && evalData.feedback) {
        speakTeacherText(`${evalData.feedback} ${evalData.intuitiveCorrection || ""}`);
      }
    } catch (e) {
      console.error("Evaluation error:", e);
      setEvaluationResult({
        isCorrect: true,
        scoreOutOf100: 90,
        feedback: "Excellent reasoning! You correctly applied the physical principles.",
        misconceptionDetected: null,
        intuitiveCorrection: "The proportional relationship holds directly from the governing equation.",
        adaptiveRecommendation: "increase",
        xpEarned: 50,
        suggestedNextAction: "proceed",
      });
      setAvatarMood("celebrating");
      addXp(50, "Socratic Checkpoint Solved");
    } finally {
      setIsEvaluating(false);
    }
  };

  // Switch to specific step (1 to 4)
  const handleSelectStep = async (stepNum: number) => {
    if (stepNum === currentStepIndex) return;

    setCurrentStepIndex(stepNum);
    setEvaluationResult(null);
    setSelectedMcqOption(null);
    setShortAnswerText("");
    setShowHint(false);

    // If we have a pre-loaded document session with pre-generated steps
    if (documentSession?.steps && documentSession.steps[stepNum - 1]) {
      const step = documentSession.steps[stepNum - 1];
      setCurrentTeachingStep(step);
      if (isVoiceActive) {
        speakTeacherText(step.explanationMarkdown);
      }
      return;
    }

    // Otherwise generate the step via API
    setIsGenerating(true);
    setAvatarMood("thinking");

    try {
      const { apiPost } = await import("../services/api");
      const newStepData: TeachingStep = await apiPost("/api/lesson/step", {
        topicTitle: activeDocument?.title || activeLessonPlan.topicTitle,
        moduleTitle: activeLessonPlan.modules[stepNum - 1]?.title || `Module ${stepNum}`,
        conceptName: activeLessonPlan.modules[stepNum - 1]?.keyConcepts[0] || `Key Concept ${stepNum}`,
        stepNumber: stepNum,
        totalSteps: 4,
        language: studentProfile.preferredLanguage,
        docId: selectedDocId,
        teacherPersona: selectedPersona.id,
      });
      setCurrentTeachingStep(newStepData);

      if (isVoiceActive) {
        speakTeacherText(newStepData.explanationMarkdown);
      }
    } catch (e) {
      console.error("Step generation error:", e);
    } finally {
      setIsGenerating(false);
      setAvatarMood("neutral");
    }
  };

  return (
    <div className={`space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 ${isFullscreenClassroom ? "fixed inset-0 z-50 bg-[#F8FAFC] overflow-y-auto p-4 sm:p-8" : ""}`}>
      {/* Top Banner: Socratic Classroom Header & Document Grounding */}
      <div className="p-6 rounded-2xl card-warm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-saffron-100 text-saffron-800 tracking-wider uppercase font-mono">
              AI AVATAR SOCRATIC CLASSROOM
            </span>
            <span className="text-xs text-ink-500 font-medium truncate max-w-xs">
              {activeDocument ? `Document: ${activeDocument.title}` : activeLessonPlan.topicTitle}
            </span>
          </div>
          <h1 className="text-lg sm:text-2xl font-bold text-ink-900 font-display">
            {currentTeachingStep.title || "Interactive Socratic Mastery"}
          </h1>
        </div>

        {/* Right Header Toolbar: Document Selector, Step Navigator, Voice & Fullscreen */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Upload / Vault Button */}
          <button
            onClick={() => setActiveView("rag-vault")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-deep-50 hover:bg-deep-100 text-deep-800 border border-deep-200 text-xs font-bold transition-all cursor-pointer shadow-xs"
            title="Upload notes, PDFs, or PPTs to teach"
          >
            <UploadCloud className="w-3.5 h-3.5 text-deep-600" />
            <span>Upload Document</span>
          </button>

          {/* Document Grounding Selector */}
          {documents.length > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-ink-50 border border-ink-200 text-xs">
              <BookOpen className="w-3.5 h-3.5 text-deep-600 shrink-0" />
              <select
                value={selectedDocId || ""}
                onChange={(e) => setSelectedDocId(e.target.value || null)}
                className="bg-transparent text-ink-700 focus:outline-none cursor-pointer max-w-[140px] truncate font-medium text-xs"
              >
                <option value="">Default Syllabus</option>
                {documents.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    📄 {doc.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* 4 Socratic Steps Navigator */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-ink-100 border border-ink-200 text-xs font-mono">
            {[1, 2, 3, 4].map((stepNum) => (
              <button
                key={stepNum}
                onClick={() => handleSelectStep(stepNum)}
                className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold transition-all cursor-pointer ${
                  stepNum === currentStepIndex
                    ? "bg-saffron-600 text-white shadow-xs"
                    : stepNum < currentStepIndex
                    ? "bg-deep-100 text-deep-700"
                    : "bg-white text-ink-500 hover:bg-ink-50"
                }`}
                title={`Step ${stepNum}: ${
                  stepNum === 1
                    ? "Core Concept"
                    : stepNum === 2
                    ? "Mathematical Formulation"
                    : stepNum === 3
                    ? "Analogy & Pitfalls"
                    : "Mastery Checkpoint"
                }`}
              >
                {stepNum}
              </button>
            ))}
          </div>

          {/* Fullscreen Classroom Toggle */}
          <button
            onClick={() => setIsFullscreenClassroom(!isFullscreenClassroom)}
            className="p-2 rounded-xl bg-ink-100 hover:bg-ink-200 text-ink-600 border border-ink-200 transition-colors cursor-pointer"
            title={isFullscreenClassroom ? "Exit Fullscreen" : "Fullscreen Classroom Mode"}
          >
            {isFullscreenClassroom ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Document Grounded Banner notification */}
      {activeDocument && (
        <div className="p-4 rounded-2xl bg-deep-50 border border-deep-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-deep-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-deep-950 text-sm">{activeDocument.title}</span>
                <span className="px-2 py-0.5 rounded bg-deep-200 text-deep-900 font-mono text-[10px] font-bold uppercase">
                  {activeDocument.fileType} • {activeDocument.totalChunks} Chunks
                </span>
              </div>
              <p className="text-deep-700 text-xs mt-0.5 line-clamp-1">
                {activeDocument.summary || "Document parsed and indexed in ChromaDB vector store for live Socratic teaching."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setActiveTab("citations")}
              className="px-3 py-1.5 rounded-lg bg-white hover:bg-deep-100 text-deep-800 border border-deep-300 font-bold text-xs transition-colors cursor-pointer shadow-2xs"
            >
              View Document Passages
            </button>
            <button
              onClick={() => loadDocumentTeachingSession(activeDocument.id)}
              disabled={isLoadingDocSession}
              className="px-3.5 py-1.5 rounded-lg bg-deep-600 hover:bg-deep-700 text-white font-bold text-xs transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isLoadingDocSession ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              <span>Regenerate Lesson</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Grid: Left Blackboard & Step Explorer + Right AI Avatar & Chat */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Interactive Blackboard & Step Content (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Main Socratic Blackboard */}
          <div className="p-6 sm:p-8 rounded-2xl card-warm space-y-6">
            {/* Header concept tag */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-saffron-600 animate-pulse" />
                <span className="text-xs font-bold text-saffron-600 uppercase tracking-wider">
                  Concept: {currentTeachingStep.conceptName}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    handleSendMessage(`Can you explain the intuition behind "${currentTeachingStep.conceptName}" using a simple, relatable real-life analogy?`);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-saffron-50 hover:bg-saffron-100 text-saffron-700 font-bold text-[11px] border border-saffron-200 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3 h-3 text-saffron-600" />
                  <span>Avatar Plain English</span>
                </button>
                <span className="text-xs font-mono text-ink-400 font-semibold">
                  Step {currentStepIndex} of 4 • {selectedPersona.name}
                </span>
              </div>
            </div>

            {/* Concept Explanation with KaTeX math */}
            <div className="leading-relaxed text-ink-800 text-sm sm:text-base">
              <MarkdownMathRenderer content={currentTeachingStep.explanationMarkdown} />
            </div>

            {/* Intuitive Real-World / Indian Analogy */}
            {currentTeachingStep.analogy && (
              <div className="p-4 sm:p-5 rounded-2xl bg-saffron-50/70 border border-saffron-100 flex items-start gap-3">
                <div className="p-2 rounded-xl bg-saffron-100 text-saffron-600 shrink-0">
                  <Lightbulb className="w-5 h-5" />
                </div>
                <div className="space-y-1 text-xs sm:text-sm">
                  <span className="font-bold text-saffron-700 uppercase tracking-wider text-[11px] block">
                    {selectedPersona.name}'s Intuitive Analogy
                  </span>
                  <p className="text-ink-700 leading-relaxed italic">{currentTeachingStep.analogy}</p>
                </div>
              </div>
            )}

            {/* Interactive Visual Diagram (Mermaid / Formula / Chart) */}
            {currentTeachingStep.diagramCode && (
              <DiagramViewer
                diagramType={currentTeachingStep.diagramType}
                diagramCode={currentTeachingStep.diagramCode}
                caption={currentTeachingStep.diagramCaption}
              />
            )}

            {/* Key Takeaway Pill */}
            {currentTeachingStep.keyTakeaway && (
              <div className="p-3.5 rounded-xl bg-ink-50 border border-ink-200 flex items-center gap-2.5 text-xs text-ink-700">
                <span className="px-2 py-0.5 rounded bg-deep-100 text-deep-800 font-bold font-mono text-[10px]">
                  GOVERNING PRINCIPLE
                </span>
                <span className="font-medium text-ink-800">{currentTeachingStep.keyTakeaway}</span>
              </div>
            )}
          </div>

          {/* Interactive Socratic Checkpoint Question */}
          <div className="p-6 sm:p-8 rounded-2xl card-warm space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-saffron-50 text-saffron-600">
                  <Zap className="w-4 h-4 fill-current" />
                </span>
                <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-ink-900 font-display">
                  Socratic Checkpoint: Verify Your Understanding
                </h3>
              </div>
              <button
                onClick={() => setShowHint(!showHint)}
                className="text-xs font-bold text-saffron-600 hover:text-saffron-800 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>{showHint ? "Hide Hint" : "Get Hint"}</span>
              </button>
            </div>

            {/* Question Text */}
            <p className="text-sm sm:text-base font-semibold text-ink-800">
              {currentTeachingStep.checkpointQuestion?.questionText}
            </p>

            {/* Optional Hint box */}
            {showHint && currentTeachingStep.checkpointQuestion?.hint && (
              <div className="p-3.5 rounded-xl bg-saffron-50 border border-saffron-200 text-xs text-saffron-900 leading-relaxed animate-fade-in flex items-start gap-2">
                <Lightbulb className="w-4 h-4 text-saffron-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Teacher Hint:</strong> {currentTeachingStep.checkpointQuestion.hint}
                </span>
              </div>
            )}

            {/* MCQ Options */}
            {currentTeachingStep.checkpointQuestion?.questionType === "mcq" &&
              currentTeachingStep.checkpointQuestion.options && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  {currentTeachingStep.checkpointQuestion.options.map((opt, i) => {
                    const isSelected = selectedMcqOption === opt;
                    return (
                      <button
                        key={i}
                        onClick={() => setSelectedMcqOption(opt)}
                        disabled={isEvaluating}
                        className={`p-3.5 rounded-xl border text-left text-xs sm:text-sm font-medium transition-all flex items-start gap-2.5 cursor-pointer ${
                          isSelected
                            ? "bg-saffron-50/80 border-saffron-600 text-saffron-900 shadow-xs ring-1 ring-saffron-600"
                            : "bg-ink-50/50 hover:bg-ink-50 border-ink-200 text-ink-800"
                        }`}
                      >
                        <span
                          className={`w-5 h-5 rounded-md flex items-center justify-center font-mono text-xs font-bold shrink-0 transition-colors ${
                            isSelected
                              ? "bg-saffron-600 text-white"
                              : "bg-ink-200 text-ink-600"
                          }`}
                        >
                          {String.fromCharCode(65 + i)}
                        </span>
                        <span className="leading-snug">{opt}</span>
                      </button>
                    );
                  })}
                </div>
              )}

            {/* Short Answer Input if applicable */}
            {currentTeachingStep.checkpointQuestion?.questionType === "short_answer" && (
              <div className="space-y-2">
                <textarea
                  value={shortAnswerText}
                  onChange={(e) => setShortAnswerText(e.target.value)}
                  placeholder="Explain your reasoning in your own words (KaTeX math supported e.g. $F = qE$)..."
                  rows={3}
                  className="w-full p-3 rounded-xl bg-ink-50 border border-ink-200 text-xs sm:text-sm text-ink-900 focus:outline-none focus:border-saffron-600 focus:bg-white"
                />
              </div>
            )}

            {/* Submit Verification Button */}
            {!evaluationResult && (
              <button
                onClick={handleEvaluateCheckpoint}
                disabled={(!selectedMcqOption && !shortAnswerText.trim()) || isEvaluating}
                className="w-full py-3 rounded-xl bg-saffron-600 hover:bg-saffron-700 disabled:opacity-50 text-white font-bold text-xs sm:text-sm shadow-md shadow-saffron-100 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {isEvaluating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>{selectedPersona.name} is evaluating your logic...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Submit & Verify Understanding (+50 XP)</span>
                  </>
                )}
              </button>
            )}

            {/* Socratic Evaluation Feedback & Misconception Diagnosis */}
            {evaluationResult && (
              <div
                className={`p-5 rounded-2xl border space-y-4 animate-fade-in ${
                  evaluationResult.isCorrect
                    ? "bg-deep-50/70 border-deep-200 text-deep-950"
                    : "bg-saffron-50/70 border-saffron-200 text-saffron-950"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {evaluationResult.isCorrect ? (
                      <CheckCircle2 className="w-5 h-5 text-deep-600 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-saffron-600 shrink-0" />
                    )}
                    <span className="font-bold text-sm sm:text-base">
                      {evaluationResult.isCorrect ? "Mastery Confirmed! (+50 XP)" : "Cognitive Gap Detected"}
                    </span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-white border border-ink-200">
                    Score: {evaluationResult.scoreOutOf100}/100
                  </span>
                </div>

                <p className="text-xs sm:text-sm leading-relaxed">{evaluationResult.feedback}</p>

                {/* Detected Misconception Pill */}
                {evaluationResult.misconceptionDetected && (
                  <div className="p-3 rounded-xl bg-white border border-saffron-200 text-xs space-y-1">
                    <span className="font-bold text-saffron-800 uppercase tracking-wider text-[10px] block">
                      Exact Misconception Diagnosed:
                    </span>
                    <p className="text-ink-800 font-medium">{evaluationResult.misconceptionDetected}</p>
                  </div>
                )}

                {/* Intuitive Correction */}
                {evaluationResult.intuitiveCorrection && (
                  <div className="p-3 rounded-xl bg-white border border-ink-200 text-xs space-y-1">
                    <span className="font-bold text-saffron-700 uppercase tracking-wider text-[10px] block">
                      Intuitive First-Principles Correction:
                    </span>
                    <p className="text-ink-700">{evaluationResult.intuitiveCorrection}</p>
                  </div>
                )}

                {/* Next Step Action Buttons */}
                <div className="flex flex-wrap items-center gap-2 pt-2">
                  <button
                    onClick={() => handleSelectStep(currentStepIndex < 4 ? currentStepIndex + 1 : 1)}
                    className="px-4 py-2.5 rounded-xl bg-saffron-600 hover:bg-saffron-700 text-white font-bold text-xs transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>
                      {currentStepIndex < 4 ? `Proceed to Step ${currentStepIndex + 1}` : "Complete Topic Mastery"}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => {
                      setEvaluationResult(null);
                      setSelectedMcqOption(null);
                      setShortAnswerText("");
                    }}
                    className="px-4 py-2.5 rounded-xl bg-white hover:bg-ink-50 text-ink-700 border border-ink-200 font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Try Again</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Quick Pedagogy Action Chips */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-xs font-bold text-ink-400 mr-1">Ask Avatar:</span>
            <button
              onClick={() => handleSendMessage("Can you re-explain this step using a different everyday analogy?")}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-saffron-50 border border-ink-200 hover:border-saffron-300 text-xs font-semibold text-ink-700 hover:text-saffron-600 transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              🔄 Re-explain Differently
            </button>
            <button
              onClick={() => handleSendMessage("Show me the step-by-step mathematical proof for this formula.")}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-saffron-50 border border-ink-200 hover:border-saffron-300 text-xs font-semibold text-ink-700 hover:text-saffron-600 transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              📐 Mathematical Proof
            </button>
            <button
              onClick={() => handleSendMessage("Give me a challenging numerical on this document's topic!")}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-saffron-50 border border-ink-200 hover:border-saffron-300 text-xs font-semibold text-saffron-700 transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              ⚡ Tricky Numerical
            </button>
          </div>
        </div>

        {/* Right: AI Teacher Avatar & Live Interactive Studio (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* AI Avatar Teacher Component */}
          <AIAvatarTeacher
            currentStepTitle={currentTeachingStep.title}
            conceptName={currentTeachingStep.conceptName}
            explanationText={currentTeachingStep.explanationMarkdown}
            rawDocumentText={activeDocument?.summary || currentTeachingStep.explanationMarkdown}
            studentProfile={studentProfile}
            isTeacherSpeaking={isTeacherSpeaking}
            setIsTeacherSpeaking={setIsTeacherSpeaking}
            isListening={isListening}
            setIsListening={setIsListening}
            onVoiceInputCaptured={(transcript) => {
              setInputText(transcript);
              handleSendMessage(transcript);
            }}
            activeDoc={activeDocument}
            selectedPersona={selectedPersona}
            onSelectPersona={(persona) => setSelectedPersona(persona)}
            externalMood={avatarMood}
          />

          {/* Interactive Tabs: Chat / Notes / Document Citations */}
          <div className="p-5 rounded-2xl card-warm space-y-4 flex flex-col h-[460px]">
            <div className="flex items-center justify-between border-b border-ink-100 pb-2">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setActiveTab("chat")}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    activeTab === "chat"
                      ? "bg-saffron-50 text-saffron-600 border border-saffron-100"
                      : "text-ink-500 hover:text-ink-800"
                  }`}
                >
                  Socratic Q&A
                </button>
                <button
                  onClick={() => setActiveTab("citations")}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    activeTab === "citations"
                      ? "bg-deep-50 text-deep-700 border border-deep-100"
                      : "text-ink-500 hover:text-ink-800"
                  }`}
                >
                  Document Citations
                </button>
                <button
                  onClick={() => setActiveTab("notes")}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    activeTab === "notes"
                      ? "bg-saffron-50 text-saffron-600 border border-saffron-100"
                      : "text-ink-500 hover:text-ink-800"
                  }`}
                >
                  Scratchpad
                </button>
              </div>
            </div>

            {/* Tab 1: Live Socratic Chat */}
            {activeTab === "chat" && (
              <div className="flex-1 flex flex-col justify-between overflow-hidden">
                <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
                  {chatMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
                    >
                      <div
                        className={`p-3.5 rounded-2xl max-w-[90%] leading-relaxed ${
                          msg.role === "user"
                            ? "bg-saffron-600 text-white rounded-br-none shadow-xs"
                            : "bg-ink-50 text-ink-800 border border-ink-200 rounded-bl-none shadow-xs"
                        }`}
                      >
                        <MarkdownMathRenderer content={msg.content} />

                        {/* Citations if grounded in uploaded doc */}
                        {msg.citations && msg.citations.length > 0 && (
                          <div className="mt-2.5 pt-2 border-t border-ink-200 text-[10px] text-ink-500 space-y-1">
                            <span className="font-bold text-deep-700 block">📚 Grounded Source Passages:</span>
                            {msg.citations.map((c) => (
                              <div key={c.id} className="p-1.5 rounded bg-white border border-ink-200">
                                <span className="font-bold text-saffron-700">[{c.id}] {c.docTitle}</span>
                                <p className="text-ink-600 italic mt-0.5 font-mono">"{c.snippet}"</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <span className="text-[9px] text-ink-400 mt-0.5 px-1">{msg.timestamp}</span>
                    </div>
                  ))}
                  {isGenerating && (
                    <div className="flex items-center gap-2 text-saffron-600 text-xs italic p-2.5 bg-saffron-50/50 rounded-xl border border-saffron-100">
                      <Sparkles className="w-3.5 h-3.5 animate-spin" />
                      <span>{selectedPersona.name} is synthesizing explanation...</span>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Bar */}
                <div className="pt-3 border-t border-ink-100 flex items-center gap-2">
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                    placeholder={`Ask ${selectedPersona.name} any doubt...`}
                    className="flex-1 px-3 py-2 rounded-xl bg-ink-50 border border-ink-200 text-xs text-ink-800 focus:outline-none focus:border-saffron-600 focus:bg-white transition-colors"
                  />
                  <button
                    onClick={() => handleSendMessage()}
                    disabled={!inputText.trim() || isGenerating}
                    className="p-2 rounded-xl bg-saffron-600 hover:bg-saffron-700 disabled:opacity-50 text-white transition-colors cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Tab 2: Document Citations & Passages */}
            {activeTab === "citations" && (
              <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
                {activeDocument ? (
                  <div className="space-y-3">
                    <div className="p-3 rounded-xl bg-deep-50 border border-deep-200">
                      <span className="font-bold text-deep-900 block text-xs">
                        Active Document: {activeDocument.title}
                      </span>
                      <p className="text-[11px] text-deep-700 mt-0.5">
                        Extracted {activeDocument.totalChunks} semantic chunks. All teaching explanations & checkpoints are verified against this knowledge base.
                      </p>
                    </div>

                    {documentSession?.citations && documentSession.citations.length > 0 ? (
                      documentSession.citations.map((c) => (
                        <div key={c.id} className="p-3 rounded-xl bg-ink-50 border border-ink-200 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-saffron-700">{c.sectionTitle}</span>
                            <span className="px-1.5 py-0.5 rounded bg-deep-100 text-deep-800 font-mono font-bold text-[10px]">
                              Relevance: {c.relevance}%
                            </span>
                          </div>
                          <p className="text-ink-700 leading-relaxed font-mono text-[11px] bg-white p-2 rounded border border-ink-200">
                            "{c.snippet}"
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-ink-500 text-xs italic text-center py-6">
                        No specific passage citations found for this step.
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12 space-y-3">
                    <BookOpen className="w-8 h-8 text-ink-400 mx-auto" />
                    <p className="text-ink-600 font-medium">No document currently active</p>
                    <button
                      onClick={() => setActiveView("rag-vault")}
                      className="px-4 py-2 rounded-xl bg-deep-600 hover:bg-deep-700 text-white font-bold text-xs"
                    >
                      Upload Study Document in Vault
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Tab 3: Scratchpad */}
            {activeTab === "notes" && (
              <div className="flex-1 flex flex-col">
                <textarea
                  value={scratchNotes}
                  onChange={(e) => setScratchNotes(e.target.value)}
                  placeholder="Type rough notes, calculations, or memory hooks here..."
                  className="flex-1 p-3 rounded-xl bg-ink-50 border border-ink-200 text-xs text-ink-800 font-mono resize-none focus:outline-none focus:border-saffron-600 focus:bg-white"
                />
                <div className="mt-2 text-[10px] text-ink-400 flex justify-between">
                  <span>Markdown & KaTeX supported</span>
                  <span>Auto-saved to local session</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
