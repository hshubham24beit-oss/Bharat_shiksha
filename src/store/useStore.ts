import { useState, useEffect } from "react";
import {
  ActiveView,
  StudentProfile,
  LessonPlan,
  TeachingStep,
  ChatMessage,
  Quiz,
  SmartNotes,
  VideoLecture,
  AnalyticsReport,
  IngestedDocument,
  SupportedLanguage,
  TargetExam,
  LearningStyle,
} from "../types";
import {
  initialStudentProfile,
  defaultLessonPlan,
  defaultTeachingStep,
  defaultQuiz,
  defaultSmartNotes,
  defaultVideoLecture,
  defaultAnalyticsReport,
} from "../data/mockData";
import confetti from "canvas-confetti";

export function useAppStore() {
  const [activeView, setActiveView] = useState<ActiveView>("landing");
  const [studentProfile, setStudentProfile] = useState<StudentProfile>(() => {
    const saved = localStorage.getItem("bharat_student_profile");
    return saved ? JSON.parse(saved) : initialStudentProfile;
  });

  const [activeLessonPlan, setActiveLessonPlan] = useState<LessonPlan>(defaultLessonPlan);
  const [currentTeachingStep, setCurrentTeachingStep] = useState<TeachingStep>(defaultTeachingStep);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "msg-welcome",
      role: "model",
      content: `**Namaste! I am Bharat Shikshak AI**, your personal autonomous AI Teacher & Mentor.

I am here to guide you step-by-step using **first principles**, **intuitive analogies**, and **interactive check-points**.

You can upload your own textbooks/notes in the **RAG Vault**, generate custom **Lesson Plans**, practice **Adaptive Quizzes**, or talk to me using **Voice Mode**!

What subject or topic shall we conquer today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      suggestedQuestions: [
        "Explain Coulomb's Law with vector diagrams",
        "Teach me Backpropagation in Neural Networks",
        "How does Photosynthesis convert light to ATP?",
        "Solve a JEE level numerical with me",
      ],
    },
  ]);

  const [activeQuiz, setActiveQuiz] = useState<Quiz>(defaultQuiz);
  const [smartNotes, setSmartNotes] = useState<SmartNotes>(defaultSmartNotes);
  const [videoLecture, setVideoLecture] = useState<VideoLecture>(defaultVideoLecture);
  const [analyticsReport, setAnalyticsReport] = useState<AnalyticsReport>(defaultAnalyticsReport);
  const [documents, setDocuments] = useState<IngestedDocument[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);

  const [isVoiceActive, setIsVoiceActive] = useState<boolean>(false);
  const [isTeacherSpeaking, setIsTeacherSpeaking] = useState<boolean>(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);

  // Sync profile to localStorage
  useEffect(() => {
    localStorage.setItem("bharat_student_profile", JSON.stringify(studentProfile));
  }, [studentProfile]);

  // Load documents from backend (with auth)
  useEffect(() => {
    const token = localStorage.getItem("bharat_token");
    if (!token) return;

    fetch("/api/rag/documents", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (res.status === 401) return null;
        return res.json();
      })
      .then((data) => {
        if (data && data.documents) {
          setDocuments(data.documents);
        }
      })
      .catch((e) => console.warn("Failed to load documents:", e));
  }, []);

  const addXp = (points: number, reason: string = "Concept Mastered") => {
    setStudentProfile((prev) => {
      const newXp = prev.xp + points;
      const newToday = prev.todayXpEarned + points;
      const newLevel = Math.floor(newXp / 500) + 1;

      // Celebrate milestone with confetti
      if (points >= 50) {
        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
            colors: ["#6366f1", "#10b981", "#f59e0b", "#ec4899"],
          });
        } catch (e) {
          // ignore if canvas unavailable
        }
      }

      return {
        ...prev,
        xp: newXp,
        todayXpEarned: newToday,
        level: newLevel,
      };
    });
  };

  const updateLanguage = (lang: SupportedLanguage) => {
    setStudentProfile((prev) => ({ ...prev, preferredLanguage: lang }));
  };

  const updateTargetExam = (exam: TargetExam) => {
    setStudentProfile((prev) => ({ ...prev, targetExam: exam }));
  };

  const updateLearningStyle = (style: LearningStyle) => {
    setStudentProfile((prev) => ({ ...prev, learningStyle: style }));
  };

  const addWeakConcept = (concept: string) => {
    setStudentProfile((prev) => {
      if (prev.weakConcepts.includes(concept)) return prev;
      return { ...prev, weakConcepts: [...prev.weakConcepts, concept] };
    });
  };

  const resolveWeakConcept = (concept: string) => {
    setStudentProfile((prev) => ({
      ...prev,
      weakConcepts: prev.weakConcepts.filter((c) => c !== concept),
      strongConcepts: [...prev.strongConcepts, concept],
    }));
  };

  return {
    activeView,
    setActiveView,
    studentProfile,
    setStudentProfile,
    activeLessonPlan,
    setActiveLessonPlan,
    currentTeachingStep,
    setCurrentTeachingStep,
    chatMessages,
    setChatMessages,
    activeQuiz,
    setActiveQuiz,
    smartNotes,
    setSmartNotes,
    videoLecture,
    setVideoLecture,
    analyticsReport,
    setAnalyticsReport,
    documents,
    setDocuments,
    selectedDocId,
    setSelectedDocId,
    isVoiceActive,
    setIsVoiceActive,
    isTeacherSpeaking,
    setIsTeacherSpeaking,
    isDarkMode,
    setIsDarkMode,
    addXp,
    updateLanguage,
    updateTargetExam,
    updateLearningStyle,
    addWeakConcept,
    resolveWeakConcept,
  };
}
