import React, { useState, useEffect } from "react";
import {
  BarChart3,
  Award,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Download,
  Printer,
  Sparkles,
  Zap,
  Clock,
  Target,
  RefreshCw,
  BookOpen,
  FileText,
  Video,
  MessageCircle,
  Upload,
} from "lucide-react";
import { AnalyticsReport, StudentProfile, ActiveView } from "../types";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  LineChart,
  Line,
} from "recharts";

interface Props {
  analyticsReport: AnalyticsReport;
  setAnalyticsReport: React.Dispatch<React.SetStateAction<AnalyticsReport>>;
  studentProfile: StudentProfile;
  setActiveView: (view: ActiveView) => void;
}

interface QuizRecord {
  id: string;
  topic: string;
  difficulty: string;
  totalQuestions: number;
  correctAnswers: number;
  scorePercent: number;
  xpEarned: number;
  createdAt: string;
}

interface NoteRecord {
  id: string;
  topic: string;
  noteType: string;
  createdAt: string;
}

interface ActivityItem {
  type: string;
  icon: React.ReactNode;
  title: string;
  detail: string;
  time: string;
  color: string;
}

export const AnalyticsReportView: React.FC<Props> = ({
  analyticsReport,
  setAnalyticsReport,
  studentProfile,
  setActiveView,
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [quizHistory, setQuizHistory] = useState<QuizRecord[]>([]);
  const [notesHistory, setNotesHistory] = useState<NoteRecord[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [chatSessions, setChatSessions] = useState<any[]>([]);
  const [studyPacks, setStudyPacks] = useState<any[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Fetch all user data on mount
  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setIsLoadingData(true);
    try {
      const { apiGet } = await import("../services/api");
      const [quizzes, notes, docs, sessions, packs] = await Promise.allSettled([
        apiGet("/api/quiz/history"),
        apiGet("/api/notes/saved"),
        apiGet("/api/rag/documents"),
        apiGet("/api/chat/sessions"),
        apiGet("/api/study-pack/"),
      ]);

      if (quizzes.status === "fulfilled" && quizzes.value.quizzes) {
        setQuizHistory(quizzes.value.quizzes);
      }
      if (notes.status === "fulfilled" && notes.value.notes) {
        setNotesHistory(notes.value.notes);
      }
      if (docs.status === "fulfilled" && docs.value.documents) {
        setDocuments(docs.value.documents);
      }
      if (sessions.status === "fulfilled" && sessions.value.sessions) {
        setChatSessions(sessions.value.sessions);
      }
      if (packs.status === "fulfilled" && packs.value.packs) {
        setStudyPacks(packs.value.packs);
      }
    } catch (e) {
      console.error("Failed to fetch analytics data:", e);
    } finally {
      setIsLoadingData(false);
    }
  };

  // Compute real metrics from fetched data
  const computedMetrics = computeMetrics(quizHistory, notesHistory, documents, chatSessions, studyPacks, studentProfile);

  const handleRefreshReport = async () => {
    setIsRefreshing(true);
    try {
      await fetchAllData();
      const { apiPost } = await import("../services/api");
      const data = await apiPost("/api/report/generate", {
        studentProfile,
        language: studentProfile.preferredLanguage,
      });
      if (data.report) {
        setAnalyticsReport(data.report);
      } else if (data.overallMasteryScore || data.overallScore) {
        setAnalyticsReport(data);
      }
    } catch (e) {
      console.error("Report error:", e);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Use computed data for radar chart
  const radarData = [
    { metric: "Quiz Accuracy", value: computedMetrics.quizAccuracy },
    { metric: "Consistency", value: computedMetrics.consistency },
    { metric: "Knowledge Breadth", value: computedMetrics.knowledgeBreadth },
    { metric: "Active Recall", value: computedMetrics.activeRecall },
    { metric: "Document Coverage", value: computedMetrics.documentCoverage },
  ];

  // Build activity timeline from real data
  const activityTimeline = buildActivityTimeline(quizHistory, notesHistory, documents, chatSessions, studyPacks);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-deep-500/20 text-deep-400 text-xs font-semibold border border-deep-500/30">
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Cognitive Analytics & Student Memory</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-100 font-display">
            Personal Progress & Mastery Report
          </h1>
          <p className="text-slate-400 text-sm">
            Student: <span className="text-slate-200 font-semibold">{studentProfile.name}</span> • Goal:{" "}
            <span className="text-saffron-400 font-semibold">{studentProfile.targetExam}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRefreshReport}
            disabled={isRefreshing}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors flex items-center gap-1.5"
          >
            {isRefreshing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            <span>Refresh AI Report</span>
          </button>

          <button
            onClick={() => window.print()}
            className="px-4 py-2.5 rounded-xl bg-deep-600 hover:bg-deep-500 text-white text-xs font-bold shadow-lg shadow-deep-600/30 transition-all flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report Card</span>
          </button>
        </div>
      </div>

      {/* 5 Overview Score Cards — all real data */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard
          label="Quizzes Taken"
          value={String(computedMetrics.totalQuizzes)}
          sub={`${computedMetrics.quizAccuracy}% avg accuracy`}
          icon={<Target className="w-6 h-6" />}
          color="saffron"
        />
        <StatCard
          label="Total XP Earned"
          value={String(studentProfile.xp)}
          sub={`Level ${studentProfile.level}`}
          icon={<Zap className="w-6 h-6" />}
          color="deep"
        />
        <StatCard
          label="Study Streak"
          value={`${studentProfile.streakDays || 0}d`}
          sub={studentProfile.streakDays ? "Active" : "Start today!"}
          icon={<Award className="w-6 h-6" />}
          color="deep"
        />
        <StatCard
          label="Documents Indexed"
          value={String(computedMetrics.totalDocuments)}
          sub={`${computedMetrics.totalStudyPacks} study packs`}
          icon={<BookOpen className="w-6 h-6" />}
          color="saffron"
        />
        <StatCard
          label="Sessions Completed"
          value={String(computedMetrics.totalSessions)}
          sub={`${computedMetrics.totalNotes} notes created`}
          icon={<MessageCircle className="w-6 h-6" />}
          color="deep"
        />
      </div>

      {/* Visual Charts: Subject Mastery Bar Chart + Cognitive Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quiz Performance Over Time */}
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200 font-display">
            Quiz Score Trend
          </h2>
          <div className="h-64 w-full">
            {quizHistory.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={quizHistory.slice(0, 15).reverse()}>
                  <XAxis dataKey="topic" stroke="#64748b" fontSize={10} tickLine={false} angle={-30} textAnchor="end" height={60} />
                  <YAxis stroke="#64748b" fontSize={12} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "12px", color: "#fff" }}
                  />
                  <Line type="monotone" dataKey="scorePercent" stroke="#e8a030" strokeWidth={3} dot={{ fill: "#e8a030", r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500 text-sm">
                No quiz data yet. Take a quiz to see your trend.
              </div>
            )}
          </div>
        </div>

        {/* Cognitive Radar Chart — computed from real data */}
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200 font-display">
            Cognitive Dimension Profile
          </h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="#334155" />
                <PolarAngleAxis dataKey="metric" stroke="#94a3b8" fontSize={11} />
                <PolarRadiusAxis stroke="#475569" angle={30} domain={[0, 100]} />
                <Radar name="Student Capability" dataKey="value" stroke="#2e8b7a" fill="#2e8b7a" fillOpacity={0.4} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Weak/Strong Areas + Activity Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Strengths vs Target Gaps — from quiz data */}
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-6">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-deep-400 flex items-center gap-1.5 mb-3 font-display">
              <CheckCircle2 className="w-4 h-4" /> Strong Areas
            </h3>
            <div className="space-y-2">
              {computedMetrics.strongAreas.length > 0 ? computedMetrics.strongAreas.map((area, i) => (
                <div key={i} className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-deep-400" />
                  <span>{area}</span>
                </div>
              )) : (
                <p className="text-xs text-slate-500">Complete quizzes to see your strong areas.</p>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-red-400 flex items-center gap-1.5 mb-3 font-display">
              <AlertCircle className="w-4 h-4" /> Areas to Improve
            </h3>
            <div className="space-y-2">
              {computedMetrics.weakAreas.length > 0 ? computedMetrics.weakAreas.map((area, i) => (
                <div key={i} className="p-3 rounded-xl bg-red-950/20 border border-red-500/30 text-xs text-slate-300 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                  <span>{area}</span>
                </div>
              )) : (
                <p className="text-xs text-slate-500">No weak areas identified yet.</p>
              )}
            </div>
          </div>
        </div>

        {/* Recent Activity Timeline */}
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2 font-display">
            <Clock className="w-4 h-4 text-saffron-400" />
            <span>Recent Activity</span>
          </h2>

          <div className="space-y-2.5 max-h-80 overflow-y-auto">
            {activityTimeline.length > 0 ? activityTimeline.map((item, i) => (
              <div key={i} className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${item.color}`}>
                  {item.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-slate-200 truncate">{item.title}</div>
                  <div className="text-[10px] text-slate-500 truncate">{item.detail}</div>
                </div>
                <span className="text-[10px] text-slate-500 font-mono shrink-0">{item.time}</span>
              </div>
            )) : (
              <p className="text-xs text-slate-500 text-center py-4">No activity yet. Start learning!</p>
            )}
          </div>
        </div>
      </div>

      {/* XP Progress Bar */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200 font-display">
            Daily XP Goal Progress
          </h2>
          <span className="text-xs text-slate-400 font-mono">
            {studentProfile.todayXpEarned || 0} / {studentProfile.dailyGoalXp || 500} XP
          </span>
        </div>
        <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-saffron-500 to-deep-500 transition-all duration-500 rounded-full"
            style={{ width: `${Math.min(100, ((studentProfile.todayXpEarned || 0) / (studentProfile.dailyGoalXp || 500)) * 100)}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-slate-500">
          <span>{studentProfile.todayXpEarned || 0} XP today</span>
          <span>{Math.min(100, Math.round(((studentProfile.todayXpEarned || 0) / (studentProfile.dailyGoalXp || 500)) * 100))}% complete</span>
        </div>
      </div>
    </div>
  );
};

// ─── Helper: Stat Card ───
function StatCard({ label, value, sub, icon, color }: { label: string; value: string; sub: string; icon: React.ReactNode; color: string }) {
  return (
    <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col items-center text-center space-y-2">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color === "saffron" ? "bg-saffron-500/10 text-saffron-400" : "bg-deep-500/10 text-deep-400"}`}>
        {icon}
      </div>
      <div className="text-2xl font-black text-slate-100">{value}</div>
      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</div>
      <div className="text-[10px] text-slate-500">{sub}</div>
    </div>
  );
}

// ─── Helper: Compute real metrics from data ───
function computeMetrics(quizzes: QuizRecord[], notes: NoteRecord[], docs: any[], sessions: any[], packs: any[], profile: StudentProfile) {
  const totalQuizzes = quizzes.length;
  const quizAccuracy = totalQuizzes > 0
    ? Math.round(quizzes.reduce((sum, q) => sum + q.scorePercent, 0) / totalQuizzes)
    : 0;

  const totalNotes = notes.length;
  const totalDocuments = docs.length;
  const totalSessions = sessions.length;
  const totalStudyPacks = packs.length;

  // Compute consistency: days with activity out of last 7
  const now = new Date();
  const activeDays = new Set<string>();
  [...quizzes, ...notes].forEach((item: any) => {
    const d = new Date(item.createdAt);
    const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays <= 7) activeDays.add(d.toISOString().split("T")[0]);
  });
  const consistency = Math.min(100, Math.round((activeDays.size / 7) * 100));

  // Knowledge breadth: unique topics covered
  const uniqueTopics = new Set(quizzes.map(q => q.topic));
  const knowledgeBreadth = Math.min(100, uniqueTopics.size * 15);

  // Active recall: quizzes + notes as percentage of sessions
  const activeRecall = totalQuizzes + totalNotes > 0
    ? Math.min(100, Math.round(((totalQuizzes + totalNotes) / Math.max(1, totalSessions + totalQuizzes + totalNotes)) * 100))
    : 0;

  // Document coverage: study packs / documents
  const documentCoverage = totalDocuments > 0
    ? Math.min(100, Math.round((totalStudyPacks / totalDocuments) * 100))
    : 0;

  // Strong areas: topics with score > 75%
  const topicScores: Record<string, number[]> = {};
  quizzes.forEach(q => {
    if (!topicScores[q.topic]) topicScores[q.topic] = [];
    topicScores[q.topic].push(q.scorePercent);
  });
  const strongAreas = Object.entries(topicScores)
    .map(([topic, scores]) => ({ topic, avg: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) }))
    .filter(t => t.avg >= 75)
    .sort((a, b) => b.avg - a.avg)
    .map(t => `${t.topic} (${t.avg}%)`);

  // Weak areas: topics with score < 60%
  const weakAreas = Object.entries(topicScores)
    .map(([topic, scores]) => ({ topic, avg: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) }))
    .filter(t => t.avg < 60)
    .sort((a, b) => a.avg - b.avg)
    .map(t => `${t.topic} (${t.avg}%)`);

  // Fallback if no quiz data
  if (strongAreas.length === 0 && totalQuizzes === 0) {
    strongAreas.push("No data yet — take a quiz!");
  }

  return {
    totalQuizzes,
    quizAccuracy,
    totalNotes,
    totalDocuments,
    totalSessions,
    totalStudyPacks,
    consistency,
    knowledgeBreadth: Math.max(10, knowledgeBreadth),
    activeRecall: Math.max(10, activeRecall),
    documentCoverage: Math.max(10, documentCoverage),
    strongAreas,
    weakAreas,
  };
}

// ─── Helper: Build activity timeline ───
function buildActivityTimeline(quizzes: QuizRecord[], notes: NoteRecord[], docs: any[], sessions: any[], packs: any[]): ActivityItem[] {
  const items: ActivityItem[] = [];
  const now = new Date();

  function timeAgo(date: string): string {
    const diff = now.getTime() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "now";
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}d`;
  }

  quizzes.forEach(q => {
    items.push({
      type: "quiz",
      icon: <Target className="w-4 h-4" />,
      title: `Quiz: ${q.topic}`,
      detail: `${q.scorePercent}% score • ${q.correctAnswers}/${q.totalQuestions} correct`,
      time: timeAgo(q.createdAt),
      color: q.scorePercent >= 70 ? "bg-deep-500/10 text-deep-400" : "bg-red-500/10 text-red-400",
    });
  });

  notes.forEach(n => {
    items.push({
      type: "note",
      icon: <FileText className="w-4 h-4" />,
      title: `Notes: ${n.topic}`,
      detail: `${n.noteType} notes created`,
      time: timeAgo(n.createdAt),
      color: "bg-saffron-500/10 text-saffron-400",
    });
  });

  docs.forEach((d: any) => {
    items.push({
      type: "upload",
      icon: <Upload className="w-4 h-4" />,
      title: `Uploaded: ${d.title}`,
      detail: `${d.totalChunks} chunks indexed • ${d.fileType}`,
      time: timeAgo(d.uploadedAt || d.createdAt),
      color: "bg-slate-700 text-slate-300",
    });
  });

  sessions.forEach((s: any) => {
    items.push({
      type: "chat",
      icon: <MessageCircle className="w-4 h-4" />,
      title: `Chat: ${s.topic || "General"}`,
      detail: `${s.messageCount || 0} messages • ${s.persona || "AI teacher"}`,
      time: timeAgo(s.createdAt),
      color: "bg-deep-500/10 text-deep-400",
    });
  });

  // Sort by most recent first
  items.sort((a, b) => {
    // Items with shorter time strings are more recent
    const getSeconds = (t: string) => {
      if (t === "now") return 0;
      const num = parseInt(t);
      if (t.endsWith("m")) return num * 60;
      if (t.endsWith("h")) return num * 3600;
      return num * 86400;
    };
    return getSeconds(a.time) - getSeconds(b.time);
  });

  return items.slice(0, 20);
}
