import React from "react";
import {
  Sparkles, GraduationCap, Brain, UploadCloud, Zap, Video,
  Globe, Award, ArrowRight, CheckCircle2, Layers, MessageSquare,
  BookOpen, BarChart3, Trophy, ChevronRight,
} from "lucide-react";
import { ActiveView } from "../types";

interface Props {
  setActiveView: (view: ActiveView) => void;
}

export const LandingPageView: React.FC<Props> = ({ setActiveView }) => {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, var(--color-ink-900) 1px, transparent 0)`,
            backgroundSize: '32px 32px',
          }}
        />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-16 sm:pt-24 pb-16">
          {/* Hackathon badge */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cream-100 border border-cream-200 text-xs font-bold text-saffron-700">
              <span className="w-1.5 h-1.5 rounded-full bg-saffron-500 animate-pulse" />
              BHARAT ACADEMIX HACKATHON 2026
            </div>
          </div>

          {/* Main headline */}
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black font-display leading-[1.05] tracking-tight mb-6">
              Your personal
              <br />
              <span className="text-gradient-warm">AI teacher</span> who
              <br />
              actually teaches
            </h1>

            <p className="text-lg sm:text-xl text-ink-500 max-w-2xl mx-auto leading-relaxed mb-10">
              Not another chatbot. A Socratic mentor that adapts to how you learn,
              catches your misconceptions, and builds real understanding — in your language.
            </p>

            {/* CTA buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button onClick={() => setActiveView("dashboard")}
                className="btn-saffron text-sm flex items-center gap-2">
                Start learning free
                <ArrowRight className="w-4 h-4" />
              </button>
              <button onClick={() => setActiveView("rag-vault")}
                className="btn-ghost text-sm flex items-center gap-2">
                <UploadCloud className="w-4 h-4" />
                Upload your notes
              </button>
            </div>
          </div>

          {/* Hero illustration - Live preview card */}
          <div className="mt-16 max-w-3xl mx-auto">
            <div className="relative rounded-2xl border border-ink-200 bg-white shadow-2xl shadow-ink-900/5 overflow-hidden">
              {/* Browser chrome */}
              <div className="flex items-center gap-2 px-4 py-2.5 bg-ink-50 border-b border-ink-200">
                <div className="flex gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                </div>
                <div className="flex-1 text-center">
                  <span className="text-[10px] font-mono text-ink-400">bharatshikshak.ai/teacher</span>
                </div>
              </div>

              {/* Chat preview */}
              <div className="p-6 space-y-4">
                {/* Teacher message */}
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-saffron-400 to-deep-500 flex items-center justify-center text-white text-[11px] font-bold shrink-0">
                    AI
                  </div>
                  <div className="flex-1">
                    <div className="inline-block px-4 py-3 rounded-2xl rounded-tl-sm bg-ink-50 text-sm text-ink-800 leading-relaxed">
                      <strong>Coulomb's Law</strong> says the force between two charges is inversely proportional to the square of distance. Think of it like this — if you move twice as far from a light bulb, it feels <strong>4 times dimmer</strong>. Same principle!
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-lg bg-saffron-50 border border-saffron-100 text-[11px] font-semibold text-saffron-700 cursor-pointer hover:bg-saffron-100 transition-colors">
                        Why squared specifically?
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-ink-50 border border-ink-200 text-[11px] font-medium text-ink-500 cursor-pointer hover:bg-ink-100 transition-colors">
                        Test me on this
                      </span>
                    </div>
                  </div>
                </div>

                {/* Student input */}
                <div className="flex gap-3 justify-end">
                  <div className="inline-block px-4 py-2.5 rounded-2xl rounded-tr-sm bg-saffron-500 text-white text-sm">
                    Can you show me the formula with real numbers?
                  </div>
                </div>

                {/* MCQ Checkpoint */}
                <div className="mt-4 p-4 rounded-xl border border-deep-200 bg-deep-50/50">
                  <p className="text-xs font-bold text-deep-700 mb-2 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Quick check — does this make sense?
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <span className="px-3 py-2 rounded-lg bg-white border border-deep-200 text-xs font-medium text-ink-700 cursor-pointer hover:border-deep-400 transition-colors text-center">
                      F = k · q₁q₂ / r²
                    </span>
                    <span className="px-3 py-2 rounded-lg bg-white border border-ink-200 text-xs font-medium text-ink-400 cursor-pointer hover:border-ink-300 transition-colors text-center">
                      F = k · q₁q₂ · r²
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-white border-y border-ink-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <span className="text-xs font-bold uppercase tracking-widest text-saffron-600 mb-3 block">The method</span>
            <h2 className="text-3xl sm:text-4xl font-black font-display text-ink-900">
              Not memorization. Understanding.
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                icon: <UploadCloud className="w-5 h-5" />,
                title: "Feed it your material",
                desc: "Upload NCERT chapters, coaching notes, or any PDF. Our RAG engine indexes every concept into a searchable knowledge base.",
                color: "saffron",
              },
              {
                step: "02",
                icon: <MessageSquare className="w-5 h-5" />,
                title: "Learn through dialogue",
                desc: "The AI teacher asks you questions, explains with analogies, and adapts based on what you know and what you don't.",
                color: "deep",
              },
              {
                step: "03",
                icon: <Brain className="w-5 h-5" />,
                title: "Master through practice",
                desc: "Adaptive quizzes, flashcards, and video lectures that target your weak spots. Every session builds on the last.",
                color: "ink",
              },
            ].map((item) => (
              <div key={item.step} className="relative group">
                <div className="p-6 rounded-2xl border border-ink-200 bg-white hover:border-ink-300 transition-all hover:shadow-lg hover:shadow-ink-900/5">
                  <div className="flex items-center gap-3 mb-4">
                    <span className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      item.color === "saffron" ? "bg-saffron-100 text-saffron-600" :
                      item.color === "deep" ? "bg-deep-100 text-deep-600" :
                      "bg-ink-100 text-ink-600"
                    }`}>
                      {item.icon}
                    </span>
                    <span className="text-[10px] font-mono font-bold text-ink-300">STEP {item.step}</span>
                  </div>
                  <h3 className="text-lg font-bold text-ink-900 mb-2 font-display">{item.title}</h3>
                  <p className="text-sm text-ink-500 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <span className="text-xs font-bold uppercase tracking-widest text-deep-600 mb-3 block">Everything you need</span>
            <h2 className="text-3xl sm:text-4xl font-black font-display text-ink-900">
              A complete learning companion
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger-in">
            {[
              { icon: <Globe className="w-5 h-5" />, title: "11 Indian Languages", desc: "Hindi, Tamil, Telugu, Marathi, Bengali, and more — learn in the language you think in.", color: "bg-saffron-100 text-saffron-600" },
              { icon: <Video className="w-5 h-5" />, title: "AI Video Lectures", desc: "Auto-generated slide decks with voiceover narration, diagrams, and checkpoint quizzes.", color: "bg-purple-100 text-purple-600" },
              { icon: <Layers className="w-5 h-5" />, title: "Smart Notes & Flashcards", desc: "One-click revision notes with Leitner flashcards and formula cheat sheets.", color: "bg-deep-100 text-deep-600" },
              { icon: <Zap className="w-5 h-5" />, title: "Adaptive Quiz Arena", desc: "MCQ, numerical, short answer — questions that adapt to your level in real-time.", color: "bg-amber-100 text-amber-600" },
              { icon: <BarChart3 className="w-5 h-5" />, title: "Progress Analytics", desc: "Radar charts, mastery reports, and personalized study schedules.", color: "bg-blue-100 text-blue-600" },
              { icon: <Trophy className="w-5 h-5" />, title: "Gamified Learning", desc: "XP points, daily streaks, badges, and leaderboards to keep you motivated.", color: "bg-rose-100 text-rose-600" },
            ].map((f, i) => (
              <div key={i} className="p-5 rounded-xl border border-ink-200 bg-white hover:border-ink-300 hover:shadow-md hover:shadow-ink-900/5 transition-all group cursor-default">
                <div className={`w-10 h-10 rounded-xl ${f.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                  {f.icon}
                </div>
                <h3 className="text-sm font-bold text-ink-900 mb-1">{f.title}</h3>
                <p className="text-xs text-ink-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-ink-900 via-ink-800 to-ink-900 p-10 text-center">
            <div className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
                backgroundSize: '24px 24px',
              }}
            />
            <div className="relative">
              <Sparkles className="w-8 h-8 text-saffron-400 mx-auto mb-4" />
              <h2 className="text-2xl sm:text-3xl font-black font-display text-white mb-3">
                Ready to learn differently?
              </h2>
              <p className="text-sm text-ink-400 mb-8 max-w-md mx-auto">
                Join thousands of students using AI that actually adapts to how they learn.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <button onClick={() => setActiveView("dashboard")}
                  className="btn-saffron text-sm flex items-center gap-2">
                  Get started — it's free
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button onClick={() => setActiveView("rag-vault")}
                  className="px-5 py-2.5 rounded-xl border border-ink-600 text-ink-300 hover:text-white hover:border-ink-400 font-semibold text-sm transition-colors">
                  Upload study material
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-ink-100 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-saffron-500 to-saffron-600 flex items-center justify-center">
              <Sparkles className="w-3 h-3 text-white" />
            </div>
            <span className="text-sm font-bold text-ink-700">BharatShikshak</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-ink-400">
            <span>Built for Bharat Academix 2026</span>
            <span>·</span>
            <span>Powered by Gemini AI</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
