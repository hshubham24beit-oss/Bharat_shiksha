import React, { useState } from "react";
import {
  BookOpen,
  Sparkles,
  Clock,
  CheckCircle2,
  Play,
  ArrowRight,
  ListChecks,
  Compass,
  Layers,
  GraduationCap,
  RefreshCw,
} from "lucide-react";
import { LessonPlan, StudentProfile, ActiveView } from "../types";

interface Props {
  activeLessonPlan: LessonPlan;
  setActiveLessonPlan: (plan: LessonPlan) => void;
  studentProfile: StudentProfile;
  setActiveView: (view: ActiveView) => void;
}

export const LessonPlannerView: React.FC<Props> = ({
  activeLessonPlan,
  setActiveLessonPlan,
  studentProfile,
  setActiveView,
}) => {
  const [topicInput, setTopicInput] = useState("");
  const [gradeLevel, setGradeLevel] = useState("Class 11-12 & Competitive (JEE/NEET)");
  const [customGoal, setCustomGoal] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const presetTopics = [
    "Coulomb's Law & Electric Fields",
    "Transformer Neural Networks & Attention Mechanism",
    "Cellular Respiration & Krebs Cycle",
    "Quadratic Equations & Complex Numbers",
    "Thermodynamics & Carnot Engine",
    "Indian Constitution Fundamental Rights",
  ];

  const handleGeneratePlan = async (selectedTopic?: string) => {
    const topic = selectedTopic || topicInput.trim();
    if (!topic || isGenerating) return;

    setIsGenerating(true);

    try {
      const { apiPost } = await import("../services/api");
      const data: LessonPlan = await apiPost("/api/lesson/generate", {
        topic,
        gradeLevel,
        language: studentProfile.preferredLanguage,
        customGoal,
      });
      if (data.topicTitle) {
        setActiveLessonPlan(data);
      }
    } catch (e) {
      console.error("Lesson generation error:", e);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-2xl card-warm space-y-6">
        <div className="max-w-3xl space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-saffron-50 text-saffron-600 text-xs font-bold border border-saffron-100">
            <Compass className="w-3.5 h-3.5" />
            <span>AI Curriculum Architect</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-ink-900 font-display">
            Personalized Lesson Planner
          </h1>
          <p className="text-ink-600 text-xs sm:text-sm leading-relaxed">
            Enter any topic or textbook chapter. Bharat Shikshak AI structures a prerequisite-mapped, Socratic curriculum calibrated to your target exams.
          </p>
        </div>

        {/* Input Generator Form */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-6">
            <label className="text-xs font-bold text-ink-700 mb-1.5 block uppercase tracking-wider">
              Topic or Chapter Name
            </label>
            <input
              type="text"
              value={topicInput}
              onChange={(e) => setTopicInput(e.target.value)}
              placeholder="e.g. Wave Optics, Backpropagation, Organic Carbonyl Compounds..."
              className="w-full px-4 py-2.5 rounded-xl bg-ink-50 border border-ink-200 text-sm text-ink-900 focus:outline-none focus:border-saffron-600 focus:bg-white transition-colors"
            />
          </div>

          <div className="md:col-span-3">
            <label className="text-xs font-bold text-ink-700 mb-1.5 block uppercase tracking-wider">
              Target Level / Exam
            </label>
            <select
              value={gradeLevel}
              onChange={(e) => setGradeLevel(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-ink-50 border border-ink-200 text-sm text-ink-900 focus:outline-none focus:border-saffron-600 focus:bg-white cursor-pointer font-medium"
            >
              <option value="Class 9-10 Foundation">Class 9-10 Foundation</option>
              <option value="Class 11-12 & Competitive (JEE/NEET)">Class 11-12 & JEE/NEET</option>
              <option value="Undergraduate STEM & GATE">Undergraduate STEM & GATE</option>
              <option value="UPSC & Civil Services">UPSC & Civil Services</option>
              <option value="Professional & Developer">Professional & Developer</option>
            </select>
          </div>

          <div className="md:col-span-3 flex items-end">
            <button
              onClick={() => handleGeneratePlan()}
              disabled={!topicInput.trim() || isGenerating}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-saffron-500 to-saffron-600 hover:from-saffron-600 hover:to-saffron-700 disabled:opacity-50 text-white font-bold text-sm transition-all shadow-md shadow-saffron-100 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Synthesizing Plan...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Curriculum</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Preset Topic Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-ink-100">
          <span className="text-xs text-ink-400 font-semibold">Quick Suggestions:</span>
          {presetTopics.map((pt) => (
            <button
              key={pt}
              onClick={() => {
                setTopicInput(pt);
                handleGeneratePlan(pt);
              }}
              className="px-2.5 py-1 rounded-lg bg-ink-100 hover:bg-saffron-50 border border-ink-200 text-xs font-medium text-ink-700 hover:text-saffron-600 transition-colors cursor-pointer"
            >
              {pt}
            </button>
          ))}
        </div>
      </div>

      {/* Generated Lesson Plan View */}
      <div className="p-6 sm:p-8 rounded-2xl card-warm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-ink-100 pb-6 gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-deep-50 text-deep-700 border border-deep-200">
                ACTIVE CURRICULUM
              </span>
              <span className="text-xs text-ink-500 font-semibold">{activeLessonPlan.subject}</span>
              <span className="text-xs px-2 py-0.5 rounded bg-ink-100 text-ink-600 font-mono font-medium">
                {activeLessonPlan.difficultyLevel}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-ink-900 font-display mt-2">
              {activeLessonPlan.topicTitle}
            </h2>
            <p className="text-xs sm:text-sm text-ink-600 mt-2 max-w-3xl leading-relaxed">
              {activeLessonPlan.overview}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setActiveView("teacher")}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-saffron-500 to-saffron-600 hover:from-saffron-600 hover:to-saffron-700 text-white font-bold text-sm shadow-md shadow-saffron-100 flex items-center gap-2 transition-all cursor-pointer"
            >
              <GraduationCap className="w-4 h-4" />
              <span>Start Socratic Teaching Loop</span>
            </button>
          </div>
        </div>

        {/* Prerequisites & Outcomes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-5 rounded-xl bg-ink-50 border border-ink-200 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-saffron-700 flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5" /> Conceptual Prerequisites
            </h3>
            <ul className="space-y-2 text-xs text-ink-700">
              {activeLessonPlan.prerequisites.map((p, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-saffron-600 font-bold">•</span>
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="p-5 rounded-xl bg-ink-50 border border-ink-200 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-deep-700 flex items-center gap-1.5">
              <ListChecks className="w-3.5 h-3.5" /> Core Learning Outcomes
            </h3>
            <ul className="space-y-2 text-xs text-ink-700">
              {activeLessonPlan.learningOutcomes.map((o, i) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-deep-600 shrink-0 mt-0.5" />
                  <span>{o}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Modules Timeline */}
        <div className="space-y-4 pt-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-ink-800">
            Step-by-Step Pedagogical Modules ({activeLessonPlan.modules.length})
          </h3>

          <div className="grid grid-cols-1 gap-3">
            {activeLessonPlan.modules.map((mod, idx) => (
              <div
                key={mod.id}
                className="p-4 sm:p-5 rounded-xl bg-ink-50 border border-ink-200 hover:border-saffron-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 group"
              >
                <div className="flex items-start gap-4">
                  <div className="w-9 h-9 rounded-xl bg-saffron-50 border border-saffron-200 flex items-center justify-center font-bold text-saffron-600 shrink-0">
                    {mod.moduleNumber}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm sm:text-base font-bold text-ink-900 group-hover:text-saffron-600 transition-colors">
                        {mod.title}
                      </h4>
                      <span className="text-xs text-ink-400 font-mono">~{mod.estimatedMinutes} mins</span>
                    </div>
                    <p className="text-xs text-ink-600 max-w-2xl">{mod.description}</p>
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      {mod.keyConcepts.map((kc, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded bg-white border border-ink-200 text-[10px] font-medium text-ink-700"
                        >
                          {kc}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setActiveView("teacher")}
                  className="px-4 py-2 rounded-xl bg-white hover:bg-gradient-to-r hover:from-saffron-500 hover:to-saffron-600 border border-ink-200 hover:border-saffron-600 text-xs font-bold text-ink-700 hover:text-white transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer shadow-xs"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Teach Concept</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};