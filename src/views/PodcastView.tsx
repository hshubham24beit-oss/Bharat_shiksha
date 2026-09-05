import React, { useState, useRef, useEffect } from "react";
import {
  Headphones, Play, Pause, SkipForward, SkipBack, RefreshCw,
  Sparkles, Clock, Volume2, MessageSquare, BookOpen,
} from "lucide-react";
import { StudentProfile, ActiveView } from "../types";
import { MarkdownMathRenderer } from "../components/MarkdownMathRenderer";

interface PodcastSegment {
  speaker: "host" | "teacher";
  speakerName: string;
  text: string;
  timestamp: string;
}

interface PodcastData {
  title: string;
  introduction: string;
  segments: PodcastSegment[];
  conclusion: string;
  durationEstimate: string;
  keyTopics: string[];
}

interface Props {
  studentProfile: StudentProfile;
  setActiveView: (view: ActiveView) => void;
}

export const PodcastView: React.FC<Props> = ({ studentProfile, setActiveView }) => {
  const [podcast, setPodcast] = useState<PodcastData | null>(null);
  const [topicInput, setTopicInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSegmentIdx, setCurrentSegmentIdx] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [spokenWord, setSpokenWord] = useState("");
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const currentSegment = podcast?.segments[currentSegmentIdx];

  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  useEffect(() => {
    if (isPlaying && currentSegment) {
      speakSegment(currentSegment);
    } else {
      window.speechSynthesis.cancel();
    }
  }, [isPlaying, currentSegmentIdx]);

  const speakSegment = (segment: PodcastSegment) => {
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(segment.text);
    utterance.lang = segment.speaker === "host" ? "hi-IN" : "en-IN";
    utterance.rate = playbackSpeed * (segment.speaker === "host" ? 0.95 : 0.9);
    utterance.pitch = segment.speaker === "host" ? 1.2 : 0.95;

    const voices = window.speechSynthesis.getVoices();
    const indianVoice = voices.find((v) =>
      v.lang.includes("hi-IN") || v.lang.includes("en-IN")
    );
    if (indianVoice) utterance.voice = indianVoice;

    utterance.onboundary = (event) => {
      if (event.name === "word") {
        setSpokenWord(segment.text.slice(event.charIndex, event.charIndex + event.charLength));
      }
    };

    utterance.onend = () => {
      setSpokenWord("");
      if (podcast && currentSegmentIdx < podcast.segments.length - 1) {
        setCurrentSegmentIdx((prev) => prev + 1);
      } else {
        setIsPlaying(false);
      }
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const handleGenerate = async () => {
    if (!topicInput.trim() || isGenerating) return;

    setIsGenerating(true);
    try {
      const { apiPost } = await import("../services/api");
      const data = await apiPost("/api/podcast/generate", {
        topic: topicInput.trim(),
        language: studentProfile.preferredLanguage,
        style: "standard",
      });
      if (data.podcast) {
        setPodcast(data.podcast);
        setCurrentSegmentIdx(0);
        setIsPlaying(false);
      }
    } catch (e) {
      console.error("Podcast generation error:", e);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleTogglePlay = () => {
    if (isPlaying) {
      window.speechSynthesis.pause();
      setIsPlaying(false);
    } else {
      window.speechSynthesis.resume();
      setIsPlaying(true);
    }
  };

  const handleNext = () => {
    if (podcast && currentSegmentIdx < podcast.segments.length - 1) {
      window.speechSynthesis.cancel();
      setCurrentSegmentIdx((prev) => prev + 1);
      if (isPlaying) {
        setTimeout(() => {
          if (podcast.segments[currentSegmentIdx + 1]) {
            speakSegment(podcast.segments[currentSegmentIdx + 1]);
          }
        }, 100);
      }
    }
  };

  const handlePrev = () => {
    if (currentSegmentIdx > 0) {
      window.speechSynthesis.cancel();
      setCurrentSegmentIdx((prev) => prev - 1);
      if (isPlaying && podcast?.segments[currentSegmentIdx - 1]) {
        setTimeout(() => {
          speakSegment(podcast.segments[currentSegmentIdx - 1]);
        }, 100);
      }
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="card-warm p-6 sm:p-8 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-saffron-50 text-saffron-600 text-xs font-bold border border-saffron-100">
              <Headphones className="w-3.5 h-3.5" />
              <span>Shikshak Podcast Studio</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black font-display text-ink-900">
              AI Podcast Lessons
            </h1>
            <p className="text-sm text-ink-500">
              Two AI teachers discuss any topic in a conversational podcast format — learn by listening.
            </p>
          </div>
        </div>

        {/* Generate form */}
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={topicInput}
            onChange={(e) => setTopicInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
            placeholder="Enter topic for podcast lesson..."
            className="flex-1 px-4 py-2.5 rounded-xl bg-ink-50 border border-ink-200 text-sm text-ink-800 focus:outline-none focus:border-saffron-400 focus:ring-2 focus:ring-saffron-100 transition-all"
          />
          <button
            onClick={handleGenerate}
            disabled={!topicInput.trim() || isGenerating}
            className="btn-saffron text-sm flex items-center gap-2 shrink-0"
          >
            {isGenerating ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            <span>{isGenerating ? "Generating..." : "Generate"}</span>
          </button>
        </div>
      </div>

      {podcast && (
        <>
          {/* Player */}
          <div className="card-warm overflow-hidden">
            {/* Now playing */}
            <div className="p-6 bg-gradient-to-br from-ink-900 via-ink-800 to-ink-900 text-white relative">
              <div className="absolute inset-0 opacity-[0.04]"
                style={{
                  backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
                  backgroundSize: '20px 20px',
                }}
              />
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-widest text-white/40">Now Playing</span>
                    <h2 className="text-lg font-bold font-display mt-1">{podcast.title}</h2>
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 text-xs">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{podcast.durationEstimate}</span>
                  </div>
                </div>

                {currentSegment && (
                  <div className="p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        currentSegment.speaker === "host"
                          ? "bg-saffron-500 text-white"
                          : "bg-deep-500 text-white"
                      }`}>
                        {currentSegment.speaker === "host" ? "P" : "V"}
                      </div>
                      <span className="text-xs font-semibold text-white/70">
                        {currentSegment.speakerName}
                      </span>
                      <span className="text-[10px] font-mono text-white/30">
                        {currentSegment.timestamp}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed text-white/90">
                      {currentSegment.text}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Controls */}
            <div className="p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <button onClick={handlePrev} disabled={currentSegmentIdx === 0}
                  className="p-2 rounded-xl bg-ink-50 hover:bg-ink-100 text-ink-500 disabled:opacity-30 transition-colors">
                  <SkipBack className="w-4 h-4" />
                </button>
                <button onClick={handleTogglePlay}
                  className="p-3 rounded-xl bg-gradient-to-r from-saffron-500 to-saffron-600 text-white shadow-sm shadow-saffron-500/30 hover:shadow-md transition-all">
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
                </button>
                <button onClick={handleNext}
                  disabled={!podcast || currentSegmentIdx >= podcast.segments.length - 1}
                  className="p-2 rounded-xl bg-ink-50 hover:bg-ink-100 text-ink-500 disabled:opacity-30 transition-colors">
                  <SkipForward className="w-4 h-4" />
                </button>
              </div>

              {/* Progress */}
              <div className="flex-1 flex items-center gap-3">
                <span className="text-[11px] font-mono text-ink-400 shrink-0">
                  {currentSegmentIdx + 1}/{podcast.segments.length}
                </span>
                <div className="flex-1 h-1.5 bg-ink-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-saffron-500 to-saffron-600 rounded-full transition-all"
                    style={{ width: `${((currentSegmentIdx + 1) / podcast.segments.length) * 100}%` }}
                  />
                </div>
              </div>

              {/* Speed */}
              <div className="flex items-center gap-1 bg-ink-50 rounded-lg px-2 py-1">
                {[0.75, 1.0, 1.25, 1.5].map((s) => (
                  <button key={s} onClick={() => setPlaybackSpeed(s)}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-colors ${
                      playbackSpeed === s ? "bg-saffron-500 text-white" : "text-ink-400 hover:text-ink-600"
                    }`}>
                    {s}x
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Episode info */}
          <div className="card-warm p-6 space-y-4">
            <h3 className="text-sm font-bold text-ink-700 font-display">Episode Overview</h3>
            <p className="text-sm text-ink-600 leading-relaxed">{podcast.introduction}</p>

            <div className="flex flex-wrap gap-2">
              {podcast.keyTopics.map((topic, i) => (
                <span key={i} className="px-2.5 py-1 rounded-lg bg-saffron-50 border border-saffron-100 text-[11px] font-semibold text-saffron-700">
                  {topic}
                </span>
              ))}
            </div>
          </div>

          {/* Transcript */}
          <div className="card-warm p-6 space-y-4">
            <h3 className="text-sm font-bold text-ink-700 font-display">Full Transcript</h3>
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {podcast.segments.map((seg, idx) => (
                <div key={idx}
                  onClick={() => {
                    window.speechSynthesis.cancel();
                    setCurrentSegmentIdx(idx);
                    if (isPlaying) {
                      setTimeout(() => speakSegment(seg), 100);
                    }
                  }}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    idx === currentSegmentIdx
                      ? "bg-saffron-50/60 border-saffron-200/60"
                      : "bg-ink-50/40 border-ink-200/40 hover:border-ink-300"
                  }`}>
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold ${
                      seg.speaker === "host" ? "bg-saffron-500 text-white" : "bg-deep-500 text-white"
                    }`}>
                      {seg.speaker === "host" ? "P" : "V"}
                    </div>
                    <span className="text-[11px] font-semibold text-ink-600">{seg.speakerName}</span>
                    <span className="text-[10px] font-mono text-ink-300">{seg.timestamp}</span>
                  </div>
                  <p className="text-xs text-ink-600 leading-relaxed pl-7">{seg.text}</p>
                </div>
              ))}
            </div>

            <div className="p-4 rounded-xl bg-deep-50/60 border border-deep-200/40">
              <span className="text-[10px] font-bold uppercase tracking-widest text-deep-600 block mb-2">Conclusion</span>
              <p className="text-xs text-ink-600 leading-relaxed">{podcast.conclusion}</p>
            </div>
          </div>
        </>
      )}

      {!podcast && !isGenerating && (
        <div className="card-warm p-12 text-center space-y-4">
          <Headphones className="w-12 h-12 text-ink-300 mx-auto" />
          <h3 className="text-lg font-bold text-ink-700 font-display">No podcast yet</h3>
          <p className="text-sm text-ink-400 max-w-md mx-auto">
            Enter a topic above to generate an AI podcast lesson with two teachers discussing concepts in a conversational format.
          </p>
        </div>
      )}
    </div>
  );
};
