import React from "react";
import katex from "katex";

interface Props {
  content: string;
  className?: string;
}

export const MarkdownMathRenderer: React.FC<Props> = ({ content, className = "" }) => {
  // Helper to render KaTeX math safely
  const renderMathWithText = (text: string) => {
    if (!text) return null;

    // Split block math first ($$ ... $$)
    const blockParts = text.split(/\$\$([\s\S]*?)\$\$/g);

    return blockParts.map((blockPart, blockIdx) => {
      // Odd indices are block math formulas
      if (blockIdx % 2 === 1) {
        try {
          const html = katex.renderToString(blockPart.trim(), {
            displayMode: true,
            throwOnError: false,
          });
          return (
            <div
              key={`math-block-${blockIdx}`}
              className="my-3 py-2 px-3 overflow-x-auto bg-slate-900/80 rounded-lg border border-slate-800 text-center font-mono"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          );
        } catch (e) {
          return (
            <pre key={`math-block-err-${blockIdx}`} className="text-amber-400 bg-slate-900 p-2 rounded text-xs">
              $${blockPart}$$
            </pre>
          );
        }
      }

      // Inside non-block text, split inline math ($ ... $)
      const inlineParts = blockPart.split(/\$([^$\n]+?)\$/g);

      return (
        <span key={`text-block-${blockIdx}`}>
          {inlineParts.map((inlinePart, inlineIdx) => {
            // Odd indices are inline math
            if (inlineIdx % 2 === 1) {
              try {
                const html = katex.renderToString(inlinePart.trim(), {
                  displayMode: false,
                  throwOnError: false,
                });
                return (
                  <span
                    key={`inline-math-${inlineIdx}`}
                    className="inline-block px-1 font-mono text-indigo-300 font-medium"
                    dangerouslySetInnerHTML={{ __html: html }}
                  />
                );
              } catch (e) {
                return (
                  <code key={`inline-math-err-${inlineIdx}`} className="text-indigo-400 font-mono">
                    ${inlinePart}$
                  </code>
                );
              }
            }

            // Regular markdown text formatting (bold, italics, headers, lists, code)
            return renderSimpleMarkdown(inlinePart, `sub-${blockIdx}-${inlineIdx}`);
          })}
        </span>
      );
    });
  };

  const renderSimpleMarkdown = (text: string, keyPrefix: string) => {
    // Split into paragraphs / lines
    const lines = text.split("\n");

    return (
      <span key={keyPrefix}>
        {lines.map((line, lIdx) => {
          const trimmed = line.trim();

          // Heading 1
          if (trimmed.startsWith("# ")) {
            return (
              <h1 key={`${keyPrefix}-h1-${lIdx}`} className="text-xl sm:text-2xl font-bold text-slate-100 mt-4 mb-2 font-display">
                {formatInlineMarkup(trimmed.slice(2))}
              </h1>
            );
          }
          // Heading 2
          if (trimmed.startsWith("## ")) {
            return (
              <h2 key={`${keyPrefix}-h2-${lIdx}`} className="text-lg sm:text-xl font-semibold text-indigo-200 mt-3 mb-1.5 font-display">
                {formatInlineMarkup(trimmed.slice(3))}
              </h2>
            );
          }
          // Heading 3
          if (trimmed.startsWith("### ")) {
            return (
              <h3 key={`${keyPrefix}-h3-${lIdx}`} className="text-base font-semibold text-slate-200 mt-2 mb-1">
                {formatInlineMarkup(trimmed.slice(4))}
              </h3>
            );
          }
          // Bullet point
          if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
            return (
              <div key={`${keyPrefix}-bullet-${lIdx}`} className="flex items-start gap-2 my-1 pl-2 text-slate-300">
                <span className="text-indigo-400 mt-1 text-sm">•</span>
                <span className="flex-1 leading-relaxed">{formatInlineMarkup(trimmed.slice(2))}</span>
              </div>
            );
          }
          // Numbered list
          if (/^\d+\.\s/.test(trimmed)) {
            const numMatch = trimmed.match(/^(\d+)\.\s(.*)$/);
            return (
              <div key={`${keyPrefix}-num-${lIdx}`} className="flex items-start gap-2 my-1 pl-2 text-slate-300">
                <span className="text-indigo-400 font-semibold font-mono text-xs mt-1">{numMatch?.[1]}.</span>
                <span className="flex-1 leading-relaxed">{formatInlineMarkup(numMatch?.[2] || "")}</span>
              </div>
            );
          }
          // Blockquote
          if (trimmed.startsWith("> ")) {
            return (
              <blockquote key={`${keyPrefix}-quote-${lIdx}`} className="border-l-4 border-indigo-500 bg-indigo-950/30 pl-3 py-1.5 my-2 text-slate-300 italic rounded-r-md">
                {formatInlineMarkup(trimmed.slice(2))}
              </blockquote>
            );
          }

          if (trimmed === "") {
            return <div key={`${keyPrefix}-blank-${lIdx}`} className="h-2" />;
          }

          return (
            <span key={`${keyPrefix}-p-${lIdx}`} className="leading-relaxed text-slate-300 inline">
              {formatInlineMarkup(line)}{" "}
            </span>
          );
        })}
      </span>
    );
  };

  const formatInlineMarkup = (raw: string) => {
    // Replace **bold**, *italic*, `code`
    const parts = raw.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/g);

    return parts.map((part, pIdx) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={`b-${pIdx}`} className="font-bold text-slate-100">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith("*") && part.endsWith("*")) {
        return (
          <em key={`i-${pIdx}`} className="italic text-slate-200">
            {part.slice(1, -1)}
          </em>
        );
      }
      if (part.startsWith("`") && part.endsWith("`")) {
        return (
          <code key={`c-${pIdx}`} className="px-1.5 py-0.5 rounded bg-slate-900 text-indigo-300 font-mono text-xs border border-slate-800">
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
  };

  return <div className={`prose prose-invert max-w-none text-sm sm:text-base ${className}`}>{renderMathWithText(content)}</div>;
};
