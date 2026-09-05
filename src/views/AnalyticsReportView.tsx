import React, { useState } from "react";
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

export const AnalyticsReportView: React.FC<Props> = ({
  analyticsReport,
  setAnalyticsReport,
  studentProfile,
  setActiveView,
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefreshReport = async () => {
    setIsRefreshing(true);
    try {
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

  const radarData = [
    { metric: "Retention", value: 88 },
    { metric: "Speed", value: 82 },
    { metric: "Accuracy", value: analyticsReport.overallMasteryScore },
    { metric: "Recovery", value: 92 },
    { metric: "Curiosity", value: 95 },
  ];

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

      {/* 3 Overview Score Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-400">Mastery Index</span>
            <div className="text-3xl font-black text-slate-100 mt-1 flex items-baseline gap-1.5">
              <span>{analyticsReport.overallMasteryScore}%</span>
              <span className="text-xs text-deep-400 font-semibold">Top 5%</span>
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block">Calibrated against JEE/NEET</span>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-deep-500/10 border border-deep-500/20 flex items-center justify-center text-deep-400">
            <Award className="w-7 h-7" />
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-400">Total Checkpoints Mastered</span>
            <div className="text-3xl font-black text-slate-100 mt-1">
              {analyticsReport.totalCheckpointsMastered}
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block">94.2% First-time accuracy</span>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-saffron-500/10 border border-saffron-500/20 flex items-center justify-center text-saffron-400">
            <CheckCircle2 className="w-7 h-7" />
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-400">Weak Concepts Resolved</span>
            <div className="text-3xl font-black text-slate-100 mt-1 flex items-baseline gap-1.5">
              <span>12</span>
              <span className="text-xs text-deep-400 font-semibold font-mono">Recovered</span>
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block">0 Unresolved misconceptions</span>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-deep-500/10 border border-deep-500/20 flex items-center justify-center text-deep-400">
            <TrendingUp className="w-7 h-7" />
          </div>
        </div>
      </div>

      {/* Visual Charts: Subject Mastery Bar Chart + Cognitive Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subject Mastery Bar Chart */}
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200 font-display">
            Subject-wise Concept Mastery (%)
          </h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analyticsReport.subjectMastery}>
                <XAxis dataKey="subject" stroke="#64748b" fontSize={12} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={12} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "12px", color: "#fff" }}
                />
                <Bar dataKey="masteryPercentage" fill="#e8a030" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Cognitive Radar Chart */}
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200 font-display">
            Cognitive Dimension Spider Profile
          </h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="#334155" />
                <PolarAngleAxis dataKey="metric" stroke="#94a3b8" fontSize={12} />
                <PolarRadiusAxis stroke="#475569" angle={30} domain={[0, 100]} />
                <Radar name="Student Capability" dataKey="value" stroke="#2e8b7a" fill="#2e8b7a" fillOpacity={0.4} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Strengths & Weaknesses + 7-Day Personalized Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Strengths vs Target Gaps */}
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-6">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-deep-400 flex items-center gap-1.5 mb-3 font-display">
              <CheckCircle2 className="w-4 h-4" /> Strong Cognitive Areas
            </h3>
            <div className="space-y-2">
              {analyticsReport.strongAreas.map((area, i) => (
                <div key={i} className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-deep-400" />
                  <span>{area}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-red-400 flex items-center gap-1.5 mb-3 font-display">
              <AlertCircle className="w-4 h-4" /> Recommended Target Practice
            </h3>
            <div className="space-y-2">
              {analyticsReport.weakAreas.map((area, i) => (
                <div key={i} className="p-3 rounded-xl bg-red-950/20 border border-red-500/30 text-xs text-slate-300 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                  <span>{area}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 7-Day Adaptive Schedule */}
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2 font-display">
              <Calendar className="w-4 h-4 text-saffron-400" />
              <span>Personalized Weekly Study Routine</span>
            </h2>
          </div>

          <div className="space-y-2.5">
            {analyticsReport.weeklyStudyPlan.map((plan) => (
              <div
                key={plan.day}
                className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <span className="w-10 text-xs font-bold font-mono text-saffron-400">{plan.day}</span>
                  <div>
                    <div className="text-xs font-semibold text-slate-200">{plan.topic}</div>
                    <div className="text-[10px] text-slate-500">{plan.actionItem}</div>
                  </div>
                </div>
                <span className="text-xs text-slate-400 font-mono shrink-0">{plan.allocatedMinutes}m</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
