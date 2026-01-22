import React from 'react';
import { ChevronDown, ChevronUp, Database, FileText } from 'lucide-react';
import { Badge } from '../elements/Badge';

interface SystemPromptPanelProps {
  isOpen: boolean;
  onToggle: () => void;
  systemPrompt: string;
  dataSources: string[];
}

export const SystemPromptPanel: React.FC<SystemPromptPanelProps> = ({
  isOpen,
  onToggle,
  systemPrompt,
  dataSources,
}) => {
  return (
    <div className="bg-purple-50 border border-purple-200 rounded-xl overflow-hidden">
      {/* Toggle Header */}
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-purple-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-purple-600" />
          <span className="text-sm font-semibold text-purple-900">
            System-Prompt & Datenquellen
          </span>
        </div>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-purple-600" />
        ) : (
          <ChevronDown className="w-4 h-4 text-purple-600" />
        )}
      </button>
      
      {/* Content */}
      {isOpen && (
        <div className="px-4 pb-4 space-y-4">
          {/* System Prompt */}
          <div>
            <h3 className="text-xs font-semibold text-purple-900 mb-2 uppercase tracking-wider">
              System-Prompt
            </h3>
            <div className="bg-white rounded-lg p-3 border border-purple-200">
              <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono">
                {systemPrompt}
              </pre>
            </div>
          </div>
          
          {/* Data Sources */}
          <div>
            <h3 className="text-xs font-semibold text-purple-900 mb-2 uppercase tracking-wider flex items-center gap-2">
              <Database className="w-3 h-3" />
              Verbundene Datenquellen
            </h3>
            <div className="flex flex-wrap gap-2">
              {dataSources.map((source, index) => (
                <Badge key={index} variant="active">
                  ✓ {source}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

