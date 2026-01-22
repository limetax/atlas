import React from "react";
import Image from "next/image";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Message } from "@/types";
import { Avatar } from "../elements/Avatar";
import { Badge } from "../elements/Badge";
import { User, ExternalLink } from "lucide-react";

interface ChatMessageProps {
  message: Message;
}

// Helper function to generate law book URLs
function getLawBookUrl(citation: string): string | null {
  // Extract paragraph number and law type
  const aoMatch = citation.match(/§\s*(\d+[a-z]?)\s*AO/i);
  const ustgMatch = citation.match(/§\s*(\d+[a-z]?)\s*UStG/i);
  const estgMatch = citation.match(/§\s*(\d+[a-z]?)\s*EStG/i);

  if (aoMatch) {
    const paragraph = aoMatch[1].toLowerCase();
    return `https://www.gesetze-im-internet.de/ao_1977/__${paragraph}.html`;
  } else if (ustgMatch) {
    const paragraph = ustgMatch[1].toLowerCase();
    return `https://www.gesetze-im-internet.de/ustg_1980/__${paragraph}.html`;
  } else if (estgMatch) {
    const paragraph = estgMatch[1].toLowerCase();
    return `https://www.gesetze-im-internet.de/estg/__${paragraph}.html`;
  }

  return null;
}

// Helper function to make citations clickable in text
function enrichContentWithLinks(
  content: string,
  citations: Message["citations"]
): string {
  if (!citations || citations.length === 0) return content;

  let enrichedContent = content;

  citations.forEach((citation) => {
    const url = getLawBookUrl(citation.source);
    if (url) {
      // Replace citation references in text with markdown links
      const regex = new RegExp(
        `(${citation.source.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
        "g"
      );
      enrichedContent = enrichedContent.replace(
        regex,
        `[$1](${url} "${citation.title}")`
      );
    }
  });

  return enrichedContent;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === "user";
  const enrichedContent = enrichContentWithLinks(
    message.content,
    message.citations
  );

  return (
    <div className={`flex gap-4 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="flex-shrink-0">
          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-md p-1.5">
            <Image
              src="/icon.png"
              alt="limetax logo"
              width={40}
              height={40}
              className="w-full h-full object-contain"
            />
          </div>
        </div>
      )}

      <div
        className={`flex flex-col gap-2 max-w-[75%] ${
          isUser ? "items-end" : "items-start"
        }`}
      >
        <div
          className={`px-4 py-3 rounded-2xl ${
            isUser
              ? "bg-blue-200 text-gray-900 rounded-tr-sm shadow-md"
              : "bg-gray-50 border border-gray-200 rounded-tl-sm shadow-sm"
          }`}
        >
          <div
            className={`text-sm leading-relaxed prose prose-sm max-w-none ${
              isUser ? "prose-invert" : ""
            }`}
          >
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                a: ({ node, href, children, ...props }) => (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-lime-600 hover:text-lime-700 underline font-medium"
                    {...props}
                  >
                    {children}
                    <ExternalLink className="w-3 h-3 inline" />
                  </a>
                ),
              }}
            >
              {enrichedContent}
            </ReactMarkdown>
          </div>
        </div>

        {message.citations && message.citations.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <span className="text-xs text-gray-500 font-medium">Quellen:</span>
            {message.citations.map((citation) => {
              const url = getLawBookUrl(citation.source);
              return url ? (
                <a
                  key={citation.id}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1"
                >
                  <Badge
                    variant="info"
                    className="cursor-pointer hover:bg-blue-200 transition-colors"
                  >
                    📚 {citation.source}
                    <ExternalLink className="w-3 h-3" />
                  </Badge>
                </a>
              ) : (
                <Badge key={citation.id} variant="info">
                  📚 {citation.source}
                </Badge>
              );
            })}
          </div>
        )}

        <span className="text-xs text-gray-400">
          {new Date(message.timestamp).toLocaleTimeString("de-DE", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>

      {isUser && (
        <div className="flex-shrink-0">
          <div className="w-10 h-10 rounded-full bg-purple-400 flex items-center justify-center shadow-md">
            <User className="w-5 h-5 text-white" />
          </div>
        </div>
      )}
    </div>
  );
};
