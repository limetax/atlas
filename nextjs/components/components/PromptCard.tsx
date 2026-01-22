import React from 'react';

interface PromptCardProps {
  icon: string;
  title: string;
  description: string;
  onClick: () => void;
}

export const PromptCard: React.FC<PromptCardProps> = ({
  icon,
  title,
  description,
  onClick,
}) => {
  return (
    <button
      onClick={onClick}
      className="w-full text-left p-4 bg-white border border-gray-200 rounded-xl hover:border-orange-400 hover:shadow-md transition-all duration-200 hover:transform hover:-translate-y-0.5 group"
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl flex-shrink-0">{icon}</span>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 text-sm mb-1 group-hover:text-orange-600 transition-colors">
            {title}
          </h3>
          <p className="text-xs text-gray-500 line-clamp-2">{description}</p>
        </div>
      </div>
    </button>
  );
};

