import React, { useState, useRef, useEffect } from 'react';
import TextareaAutosize from 'react-textarea-autosize';
import { Message } from '@lime-gpt/shared';
import { ChatMessage } from '../components/components/ChatMessage';
import { Button } from '../components/elements/Button';
import { Send, Loader2 } from 'lucide-react';

interface ChatInterfaceProps {
  messages: Message[];
  onSendMessage: (message: string) => void;
  isLoading?: boolean;
  systemPrompt?: string;
  dataSources?: string[];
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  onSendMessage,
  isLoading = false,
}) => {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !isLoading) {
      onSendMessage(inputValue.trim());
      setInputValue('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Enter (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (inputValue.trim() && !isLoading) {
        onSendMessage(inputValue.trim());
        setInputValue('');
      }
    }
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-gray-50 to-white overflow-hidden">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 min-h-0">
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}

          {isLoading && (
            <div className="flex gap-4 justify-start">
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-md">
                <Loader2 className="w-6 h-6 text-orange-500 animate-spin" />
              </div>
              <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl rounded-tl-sm">
                <p className="text-sm text-gray-500">Denke nach...</p>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="flex-shrink-0 bg-white border-t border-gray-200 p-4">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
          <div className="flex gap-3 items-end">
            <div className="flex-1 relative">
              <TextareaAutosize
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Stellen Sie Ihre steuerrechtliche Frage..."
                disabled={isLoading}
                minRows={1}
                maxRows={8}
                className="w-full px-4 py-3 text-sm bg-white border border-gray-300 rounded-xl outline-none transition-all duration-150 resize-none focus:border-orange-400 focus:ring-4 focus:ring-orange-400/10 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  lineHeight: '1.5',
                }}
              />
              <div className="absolute bottom-2 right-2 text-xs text-gray-400 pointer-events-none">
                {inputValue.length > 0 && (
                  <span className="bg-white px-1 rounded">Shift+Enter für neue Zeile</span>
                )}
              </div>
            </div>
            <Button
              type="submit"
              variant="accent"
              disabled={!inputValue.trim() || isLoading}
              className="!px-4 !py-3 !rounded-xl"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </div>
          <p className="text-xs text-gray-400 mt-2 text-center">
            limetaxIQ kann Fehler machen. Überprüfen Sie wichtige Informationen.
          </p>
        </form>
      </div>
    </div>
  );
};
