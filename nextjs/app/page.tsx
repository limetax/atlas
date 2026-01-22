"use client";

import React, { useState, useEffect } from "react";
import { Header } from "@/components/views/Header";
import { Sidebar } from "@/components/views/Sidebar";
import { ChatInterface } from "@/components/views/ChatInterface";
import { Message, ChatSession } from "@/types";
import { SYSTEM_PROMPT, DATA_SOURCES } from "@/lib/utils/prompts";

export default function Home() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<
    string | undefined
  >();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load sessions from localStorage on mount
  useEffect(() => {
    const savedSessions = localStorage.getItem("limetax-sessions");
    if (savedSessions) {
      const parsed = JSON.parse(savedSessions);
      setSessions(parsed);
      if (parsed.length > 0) {
        setCurrentSessionId(parsed[0].id);
        setMessages(parsed[0].messages);
      }
    }
  }, []);

  // Save sessions to localStorage whenever they change
  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem("limetax-sessions", JSON.stringify(sessions));
    }
  }, [sessions]);

  const handleNewChat = () => {
    const newSession: ChatSession = {
      id: `session-${Date.now()}`,
      title: "Neuer Chat",
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setSessions([newSession, ...sessions]);
    setCurrentSessionId(newSession.id);
    setMessages([]);
  };

  const handleSessionSelect = (sessionId: string) => {
    const session = sessions.find((s) => s.id === sessionId);
    if (session) {
      setCurrentSessionId(sessionId);
      setMessages(session.messages);
    }
  };

  const handleDeleteSession = (sessionId: string) => {
    const updatedSessions = sessions.filter((s) => s.id !== sessionId);
    setSessions(updatedSessions);

    if (currentSessionId === sessionId) {
      if (updatedSessions.length > 0) {
        setCurrentSessionId(updatedSessions[0].id);
        setMessages(updatedSessions[0].messages);
      } else {
        setCurrentSessionId(undefined);
        setMessages([]);
      }
    }
  };

  const handleSendMessage = async (content: string) => {
    // Create user message
    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: "user",
      content,
      timestamp: new Date(),
    };

    // Add user message to current session
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);

    // Update session title if it's the first message
    let updatedSessions = sessions;
    if (currentSessionId) {
      updatedSessions = sessions.map((session) => {
        if (session.id === currentSessionId) {
          return {
            ...session,
            title:
              session.messages.length === 0
                ? content.slice(0, 50)
                : session.title,
            messages: updatedMessages,
            updatedAt: new Date(),
          };
        }
        return session;
      });
      setSessions(updatedSessions);
    } else {
      // Create new session if none exists
      const newSession: ChatSession = {
        id: `session-${Date.now()}`,
        title: content.slice(0, 50),
        messages: updatedMessages,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      updatedSessions = [newSession, ...sessions];
      setSessions(updatedSessions);
      setCurrentSessionId(newSession.id);
    }

    // Call streaming API
    setIsLoading(true);

    try {
      // Prepare request
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: content,
          history: updatedMessages.slice(0, -1), // Exclude the current message
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response from API");
      }

      // Read streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error("No response body");
      }

      let assistantContent = "";
      let citations: typeof userMessage.citations = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // Decode chunk
        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = JSON.parse(line.slice(6));

            if (data.type === "text") {
              assistantContent += data.content;

              // Update message in real-time
              const streamingMessage: Message = {
                id: `msg-${Date.now()}-assistant`,
                role: "assistant",
                content: assistantContent,
                citations,
                timestamp: new Date(),
              };

              setMessages([...updatedMessages, streamingMessage]);
            } else if (data.type === "citations") {
              citations = data.citations;
            } else if (data.type === "done") {
              // Finalize message
              const finalMessage: Message = {
                id: `msg-${Date.now()}-assistant`,
                role: "assistant",
                content: assistantContent,
                citations,
                timestamp: new Date(),
              };

              const finalMessages = [...updatedMessages, finalMessage];
              setMessages(finalMessages);

              // Update session
              setSessions(
                updatedSessions.map((session) => {
                  if (session.id === currentSessionId) {
                    return {
                      ...session,
                      messages: finalMessages,
                      updatedAt: new Date(),
                    };
                  }
                  return session;
                })
              );
            } else if (data.type === "error") {
              throw new Error(data.error);
            }
          }
        }
      }
    } catch (error) {
      console.error("Error sending message:", error);

      // Show error message
      const errorMessage: Message = {
        id: `msg-${Date.now()}-error`,
        role: "assistant",
        content: `Entschuldigung, es ist ein Fehler aufgetreten: ${
          error instanceof Error ? error.message : "Unbekannter Fehler"
        }`,
        timestamp: new Date(),
      };

      const finalMessages = [...updatedMessages, errorMessage];
      setMessages(finalMessages);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        sessions={sessions}
        currentSessionId={currentSessionId}
        onSessionSelect={handleSessionSelect}
        onNewChat={handleNewChat}
        onDeleteSession={handleDeleteSession}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <ChatInterface
          messages={messages}
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
          systemPrompt={SYSTEM_PROMPT}
          dataSources={DATA_SOURCES}
        />
      </div>
    </div>
  );
}
