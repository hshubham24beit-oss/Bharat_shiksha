import React, { useState, useEffect, useRef } from "react";
import {
  Video,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Sparkles,
  RefreshCw,
  Layers,
  FileText,
  Clock,
  CheckCircle2,
  BookOpen,
  UploadCloud,
  HelpCircle,
  Send,
  Check,
  ChevronRight,
  Download,
  ExternalLink,
  MessageSquare,
  AlertCircle,
  GraduationCap,
  Award,
  Flame,
  Maximize2,
  Zap,
  RotateCcw,
  ListOrdered,
  FileCheck,
  Paperclip,
  Share2,
} from "lucide-react";
import {
  VideoLecture,
  VideoSlide,
  StudentProfile,
  ActiveView,
  IngestedDocument,
  LessonPlan,
} from "../types";
import { DiagramViewer } from "../components/DiagramViewer";
import { MarkdownMathRenderer } from "../components/MarkdownMathRenderer";
import { ttsEngine } from "../utils/audioTts";
import uploadService, { validateFile, processAndIndexDocument } from "../services/uploadService";
import { downloadVideoLecturePdf } from "../utils/pdfExport";

interface Props {
  videoLecture: VideoLecture;
  setVideoLecture: React.Dispatch<React.SetStateAction<VideoLecture>>;
  studentProfile: StudentProfile;
  setActiveView: (view: ActiveView) => void;
  addXp: (amount: number, reason?: string) => void;
  documents?: IngestedDocument[];
  setDocuments?: React.Dispatch<React.SetStateAction<IngestedDocument[]>>;
  selectedDocId?: string | null;
  setSelectedDocId?: (id: string | null) => void;
  activeLessonPlan?: LessonPlan;
}

export const VideoLectureView: React.FC<Props> = ({
  videoLecture,
  setVideoLecture,
  studentProfile,
  setActiveView,
  addXp,
  documents = [],
  setDocuments,
  selectedDocId,
  setSelectedDocId,
  activeLessonPlan,
}) => {
  const [currentSlideIdx, setCurrentSlideIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [autoAdvance, setAutoAdvance] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState(false);
  
  // Generation & Document Grounding State
  const [activeTab, setActiveTab] = useState<"player" | "transcript" | "doubts">("player");
  const [selectedDocumentId, setSelectedDocumentId] = useState<string>(selectedDocId || (documents[0]?.id || ""));
  const [lectureStyle, setLectureStyle] = useState<string>("comprehensive");
  const [teacherPersona, setTeacherPersona] = useState<string>("vikram");
  const [lectureLanguage, setLectureLanguage] = useState<string>(studentProfile.preferredLanguage || "English");
  const [numberOfSlides, setNumberOfSlides] = useState<number>(5);
  const [isGenerating, setIsGenerating] = useState(false);
  const [customTopic, setCustomTopic] = useState("");

  // Slide Checkpoint Quiz State
  const [selectedQuizOption, setSelectedQuizOption] = useState<string | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState<boolean>(false);
  const [quizAnsweredSlides, setQuizAnsweredSlides] = useState<Record<number, boolean>>({});

  // Slide Doubt Solver State
  const [doubtInput, setDoubtInput] = useState("");
  const [isSolvingDoubt, setIsSolvingDoubt] = useState(false);
  const [slideDoubts, setSlideDoubts] = useState<
    Array<{
      question: string;
      answer: string;
      slideNumber: number;
      timestamp: string;
    }>
  >([]);

  // Instant Document Upload State
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Subtitle / Spoken word state
  const [spokenWord, setSpokenWord] = useState<string>("");

  const currentSlide: VideoSlide =
    videoLecture.slides && videoLecture.slides[currentSlideIdx]
      ? videoLecture.slides[currentSlideIdx]
      : {
          slideNumber: 1,
          heading: "Welcome to AI Video Lecture",
          bulletPoints: ["Select an uploaded document to generate synchronized slides."],
          voiceoverNarration: "Welcome! Please select a document to start your video lecture.",
          estimatedSeconds: 30,
        };

  // Sync selected document when prop changes
  useEffect(() => {
    if (selectedDocId) {
      setSelectedDocumentId(selectedDocId);
    } else if (documents.length > 0 && !selectedDocumentId) {
      setSelectedDocumentId(documents[0].id);
    }
  }, [selectedDocId, documents]);

  // Handle Play / Pause narration with speed and language
  useEffect(() => {
    if (isPlaying && currentSlide && !isMuted) {
      const textToSpeak = currentSlide.voiceoverNarration || currentSlide.narrationScript || currentSlide.heading || "";
      
      const personaGender = teacherPersona === "ananya" || teacherPersona === "tara" ? "female" : "male";

      ttsEngine.speak(
        textToSpeak,
        {
          language: lectureLanguage,
          rate: playbackSpeed * 0.95,
          voiceGender: personaGender,
          onBoundary: (word) => {
            setSpokenWord(word);
          },
          onEnd: () => {
            setSpokenWord("");
            if (autoAdvance) {
              if (currentSlideIdx < videoLecture.slides.length - 1) {
                setCurrentSlideIdx((prev) => prev + 1);
              } else {
                setIsPlaying(false);
                addXp(50, "Completed Full Video Lecture Masterclass");
              }
            } else {
              setIsPlaying(false);
            }
          },
        }
      );
    } else {
      ttsEngine.stop();
      setSpokenWord("");
    }

    return () => {
      ttsEngine.stop();
    };
  }, [isPlaying, currentSlideIdx, playbackSpeed, isMuted, lectureLanguage, teacherPersona]);

  // Reset quiz option when slide changes
  useEffect(() => {
    setSelectedQuizOption(null);
    setQuizSubmitted(false);
  }, [currentSlideIdx]);

  const handleTogglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const handleNextSlide = () => {
    if (currentSlideIdx < videoLecture.slides.length - 1) {
      setCurrentSlideIdx(currentSlideIdx + 1);
    }
  };

  const handlePrevSlide = () => {
    if (currentSlideIdx > 0) {
      setCurrentSlideIdx(currentSlideIdx - 1);
    }
  };

  const handleReplaySlide = () => {
    ttsEngine.stop();
    setIsPlaying(false);
    setTimeout(() => {
      setIsPlaying(true);
    }, 100);
  };

  // Generate Video Lecture from Selected Uploaded Document
  const handleGenerateLectureFromDoc = async () => {
    if (isGenerating) return;

    const targetDoc = documents.find((d) => d.id === selectedDocumentId);
    const effectiveTopic =
      customTopic.trim() ||
      targetDoc?.title ||
      activeLessonPlan?.topicTitle ||
      "Syllabus Masterclass";

    setIsGenerating(true);
    try {
      const { apiPost } = await import("../services/api");
      const data: VideoLecture = await apiPost("/api/video/generate", {
        topic: effectiveTopic,
        docId: selectedDocumentId || undefined,
        docTitle: targetDoc?.title || effectiveTopic,
        lectureStyle,
        teacherPersona,
        language: lectureLanguage,
        numberOfSlides,
        studentProfile,
      });
      if (data.slides && data.slides.length > 0) {
        setVideoLecture(data);
        setCurrentSlideIdx(0);
        setIsPlaying(true);
        addXp(40, `Generated AI Video Lecture on "${targetDoc?.title || effectiveTopic}"`);
      }
    } catch (e) {
      console.error("Video lecture generation error:", e);
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle Quick Upload of New Document
  const handleFileUpload = async (file: File) => {
    const validation = validateFile(file);
    if (!validation.isValid) {
      setUploadError(validation.error || "Invalid file format");
      return;
    }

    setUploadError(null);
    setIsUploading(true);

    try {
      const result = await processAndIndexDocument(file);
      const doc = result.document;
      if (setDocuments) {
        setDocuments((prev) => [doc, ...prev]);
      }
      if (setSelectedDocId) {
        setSelectedDocId(doc.id);
      }
      setSelectedDocumentId(doc.id);
      addXp(25, `Uploaded "${doc.title}" to Knowledge Vault`);

      // Auto trigger video generation for newly uploaded document
      setIsGenerating(true);
      const { apiPost } = await import("../services/api");
      const lectureData: VideoLecture = await apiPost("/api/video/generate", {
        topic: doc.title,
        docId: doc.id,
        docTitle: doc.title,
        lectureStyle,
        teacherPersona,
        language: lectureLanguage,
        numberOfSlides,
        studentProfile,
      });
      if (lectureData.slides && lectureData.slides.length > 0) {
        setVideoLecture(lectureData);
        setCurrentSlideIdx(0);
        setIsPlaying(true);
        addXp(40, `Created AI Video Lecture for "${doc.title}"`);
      }
    } catch (err: any) {
      setUploadError(err.message || "Failed to parse and index document.");
    } finally {
      setIsUploading(false);
      setIsGenerating(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  // Handle Checkpoint Quiz Submission
  const handleQuizSubmit = () => {
    if (!selectedQuizOption || quizSubmitted) return;
    setQuizSubmitted(true);

    const isCorrect =
      currentSlide.checkpointQuiz &&
      selectedQuizOption === currentSlide.checkpointQuiz.answer;

    if (isCorrect && !quizAnsweredSlides[currentSlideIdx]) {
      setQuizAnsweredSlides((prev) => ({ ...prev, [currentSlideIdx]: true }));
      addXp(20, `Mastered Slide ${currentSlideIdx + 1} Checkpoint Quiz`);
    }
  };

  // Handle Asking Live Doubt on Current Slide
  const handleAskDoubt = async () => {
    if (!doubtInput.trim() || isSolvingDoubt) return;

    const questionText = doubtInput.trim();
    setDoubtInput("");
    setIsSolvingDoubt(true);

    // Pause video while asking doubt
    setIsPlaying(false);
    ttsEngine.stop();

    try {
      const { apiPost } = await import("../services/api");
      const data = await apiPost("/api/video/ask-doubt", {
        question: questionText,
        slideHeading: currentSlide.heading,
        slideContent: currentSlide.bulletPoints,
        lectureTitle: videoLecture.title,
        sourceDocId: selectedDocumentId || videoLecture.sourceDocId,
        language: lectureLanguage,
        teacherPersona,
      });
      const newDoubtEntry = {
        question: questionText,
        answer: data.answer || "Here is the first-principles explanation of this step.",
        slideNumber: currentSlideIdx + 1,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setSlideDoubts((prev) => [newDoubtEntry, ...prev]);
      setActiveTab("doubts");
      addXp(15, "Asked In-depth Slide Concept Doubt");

      // Spoken voiceover for the teacher's doubt reply if requested
      if (data.spokenExplanation) {
        ttsEngine.speak(
          data.spokenExplanation,
          lectureLanguage,
          () => {},
          () => {}
        );
      }
    } catch (e) {
      console.error("Doubt solver error:", e);
    } finally {
      setIsSolvingDoubt(false);
    }
  };

  // Export Lecture Notes / Slides as PDF
  const handleExportLectureNotes = () => {
    downloadVideoLecturePdf(videoLecture, {
      studentName: studentProfile.name,
      targetExam: studentProfile.targetExam,
    });
    addXp(20, "Exported Video Lecture Study Guide PDF");
  };

  const activeDoc = documents.find((d) => d.id === selectedDocumentId);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* 1. Top Studio Header & Document Grounding Selector */}
      <div className="p-6 sm:p-8 rounded-2xl card-warm space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-2xl space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-saffron-50 text-saffron-700 text-xs font-bold border border-saffron-100">
              <Video className="w-3.5 h-3.5" />
              <span>Multimodal AI Lecture & Video Studio</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-ink-900 font-display">
              {videoLecture.title || "Document-Grounded AI Video Lecture"}
            </h1>
            <p className="text-ink-600 text-xs sm:text-sm leading-relaxed">
              Transform any uploaded PDF, textbook chapter, or handwritten notes into a synchronized slide lecture with AI voice narration, interactive diagrams, and live doubt resolution.
            </p>
          </div>

          {/* Quick Action Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleExportLectureNotes}
              className="px-3.5 py-2 rounded-xl bg-ink-100 hover:bg-ink-200 text-ink-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Download full slide deck and voiceover transcript as offline PDF"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Lecture PDF</span>
            </button>
            <button
              onClick={() => setActiveView("teacher")}
              className="px-3.5 py-2 rounded-xl bg-saffron-50 hover:bg-saffron-100 text-saffron-700 border border-saffron-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Socratic Avatar</span>
            </button>
          </div>
        </div>

        {/* Document Selection & Customization Controls */}
        <div className="pt-4 border-t border-ink-100 grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          {/* Document Picker */}
          <div className="md:col-span-4 space-y-1.5">
            <label className="text-xs font-bold text-ink-700 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-saffron-600" />
                Select Uploaded Document ({documents.length})
              </span>
              <span
                onClick={() => fileInputRef.current?.click()}
                className="text-[11px] text-saffron-600 hover:underline cursor-pointer font-semibold"
              >
                + Upload New
              </span>
            </label>
            <select
              value={selectedDocumentId}
              onChange={(e) => {
                setSelectedDocumentId(e.target.value);
                if (setSelectedDocId) setSelectedDocId(e.target.value);
              }}
              className="w-full px-3 py-2 rounded-xl bg-ink-50 border border-ink-200 text-xs font-semibold text-ink-900 focus:outline-none focus:border-saffron-600 focus:bg-white"
            >
              {documents.length === 0 ? (
                <option value="">No documents in Knowledge Vault (Upload below)</option>
              ) : (
                documents.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    📄 {doc.title} ({doc.totalChunks} chunks)
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Lecture Style */}
          <div className="md:col-span-3 space-y-1.5">
            <label className="text-xs font-bold text-ink-700 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-saffron-600" />
              Pedagogical Style
            </label>
            <select
              value={lectureStyle}
              onChange={(e) => setLectureStyle(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-ink-50 border border-ink-200 text-xs font-semibold text-ink-900 focus:outline-none focus:border-saffron-600 focus:bg-white"
            >
              <option value="comprehensive">🎓 Comprehensive Masterclass (5-7 Slides)</option>
              <option value="rapid_revision">⚡ High-Yield 3-Min Exam Sprint (3-4 Slides)</option>
              <option value="derivations">📐 Step-by-Step Derivations & Formulas</option>
              <option value="feynman_analogy">💡 Feynman Real-Life Analogies</option>
              <option value="exam_traps">⚠️ Common Exam Traps & Pitfalls</option>
            </select>
          </div>

          {/* Teacher Persona */}
          <div className="md:col-span-2 space-y-1.5">
            <label className="text-xs font-bold text-ink-700 flex items-center gap-1.5">
              <GraduationCap className="w-3.5 h-3.5 text-saffron-600" />
              Teacher Persona
            </label>
            <select
              value={teacherPersona}
              onChange={(e) => setTeacherPersona(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-ink-50 border border-ink-200 text-xs font-semibold text-ink-900 focus:outline-none focus:border-saffron-600 focus:bg-white"
            >
              <option value="vikram">Dr. Vikram AI (Physics/Maths)</option>
              <option value="ananya">Prof. Ananya AI (Bio/Chem)</option>
              <option value="chanakya">Acharya Chanakya AI (Logic)</option>
              <option value="tara">Tara AI (Peer Hinglish)</option>
            </select>
          </div>

          {/* Language */}
          <div className="md:col-span-1 space-y-1.5">
            <label className="text-xs font-bold text-ink-700">Language</label>
            <select
              value={lectureLanguage}
              onChange={(e) => setLectureLanguage(e.target.value)}
              className="w-full px-2 py-2 rounded-xl bg-ink-50 border border-ink-200 text-xs font-semibold text-ink-900 focus:outline-none focus:border-saffron-600 focus:bg-white"
            >
              <option value="English">English</option>
              <option value="Hindi">Hindi (हिंदी)</option>
              <option value="Hinglish">Hinglish</option>
              <option value="Marathi">Marathi (मराठी)</option>
              <option value="Tamil">Tamil (தமிழ்)</option>
              <option value="Telugu">Telugu (తెలుగు)</option>
              <option value="Bengali">Bengali (বাংলা)</option>
              <option value="Gujarati">Gujarati (ગુજરાતી)</option>
              <option value="Kannada">Kannada (ಕನ್ನಡ)</option>
            </select>
          </div>

          {/* Generate Button */}
          <div className="md:col-span-2">
            <button
              onClick={handleGenerateLectureFromDoc}
              disabled={isGenerating || isUploading}
              className="w-full px-4 py-2 rounded-xl bg-saffron-600 hover:bg-saffron-700 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-saffron-200 transition-all flex items-center justify-center gap-1.5 cursor-pointer h-[38px]"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Synthesizing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Generate Video</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Hidden File Input for quick document addition */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.pptx,.txt"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              handleFileUpload(e.target.files[0]);
            }
          }}
          className="hidden"
        />

        {/* Active Grounding Status Banner */}
        {activeDoc && (
          <div className="p-3 rounded-xl bg-saffron-50/70 border border-saffron-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-saffron-900 font-medium">
              <span className="w-2 h-2 rounded-full bg-deep-500 animate-pulse" />
              <span>
                <strong>Grounded on:</strong> {activeDoc.title} ({activeDoc.totalChunks} searchable RAG chunks)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-saffron-700 bg-saffron-100/80 px-2 py-0.5 rounded-full font-mono">
                {activeDoc.keyTopics?.slice(0, 3).join(" • ") || "First Principles"}
              </span>
            </div>
          </div>
        )}

        {/* Upload Error Banner if any */}
        {uploadError && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{uploadError}</span>
          </div>
        )}
      </div>

      {/* 2. Studio Tabs: Video Player | Full Transcript | Slide Doubts */}
      <div className="flex items-center justify-between border-b border-ink-200 pb-3 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("player")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "player"
                ? "bg-gradient-to-r from-saffron-500 to-saffron-600 text-white shadow-xs"
                : "bg-ink-100 text-ink-700 hover:bg-ink-200 border border-ink-200"
            }`}
          >
            <Video className="w-4 h-4" />
            <span>Interactive Slide Stage ({videoLecture.slides.length} Slides)</span>
          </button>

          <button
            onClick={() => setActiveTab("transcript")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "transcript"
                ? "bg-gradient-to-r from-saffron-500 to-saffron-600 text-white shadow-xs"
                : "bg-ink-100 text-ink-700 hover:bg-ink-200 border border-ink-200"
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Full Lecture Transcript & Script</span>
          </button>

          <button
            onClick={() => setActiveTab("doubts")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "doubts"
                ? "bg-gradient-to-r from-saffron-500 to-saffron-600 text-white shadow-xs"
                : "bg-ink-100 text-ink-700 hover:bg-ink-200 border border-ink-200"
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Live Slide Doubts ({slideDoubts.length})</span>
          </button>
        </div>

        {/* Player State Controls */}
        <div className="flex items-center gap-3 text-xs">
          {/* Speed selector */}
          <div className="flex items-center gap-1.5 bg-ink-100 px-2 py-1 rounded-lg border border-ink-200">
            <span className="text-ink-500 font-medium">Speed:</span>
            {[0.75, 1.0, 1.25, 1.5, 2.0].map((s) => (
              <button
                key={s}
                onClick={() => setPlaybackSpeed(s)}
                className={`px-1.5 py-0.5 rounded text-[11px] font-bold cursor-pointer transition-colors ${
                  playbackSpeed === s
                    ? "bg-saffron-600 text-white"
                    : "text-ink-700 hover:bg-ink-200"
                }`}
              >
                {s}x
              </button>
            ))}
          </div>

          {/* Auto advance toggle */}
          <button
            onClick={() => setAutoAdvance(!autoAdvance)}
            className={`px-2.5 py-1 rounded-lg border text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
              autoAdvance
                ? "bg-saffron-50 text-saffron-700 border-saffron-200"
                : "bg-ink-100 text-ink-600 border-ink-200"
            }`}
            title="Automatically advance to next slide when voice narration completes"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Auto-Advance: {autoAdvance ? "ON" : "OFF"}</span>
          </button>
        </div>
      </div>

      {/* 3. Main Stage Player Tab */}
      {activeTab === "player" && (
        <div className="space-y-6">
          <div className="rounded-2xl card-warm overflow-hidden flex flex-col">
            {/* Presentation Canvas Header */}
            <div className="px-6 py-4 bg-ink-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-deep-400 animate-pulse" />
                  <span className="text-xs font-mono font-bold text-deep-400 uppercase tracking-wider">
                    Slide {currentSlide.slideNumber} of {videoLecture.slides.length}
                  </span>
                </div>
                <span className="text-ink-500">•</span>
                <span className="text-xs text-ink-300 font-medium truncate max-w-xs sm:max-w-md">
                  {currentSlide.heading}
                </span>
              </div>

              <div className="flex items-center gap-3">
                {currentSlide.docCitation && (
                  <span className="text-[11px] font-mono text-saffron-300 bg-saffron-950/60 px-2 py-0.5 rounded border border-saffron-800 flex items-center gap-1">
                    <FileCheck className="w-3 h-3 text-saffron-400" />
                    <span>{currentSlide.docCitation.pageOrSection || "Document Note"}</span>
                  </span>
                )}
                <span className="text-xs font-mono text-ink-400">
                  ~{currentSlide.estimatedSeconds || 30}s
                </span>
              </div>
            </div>

            {/* Visual Blackboard Stage Canvas */}
            <div className="p-6 sm:p-10 min-h-[460px] flex flex-col justify-between bg-gradient-to-b from-ink-50/50 to-white relative text-ink-900">
              {/* Document Citation Anchor Strip */}
              {currentSlide.docCitation && (
                <div className="mb-4 px-3.5 py-2 rounded-xl bg-saffron-50/60 border border-saffron-100 flex items-center justify-between text-xs text-saffron-900">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-3.5 h-3.5 text-saffron-600 shrink-0" />
                    <span>
                      <strong>Grounded Source:</strong> {currentSlide.docCitation.sourceDocTitle}
                      {currentSlide.docCitation.snippet ? ` — "${currentSlide.docCitation.snippet}"` : ""}
                    </span>
                  </div>
                  <span className="text-[10px] text-saffron-600 font-bold uppercase tracking-wider hidden sm:inline">
                    Verified RAG Chunk
                  </span>
                </div>
              )}

              {/* Slide Content Grid: Left Bullet Points & Math; Right Diagram & Analogy */}
              <div className="my-4 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                <div className="lg:col-span-7 space-y-5">
                  <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-ink-900 font-display leading-tight">
                    {currentSlide.heading}
                  </h2>

                  <ul className="space-y-3.5 pt-1">
                    {currentSlide.bulletPoints.map((bp, i) => (
                      <li key={i} className="flex items-start gap-3 text-ink-800 text-sm sm:text-base leading-relaxed">
                        <span className="w-2 h-2 rounded-full bg-saffron-600 mt-2 shrink-0" />
                        <div className="flex-1">
                          <MarkdownMathRenderer content={bp} />
                        </div>
                      </li>
                    ))}
                  </ul>

                  {/* Key Formula Box if present */}
                  {currentSlide.keyFormula && (
                    <div className="p-3.5 rounded-xl bg-ink-900 text-deep-400 border border-ink-800 font-mono text-sm shadow-xs space-y-1">
                      <span className="text-[10px] uppercase font-bold text-ink-400 tracking-wider block">
                        ⚡ Governing Equation
                      </span>
                      <MarkdownMathRenderer content={`$$${currentSlide.keyFormula}$$`} />
                    </div>
                  )}

                  {/* Key Terms Chips */}
                  {currentSlide.keyTerms && currentSlide.keyTerms.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap pt-2">
                      <span className="text-xs font-bold text-ink-500">Core Concepts:</span>
                      {currentSlide.keyTerms.map((term, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-md bg-saffron-50 border border-saffron-200 text-saffron-800 text-[11px] font-semibold"
                        >
                          #{term}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Right Visual Deck: Diagrams & Intuitive Analogy */}
                <div className="lg:col-span-5 space-y-4">
                  {/* Diagram / Mermaid Code */}
                  {currentSlide.diagramCode ? (
                    <div className="rounded-xl overflow-hidden border border-ink-200 bg-white shadow-xs p-1">
                      <DiagramViewer
                        diagramType={(currentSlide.diagramType as any) || "mermaid"}
                        diagramCode={currentSlide.diagramCode}
                        caption={currentSlide.visualPrompt || "Interactive Visual Schema"}
                      />
                    </div>
                  ) : currentSlide.visualPrompt ? (
                    <div className="p-4 rounded-xl bg-ink-50 border border-ink-200 text-xs text-ink-600 space-y-2">
                      <span className="font-bold text-ink-800 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-saffron-600" />
                        Visual Mental Anchor:
                      </span>
                      <p className="italic leading-relaxed">{currentSlide.visualPrompt}</p>
                    </div>
                  ) : null}

                  {/* Intuitive Feynman Analogy Box */}
                  {currentSlide.feynmanAnalogy && (
                    <div className="p-4 rounded-xl bg-saffron-50/80 border border-saffron-200 space-y-1 text-xs">
                      <span className="font-bold text-saffron-900 uppercase tracking-wider flex items-center gap-1.5">
                        💡 Real-World Analogy
                      </span>
                      <p className="text-saffron-950 leading-relaxed italic">
                        "{currentSlide.feynmanAnalogy}"
                      </p>
                    </div>
                  )}

                  {/* Socratic Reflection Question */}
                  {currentSlide.socraticQuestion && (
                    <div className="p-3.5 rounded-xl bg-saffron-50/80 border border-saffron-200 space-y-1 text-xs">
                      <span className="font-bold text-saffron-900 uppercase tracking-wider flex items-center gap-1.5">
                        🧠 Teacher Socratic Reflection
                      </span>
                      <p className="text-saffron-950 font-medium leading-relaxed">
                        {currentSlide.socraticQuestion}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Real-time Subtitle / Voiceover Transcript Strip */}
              <div className="mt-6 p-4 rounded-xl bg-saffron-50/90 border border-saffron-200 flex items-start gap-3 shadow-xs">
                <div className="p-2 rounded-xl bg-saffron-600 text-white shrink-0 shadow-xs">
                  <Volume2 className={`w-4 h-4 ${isPlaying ? "animate-pulse" : ""}`} />
                </div>
                <div className="space-y-1 flex-1">
                  <div className="flex items-center justify-between text-[11px] font-bold text-saffron-800 uppercase tracking-wider">
                    <span>AI Teacher Voice Narration ({teacherPersona.toUpperCase()})</span>
                    {isPlaying && (
                      <span className="flex items-center gap-1 text-deep-700 lowercase font-mono">
                        <span className="w-1.5 h-1.5 rounded-full bg-deep-600 animate-ping" />
                        narrating live ({playbackSpeed}x)...
                      </span>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm text-ink-800 italic leading-relaxed font-sans">
                    "{currentSlide.voiceoverNarration || currentSlide.narrationScript || currentSlide.heading}"
                  </p>
                </div>
              </div>
            </div>

            {/* Video Control Bar */}
            <div className="p-4 bg-ink-900 text-white flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-ink-800">
              {/* Playback Controls */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrevSlide}
                  disabled={currentSlideIdx === 0}
                  className="p-2.5 rounded-xl bg-ink-800 hover:bg-ink-700 disabled:opacity-30 text-white transition-colors cursor-pointer"
                  title="Previous Slide"
                >
                  <SkipBack className="w-4 h-4" />
                </button>

                <button
                  onClick={handleTogglePlay}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-saffron-500 to-saffron-600 hover:from-saffron-600 hover:to-saffron-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
                  <span>{isPlaying ? "Pause Narration" : "Play Slide Lecture"}</span>
                </button>

                <button
                  onClick={handleReplaySlide}
                  className="p-2.5 rounded-xl bg-ink-800 hover:bg-ink-700 text-ink-300 hover:text-white transition-colors cursor-pointer"
                  title="Replay Current Slide"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                <button
                  onClick={handleNextSlide}
                  disabled={currentSlideIdx === videoLecture.slides.length - 1}
                  className="p-2.5 rounded-xl bg-ink-800 hover:bg-ink-700 disabled:opacity-30 text-white transition-colors cursor-pointer"
                  title="Next Slide"
                >
                  <SkipForward className="w-4 h-4" />
                </button>

                {/* Mute Button */}
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className={`p-2.5 rounded-xl transition-colors cursor-pointer ${
                    isMuted ? "bg-rose-900/60 text-rose-300" : "bg-ink-800 hover:bg-ink-700 text-ink-300"
                  }`}
                  title={isMuted ? "Unmute Narration" : "Mute Narration"}
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
              </div>

              {/* Slide Progress Timeline Dots */}
              <div className="flex items-center gap-2 overflow-x-auto py-1 max-w-xs sm:max-w-md">
                {videoLecture.slides.map((s, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setCurrentSlideIdx(idx);
                      if (isPlaying) {
                        handleReplaySlide();
                      }
                    }}
                    className={`h-2.5 rounded-full transition-all cursor-pointer ${
                      idx === currentSlideIdx
                        ? "w-8 bg-saffron-500 shadow-sm"
                        : quizAnsweredSlides[idx]
                        ? "w-3 bg-deep-500"
                        : "w-2.5 bg-ink-700 hover:bg-ink-500"
                    }`}
                    title={`Jump to Slide ${s.slideNumber}: ${s.heading}`}
                  />
                ))}
              </div>

              {/* Doubt / Teacher Link */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab("doubts")}
                  className="px-3 py-1.5 rounded-lg bg-ink-800 hover:bg-ink-700 text-saffron-300 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-saffron-400" />
                  <span>Ask Doubt on Slide</span>
                </button>
              </div>
            </div>
          </div>

          {/* 4. Slide Checkpoint Micro-Quiz & Ask Doubt Bar */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Slide Checkpoint Quiz */}
            <div className="lg:col-span-7 p-6 rounded-2xl card-warm space-y-4">
              <div className="flex items-center justify-between border-b border-ink-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-deep-100 text-deep-700 font-bold text-xs flex items-center justify-center">
                    ✓
                  </div>
                  <h3 className="text-sm font-bold text-ink-900">
                    Slide {currentSlideIdx + 1} Checkpoint Quiz
                  </h3>
                </div>
                {quizAnsweredSlides[currentSlideIdx] && (
                  <span className="text-[11px] font-bold text-deep-700 bg-deep-50 px-2 py-0.5 rounded-full border border-deep-200">
                    +20 XP Mastered
                  </span>
                )}
              </div>

              {currentSlide.checkpointQuiz ? (
                <div className="space-y-4">
                  <p className="text-xs sm:text-sm font-semibold text-ink-800">
                    <MarkdownMathRenderer content={currentSlide.checkpointQuiz.question} />
                  </p>

                  <div className="space-y-2">
                    {currentSlide.checkpointQuiz.options.map((option, idx) => {
                      const isSelected = selectedQuizOption === option;
                      const isCorrect = option === currentSlide.checkpointQuiz?.answer;
                      let optionStyle = "bg-ink-50 hover:bg-ink-100 border-ink-200 text-ink-800";

                      if (quizSubmitted) {
                        if (isCorrect) {
                          optionStyle = "bg-deep-50 border-deep-500 text-deep-900 font-bold";
                        } else if (isSelected) {
                          optionStyle = "bg-rose-50 border-rose-400 text-rose-900";
                        }
                      } else if (isSelected) {
                        optionStyle = "bg-saffron-50 border-saffron-500 text-saffron-900 font-bold shadow-xs";
                      }

                      return (
                        <button
                          key={idx}
                          disabled={quizSubmitted}
                          onClick={() => setSelectedQuizOption(option)}
                          className={`w-full p-3 rounded-xl border text-xs text-left transition-all flex items-center justify-between cursor-pointer ${optionStyle}`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="w-5 h-5 rounded-full bg-white border border-ink-300 text-[11px] font-bold flex items-center justify-center text-ink-700">
                              {String.fromCharCode(65 + idx)}
                            </span>
                            <span>{option}</span>
                          </div>
                          {quizSubmitted && isCorrect && (
                            <CheckCircle2 className="w-4 h-4 text-deep-600 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Submit / Feedback */}
                  {!quizSubmitted ? (
                    <button
                      onClick={handleQuizSubmit}
                      disabled={!selectedQuizOption}
                      className="px-4 py-2 rounded-xl bg-deep-600 hover:bg-deep-700 disabled:opacity-40 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
                    >
                      Check Answer (+20 XP)
                    </button>
                  ) : (
                    <div className="p-3.5 rounded-xl bg-ink-50 border border-ink-200 text-xs text-ink-700 space-y-1">
                      <span className="font-bold text-ink-900 block">
                        {selectedQuizOption === currentSlide.checkpointQuiz.answer
                          ? "🎉 Excellent Intuition!"
                          : "💡 Teacher Explanation:"}
                      </span>
                      <p className="leading-relaxed">{currentSlide.checkpointQuiz.explanation}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-ink-50 border border-ink-200 text-xs text-ink-500 italic">
                  Reflect on the Socratic question on this slide to reinforce your conceptual retention.
                </div>
              )}
            </div>

            {/* Right: Instant Doubt Asking Input */}
            <div className="lg:col-span-5 p-6 rounded-2xl card-warm space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2 border-b border-ink-100 pb-3">
                  <MessageSquare className="w-4 h-4 text-saffron-600" />
                  <h3 className="text-sm font-bold text-ink-900">
                    Ask Doubt on Slide {currentSlideIdx + 1}
                  </h3>
                </div>
                <p className="text-xs text-ink-600">
                  Stuck on this derivation or formula? Ask your AI Teacher for instant voice & math clarification grounded in your uploaded document.
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <textarea
                  value={doubtInput}
                  onChange={(e) => setDoubtInput(e.target.value)}
                  placeholder={`E.g., "Why does the field decrease with r^2 instead of r?"`}
                  rows={3}
                  className="w-full p-3 rounded-xl bg-ink-50 border border-ink-200 text-xs text-ink-900 focus:outline-none focus:border-saffron-600 focus:bg-white resize-none"
                />

                <button
                  onClick={handleAskDoubt}
                  disabled={!doubtInput.trim() || isSolvingDoubt}
                  className="w-full py-2.5 rounded-xl bg-saffron-600 hover:bg-saffron-700 disabled:opacity-50 text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {isSolvingDoubt ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Resolving Doubt...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Ask AI Teacher (+15 XP)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Full Transcript & Script Tab */}
      {activeTab === "transcript" && (
        <div className="p-6 sm:p-8 rounded-2xl card-warm space-y-6">
          <div className="flex items-center justify-between border-b border-ink-100 pb-4">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-ink-900">
                Complete Lecture Transcript & Slide Script
              </h2>
              <p className="text-xs text-ink-500">
                Synchronized voiceover script, equations, and document citations for all slides
              </p>
            </div>
            <button
              onClick={handleExportLectureNotes}
              className="px-3.5 py-1.5 rounded-lg bg-saffron-600 hover:bg-saffron-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export PDF</span>
            </button>
          </div>

          <div className="space-y-4">
            {videoLecture.slides.map((slide, idx) => (
              <div
                key={idx}
                className={`p-5 rounded-xl border transition-all space-y-3 ${
                  idx === currentSlideIdx
                    ? "bg-saffron-50/40 border-saffron-300 shadow-xs"
                    : "bg-ink-50 border-ink-200 hover:border-ink-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-saffron-600 text-white text-xs font-mono font-bold">
                      Slide {slide.slideNumber}
                    </span>
                    <h3 className="text-sm font-bold text-ink-900">{slide.heading}</h3>
                  </div>

                  <button
                    onClick={() => {
                      setCurrentSlideIdx(idx);
                      setActiveTab("player");
                      handleReplaySlide();
                    }}
                    className="text-xs font-bold text-saffron-600 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Play this slide</span>
                  </button>
                </div>

                {/* Bullet Points */}
                <ul className="space-y-1.5 text-xs text-ink-700 list-disc list-inside">
                  {slide.bulletPoints.map((bp, i) => (
                    <li key={i}>
                      <MarkdownMathRenderer content={bp} />
                    </li>
                  ))}
                </ul>

                {/* Spoken Voiceover Script */}
                <div className="p-3 rounded-lg bg-white border border-ink-200 text-xs text-ink-800 space-y-1">
                  <span className="font-bold text-ink-500 text-[10px] uppercase tracking-wider block">
                    Voiceover Narration:
                  </span>
                  <p className="italic leading-relaxed">
                    "{slide.voiceoverNarration || slide.narrationScript || ""}"
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. Live Doubts Tab */}
      {activeTab === "doubts" && (
        <div className="p-6 sm:p-8 rounded-2xl card-warm space-y-6">
          <div className="flex items-center justify-between border-b border-ink-100 pb-4">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-ink-900">
                Live Slide Doubts & Discussion ({slideDoubts.length})
              </h2>
              <p className="text-xs text-ink-500">
                Questions asked during video playback, answered directly from your uploaded document
              </p>
            </div>
            <button
              onClick={() => setActiveTab("player")}
              className="text-xs font-bold text-saffron-600 hover:underline cursor-pointer"
            >
              ← Back to Slide Player
            </button>
          </div>

          {slideDoubts.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <MessageSquare className="w-10 h-10 text-ink-300 mx-auto" />
              <p className="text-sm font-semibold text-ink-700">No doubts asked yet!</p>
              <p className="text-xs text-ink-500 max-w-md mx-auto">
                While watching any slide, type your doubt in the box to get an immediate first-principles answer with KaTeX mathematical formulas and spoken teacher voiceover.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {slideDoubts.map((doubt, idx) => (
                <div key={idx} className="p-5 rounded-xl bg-ink-50 border border-ink-200 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-saffron-700 bg-saffron-100 px-2 py-0.5 rounded">
                      Slide #{doubt.slideNumber} Doubt
                    </span>
                    <span className="text-ink-400 font-mono">{doubt.timestamp}</span>
                  </div>

                  <p className="text-sm font-bold text-ink-900">
                    Q: "{doubt.question}"
                  </p>

                  <div className="p-4 rounded-xl bg-white border border-ink-200 text-xs text-ink-800 space-y-2 leading-relaxed">
                    <span className="font-bold text-saffron-700 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      AI Teacher Solution:
                    </span>
                    <MarkdownMathRenderer content={doubt.answer} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
