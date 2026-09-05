import React, { useState } from "react";
import {
  Zap,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Sparkles,
  RefreshCw,
  Award,
  ArrowRight,
  Code,
  Check,
  X,
} from "lucide-react";
import { Quiz, QuizQuestion, StudentProfile, ActiveView } from "../types";
import { MarkdownMathRenderer } from "../components/MarkdownMathRenderer";
import confetti from "canvas-confetti";

interface Props {
  activeQuiz: Quiz;
  setActiveQuiz: React.Dispatch<React.SetStateAction<Quiz>>;
  studentProfile: StudentProfile;
  setActiveView: (view: ActiveView) => void;
  addXp: (amount: number, reason?: string) => void;
  addWeakConcept: (concept: string) => void;
}

export const QuizArenaView: React.FC<Props> = ({
  activeQuiz,
  setActiveQuiz,
  studentProfile,
  setActiveView,
  addXp,
  addWeakConcept,
}) => {
  const [currentQIdx, setCurrentQIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [qId: string]: string }>({});
  const [submittedQuestions, setSubmittedQuestions] = useState<{ [qId: string]: boolean }>({});
  const [quizFinished, setQuizFinished] = useState(false);
  const [topicInput, setTopicInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [codeEditorText, setCodeEditorText] = useState("");

  const currentQ = activeQuiz.questions[currentQIdx] || activeQuiz.questions[0];
  const isCurrentSubmitted = submittedQuestions[currentQ?.id];
  const userAnswer = selectedAnswers[currentQ?.id];

  const handleSelectOption = (option: string) => {
    if (isCurrentSubmitted) return;
    setSelectedAnswers((prev) => ({ ...prev, [currentQ.id]: option }));
  };

  const handleSubmitAnswer = () => {
    if (!userAnswer || isCurrentSubmitted) return;

    setSubmittedQuestions((prev) => ({ ...prev, [currentQ.id]: true }));

    const isCorrect =
      userAnswer.trim().toLowerCase() === currentQ.correctAnswer.trim().toLowerCase() ||
      userAnswer.startsWith(currentQ.correctAnswer);

    if (isCorrect) {
      addXp(currentQ.points || 50, "Quiz Question Mastered");
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
        });
      } catch (e) {}
    } else {
      if (currentQ.misconceptionTriggers?.[userAnswer]) {
        addWeakConcept(currentQ.misconceptionTriggers[userAnswer]);
      }
    }
  };

  const handleNext = () => {
    if (currentQIdx < activeQuiz.questions.length - 1) {
      setCurrentQIdx(currentQIdx + 1);
    } else {
      setQuizFinished(true);
    }
  };

  const handleGenerateNewQuiz = async () => {
    if (!topicInput.trim() || isGenerating) return;

    setIsGenerating(true);
    try {
      const { apiPost } = await import("../services/api");
      const data: Quiz = await apiPost("/api/quiz/generate", {
        topic: topicInput.trim(),
        difficulty: "Adaptive JEE/NEET Level",
        questionCount: 4,
        language: studentProfile.preferredLanguage,
      });
      if (data.questions && data.questions.length > 0) {
        setActiveQuiz(data);
        setCurrentQIdx(0);
        setSelectedAnswers({});
        setSubmittedQuestions({});
        setQuizFinished(false);
      }
    } catch (e) {
      console.error("Quiz generate error:", e);
    } finally {
      setIsGenerating(false);
    }
  };

  // Calculate total score
  const totalCorrect = activeQuiz.questions.filter((q) => {
    const ans = selectedAnswers[q.id];
    return ans && (ans.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase() || ans.startsWith(q.correctAnswer));
  }).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner */}
      <div className="p-6 sm:p-8 rounded-2xl card-warm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-saffron-50 text-saffron-700 text-xs font-bold border border-saffron-100">
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>Adaptive Testing Arena</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-ink-900 font-display">
            {activeQuiz.title}
          </h1>
          <p className="text-ink-600 text-xs sm:text-sm">
            Instant AI evaluation, distractor misconception diagnosis, and detailed KaTeX explanations.
          </p>
        </div>

        {/* Generate Custom Quiz */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <input
            type="text"
            value={topicInput}
            onChange={(e) => setTopicInput(e.target.value)}
            placeholder="Generate quiz on any topic..."
            className="px-3.5 py-2.5 rounded-xl bg-ink-50 border border-ink-200 text-xs sm:text-sm text-ink-900 focus:outline-none focus:border-saffron-500 focus:bg-white"
          />
          <button
            onClick={handleGenerateNewQuiz}
            disabled={!topicInput.trim() || isGenerating}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-saffron-500 to-saffron-600 hover:from-saffron-600 hover:to-saffron-700 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-saffron-100 transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
          >
            {isGenerating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            <span>New Quiz</span>
          </button>
        </div>
      </div>

      {!quizFinished ? (
        /* Active Quiz Question Card */
        <div className="p-6 sm:p-10 rounded-2xl card-warm space-y-6">
          {/* Question Meta Header */}
          <div className="flex items-center justify-between border-b border-ink-100 pb-4">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-saffron-50 text-saffron-700 border border-saffron-200">
                Question {currentQIdx + 1} of {activeQuiz.questions.length}
              </span>
              <span className="text-xs font-mono text-ink-500 font-semibold uppercase">
                {currentQ.type} • {currentQ.difficulty}
              </span>
            </div>

            <span className="text-xs font-mono font-bold text-saffron-600">
              +{currentQ.points} XP
            </span>
          </div>

          {/* Question Text with KaTeX */}
          <div className="text-base sm:text-lg font-bold text-ink-900 leading-relaxed">
            <MarkdownMathRenderer content={currentQ.questionText} />
          </div>

          {/* Options / Coding Sandbox */}
          {currentQ.type === "mcq" || currentQ.options.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {currentQ.options.map((opt, idx) => {
                const isSelected = userAnswer === opt;
                const isCorrect =
                  opt.trim().toLowerCase() === currentQ.correctAnswer.trim().toLowerCase() ||
                  opt.startsWith(currentQ.correctAnswer);

                let btnStyle = "bg-ink-50 border-ink-200 text-ink-700 hover:border-saffron-400 hover:bg-ink-100";
                if (isCurrentSubmitted) {
                  if (isCorrect) {
                    btnStyle = "bg-deep-50 border-deep-500 text-deep-900 font-bold";
                  } else if (isSelected && !isCorrect) {
                    btnStyle = "bg-red-50 border-red-500 text-red-900 font-bold";
                  }
                } else if (isSelected) {
                  btnStyle = "bg-saffron-50 border-saffron-500 text-saffron-900 font-semibold shadow-xs";
                }

                return (
                  <button
                    key={idx}
                    disabled={isCurrentSubmitted}
                    onClick={() => handleSelectOption(opt)}
                    className={`p-4 rounded-xl text-left text-xs sm:text-sm border transition-all flex items-center justify-between cursor-pointer ${btnStyle}`}
                  >
                    <MarkdownMathRenderer content={opt} />
                    {isCurrentSubmitted && isCorrect && <Check className="w-5 h-5 text-deep-600 shrink-0 ml-2" />}
                    {isCurrentSubmitted && isSelected && !isCorrect && <X className="w-5 h-5 text-red-600 shrink-0 ml-2" />}
                  </button>
                );
              })}
            </div>
          ) : currentQ.type === "coding" ? (
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-saffron-700">
                <Code className="w-4 h-4" />
                <span>Python 3.12 Interactive Sandbox</span>
              </div>
              <textarea
                value={codeEditorText || currentQ.codeSnippet || ""}
                onChange={(e) => {
                  setCodeEditorText(e.target.value);
                  setSelectedAnswers((prev) => ({ ...prev, [currentQ.id]: e.target.value }));
                }}
                rows={6}
                className="w-full p-4 rounded-xl bg-ink-900 border border-ink-700 text-xs sm:text-sm font-mono text-deep-400 focus:outline-none focus:border-saffron-500 leading-relaxed"
              />
            </div>
          ) : (
            <div className="pt-2">
              <input
                type="text"
                value={userAnswer || ""}
                onChange={(e) => setSelectedAnswers((prev) => ({ ...prev, [currentQ.id]: e.target.value }))}
                placeholder="Enter your exact numerical answer with units..."
                className="w-full p-4 rounded-xl bg-ink-50 border border-ink-200 text-sm text-ink-900 focus:outline-none focus:border-saffron-500 focus:bg-white"
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-4 flex items-center justify-between border-t border-ink-100">
            {!isCurrentSubmitted ? (
              <button
                onClick={handleSubmitAnswer}
                disabled={!userAnswer}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-saffron-500 to-saffron-600 hover:from-saffron-600 hover:to-saffron-700 disabled:opacity-50 text-white font-bold text-sm shadow-md shadow-saffron-100 transition-all flex items-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Submit Answer</span>
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-saffron-500 to-saffron-600 hover:from-saffron-600 hover:to-saffron-700 text-white font-bold text-sm shadow-md shadow-saffron-100 transition-all flex items-center gap-2 cursor-pointer"
              >
                <span>{currentQIdx < activeQuiz.questions.length - 1 ? "Next Question" : "View Quiz Results"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            <span className="text-xs text-ink-400 font-mono font-medium">
              Accuracy Tracked in Student Memory
            </span>
          </div>

          {/* Post-Submission Explanation & Misconception Breakdown */}
          {isCurrentSubmitted && (
            <div className="p-5 rounded-xl bg-ink-50 border border-ink-200 space-y-3 animate-in fade-in zoom-in-95">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-saffron-700">
                <HelpCircle className="w-4 h-4" />
                <span>Step-by-Step AI Solution & Pedagogical Breakdown</span>
              </div>
              <div className="text-xs sm:text-sm text-ink-700 leading-relaxed">
                <MarkdownMathRenderer content={currentQ.explanationMarkdown} />
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Quiz Finished Summary Card */
        <div className="p-8 sm:p-12 rounded-2xl card-warm text-center space-y-6">
          <div className="w-20 h-20 rounded-2xl bg-saffron-50 border border-saffron-200 mx-auto flex items-center justify-center text-saffron-600 shadow-xs">
            <Award className="w-10 h-10" />
          </div>

          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-ink-900 font-display">
              Quiz Completed!
            </h2>
            <p className="text-ink-600 text-sm mt-1">
              You scored <span className="text-saffron-600 font-bold font-mono">{totalCorrect}/{activeQuiz.questions.length}</span> questions correctly.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <button
              onClick={() => {
                setQuizFinished(false);
                setCurrentQIdx(0);
                setSelectedAnswers({});
                setSubmittedQuestions({});
              }}
              className="px-6 py-2.5 rounded-xl bg-ink-100 hover:bg-ink-200 text-ink-700 font-bold text-sm transition-colors cursor-pointer"
            >
              Retake Quiz
            </button>
            <button
              onClick={() => setActiveView("teacher")}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-saffron-500 to-saffron-600 hover:from-saffron-600 hover:to-saffron-700 text-white font-bold text-sm shadow-md shadow-saffron-100 transition-all cursor-pointer"
            >
              Ask Teacher About Missed Concepts
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
