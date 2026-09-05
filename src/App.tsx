import React from "react";
import { Sparkles } from "lucide-react";
import { useAuth } from "./contexts/AuthContext";
import { useAppStore } from "./store/useStore";
import { AuthPage } from "./views/AuthPage";
import { Navbar } from "./components/Navbar";
import { LandingPageView } from "./views/LandingPageView";
import { DashboardView } from "./views/DashboardView";
import { TeacherRoomView } from "./views/TeacherRoomView";
import { LessonPlannerView } from "./views/LessonPlannerView";
import { RagVaultView } from "./views/RagVaultView";
import { VideoLectureView } from "./views/VideoLectureView";
import { QuizArenaView } from "./views/QuizArenaView";
import { FlashcardsStudioView } from "./views/FlashcardsStudioView";
import { AnalyticsReportView } from "./views/AnalyticsReportView";
import { LeaderboardView } from "./views/LeaderboardView";
import { PodcastView } from "./views/PodcastView";
import { DiagramsView } from "./views/DiagramsView";

export default function App() {
  const { user, isLoading } = useAuth();
  const {
    activeView,
    setActiveView,
    studentProfile,
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
    addXp,
    updateLanguage,
    updateTargetExam,
    addWeakConcept,
    resolveWeakConcept,
  } = useAppStore();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-sm text-slate-500">Loading Bharat Shikshak AI...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return (
    <div className="grain-overlay min-h-screen bg-[#faf9f7] text-ink-900 flex flex-col font-sans antialiased">
      <Navbar
        activeView={activeView}
        setActiveView={setActiveView}
        studentProfile={studentProfile}
        updateLanguage={updateLanguage}
        updateTargetExam={updateTargetExam}
        isVoiceActive={isVoiceActive}
        setIsVoiceActive={setIsVoiceActive}
        isTeacherSpeaking={isTeacherSpeaking}
      />

      <main className="flex-1 w-full pb-16">
        {activeView === "landing" && (
          <LandingPageView setActiveView={setActiveView} />
        )}

        {activeView === "dashboard" && (
          <DashboardView
            setActiveView={setActiveView}
            studentProfile={studentProfile}
            activeLessonPlan={activeLessonPlan}
            resolveWeakConcept={resolveWeakConcept}
          />
        )}

        {activeView === "teacher" && (
          <TeacherRoomView
            studentProfile={studentProfile}
            activeLessonPlan={activeLessonPlan}
            currentTeachingStep={currentTeachingStep}
            setCurrentTeachingStep={setCurrentTeachingStep}
            chatMessages={chatMessages}
            setChatMessages={setChatMessages}
            documents={documents}
            selectedDocId={selectedDocId}
            setSelectedDocId={setSelectedDocId}
            setActiveView={setActiveView}
            addXp={addXp}
            addWeakConcept={addWeakConcept}
            isVoiceActive={isVoiceActive}
            setIsVoiceActive={setIsVoiceActive}
          />
        )}

        {activeView === "lesson-planner" && (
          <LessonPlannerView
            activeLessonPlan={activeLessonPlan}
            setActiveLessonPlan={setActiveLessonPlan}
            studentProfile={studentProfile}
            setActiveView={setActiveView}
          />
        )}

        {activeView === "rag-vault" && (
          <RagVaultView
            documents={documents}
            setDocuments={setDocuments}
            selectedDocId={selectedDocId}
            setSelectedDocId={setSelectedDocId}
            setActiveView={setActiveView}
            addXp={addXp}
          />
        )}

        {activeView === "video-lecture" && (
          <VideoLectureView
            videoLecture={videoLecture}
            setVideoLecture={setVideoLecture}
            studentProfile={studentProfile}
            setActiveView={setActiveView}
            addXp={addXp}
            documents={documents}
            setDocuments={setDocuments}
            selectedDocId={selectedDocId}
            setSelectedDocId={setSelectedDocId}
            activeLessonPlan={activeLessonPlan}
          />
        )}

        {activeView === "quiz-arena" && (
          <QuizArenaView
            activeQuiz={activeQuiz}
            setActiveQuiz={setActiveQuiz}
            studentProfile={studentProfile}
            setActiveView={setActiveView}
            addXp={addXp}
            addWeakConcept={addWeakConcept}
          />
        )}

        {activeView === "flashcards" && (
          <FlashcardsStudioView
            smartNotes={smartNotes}
            setSmartNotes={setSmartNotes}
            studentProfile={studentProfile}
            setActiveView={setActiveView}
            addXp={addXp}
          />
        )}

        {activeView === "analytics-report" && (
          <AnalyticsReportView
            analyticsReport={analyticsReport}
            setAnalyticsReport={setAnalyticsReport}
            studentProfile={studentProfile}
            setActiveView={setActiveView}
          />
        )}

        {activeView === "leaderboard" && (
          <LeaderboardView
            studentProfile={studentProfile}
            setActiveView={setActiveView}
          />
        )}

        {activeView === "podcast" && (
          <PodcastView
            studentProfile={studentProfile}
            setActiveView={setActiveView}
          />
        )}

        {activeView === "diagrams" && (
          <DiagramsView
            studentProfile={studentProfile}
            setActiveView={setActiveView}
          />
        )}
      </main>

      <footer className="w-full border-t border-ink-100 bg-white/50 backdrop-blur-sm py-5 px-4 text-center">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-gradient-to-br from-saffron-500 to-saffron-600 flex items-center justify-center">
              <Sparkles className="w-3 h-3 text-white" />
            </div>
            <span className="text-xs font-bold text-ink-700">BharatShikshak</span>
            <span className="text-ink-200">·</span>
            <span className="text-[11px] text-ink-400">Hackathon 2026</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-ink-400">
            <span className="flex items-center gap-1.5">
              <span className="pulse-dot" />
              <span className="font-medium">Gemini Connected</span>
            </span>
            <span className="text-ink-200">·</span>
            <span className="text-ink-500">{user.name}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
