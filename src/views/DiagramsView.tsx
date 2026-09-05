import React, { useState } from "react";
import {
  Network, Sparkles, RefreshCw, Copy, Check, Download, Layers,
} from "lucide-react";
import { StudentProfile, ActiveView } from "../types";
import { DiagramViewer } from "../components/DiagramViewer";

interface DiagramData {
  type: string;
  title: string;
  code: string;
  description: string;
  visualPrompt?: string;
  alternativeFormats?: {
    ascii?: string;
    description?: string;
  };
}

interface Props {
  studentProfile: StudentProfile;
  setActiveView: (view: ActiveView) => void;
}

export const DiagramsView: React.FC<Props> = ({ studentProfile, setActiveView }) => {
  const [topicInput, setTopicInput] = useState("");
  const [diagramType, setDiagramType] = useState("flowchart");
  const [isGenerating, setIsGenerating] = useState(false);
  const [diagrams, setDiagrams] = useState<DiagramData[]>([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (!topicInput.trim() || isGenerating) return;

    setIsGenerating(true);
    try {
      const { apiPost } = await import("../services/api");
      const data = await apiPost("/api/diagrams/generate-multiple", {
        topic: topicInput.trim(),
        count: 3,
        language: studentProfile.preferredLanguage,
      });
      if (data.diagrams && data.diagrams.length > 0) {
        setDiagrams(data.diagrams);
        setSelectedIdx(0);
      }
    } catch (e) {
      console.error("Diagram generation error:", e);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const currentDiagram = diagrams[selectedIdx];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="card-warm p-6 sm:p-8 space-y-4">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-saffron-50 text-saffron-600 text-xs font-bold border border-saffron-100">
            <Network className="w-3.5 h-3.5" />
            <span>Visual Diagram Generator</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black font-display text-ink-900">
            Flowcharts & Diagrams
          </h1>
          <p className="text-sm text-ink-500">
            Generate visual diagrams, concept maps, and flowcharts from any topic — powered by AI.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <input
            type="text"
            value={topicInput}
            onChange={(e) => setTopicInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
            placeholder="Enter topic for diagram generation..."
            className="flex-1 px-4 py-2.5 rounded-xl bg-ink-50 border border-ink-200 text-sm text-ink-800 focus:outline-none focus:border-saffron-400 focus:ring-2 focus:ring-saffron-100 transition-all"
          />
          <select
            value={diagramType}
            onChange={(e) => setDiagramType(e.target.value)}
            className="px-3 py-2.5 rounded-xl bg-ink-50 border border-ink-200 text-sm text-ink-700 focus:outline-none focus:border-saffron-400"
          >
            <option value="flowchart">Flowchart</option>
            <option value="concept-map">Concept Map</option>
            <option value="sequence">Sequence Diagram</option>
            <option value="comparison">Comparison</option>
          </select>
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

      {diagrams.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Diagram list */}
          <div className="lg:col-span-3 space-y-3">
            <span className="text-[10px] font-bold uppercase tracking-widest text-ink-300 block">
              Generated Diagrams ({diagrams.length})
            </span>
            {diagrams.map((d, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedIdx(idx)}
                className={`w-full p-3 rounded-xl border text-left transition-all ${
                  idx === selectedIdx
                    ? "bg-saffron-50/60 border-saffron-200/60"
                    : "bg-ink-50/40 border-ink-200/40 hover:border-ink-300"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Layers className="w-3.5 h-3.5 text-saffron-500" />
                  <span className="text-[10px] font-bold uppercase text-ink-400">{d.type}</span>
                </div>
                <span className="text-xs font-semibold text-ink-700 line-clamp-2">{d.title}</span>
              </button>
            ))}
          </div>

          {/* Main diagram view */}
          <div className="lg:col-span-9 space-y-4">
            {currentDiagram && (
              <>
                <div className="card-warm p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-bold font-display text-ink-900">{currentDiagram.title}</h2>
                      <p className="text-xs text-ink-400 mt-1">{currentDiagram.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCopy(currentDiagram.code)}
                        className="px-3 py-1.5 rounded-lg bg-ink-50 hover:bg-ink-100 border border-ink-200 text-xs font-semibold text-ink-600 flex items-center gap-1.5 transition-colors"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-deep-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copied ? "Copied!" : "Copy Code"}</span>
                      </button>
                    </div>
                  </div>

                  <DiagramViewer
                    diagramType={currentDiagram.type as any}
                    diagramCode={currentDiagram.code}
                    caption={currentDiagram.description}
                  />
                </div>

                {/* Code view */}
                <div className="card-warm p-6 space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-ink-400">Mermaid Code</h3>
                  <pre className="p-4 rounded-xl bg-ink-900 text-deep-400 text-xs font-mono overflow-x-auto leading-relaxed">
                    {currentDiagram.code}
                  </pre>
                </div>

                {/* Alternative format */}
                {currentDiagram.alternativeFormats?.description && (
                  <div className="card-warm p-6 space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-ink-400">Step-by-Step Walkthrough</h3>
                    <p className="text-sm text-ink-600 leading-relaxed">
                      {currentDiagram.alternativeFormats.description}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {!diagrams.length && !isGenerating && (
        <div className="card-warm p-12 text-center space-y-4">
          <Network className="w-12 h-12 text-ink-300 mx-auto" />
          <h3 className="text-lg font-bold text-ink-700 font-display">No diagrams yet</h3>
          <p className="text-sm text-ink-400 max-w-md mx-auto">
            Enter a topic above to generate visual diagrams, flowcharts, and concept maps.
          </p>
        </div>
      )}
    </div>
  );
};
