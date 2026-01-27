import React, { useState } from 'react';
import { ResearchSource } from '@atlas/shared';
import { Database, Building2, Scale, BookOpen, ChevronDown } from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';

interface ResearchOption {
  id: ResearchSource;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  disabled?: boolean;
}

interface ResearchDropdownProps {
  selected: ResearchSource[];
  onChange: (sources: ResearchSource[]) => void;
}

const RESEARCH_OPTIONS: ResearchOption[] = [
  { id: 'handelsregister', label: 'Handelsregister', icon: Building2, disabled: false },
  { id: 'german_law', label: 'Deutsches Recht', icon: Scale, disabled: true },
  { id: 'law_publishers', label: 'Rechtsverlage', icon: BookOpen, disabled: true },
];

const cn = (...classes: (string | boolean | undefined)[]) => {
  return classes.filter(Boolean).join(' ');
};

export const ResearchDropdown: React.FC<ResearchDropdownProps> = ({ selected, onChange }) => {
  const [open, setOpen] = useState(false);

  const handleToggle = (sourceId: ResearchSource) => {
    const isSelected = selected.includes(sourceId);
    const newSelected = isSelected
      ? selected.filter((s) => s !== sourceId)
      : [...selected, sourceId];
    onChange(newSelected);
  };

  return (
    <DropdownMenu.Root open={open} onOpenChange={setOpen}>
      <DropdownMenu.Trigger asChild>
        <button
          className={cn(
            'flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm transition-colors',
            selected.length > 0
              ? 'bg-orange-50 border-orange-300 text-orange-700'
              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
          )}
        >
          <Database className="w-4 h-4" />
          <span>Research</span>
          {selected.length > 0 && (
            <span className="bg-orange-600 text-white text-xs px-1.5 rounded-full">
              {selected.length}
            </span>
          )}
          <ChevronDown className="w-3 h-3" />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="bg-white rounded-lg shadow-lg border border-gray-200 p-1 min-w-[200px] z-50"
          sideOffset={5}
        >
          {RESEARCH_OPTIONS.map((option) => {
            const Icon = option.icon;
            const isSelected = selected.includes(option.id);

            return (
              <DropdownMenu.CheckboxItem
                key={option.id}
                checked={isSelected}
                onCheckedChange={() => handleToggle(option.id)}
                disabled={option.disabled}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded outline-none',
                  'data-[highlighted]:bg-gray-100',
                  option.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                )}
              >
                <DropdownMenu.ItemIndicator className="w-4 h-4">
                  <div className="w-4 h-4 border-2 border-orange-600 rounded bg-orange-600 flex items-center justify-center">
                    <svg
                      className="w-3 h-3 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                </DropdownMenu.ItemIndicator>
                {!isSelected && <div className="w-4 h-4 border-2 border-gray-300 rounded" />}
                <Icon className="w-4 h-4" />
                <span className="flex-1">{option.label}</span>
                {option.disabled && <span className="text-xs text-gray-400">Bald verfügbar</span>}
              </DropdownMenu.CheckboxItem>
            );
          })}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
};
