import React, { useState } from "react";
import {
  Sparkles,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Lightbulb,
  ThumbsUp,
  Hand,
  Sliders,
  ChevronDown,
  ChevronUp,
  Volume2,
  Zap,
  Smile,
  Flame,
} from "lucide-react";
import { AvatarPedagogicalState, AvatarGestureType } from "../types";

export interface GestureDefinition {
  id: AvatarGestureType;
  pedagogicalState: AvatarPedagogicalState;
  label: string;
  shortLabel: string;
  description: string;
  icon: React.ElementType;
  badgeColor: string;
  avatarClass: string;
  gestureEmoji: string;
}

export const GESTURE_DEFINITIONS: GestureDefinition[] = [
  {
    id: "nod_explain",
    pedagogicalState: "explaining_concept",
    label: "Explaining Concept (Head Nod & Pointer)",
    shortLabel: "Nod & Explain",
    description: "Conversational rhythmic head nodding with directional teaching pointer gesture.",
    icon: Volume2,
    badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-300",
    avatarClass: "animate-avatar-head-nod",
    gestureEmoji: "👉",
  },
  {
    id: "inquisitive_tilt",
    pedagogicalState: "asking_question",
    label: "Asking Question (Inquisitive Tilt & Lean)",
    shortLabel: "Inquisitive Tilt",
    description: "Head tilts 5° with forward focal zoom to engage the student during Socratic questions.",
    icon: HelpCircle,
    badgeColor: "bg-indigo-100 text-indigo-800 border-indigo-300",
    avatarClass: "animate-avatar-inquisitive",
    gestureEmoji: "❓",
  },
  {
    id: "celebration_thumbs_up",
    pedagogicalState: "positive_feedback",
    label: "Positive Feedback (Thumbs Up & Joy Bounce)",
    shortLabel: "Praise & Thumbs Up",
    description: "Celebratory vertical bounce with glowing thumbs-up hand gesture and golden particle burst.",
    icon: ThumbsUp,
    badgeColor: "bg-amber-100 text-amber-900 border-amber-300",
    avatarClass: "animate-avatar-celebrate",
    gestureEmoji: "👍",
  },
  {
    id: "eureka_point",
    pedagogicalState: "explaining_concept",
    label: "Eureka Moment (Upward Finger Point)",
    shortLabel: "Eureka Point",
    description: "Upward pointing gesture with lightbulb epiphany glow for key insights and analogies.",
    icon: Lightbulb,
    badgeColor: "bg-yellow-100 text-yellow-900 border-yellow-300",
    avatarClass: "animate-avatar-celebrate",
    gestureEmoji: "💡",
  },
  {
    id: "caution_stop",
    pedagogicalState: "exam_trap_warning",
    label: "Exam Trap Alert (Caution Shake & Stop Hand)",
    shortLabel: "Caution Shake",
    description: "Subtle head shake with open palm stop gesture to warn about negative marking pitfalls.",
    icon: AlertTriangle,
    badgeColor: "bg-rose-100 text-rose-800 border-rose-300",
    avatarClass: "animate-avatar-warning",
    gestureEmoji: "✋",
  },
  {
    id: "thinking_ponder",
    pedagogicalState: "deep_thinking",
    label: "Deep Thinking (Chin Tap & Ponder Tilt)",
    shortLabel: "Ponder & Think",
    description: "Upward chin tilt with pondering gesture during RAG document retrieval & synthesis.",
    icon: Sparkles,
    badgeColor: "bg-purple-100 text-purple-800 border-purple-300",
    avatarClass: "animate-avatar-thinking",
    gestureEmoji: "🤔",
  },
  {
    id: "namaste_greet",
    pedagogicalState: "welcoming_greeting",
    label: "Respectful Greeting (Namaste Bow)",
    shortLabel: "Namaste Greet",
    description: "Traditional Indian welcoming gesture with gentle forward bow and folded hands.",
    icon: Hand,
    badgeColor: "bg-teal-100 text-teal-800 border-teal-300",
    avatarClass: "animate-avatar-namaste",
    gestureEmoji: "🙏",
  },
];

interface AvatarInteractionControllerProps {
  activeGesture: AvatarGestureType;
  activePedagogicalState: AvatarPedagogicalState;
  onTriggerGesture: (gesture: AvatarGestureType, state?: AvatarPedagogicalState) => void;
  isAutoSync: boolean;
  onToggleAutoSync: () => void;
  compact?: boolean;
  className?: string;
}

export const AvatarInteractionController: React.FC<AvatarInteractionControllerProps> = ({
  activeGesture,
  activePedagogicalState,
  onTriggerGesture,
  isAutoSync,
  onToggleAutoSync,
  compact = false,
  className = "",
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const currentGestureDef =
    GESTURE_DEFINITIONS.find((g) => g.id === activeGesture) || GESTURE_DEFINITIONS[0];

  return (
    <div
      className={`rounded-2xl border border-slate-200 bg-white/95 backdrop-blur-xs transition-all shadow-2xs overflow-hidden ${className}`}
    >
      {/* Header bar */}
      <div className="p-3 flex items-center justify-between gap-2 border-b border-slate-100">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-2xs shrink-0">
            <Sliders className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-900 truncate">Avatar Interaction Controller</span>
              <span className="px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                CSS Transforms
              </span>
            </div>
            <p className="text-[10px] text-slate-500 truncate">
              {isAutoSync ? "Auto-synced to pedagogical state" : "Manual gesture trigger mode"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Auto-sync toggle */}
          <button
            onClick={onToggleAutoSync}
            className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer flex items-center gap-1 ${
              isAutoSync
                ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
            }`}
            title={isAutoSync ? "Auto sync enabled (reacts to lesson flow)" : "Manual mode active"}
          >
            <Zap className={`w-3 h-3 ${isAutoSync ? "text-emerald-600 fill-emerald-500" : "text-slate-400"}`} />
            <span>{isAutoSync ? "Auto Sync" : "Manual"}</span>
          </button>

          {/* Expand/Collapse Toggle */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors cursor-pointer"
            aria-label="Toggle interaction controls"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Active State Pill Bar */}
      <div className="px-3 py-2 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between text-xs gap-2">
        <div className="flex items-center gap-1.5 truncate">
          <span className="text-base shrink-0">{currentGestureDef.gestureEmoji}</span>
          <span className="font-bold text-slate-800 truncate text-[11px]">{currentGestureDef.label}</span>
        </div>
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${currentGestureDef.badgeColor}`}>
          {activeGesture}
        </span>
      </div>

      {/* Expanded Gesture Trigger Grid */}
      {isExpanded && (
        <div className="p-3 space-y-2.5 animate-in fade-in slide-in-from-top-1">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Predefined Pedagogical Gestures & Transforms:
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {GESTURE_DEFINITIONS.map((gesture) => {
              const isActive = activeGesture === gesture.id;
              const IconComp = gesture.icon;

              return (
                <button
                  key={gesture.id}
                  onClick={() => onTriggerGesture(gesture.id, gesture.pedagogicalState)}
                  className={`p-2 rounded-xl text-left border transition-all cursor-pointer flex items-start gap-2 group ${
                    isActive
                      ? "bg-indigo-50 border-indigo-300 text-indigo-950 shadow-2xs ring-1 ring-indigo-200"
                      : "bg-white hover:bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300"
                  }`}
                >
                  <span className="text-lg shrink-0 mt-0.5 group-hover:scale-110 transition-transform">
                    {gesture.gestureEmoji}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                        {gesture.shortLabel}
                      </span>
                      {isActive && <CheckCircle2 className="w-3 h-3 text-indigo-600 shrink-0" />}
                    </div>
                    <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                      {gesture.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Quick testing presets */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-400 font-medium">Interactive Feedback Flow:</span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => onTriggerGesture("nod_explain", "explaining_concept")}
                className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold border border-emerald-200 transition-colors cursor-pointer"
              >
                1. Explain
              </button>
              <button
                onClick={() => onTriggerGesture("inquisitive_tilt", "asking_question")}
                className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold border border-indigo-200 transition-colors cursor-pointer"
              >
                2. Question
              </button>
              <button
                onClick={() => onTriggerGesture("celebration_thumbs_up", "positive_feedback")}
                className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 hover:bg-amber-100 font-bold border border-amber-200 transition-colors cursor-pointer"
              >
                3. Praise
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
