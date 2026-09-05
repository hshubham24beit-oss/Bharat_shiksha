import React, { useState } from "react";
import {
  Sparkles,
  BookOpen,
  GraduationCap,
  UploadCloud,
  Video,
  Zap,
  Layers,
  BarChart3,
  Trophy,
  Flame,
  Globe,
  Volume2,
  VolumeX,
  ChevronDown,
  LayoutDashboard,
  Target,
  LogOut,
  Headphones,
  Network,
} from "lucide-react";
import { ActiveView, SupportedLanguage, TargetExam } from "../types";
import { useAuth } from "../contexts/AuthContext";

interface Props {
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  studentProfile: any;
  updateLanguage: (lang: SupportedLanguage) => void;
  updateTargetExam: (exam: TargetExam) => void;
  isVoiceActive: boolean;
  setIsVoiceActive: (active: boolean) => void;
  isTeacherSpeaking: boolean;
}

const languages: SupportedLanguage[] = [
  "English", "Hindi", "Hinglish", "Tamil", "Telugu",
  "Marathi", "Bengali", "Kannada", "Gujarati", "Malayalam", "Punjabi",
];

const targetExams: TargetExam[] = [
  "JEE Main & Advanced", "NEET (Medical)", "GATE / Computer Science",
  "UPSC & Civil Services", "Class 11-12 CBSE/State", "Undergraduate STEM",
  "General Curiosity",
];

const navItems: { id: ActiveView; label: string; icon: React.ReactNode; badge?: string }[] = [
  { id: "dashboard", label: "Home", icon: <LayoutDashboard className="w-4 h-4" /> },
  { id: "teacher", label: "AI Teacher", icon: <GraduationCap className="w-4 h-4" />, badge: "Socratic" },
  { id: "lesson-planner", label: "Lessons", icon: <BookOpen className="w-4 h-4" /> },
  { id: "rag-vault", label: "Documents", icon: <UploadCloud className="w-4 h-4" /> },
  { id: "video-lecture", label: "Video", icon: <Video className="w-4 h-4" /> },
  { id: "quiz-arena", label: "Quiz", icon: <Zap className="w-4 h-4" /> },
  { id: "flashcards", label: "Notes", icon: <Layers className="w-4 h-4" /> },
  { id: "analytics-report", label: "Progress", icon: <BarChart3 className="w-4 h-4" /> },
  { id: "leaderboard", label: "Rankings", icon: <Trophy className="w-4 h-4" /> },
  { id: "podcast", label: "Podcast", icon: <Headphones className="w-4 h-4" /> },
  { id: "diagrams", label: "Diagrams", icon: <Network className="w-4 h-4" /> },
];

export const Navbar: React.FC<Props> = ({
  activeView, setActiveView, studentProfile,
  updateLanguage, updateTargetExam,
  isVoiceActive, setIsVoiceActive, isTeacherSpeaking,
}) => {
  const { user, logout } = useAuth();
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showExamMenu, setShowExamMenu] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-ink-200/60">
      {/* Top bar */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        {/* Logo */}
        <button onClick={() => setActiveView("dashboard")} className="flex items-center gap-2.5 shrink-0 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-saffron-500 to-saffron-600 flex items-center justify-center shadow-sm shadow-saffron-500/20 group-hover:shadow-md group-hover:shadow-saffron-500/30 transition-shadow">
            <Sparkles className="w-4.5 h-4.5 text-white" />
          </div>
          <div className="hidden sm:block">
            <span className="text-[15px] font-extrabold tracking-tight text-ink-900 font-display">
              Bharat<span className="text-saffron-600">Shikshak</span>
            </span>
          </div>
        </button>

        {/* Center: Quick stats */}
        <div className="hidden md:flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-saffron-50 border border-saffron-100">
            <Flame className="w-3.5 h-3.5 text-saffron-500" />
            <span className="text-xs font-bold text-saffron-700">{studentProfile.streakDays} day streak</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-deep-50 border border-deep-100">
            <Zap className="w-3.5 h-3.5 text-deep-600" />
            <span className="text-xs font-bold text-deep-700">{studentProfile.xp} XP</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-ink-50 border border-ink-200">
            <Target className="w-3.5 h-3.5 text-ink-500" />
            <span className="text-xs font-semibold text-ink-600">{studentProfile.targetExam}</span>
          </div>
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-2">
          {/* Language */}
          <div className="relative">
            <button
              onClick={() => { setShowLangMenu(!showLangMenu); setShowExamMenu(false); }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-ink-50 hover:bg-ink-100 border border-ink-200 transition-colors text-xs font-medium text-ink-600"
            >
              <Globe className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{studentProfile.preferredLanguage}</span>
            </button>
            {showLangMenu && (
              <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-xl border border-ink-200 shadow-lg py-1 z-50">
                {languages.map((lang) => (
                  <button key={lang} onClick={() => { updateLanguage(lang); setShowLangMenu(false); }}
                    className={`w-full text-left px-3 py-1.5 text-xs font-medium transition-colors ${
                      studentProfile.preferredLanguage === lang ? "bg-saffron-50 text-saffron-700" : "text-ink-600 hover:bg-ink-50"
                    }`}>
                    {lang}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Voice */}
          <button
            onClick={() => setIsVoiceActive(!isVoiceActive)}
            className={`p-1.5 rounded-lg border transition-all ${
              isVoiceActive
                ? "bg-deep-50 border-deep-200 text-deep-600"
                : "bg-ink-50 border-ink-200 text-ink-400 hover:text-ink-600"
            }`}
          >
            {isVoiceActive ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* User + Logout */}
          <div className="flex items-center gap-2 pl-2 border-l border-ink-200">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-saffron-400 to-deep-500 flex items-center justify-center text-white text-[11px] font-bold">
              {user?.name?.charAt(0)?.toUpperCase() || "S"}
            </div>
            <span className="hidden lg:inline text-xs font-semibold text-ink-700 max-w-[100px] truncate">{user?.name}</span>
            <button onClick={logout} className="p-1.5 rounded-lg text-ink-400 hover:text-red-500 hover:bg-red-50 transition-colors" title="Sign out">
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Nav tabs */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6">
        <div className="flex items-center gap-1 overflow-x-auto pb-px scrollbar-none">
          {navItems.map((item) => {
            const isActive = activeView === item.id;
            return (
              <button key={item.id} onClick={() => setActiveView(item.id)}
                className={`relative flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? "bg-saffron-50 text-saffron-700 border border-saffron-200/60"
                    : "text-ink-500 hover:text-ink-700 hover:bg-ink-50 border border-transparent"
                }`}>
                {item.icon}
                <span>{item.label}</span>
                {item.badge && (
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                    isActive ? "bg-saffron-500 text-white" : "bg-ink-200 text-ink-500"
                  }`}>
                    {item.badge}
                  </span>
                )}
                {isActive && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-saffron-500 rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
