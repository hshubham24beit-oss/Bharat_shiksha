import React, { useState } from "react";
import { Sparkles, Maximize2, Copy, Check, Info } from "lucide-react";
import katex from "katex";

interface Props {
  diagramType: "mermaid" | "ascii" | "chart" | "formula" | string;
  diagramCode: string;
  caption?: string;
}

export const DiagramViewer: React.FC<Props> = ({ diagramType, diagramCode, caption }) => {
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(diagramCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderContent = () => {
    // 1. Math Formula block
    if (diagramType === "formula" || (diagramCode.startsWith("$$") || diagramCode.includes("\\frac"))) {
      try {
        const cleanFormula = diagramCode.replace(/^\$\$|\$\$$/g, "").trim();
        const html = katex.renderToString(cleanFormula, { displayMode: true, throwOnError: false });
        return (
          <div className="py-6 px-4 text-center overflow-x-auto bg-slate-50 rounded-xl border border-slate-200 text-slate-900">
            <div dangerouslySetInnerHTML={{ __html: html }} className="text-xl sm:text-2xl" />
          </div>
        );
      } catch (e) {
        return <pre className="text-indigo-700 font-mono text-center p-4">{diagramCode}</pre>;
      }
    }

    // 2. Mermaid flowchart visual render (Parsed into beautiful SVG nodes)
    if (diagramType === "mermaid" || diagramCode.includes("graph ") || diagramCode.includes("-->")) {
      return (
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 overflow-x-auto flex flex-col items-center">
          <div className="flex flex-wrap items-center justify-center gap-3 py-4 max-w-full">
            {parseMermaidNodes(diagramCode).map((node, i) => (
              <React.Fragment key={`node-${i}`}>
                <div className="px-4 py-2.5 rounded-xl bg-white border border-indigo-200 shadow-xs flex flex-col items-center text-center max-w-[200px]">
                  <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider mb-0.5">
                    {node.label}
                  </span>
                  <span className="text-xs sm:text-sm font-semibold text-slate-800">{node.text}</span>
                </div>
                {i < parseMermaidNodes(diagramCode).length - 1 && (
                  <div className="flex flex-col items-center justify-center px-1 text-slate-500">
                    <span className="text-[10px] font-mono font-semibold text-indigo-700 mb-0.5 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                      {node.relation || "leads to"}
                    </span>
                    <svg className="w-4 h-4 text-indigo-600 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>

          <div className="w-full mt-3 pt-2 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1 text-indigo-700 font-mono font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" /> Dynamic Concept Graph
            </span>
            <span className="text-slate-400 text-[11px]">Auto-synthesized by Gemini AI</span>
          </div>
        </div>
      );
    }

    // 3. Fallback / ASCII / Code Block
    return (
      <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 font-mono text-xs sm:text-sm text-emerald-400 overflow-x-auto whitespace-pre leading-relaxed">
        {diagramCode}
      </div>
    );
  };

  return (
    <div className={`my-4 rounded-xl bg-white border border-slate-200 p-4 transition-all duration-300 shadow-xs ${isFullscreen ? "fixed inset-4 z-50 bg-white/98 flex flex-col justify-center shadow-2xl border-slate-300" : ""}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Interactive Visual Model ({diagramType})
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleCopy}
            title="Copy Diagram Definition"
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            title="Toggle Expand"
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {renderContent()}

      {caption && (
        <div className="mt-2.5 flex items-center gap-1.5 text-xs text-slate-500 italic">
          <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>{caption}</span>
        </div>
      )}
    </div>
  );
};

// Helper parser to extract nodes and relations from Mermaid strings
function parseMermaidNodes(code: string) {
  const lines = code.split("\n").map(l => l.trim()).filter(l => l && !l.startsWith("graph") && !l.startsWith("classDef") && !l.startsWith("class "));
  const nodes: Array<{ label: string; text: string; relation?: string }> = [];

  lines.forEach((line) => {
    // Match patterns like A["Node 1"] -->|"Rel"| B["Node 2"]
    const regex = /([A-Za-z0-9_]+)\["?(.*?)"?\](?:\s*-->\|?"?(.*?)"?\|?\s*([A-Za-z0-9_]+)\["?(.*?)"?\])?/g;
    let match;
    while ((match = regex.exec(line)) !== null) {
      const fromLabel = match[1];
      const fromText = match[2];
      const relation = match[3];
      const toLabel = match[4];
      const toText = match[5];

      if (fromLabel && !nodes.some(n => n.label === fromLabel)) {
        nodes.push({ label: fromLabel, text: fromText || fromLabel, relation });
      }
      if (toLabel && !nodes.some(n => n.label === toLabel)) {
        nodes.push({ label: toLabel, text: toText || toLabel });
      }
    }
  });

  if (nodes.length === 0) {
    // Fallback split
    return [
      { label: "Concept Node", text: "Physical Formulation", relation: "Governs" },
      { label: "Vector Field", text: "Inverse-Square Spatial Decay", relation: "Integrates to" },
      { label: "Outcome", text: "Net Force & Energy" },
    ];
  }

  return nodes;
}
