import React from "react";
import {
  Flame, Zap, Clock, Target, Play, ArrowRight, BookOpen,
  UploadCloud, Layers, AlertCircle, CheckCircle2, Sparkles,
  Trophy, GraduationCap, Video,
} from "lucide-react";
import { ActiveView, StudentProfile, LessonPlan } from "../types";
import { leaderboardData } from "../data/mockData";

interface Props {
  setActiveView: (view: ActiveView) => void;
  studentProfile: StudentProfile;
  activeLessonPlan: LessonPlan;
  resolveWeakConcept: (concept: string) => void;
}

export const DashboardView: React.FC<Props> = ({
  setActiveView, studentProfile, activeLessonPlan, resolveWeakConcept,
}) => {
  const goalProgress = Math.min(100, Math.round((studentProfile.todayXpEarned / studentProfile.dailyGoalXp) * 100));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Hero banner */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-ink-900 via-ink-800 to-ink-900 p-6 sm:p-8 text-white">
        <div className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
            backgroundSize: '20px 20px',
          }}
        />
        <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-saffron-400 to-deep-500 flex items-center justify-center text-xl font-black shadow-lg shrink-0">
              AI
            </div>
            <div className="space-y-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 text-[11px] font-semibold text-white/70 backdrop-blur-sm">
                <Sparkles className="w-3 h-3" />
                {studentProfile.targetExam}
              </span>
              <h1 className="text-xl sm:text-2xl font-black font-display">
                Hey {studentProfile.name.split(" ")[0]}, ready to learn?
              </h1>
              <p className="text-white/50 text-xs max-w-md leading-relaxed">
                You're on a {studentProfile.streakDays}-day streak. Keep the momentum going.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setActiveView("teacher")}
              className="px-4 py-2.5 bg-saffron-500 hover:bg-saffron-600 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-all shadow-sm shadow-saffron-500/30">
              <GraduationCap className="w-4 h-4" />
              Continue learning
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => setActiveView("quiz-arena")}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/15 text-white/80 text-xs font-bold rounded-xl backdrop-blur-sm transition-all">
              Quick quiz
            </button>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Day streak", value: studentProfile.streakDays, suffix: "days", icon: <Flame className="w-4 h-4" />, color: "from-saffron-500 to-saffron-600", bg: "bg-saffron-50", text: "text-saffron-600" },
          { label: "Today's XP", value: studentProfile.todayXpEarned, suffix: `/ ${studentProfile.dailyGoalXp}`, icon: <Zap className="w-4 h-4" />, color: "from-deep-500 to-deep-600", bg: "bg-deep-50", text: "text-deep-600", progress: goalProgress },
          { label: "Study time", value: studentProfile.totalHoursLearned, suffix: "hrs", icon: <Clock className="w-4 h-4" />, color: "from-blue-500 to-blue-600", bg: "bg-blue-50", text: "text-blue-600" },
          { label: "Level", value: `Lv.${studentProfile.level}`, suffix: `${studentProfile.xp} XP`, icon: <Target className="w-4 h-4" />, color: "from-purple-500 to-purple-600", bg: "bg-purple-50", text: "text-purple-600" },
        ].map((s, i) => (
          <div key={i} className="card-warm p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-ink-400 uppercase tracking-wider">{s.label}</span>
              <div className={`w-8 h-8 rounded-lg ${s.bg} ${s.text} flex items-center justify-center`}>
                {s.icon}
              </div>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black font-display text-ink-900">{s.value}</span>
              <span className="text-xs text-ink-400 font-medium">{s.suffix}</span>
            </div>
            {"progress" in s && typeof s.progress === "number" && (
              <div className="w-full bg-ink-100 h-1.5 rounded-full overflow-hidden">
                <div className={`bg-gradient-to-r ${s.color} h-full rounded-full transition-all duration-500`}
                  style={{ width: `${s.progress}%` }} />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active lesson */}
          <div className="card-warm p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-saffron-50 text-saffron-600 border border-saffron-100">
                  {activeLessonPlan.subject}
                </span>
                <span className="text-[11px] text-ink-400 font-medium">{activeLessonPlan.topicTitle}</span>
              </div>
              <span className="text-[11px] text-ink-400 font-mono flex items-center gap-1">
                <Clock className="w-3 h-3" /> ~{activeLessonPlan.estimatedTimeMinutes}m
              </span>
            </div>

            <div>
              <h2 className="text-lg sm:text-xl font-bold font-display text-ink-900">{activeLessonPlan.topicTitle}</h2>
              <p className="text-sm text-ink-500 mt-1 leading-relaxed line-clamp-2">{activeLessonPlan.overview}</p>
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-bold text-ink-300 uppercase tracking-widest">Modules</span>
              {activeLessonPlan.modules.map((mod, idx) => (
                <div key={mod.id} onClick={() => setActiveView("teacher")}
                  className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                    idx === 1 ? "bg-saffron-50/60 border-saffron-200/60" :
                    idx === 0 ? "bg-deep-50/40 border-deep-200/40" :
                    "bg-ink-50/40 border-ink-200/40 hover:border-ink-300"
                  }`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-bold ${
                      idx === 0 ? "bg-deep-100 text-deep-600" :
                      idx === 1 ? "bg-saffron-500 text-white shadow-sm shadow-saffron-500/30" :
                      "bg-ink-100 text-ink-500"
                    }`}>
                      {idx === 0 ? <CheckCircle2 className="w-3.5 h-3.5" /> : mod.moduleNumber}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-ink-800">{mod.title}</span>
                        {idx === 1 && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-saffron-100 text-saffron-700">
                            IN PROGRESS
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-ink-400 line-clamp-1">{mod.description}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[11px] text-ink-300 font-mono hidden sm:inline">{mod.estimatedMinutes}m</span>
                    <button className="p-1.5 rounded-lg bg-white border border-ink-200 hover:bg-saffron-500 hover:text-white hover:border-saffron-500 text-ink-500 transition-colors">
                      <Play className="w-3 h-3 fill-current" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick actions */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { view: "rag-vault" as ActiveView, icon: <UploadCloud className="w-5 h-5" />, label: "Upload notes", sub: "PDF & DOCX", color: "bg-deep-100 text-deep-600" },
              { view: "quiz-arena" as ActiveView, icon: <Zap className="w-5 h-5" />, label: "Quiz Arena", sub: "Adaptive", color: "bg-saffron-100 text-saffron-600" },
              { view: "video-lecture" as ActiveView, icon: <Video className="w-5 h-5" />, label: "AI Video", sub: "With voiceover", color: "bg-purple-100 text-purple-600" },
              { view: "flashcards" as ActiveView, icon: <Layers className="w-5 h-5" />, label: "Smart Notes", sub: "Flashcards", color: "bg-blue-100 text-blue-600" },
            ].map((q, i) => (
              <button key={i} onClick={() => setActiveView(q.view)}
                className="card-warm p-4 flex flex-col items-center text-center group cursor-pointer hover:shadow-md">
                <div className={`w-11 h-11 rounded-xl ${q.color} flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform`}>
                  {q.icon}
                </div>
                <span className="text-xs font-bold text-ink-800">{q.label}</span>
                <span className="text-[10px] text-ink-400 mt-0.5">{q.sub}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Weak concepts */}
          <div className="card-warm p-5 space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-red-100 text-red-600 flex items-center justify-center">
                  <AlertCircle className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-ink-700">Weak spots</span>
              </div>
              <span className="text-[10px] text-ink-400 font-mono">{studentProfile.weakConcepts.length} flagged</span>
            </div>
            <p className="text-[11px] text-ink-400 leading-relaxed">
              Found by your AI teacher. Tackle these to level up faster.
            </p>
            <div className="flex flex-wrap gap-1.5">
              {studentProfile.weakConcepts.map((concept) => (
                <div key={concept}
                  className="px-2.5 py-1 bg-red-50 text-red-600 rounded-lg text-[11px] font-semibold border border-red-100 flex items-center gap-1.5">
                  <span>{concept}</span>
                  <button onClick={() => resolveWeakConcept(concept)}
                    className="text-red-300 hover:text-red-600 font-bold transition-colors">×</button>
                </div>
              ))}
            </div>
            <button onClick={() => setActiveView("quiz-arena")}
              className="w-full py-2 border border-dashed border-ink-200 rounded-xl text-[11px] font-bold text-ink-500 hover:border-saffron-300 hover:text-saffron-600 transition-colors flex items-center justify-center gap-1.5">
              Practice weak topics
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {/* Mini leaderboard */}
          <div className="card-warm p-5 space-y-3.5 flex flex-col">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-saffron-100 text-saffron-600 flex items-center justify-center">
                  <Trophy className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-ink-700">Top learners</span>
              </div>
              <button onClick={() => setActiveView("leaderboard")}
                className="text-[11px] font-semibold text-saffron-600 hover:text-saffron-700 transition-colors">
                View all
              </button>
            </div>

            <div className="space-y-2">
              {leaderboardData.slice(0, 3).map((user) => (
                <div key={user.rank}
                  className={`p-2.5 rounded-xl flex items-center justify-between border transition-all ${
                    user.name.includes("You")
                      ? "bg-saffron-50/60 border-saffron-200/60"
                      : "bg-ink-50/40 border-ink-200/40"
                  }`}>
                  <div className="flex items-center gap-2.5">
                    <span className="w-4 text-center font-mono text-[11px] font-bold text-ink-300">{user.rank}</span>
                    <img src={user.avatar} alt={user.name} className="w-7 h-7 rounded-full object-cover" />
                    <div>
                      <div className="text-[11px] font-bold text-ink-800">{user.name}</div>
                      <div className="text-[9px] text-ink-400">{user.school}</div>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono font-bold text-saffron-600">{user.xp}</span>
                </div>
              ))}
            </div>

            <button onClick={() => setActiveView("leaderboard")}
              className="mt-auto w-full py-2 bg-ink-900 hover:bg-ink-800 text-white rounded-xl text-xs font-bold transition-colors">
              Full rankings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
