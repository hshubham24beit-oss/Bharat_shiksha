export type SupportedLanguage =
  | "English"
  | "Hindi"
  | "Hinglish"
  | "Tamil"
  | "Telugu"
  | "Marathi"
  | "Bengali"
  | "Kannada"
  | "Gujarati"
  | "Malayalam"
  | "Punjabi";

export type LearningStyle = "Socratic & Visual" | "First-Principles" | "Exam-Oriented" | "Hands-on & Code";

export type TargetExam =
  | "Class 11-12 CBSE/State"
  | "JEE Main & Advanced"
  | "NEET (Medical)"
  | "GATE / Computer Science"
  | "UPSC & Civil Services"
  | "Undergraduate STEM"
  | "General Curiosity";

export interface StudentProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  xp: number;
  level: number;
  streakDays: number;
  dailyGoalXp: number;
  todayXpEarned: number;
  totalHoursLearned: number;
  targetExam: TargetExam;
  learningStyle: LearningStyle;
  preferredLanguage: SupportedLanguage;
  weakConcepts: string[];
  strongConcepts: string[];
  badges: Badge[];
}

export interface Badge {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt?: string;
  isUnlocked: boolean;
}

export interface Citation {
  id: number;
  docTitle: string;
  sectionTitle?: string;
  relevance: number;
  snippet: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "model";
  content: string;
  timestamp: string;
  citations?: Citation[];
  suggestedQuestions?: string[];
  stepData?: TeachingStep;
}

export interface LessonModule {
  id: string;
  moduleNumber: number;
  title: string;
  description: string;
  estimatedMinutes: number;
  keyConcepts: string[];
  formulaOrKeywords: string[];
  socraticPrompt: string;
}

export interface LessonPlan {
  topicTitle: string;
  subject: string;
  difficultyLevel: "Beginner" | "Intermediate" | "Advanced";
  estimatedTimeMinutes: number;
  overview: string;
  prerequisites: string[];
  learningOutcomes: string[];
  modules: LessonModule[];
}

export interface CheckpointQuestion {
  questionText: string;
  questionType: "mcq" | "short_answer";
  options: string[];
  hint?: string;
}

export interface TeachingStep {
  conceptName: string;
  stepNumber: number;
  title: string;
  explanationMarkdown: string;
  analogy: string;
  diagramType: "mermaid" | "ascii" | "chart" | "formula";
  diagramCode: string;
  diagramCaption: string;
  keyTakeaway: string;
  checkpointQuestion: CheckpointQuestion;
}

export interface StepEvaluation {
  isCorrect: boolean;
  scoreOutOf100: number;
  feedback: string;
  misconceptionDetected: string | null;
  intuitiveCorrection: string;
  adaptiveRecommendation: "increase" | "maintain" | "decrease";
  xpEarned: number;
  suggestedNextAction: "proceed" | "re_explain_visual" | "give_easier_example";
}

export type QuestionType = "mcq" | "numerical" | "coding" | "short_answer" | "fill_blanks" | "true_false";

export interface LeaderboardEntry {
  rank: number;
  name: string;
  avatar: string;
  school: string;
  xp: number;
  streak: number;
  badgesCount: number;
}

export interface QuizQuestion {
  id: string;
  questionNumber: number;
  type: QuestionType;
  questionText: string;
  options: string[];
  correctAnswer: string;
  starterCode?: string;
  codeSnippet?: string;
  solutionExplanation?: string;
  explanationMarkdown?: string;
  conceptTested?: string;
  difficulty?: string;
  points?: number;
  xpReward?: number;
  misconceptionTriggers?: { [option: string]: string };
}

export interface Quiz {
  id?: string;
  title?: string;
  quizTitle?: string;
  topic?: string;
  subject?: string;
  totalTimeMinutes?: number;
  passingScorePercent?: number;
  questions: QuizQuestion[];
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  mnemonic?: string;
  category?: string;
  difficulty?: string;
  boxLevel?: number;
}

export interface CheatSheet {
  keyFormulas: Array<{ name: string; formula: string; where: string }>;
  goldenRules: string[];
  commonPitfallsToAvoid: string[];
}

export interface SmartNotes {
  topic?: string;
  topicTitle?: string;
  keyTakeaways?: string[];
  summaryNotesMarkdown?: string;
  cheatSheet?: CheatSheet;
  cheatSheetMarkdown?: string;
  flashcards: Flashcard[];
}

export interface VideoSlide {
  slideNumber: number;
  heading?: string;
  title?: string;
  bulletPoints: string[];
  visualDescription?: string;
  visualPrompt?: string;
  diagramType?: string;
  diagramCode?: string;
  voiceoverNarration?: string;
  narrationScript?: string;
  durationSeconds?: number;
  estimatedSeconds?: number;
  accentColor?: string;
  docCitation?: {
    sourceDocTitle: string;
    pageOrSection?: string;
    snippet?: string;
  };
  keyFormula?: string;
  socraticQuestion?: string;
  feynmanAnalogy?: string;
  keyTerms?: string[];
  checkpointQuiz?: {
    question: string;
    options: string[];
    answer: string;
    explanation: string;
  };
}

export interface VideoLecture {
  id?: string;
  title?: string;
  lectureTitle?: string;
  totalDurationSeconds?: number;
  overview?: string;
  sourceDocId?: string;
  sourceDocTitle?: string;
  lectureStyle?: string;
  teacherPersona?: string;
  language?: string;
  slides: VideoSlide[];
}

export interface AnalyticsReport {
  studentName?: string;
  overallScore?: number;
  overallMasteryScore?: number;
  masteryLevel?: string;
  streakDays?: number;
  totalStudyHours?: number;
  totalCheckpointsMastered?: number;
  subjectMasteryBreakdown?: Array<{ subject: string; score: number; status: string }>;
  subjectMastery?: Array<{ subject: string; masteryPercentage: number }>;
  radarMetrics?: Array<{ metric: string; value: number }>;
  topStrengths?: string[];
  strongAreas?: string[];
  criticalWeaknesses?: string[];
  weakAreas?: string[];
  misconceptionPatterns?: string[];
  aiRecommendations?: Array<{ actionTitle: string; reason: string; priority: string }>;
  customizedStudySchedule?: Array<{ day: string; focusTopic: string; recommendedMinutes: number }>;
  weeklyStudyPlan?: Array<{ day: string; topic: string; allocatedMinutes: number; actionItem: string }>;
}

export interface IngestedDocument {
  id: string;
  title: string;
  fileType: "pdf" | "docx" | "pptx" | "txt";
  uploadedAt: string;
  totalChunks: number;
  fileSizeBytes: number;
  summary: string;
  keyTopics: string[];
}

export interface TeacherPersona {
  id: string;
  name: string;
  roleTitle: string;
  subjectSpecialty: string;
  avatarUrl: string;
  avatarGradient: string;
  voiceGender: "female" | "male";
  voicePitch: number;
  voiceRate: number;
  teachingStyle: string;
  bio: string;
  badge: string;
}

export type AvatarMood = "neutral" | "explaining" | "listening" | "thinking" | "celebrating" | "encouraging" | "warning_trap" | "aha_moment" | "questioning";

export type AvatarPedagogicalState =
  | "explaining_concept"
  | "asking_question"
  | "positive_feedback"
  | "exam_trap_warning"
  | "deep_thinking"
  | "listening_actively"
  | "welcoming_greeting";

export type AvatarGestureType =
  | "nod_explain"
  | "inquisitive_tilt"
  | "celebration_thumbs_up"
  | "eureka_point"
  | "caution_stop"
  | "thinking_ponder"
  | "namaste_greet"
  | "idle_sway";

export interface SimplifiedConceptExplanation {
  conceptName: string;
  avatarGreeting: string;
  simpleExplanation: string;
  feynmanPoints: string[];
  everydayAnalogy: string;
  mentalModelPicture: string;
  commonExamTrap: string;
  plainEnglishFormula?: string;
  avatarPromptQuestion: string;
}

export interface DocumentTeachingSession {
  docId: string;
  docTitle: string;
  fileType: string;
  totalChunks: number;
  summary: string;
  keyTopics: string[];
  lessonPlan: LessonPlan;
  steps: TeachingStep[];
  citations?: Citation[];
  teacherGreeting?: string;
  overview?: string;
  keyFormulas?: string[];
}

export type ActiveView =
  | "landing"
  | "dashboard"
  | "teacher"
  | "lesson-planner"
  | "rag-vault"
  | "video-lecture"
  | "quiz-arena"
  | "flashcards"
  | "knowledge-graph"
  | "analytics-report"
  | "leaderboard"
  | "podcast"
  | "diagrams";

