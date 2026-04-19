import React from "react";

interface MessageBubbleProps {
  role: "user" | "assistant";
  content: string;
  created_at?: string;
}

function formatContent(text: string): React.ReactNode[] {
  if (!text) return [];
  const lines = text.split("\n");
  const nodes: React.ReactNode[] = [];

  lines.forEach((line, lineIdx) => {
    // Leerzeile → Absatz-Abstand
    if (line.trim() === "") {
      nodes.push(<br key={`br-${lineIdx}`} />);
      return;
    }

    // Überschrift ## / ###
    if (line.startsWith("### ")) {
      nodes.push(
        <div key={lineIdx} className="font-mono font-bold text-blue-400 mt-2 mb-1 uppercase text-xs tracking-wider">
          {line.replace("### ", "")}
        </div>
      );
      return;
    }
    if (line.startsWith("## ")) {
      nodes.push(
        <div key={lineIdx} className="font-mono font-bold text-blue-300 mt-3 mb-1 text-sm uppercase tracking-wider border-b border-blue-500 pb-1">
          {line.replace("## ", "")}
        </div>
      );
      return;
    }

    // Aufzählungspunkte - / •
    if (line.startsWith("- ") || line.startsWith("• ")) {
      const content = line.replace(/^[-•]\s/, "");
      nodes.push(
        <div key={lineIdx} className="flex gap-2 ml-2">
          <span className="text-blue-400 flex-shrink-0">›</span>
          <span>{renderInline(content)}</span>
        </div>
      );
      return;
    }

    // Nummerierte Liste
    const numberedMatch = line.match(/^(\d+)\.\s(.+)/);
    if (numberedMatch) {
      nodes.push(
        <div key={lineIdx} className="flex gap-2 ml-2">
          <span className="text-blue-400 flex-shrink-0 font-bold">{numberedMatch[1]}.</span>
          <span>{renderInline(numberedMatch[2])}</span>
        </div>
      );
      return;
    }

    // Trennlinie ---
    if (line.trim() === "---") {
      nodes.push(<hr key={lineIdx} className="border-blue-800 my-2" />);
      return;
    }

    // Normale Zeile mit Inline-Formatierung
    nodes.push(
      <div key={lineIdx} className="leading-relaxed">
        {renderInline(line)}
      </div>
    );
  });

  return nodes;
}

function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return <strong key={i} className="text-blue-300 font-bold">{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith("*") && part.endsWith("*")) {
          return <em key={i} className="text-gray-300 italic">{part.slice(1, -1)}</em>;
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

export default function MessageBubble({ role, content, created_at }: MessageBubbleProps) {
  const isCoach = role === "assistant";
  const time = created_at
    ? new Date(created_at).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })
    : "";

  return (
    <div className={`flex ${isCoach ? "justify-start" : "justify-end"} mb-3`}>
      {isCoach && (
        <div
          className="w-7 h-7 flex-shrink-0 border border-blue-500 flex items-center justify-center font-mono text-xs text-blue-400 mr-2 mt-1"
          aria-label="Coach"
        >
          C
        </div>
      )}
      <div
        className={`max-w-[85%] p-3 border text-sm font-mono ${
          isCoach
            ? "border-blue-700 bg-black text-gray-100"
            : "border-gray-600 bg-gray-900 text-gray-200 ml-2"
        }`}
      >
        <div className="space-y-0.5">{formatContent(content)}</div>
        {time && (
          <div className="font-mono text-xs text-gray-600 mt-2 text-right">{time}</div>
        )}
      </div>
    </div>
  );
}

export { MessageBubble };
