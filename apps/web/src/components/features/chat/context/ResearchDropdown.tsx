import React, { useState } from 'react';

import { BookOpen, Building2, ChevronDown, Database, Scale } from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { ResearchSource } from '@atlas/shared';

type ResearchOption = {
  id: ResearchSource;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  disabled?: boolean;
};

type ResearchDropdownProps = {
  selected: ResearchSource[];
  onChange: (sources: ResearchSource[]) => void;
};

const RESEARCH_OPTIONS: ResearchOption[] = [
  { id: 'handelsregister', label: 'Handelsregister', icon: Building2, disabled: false },
  { id: 'german_law', label: 'Deutsches Recht', icon: Scale, disabled: true },
  { id: 'law_publishers', label: 'Rechtsverlage', icon: BookOpen, disabled: false },
];

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
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            'flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm transition-colors',
            selected.length > 0
              ? 'bg-orange-50 border-orange-300 text-orange-700'
              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
          )}
        >
          <Database className="w-4 h-4" />
          <span>Recherche</span>
          {selected.length > 0 && (
            <span className="bg-orange-600 text-white text-xs px-1.5 rounded-full">
              {selected.length}
            </span>
          )}
          <ChevronDown className="w-3 h-3" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="min-w-[240px]" sideOffset={5}>
        {RESEARCH_OPTIONS.map((option) => {
          const Icon = option.icon;
          const isSelected = selected.includes(option.id);

          return (
            <DropdownMenuCheckboxItem
              key={option.id}
              checked={isSelected}
              onCheckedChange={() => handleToggle(option.id)}
              disabled={option.disabled}
            >
              <div className="flex items-center gap-3 flex-1">
                <Icon className="w-5 h-5 text-gray-700" />
                <span className="text-gray-900">{option.label}</span>
              </div>
              {option.disabled && (
                <span className="text-xs font-medium text-gray-500 ml-4 bg-gray-100 px-2 py-0.5 rounded">
                  Bald verfügbar
                </span>
              )}
            </DropdownMenuCheckboxItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
