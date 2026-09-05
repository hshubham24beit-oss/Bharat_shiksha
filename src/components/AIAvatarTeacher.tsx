import React, { useState, useEffect, useRef } from "react";
import {
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Sparkles,
  RefreshCw,
  Award,
  BookOpen,
  ChevronDown,
  Play,
  Square,
  CheckCircle2,
  Lightbulb,
  Zap,
  AlertTriangle,
  Flame,
  HelpCircle,
  ArrowRight,
  BrainCircuit,
  MessageSquare,
  Smile,
  Compass,
  ThumbsUp,
  Hand,
  Sliders,
} from "lucide-react";
import {
  TeacherPersona,
  AvatarMood,
  StudentProfile,
  IngestedDocument,
  SimplifiedConceptExplanation,
  AvatarPedagogicalState,
  AvatarGestureType,
} from "../types";
import { teacherPersonas } from "../data/mockData";
import { ttsEngine, SpeakOptions } from "../utils/audioTts";
import {
  AvatarInteractionController,
  GESTURE_DEFINITIONS,
} from "./AvatarInteractionController";

interface AIAvatarTeacherProps {
  currentStepTitle?: string;
  conceptName?: string;
  explanationText?: string;
  rawDocumentText?: string;
  studentProfile: StudentProfile;
  isTeacherSpeaking: boolean;
  setIsTeacherSpeaking: (speaking: boolean) => void;
  isListening: boolean;
  setIsListening: (listening: boolean) => void;
  onVoiceInputCaptured?: (transcript: string) => void;
  activeDoc?: IngestedDocument | null;
  selectedPersona?: TeacherPersona;
  onSelectPersona?: (persona: TeacherPersona) => void;
  externalMood?: AvatarMood;
  onReExplain?: () => void;
  className?: string;
  compact?: boolean;
}

export const AIAvatarTeacher: React.FC<AIAvatarTeacherProps> = ({
  currentStepTitle,
  conceptName = "Key Concept",
  explanationText = "",
  rawDocumentText = "",
  studentProfile,
  isTeacherSpeaking,
  setIsTeacherSpeaking,
  isListening,
  setIsListening,
  onVoiceInputCaptured,
  activeDoc,
  selectedPersona = teacherPersonas[0],
  onSelectPersona,
  externalMood,
  onReExplain,
  className = "",
  compact = false,
}) => {
  const [speechRate, setSpeechRate] = useState<number>(1.0);
  const [showPersonaMenu, setShowPersonaMenu] = useState<boolean>(false);
  const [currentSpokenWord, setCurrentSpokenWord] = useState<string>("");
  const [mouthOpenAmount, setMouthOpenAmount] = useState<number>(0);
  const [eyeBlink, setEyeBlink] = useState<boolean>(false);
  const [internalMood, setInternalMood] = useState<AvatarMood>("neutral");

  // Avatar Interaction Controller & CSS Transform Animation State
  const [isAutoSync, setIsAutoSync] = useState<boolean>(true);
  const [activePedagogicalState, setActivePedagogicalState] =
    useState<AvatarPedagogicalState>("explaining_concept");
  const [activeGesture, setActiveGesture] =
    useState<AvatarGestureType>("idle_sway");
  const [gestureFlashEffect, setGestureFlashEffect] = useState<boolean>(false);

  // Simplified Explanation state
  const [activeStyle, setActiveStyle] = useState<
    "feynman" | "analogy" | "exam_trap" | "plain_formula"
  >("feynman");
  const [simplifiedData, setSimplifiedData] =
    useState<SimplifiedConceptExplanation | null>(null);
  const [isSimplifying, setIsSimplifying] = useState<boolean>(false);
  const [studentReplyText, setStudentReplyText] = useState<string>("");

  const mouthAnimationRef = useRef<number | null>(null);
  const gestureTimerRef = useRef<number | null>(null);

  const mood: AvatarMood =
    externalMood ||
    (isListening
      ? "listening"
      : isTeacherSpeaking
      ? "explaining"
      : internalMood);

  // Synchronize pedagogical state and CSS transform animation automatically
  useEffect(() => {
    if (!isAutoSync) return;

    if (externalMood === "celebrating") {
      setActivePedagogicalState("positive_feedback");
      setActiveGesture("celebration_thumbs_up");
      triggerGestureFlash();
    } else if (externalMood === "warning_trap" || mood === "warning_trap") {
      setActivePedagogicalState("exam_trap_warning");
      setActiveGesture("caution_stop");
    } else if (externalMood === "aha_moment" || mood === "aha_moment") {
      setActivePedagogicalState("explaining_concept");
      setActiveGesture("eureka_point");
    } else if (isTeacherSpeaking) {
      setActivePedagogicalState("explaining_concept");
      setActiveGesture("nod_explain");
    } else if (isListening) {
      setActivePedagogicalState("listening_actively");
      setActiveGesture("inquisitive_tilt");
    } else if (mood === "thinking" || isSimplifying) {
      setActivePedagogicalState("deep_thinking");
      setActiveGesture("thinking_ponder");
    } else {
      setActivePedagogicalState("explaining_concept");
      setActiveGesture("idle_sway");
    }
  }, [externalMood, mood, isTeacherSpeaking, isListening, isSimplifying, isAutoSync]);

  // Flash particle & highlight effect when gesture triggers
  const triggerGestureFlash = () => {
    setGestureFlashEffect(true);
    if (gestureTimerRef.current) clearTimeout(gestureTimerRef.current);
    gestureTimerRef.current = window.setTimeout(() => {
      setGestureFlashEffect(false);
    }, 1800);
  };

  // Manual gesture trigger from controller
  const handleTriggerGesture = (
    gesture: AvatarGestureType,
    pedagogicalState?: AvatarPedagogicalState
  ) => {
    setActiveGesture(gesture);
    if (pedagogicalState) {
      setActivePedagogicalState(pedagogicalState);
    }
    triggerGestureFlash();
  };

  // Natural eye blink interval
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setEyeBlink(true);
      setTimeout(() => setEyeBlink(false), 180);
    }, 4500 + Math.random() * 2000);

    return () => clearInterval(blinkInterval);
  }, []);

  // Simulating lip-sync mouth movements when speaking
  useEffect(() => {
    if (isTeacherSpeaking) {
      const animateMouth = () => {
        const rand = 0.2 + Math.random() * 0.8;
        setMouthOpenAmount(rand);
        mouthAnimationRef.current = window.setTimeout(
          animateMouth,
          110 + Math.random() * 60
        );
      };
      animateMouth();
    } else {
      if (mouthAnimationRef.current) {
        clearTimeout(mouthAnimationRef.current);
      }
      setMouthOpenAmount(0);
      setCurrentSpokenWord("");
    }

    return () => {
      if (mouthAnimationRef.current) {
        clearTimeout(mouthAnimationRef.current);
      }
    };
  }, [isTeacherSpeaking]);

  // Fetch simplified, intuitive avatar explanation from the server
  const fetchSimplifiedConcept = async (
    style: "feynman" | "analogy" | "exam_trap" | "plain_formula" = "feynman"
  ) => {
    setActiveStyle(style);
    setIsSimplifying(true);
    setInternalMood("thinking");

    if (style === "exam_trap") {
      setActiveGesture("caution_stop");
      setActivePedagogicalState("exam_trap_warning");
    } else if (style === "analogy") {
      setActiveGesture("eureka_point");
      setActivePedagogicalState("explaining_concept");
    } else {
      setActiveGesture("nod_explain");
      setActivePedagogicalState("explaining_concept");
    }

    try {
      const res = await fetch("/api/teach/simplify-concept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conceptName: conceptName || currentStepTitle || "Fundamental Concept",
          rawText: rawDocumentText || explanationText,
          docTitle: activeDoc?.title || "Course Material",
          docId: activeDoc?.id || null,
          studentProfile,
          teacherPersona: selectedPersona.id,
          language: studentProfile.preferredLanguage,
          explanationStyle: style,
        }),
      });

      const data: SimplifiedConceptExplanation = await res.json();
      setSimplifiedData(data);

      if (style === "exam_trap") {
        setInternalMood("warning_trap");
      } else if (style === "analogy") {
        setInternalMood("aha_moment");
      } else {
        setInternalMood("explaining");
      }

      // Automatically speak the avatar's simplified greeting & intuition
      const speechText = `${data.avatarGreeting} ${data.simpleExplanation.replace(
        /[*#$`]/g,
        ""
      )}`;
      ttsEngine.speak(speechText, {
        language: studentProfile.preferredLanguage,
        rate: speechRate * selectedPersona.voiceRate,
        pitch: selectedPersona.voicePitch,
        voiceGender: selectedPersona.voiceGender,
        onStart: () => setIsTeacherSpeaking(true),
        onEnd: () => {
          setIsTeacherSpeaking(false);
          setCurrentSpokenWord("");
          setInternalMood("neutral");
        },
        onBoundary: (word) => setCurrentSpokenWord(word),
      });
    } catch (e) {
      console.error("Error simplifying concept:", e);
      // Fallback
      setSimplifiedData({
        conceptName: conceptName || "Core Principle",
        avatarGreeting: `Let's make ${conceptName || "this"} super simple to understand!`,
        simpleExplanation: `Rather than memorizing dry textbook lines, visualize **${
          conceptName || "this concept"
        }** as a balance of cause and effect in nature.`,
        feynmanPoints: [
          "Every action creates an equal reaction gradient.",
          "Energy always flows from higher potential to lower potential.",
          "Formulas are simply shorthand recipes for physical realities.",
        ],
        everydayAnalogy:
          "Like a cyclist pedaling up a hill—energy invested converts directly into potential energy at the peak!",
        mentalModelPicture:
          "Picture two connected water pipes finding equilibrium.",
        commonExamTrap:
          "Watch your sign conventions and units when solving numericals!",
        plainEnglishFormula:
          "Rate of change depends directly on applied force.",
        avatarPromptQuestion:
          "If we double the resistance, what should happen to the current in your intuition?",
      });
    } finally {
      setIsSimplifying(false);
    }
  };

  // Handle Speech Toggle
  const handleToggleSpeech = () => {
    if (isTeacherSpeaking) {
      ttsEngine.stop();
      setIsTeacherSpeaking(false);
      setCurrentSpokenWord("");
      setInternalMood("neutral");
    } else {
      const textToSpeak = simplifiedData
        ? `${simplifiedData.avatarGreeting} ${simplifiedData.simpleExplanation}`
        : explanationText;

      if (textToSpeak) {
        const speakOptions: SpeakOptions = {
          language: studentProfile.preferredLanguage,
          rate: speechRate * selectedPersona.voiceRate,
          pitch: selectedPersona.voicePitch,
          voiceGender: selectedPersona.voiceGender,
          onStart: () => {
            setIsTeacherSpeaking(true);
            setInternalMood("explaining");
            setActiveGesture("nod_explain");
          },
          onEnd: () => {
            setIsTeacherSpeaking(false);
            setCurrentSpokenWord("");
            setInternalMood("neutral");
            setActiveGesture("idle_sway");
          },
          onBoundary: (word) => {
            setCurrentSpokenWord(word);
          },
        };
        ttsEngine.speak(textToSpeak, speakOptions);
      }
    }
  };

  // Toggle Web Speech Recognition
  const toggleSpeechRecognition = () => {
    if (typeof window === "undefined") return;
    const SpeechRec =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRec) {
      alert(
        "Speech recognition is not supported in this browser. Please use Chrome or Edge."
      );
      return;
    }

    if (isListening) {
      setIsListening(false);
      setInternalMood("neutral");
      setActiveGesture("idle_sway");
      return;
    }

    if (isTeacherSpeaking) {
      ttsEngine.stop();
      setIsTeacherSpeaking(false);
    }

    const recognition = new SpeechRec();
    recognition.lang =
      studentProfile.preferredLanguage === "Hindi" ? "hi-IN" : "en-IN";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      setInternalMood("listening");
      setActiveGesture("inquisitive_tilt");
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      if (onVoiceInputCaptured) {
        onVoiceInputCaptured(transcript);
      }
      setIsListening(false);
      setInternalMood("thinking");
      setActiveGesture("thinking_ponder");
      setTimeout(() => {
        setInternalMood("neutral");
        setActiveGesture("idle_sway");
      }, 2000);
    };

    recognition.onerror = () => {
      setIsListening(false);
      setInternalMood("neutral");
      setActiveGesture("idle_sway");
    };

    recognition.onend = () => {
      setIsListening(false);
      setInternalMood("neutral");
      setActiveGesture("idle_sway");
    };

    recognition.start();
  };

  // Determine active CSS transform class for the avatar head / body
  const getAvatarTransformClass = () => {
    switch (activeGesture) {
      case "nod_explain":
        return "animate-avatar-head-nod";
      case "inquisitive_tilt":
        return "animate-avatar-inquisitive";
      case "celebration_thumbs_up":
        return "animate-avatar-celebrate";
      case "eureka_point":
        return "animate-avatar-celebrate";
      case "caution_stop":
        return "animate-avatar-warning";
      case "thinking_ponder":
        return "animate-avatar-thinking";
      case "namaste_greet":
        return "animate-avatar-namaste";
      default:
        return isTeacherSpeaking
          ? "animate-avatar-head-nod"
          : isListening
          ? "animate-avatar-inquisitive"
          : "animate-avatar-idle";
    }
  };

  const getMoodBadge = () => {
    switch (mood) {
      case "explaining":
        return {
          label: "Explaining in Simple Terms",
          color: "bg-emerald-100 text-emerald-800 border-emerald-300",
          icon: Volume2,
        };
      case "listening":
        return {
          label: "Listening to Your Doubt",
          color: "bg-rose-100 text-rose-800 border-rose-300 animate-pulse",
          icon: Mic,
        };
      case "thinking":
        return {
          label: "Translating Jargon...",
          color: "bg-purple-100 text-purple-800 border-purple-300 animate-spin",
          icon: Sparkles,
        };
      case "warning_trap":
        return {
          label: "Exam Pitfall Alert!",
          color: "bg-amber-100 text-amber-900 border-amber-300",
          icon: AlertTriangle,
        };
      case "aha_moment":
        return {
          label: "Real-Life Analogy",
          color: "bg-indigo-100 text-indigo-900 border-indigo-300",
          icon: Lightbulb,
        };
      case "celebrating":
        return {
          label: "Mastery Achieved!",
          color: "bg-amber-100 text-amber-900 border-amber-300",
          icon: Award,
        };
      case "encouraging":
        return {
          label: "Keep Going, Let's Revisit",
          color: "bg-blue-100 text-blue-900 border-blue-300",
          icon: Smile,
        };
      default:
        return {
          label: "AI Socratic Mentor",
          color: "bg-slate-100 text-slate-700 border-slate-200",
          icon: BookOpen,
        };
    }
  };

  const moodInfo = getMoodBadge();
  const MoodIcon = moodInfo.icon;
  const avatarTransformClass = getAvatarTransformClass();
  const currentGestureDef =
    GESTURE_DEFINITIONS.find((g) => g.id === activeGesture) ||
    GESTURE_DEFINITIONS[0];

  return (
    <div
      className={`p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col space-y-4 relative ${className}`}
    >
      {/* Top Header: Persona Switcher & Status */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div className="relative">
          <button
            onClick={() => setShowPersonaMenu(!showPersonaMenu)}
            className="flex items-center gap-2 p-1.5 -ml-1.5 rounded-xl hover:bg-slate-100 transition-colors text-left cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-purple-600 p-0.5 shadow-xs">
              <img
                src={selectedPersona.avatarUrl}
                alt={selectedPersona.name}
                className="w-full h-full object-cover rounded-[6px]"
              />
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                  {selectedPersona.name}
                </span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </div>
              <span className="text-[10px] text-slate-500 font-medium line-clamp-1">
                {selectedPersona.badge}
              </span>
            </div>
          </button>

          {/* Persona Dropdown Menu */}
          {showPersonaMenu && (
            <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-2xl border border-slate-200 shadow-xl z-50 p-2 space-y-1.5 animate-in fade-in zoom-in-95">
              <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Select AI Teacher Persona
              </div>
              {teacherPersonas.map((persona) => {
                const isSelected = selectedPersona.id === persona.id;
                return (
                  <button
                    key={persona.id}
                    onClick={() => {
                      onSelectPersona?.(persona);
                      setShowPersonaMenu(false);
                      handleTriggerGesture("namaste_greet", "welcoming_greeting");
                    }}
                    className={`w-full p-2.5 rounded-xl text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                      isSelected
                        ? "bg-indigo-50 border border-indigo-200 text-indigo-950 shadow-xs"
                        : "hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    <img
                      src={persona.avatarUrl}
                      alt={persona.name}
                      className="w-9 h-9 rounded-lg object-cover shrink-0 mt-0.5 border border-slate-200"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900">
                          {persona.name}
                        </span>
                        {isSelected && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                        )}
                      </div>
                      <span className="text-[11px] text-indigo-600 font-medium block">
                        {persona.subjectSpecialty}
                      </span>
                      <p className="text-[10px] text-slate-500 line-clamp-2 mt-0.5">
                        {persona.bio}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Current State Pill */}
        <span
          className={`px-2.5 py-1 rounded-full text-[11px] font-bold border flex items-center gap-1.5 shadow-2xs ${moodInfo.color}`}
        >
          <MoodIcon className="w-3.5 h-3.5" />
          <span>{moodInfo.label}</span>
        </span>
      </div>

      {/* Document Grounding Indicator */}
      {activeDoc && (
        <div className="p-2.5 rounded-xl bg-emerald-50/80 border border-emerald-200 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <BookOpen className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="text-emerald-900 font-semibold truncate text-[11px]">
              Grounded in: <strong className="font-bold">{activeDoc.title}</strong>
            </span>
          </div>
          <span className="px-1.5 py-0.5 rounded bg-emerald-200 text-emerald-900 font-mono text-[9px] font-bold shrink-0">
            {activeDoc.totalChunks} Chunks
          </span>
        </div>
      )}

      {/* Interactive Avatar Center Visual Stage with CSS Transform Animations */}
      <div className="relative flex flex-col items-center justify-center py-3">
        {/* Avatar Speech Balloon Popup when avatar has simplified advice */}
        {simplifiedData?.avatarGreeting && !isListening && (
          <div className="mb-3 p-3 rounded-2xl bg-indigo-50 border border-indigo-200 text-xs text-indigo-950 shadow-sm max-w-sm relative animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <p className="font-medium leading-relaxed italic">
                "{simplifiedData.avatarGreeting}"
              </p>
            </div>
            {/* Small speech balloon pointer triangle */}
            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-indigo-50 border-r border-b border-indigo-200 rotate-45" />
          </div>
        )}

        {/* Animated Avatar Stage Box with Transform Head/Body Classes */}
        <div className="relative">
          {/* Active Gesture Floating Props / Hand Overlays */}
          {activeGesture === "nod_explain" && (
            <div className="absolute -right-5 top-2 z-20 px-2 py-1 rounded-full bg-emerald-600 text-white font-bold text-[10px] shadow-md animate-gesture-point flex items-center gap-1 border border-emerald-400">
              <span>👉</span>
              <span>Pointer</span>
            </div>
          )}

          {activeGesture === "inquisitive_tilt" && (
            <div className="absolute -left-6 top-1 z-20 px-2 py-1 rounded-full bg-indigo-600 text-white font-bold text-[10px] shadow-md animate-gesture-pop flex items-center gap-1 border border-indigo-400">
              <span>❓</span>
              <span>Questioning</span>
            </div>
          )}

          {activeGesture === "celebration_thumbs_up" && (
            <div className="absolute -right-6 top-0 z-20 px-2.5 py-1 rounded-full bg-amber-500 text-white font-bold text-[10px] shadow-lg animate-gesture-thumbs flex items-center gap-1 border border-amber-300">
              <span>👍</span>
              <span>Bravo!</span>
            </div>
          )}

          {activeGesture === "eureka_point" && (
            <div className="absolute -left-5 top-0 z-20 px-2.5 py-1 rounded-full bg-yellow-500 text-slate-950 font-bold text-[10px] shadow-lg animate-gesture-pop flex items-center gap-1 border border-yellow-300">
              <span>💡</span>
              <span>Insight!</span>
            </div>
          )}

          {activeGesture === "caution_stop" && (
            <div className="absolute -right-6 top-2 z-20 px-2.5 py-1 rounded-full bg-rose-600 text-white font-bold text-[10px] shadow-md animate-gesture-pop flex items-center gap-1 border border-rose-300">
              <span>✋</span>
              <span>Caution!</span>
            </div>
          )}

          {activeGesture === "thinking_ponder" && (
            <div className="absolute -left-5 top-1 z-20 px-2 py-1 rounded-full bg-purple-600 text-white font-bold text-[10px] shadow-md animate-gesture-pop flex items-center gap-1 border border-purple-400">
              <span>🤔</span>
              <span>Pondering</span>
            </div>
          )}

          {activeGesture === "namaste_greet" && (
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 z-20 px-2.5 py-1 rounded-full bg-teal-600 text-white font-bold text-[10px] shadow-md animate-gesture-namaste flex items-center gap-1 border border-teal-300">
              <span>🙏</span>
              <span>Namaste</span>
            </div>
          )}

          {/* Glow halo when speaking or reacting */}
          <div
            className={`relative w-28 h-28 sm:w-32 sm:h-32 rounded-full p-1.5 transition-all duration-500 ${
              isTeacherSpeaking
                ? "bg-gradient-to-tr from-emerald-400 via-teal-500 to-indigo-500 shadow-lg shadow-emerald-200/50 scale-105"
                : isListening
                ? "bg-gradient-to-tr from-rose-500 via-pink-500 to-amber-400 shadow-lg shadow-rose-200/50 scale-105 animate-pulse"
                : mood === "warning_trap" || activeGesture === "caution_stop"
                ? "bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-500 shadow-md shadow-amber-200/50"
                : mood === "aha_moment" || activeGesture === "eureka_point"
                ? "bg-gradient-to-tr from-indigo-500 via-purple-500 to-amber-400 shadow-md shadow-indigo-200/50"
                : activeGesture === "celebration_thumbs_up"
                ? "bg-gradient-to-tr from-amber-400 via-yellow-400 to-orange-400 shadow-xl shadow-amber-200/70"
                : "bg-gradient-to-tr from-indigo-500 via-purple-500 to-emerald-400 shadow-sm"
            }`}
          >
            {/* Avatar Image container with predefined CSS transform animation */}
            <div
              className={`w-full h-full rounded-full bg-slate-900 flex items-center justify-center overflow-hidden relative ${avatarTransformClass}`}
            >
              <img
                src={selectedPersona.avatarUrl}
                alt={selectedPersona.name}
                className={`w-full h-full object-cover transition-transform duration-300 ${
                  isTeacherSpeaking
                    ? "scale-105"
                    : eyeBlink
                    ? "opacity-95"
                    : "scale-100"
                }`}
              />

              {/* Speaking Lip-sync mouth overlay simulator */}
              {isTeacherSpeaking && (
                <div
                  className="absolute bottom-6 w-5 rounded-full bg-slate-900/80 border border-emerald-400/80 transition-all duration-75 mx-auto left-0 right-0"
                  style={{
                    height: `${Math.max(3, mouthOpenAmount * 14)}px`,
                    opacity: 0.85,
                  }}
                />
              )}

              {/* Listening microphone ripple overlay */}
              {isListening && (
                <div className="absolute inset-0 bg-rose-950/40 flex items-center justify-center backdrop-blur-[1px]">
                  <Mic className="w-8 h-8 text-rose-300 animate-bounce" />
                </div>
              )}
            </div>

            {/* Pulsing ring during speech or celebration */}
            {(isTeacherSpeaking || activeGesture === "celebration_thumbs_up") && (
              <div className="absolute inset-0 rounded-full border-2 border-emerald-400 animate-ping pointer-events-none opacity-40" />
            )}
          </div>
        </div>

        {/* Live Audio Equalizer Waveform */}
        <div className="flex items-center justify-center gap-1.5 h-6 mt-3">
          {[5, 12, 22, 10, 18, 26, 14, 8, 24, 11, 16, 7].map((baseH, idx) => (
            <div
              key={idx}
              className={`w-1 rounded-full transition-all duration-150 ${
                isTeacherSpeaking
                  ? "bg-emerald-500"
                  : isListening
                  ? "bg-rose-500"
                  : "bg-slate-200"
              }`}
              style={{
                height: isTeacherSpeaking
                  ? `${Math.max(
                      4,
                      Math.round(baseH * (0.4 + mouthOpenAmount * 0.9))
                    )}px`
                  : isListening
                  ? `${Math.max(4, Math.round(((idx % 4) + 1) * 5))}px`
                  : "4px",
              }}
            />
          ))}
        </div>

        {/* Live Subtitle / Spoken text snippet */}
        {isTeacherSpeaking && currentSpokenWord && (
          <div className="mt-2 px-3 py-1 rounded-full bg-slate-900 text-white text-[11px] font-medium max-w-xs truncate shadow-sm animate-fade-in flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
            <span className="text-emerald-300 font-bold">Speaking:</span>
            <span className="text-slate-100 truncate">
              "...{currentSpokenWord}..."
            </span>
          </div>
        )}
      </div>

      {/* Avatar Interaction Controller Panel */}
      <AvatarInteractionController
        activeGesture={activeGesture}
        activePedagogicalState={activePedagogicalState}
        onTriggerGesture={handleTriggerGesture}
        isAutoSync={isAutoSync}
        onToggleAutoSync={() => setIsAutoSync(!isAutoSync)}
        compact={compact}
      />

      {/* Avatar Simplified Teaching Modes: Feynman, Analogy, Exam Trap, Plain Formula */}
      <div className="space-y-2 pt-1 border-t border-slate-100">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <BrainCircuit className="w-3.5 h-3.5 text-indigo-600" />
            <span>Avatar Intuition Modes:</span>
          </span>
          {simplifiedData && (
            <button
              onClick={() => fetchSimplifiedConcept(activeStyle)}
              disabled={isSimplifying}
              className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5 cursor-pointer"
            >
              <RefreshCw
                className={`w-3 h-3 ${isSimplifying ? "animate-spin" : ""}`}
              />
              <span>Regenerate</span>
            </button>
          )}
        </div>

        {/* 4 Multi-Mode Chips */}
        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={() => fetchSimplifiedConcept("feynman")}
            disabled={isSimplifying}
            className={`p-2 rounded-xl text-left text-xs font-bold transition-all border flex items-center gap-2 cursor-pointer ${
              activeStyle === "feynman" && simplifiedData
                ? "bg-indigo-50 border-indigo-300 text-indigo-900 shadow-2xs"
                : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <span className="truncate">🌟 Explain Like I'm 10</span>
          </button>

          <button
            onClick={() => fetchSimplifiedConcept("analogy")}
            disabled={isSimplifying}
            className={`p-2 rounded-xl text-left text-xs font-bold transition-all border flex items-center gap-2 cursor-pointer ${
              activeStyle === "analogy" && simplifiedData
                ? "bg-emerald-50 border-emerald-300 text-emerald-900 shadow-2xs"
                : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700"
            }`}
          >
            <Lightbulb className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="truncate">🇮🇳 Real-Life Analogy</span>
          </button>

          <button
            onClick={() => fetchSimplifiedConcept("exam_trap")}
            disabled={isSimplifying}
            className={`p-2 rounded-xl text-left text-xs font-bold transition-all border flex items-center gap-2 cursor-pointer ${
              activeStyle === "exam_trap" && simplifiedData
                ? "bg-amber-50 border-amber-300 text-amber-900 shadow-2xs"
                : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700"
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span className="truncate">⚠️ Common Exam Trap</span>
          </button>

          <button
            onClick={() => fetchSimplifiedConcept("plain_formula")}
            disabled={isSimplifying}
            className={`p-2 rounded-xl text-left text-xs font-bold transition-all border flex items-center gap-2 cursor-pointer ${
              activeStyle === "plain_formula" && simplifiedData
                ? "bg-purple-50 border-purple-300 text-purple-900 shadow-2xs"
                : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700"
            }`}
          >
            <Compass className="w-3.5 h-3.5 text-purple-600 shrink-0" />
            <span className="truncate">📐 Plain Formula Meaning</span>
          </button>
        </div>
      </div>

      {/* Simplified Intuition Cards Displayed Directly under Avatar */}
      {simplifiedData && (
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-3 animate-in fade-in">
          {/* Card 1: 3 Feynman Breakdown Bullet Points */}
          {simplifiedData.feynmanPoints &&
            simplifiedData.feynmanPoints.length > 0 && (
              <div className="space-y-1.5">
                <span className="font-bold text-slate-900 flex items-center gap-1.5 text-[11px]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Core Takeaways in Plain Words:</span>
                </span>
                <div className="space-y-1 pl-1">
                  {simplifiedData.feynmanPoints.map((pt, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2 text-slate-700 leading-snug"
                    >
                      <span className="w-4 h-4 rounded-full bg-indigo-100 text-indigo-700 font-mono text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span>{pt}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          {/* Card 2: Real-Life Indian Analogy */}
          {simplifiedData.everydayAnalogy && (
            <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200 space-y-1">
              <span className="font-bold text-amber-900 text-[11px] flex items-center gap-1">
                <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
                <span>{selectedPersona.name}'s Real-World Analogy:</span>
              </span>
              <p className="text-slate-800 italic leading-relaxed">
                {simplifiedData.everydayAnalogy}
              </p>
            </div>
          )}

          {/* Card 3: Common Exam Trap */}
          {simplifiedData.commonExamTrap && (
            <div className="p-3 rounded-xl bg-rose-50/80 border border-rose-200 space-y-1">
              <span className="font-bold text-rose-900 text-[11px] flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                <span>Exam Trap to Avoid:</span>
              </span>
              <p className="text-slate-800 leading-relaxed font-medium">
                {simplifiedData.commonExamTrap}
              </p>
            </div>
          )}

          {/* Card 4: Plain English Formula Interpretation */}
          {simplifiedData.plainEnglishFormula && (
            <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-950 flex items-start gap-2">
              <Compass className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-bold text-[10px] uppercase text-indigo-700 tracking-wider block">
                  Formula in Plain Human Words:
                </span>
                <p className="font-semibold text-slate-800">
                  {simplifiedData.plainEnglishFormula}
                </p>
              </div>
            </div>
          )}

          {/* Card 5: Socratic Question from Avatar to Student */}
          {simplifiedData.avatarPromptQuestion && (
            <div className="p-3 rounded-xl bg-white border border-indigo-200 space-y-2 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-indigo-900 text-[11px] flex items-center gap-1">
                  <HelpCircle className="w-3.5 h-3.5 text-indigo-600" />
                  <span>{selectedPersona.name} Asks You:</span>
                </span>
                <span className="text-[10px] text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded-full">
                  Quick Check
                </span>
              </div>
              <p className="font-semibold text-slate-800">
                {simplifiedData.avatarPromptQuestion}
              </p>

              {/* Student reply directly via voice / text */}
              <div className="flex items-center gap-1.5 pt-1">
                <input
                  type="text"
                  value={studentReplyText}
                  onChange={(e) => setStudentReplyText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && studentReplyText.trim()) {
                      onVoiceInputCaptured?.(studentReplyText);
                      setStudentReplyText("");
                      handleTriggerGesture("celebration_thumbs_up", "positive_feedback");
                    }
                  }}
                  placeholder="Answer Dr. Vikram..."
                  className="flex-1 px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:border-indigo-600 focus:bg-white"
                />
                <button
                  onClick={() => {
                    if (studentReplyText.trim()) {
                      onVoiceInputCaptured?.(studentReplyText);
                      setStudentReplyText("");
                      handleTriggerGesture("celebration_thumbs_up", "positive_feedback");
                    }
                  }}
                  disabled={!studentReplyText.trim()}
                  className="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-[11px] cursor-pointer"
                >
                  Send
                </button>
                <button
                  onClick={toggleSpeechRecognition}
                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                  title="Speak answer via microphone"
                >
                  <Mic className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Voice & Interactive Teaching Action Bar */}
      <div className="space-y-3 pt-2 border-t border-slate-100">
        {/* Main Controls: Speak Aloud + Microphone */}
        <div className="grid grid-cols-2 gap-2">
          {/* Read / Pause Aloud Button */}
          <button
            onClick={handleToggleSpeech}
            disabled={!explanationText && !simplifiedData}
            className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer ${
              isTeacherSpeaking
                ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-100"
                : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-100"
            }`}
          >
            {isTeacherSpeaking ? (
              <>
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>Pause Voice</span>
              </>
            ) : (
              <>
                <Volume2 className="w-3.5 h-3.5" />
                <span>Speak Simply</span>
              </>
            )}
          </button>

          {/* Student Mic Speech-to-Text Button */}
          <button
            onClick={toggleSpeechRecognition}
            className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer ${
              isListening
                ? "bg-rose-600 hover:bg-rose-700 text-white shadow-rose-100 animate-pulse"
                : "bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200"
            }`}
          >
            {isListening ? (
              <>
                <MicOff className="w-3.5 h-3.5" />
                <span>Listening...</span>
              </>
            ) : (
              <>
                <Mic className="w-3.5 h-3.5 text-slate-600" />
                <span>Ask via Voice</span>
              </>
            )}
          </button>
        </div>

        {/* Speed & Dialect Options */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold text-slate-400">Speed:</span>
            {[0.8, 1.0, 1.25].map((rate) => (
              <button
                key={rate}
                onClick={() => setSpeechRate(rate)}
                className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono transition-colors cursor-pointer ${
                  speechRate === rate
                    ? "bg-indigo-100 text-indigo-700 border border-indigo-200"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {rate}x
              </button>
            ))}
          </div>

          <div className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
            <span>Lang:</span>
            <span className="font-bold text-indigo-600">
              {studentProfile.preferredLanguage}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
