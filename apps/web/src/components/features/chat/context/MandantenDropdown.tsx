import React, { useState } from 'react';
import { Users, ChevronDown, Search } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface MandantenDropdownProps {
  selected?: string;
  onChange: (mandantId: string | undefined) => void;
}

interface Mandant {
  id: string;
  name: string;
  number: string;
}

// Mock data - later replace with DATEV integration
const MOCK_MANDANTEN: Mandant[] = [
  { id: '1', name: 'Mustermann GmbH', number: '12345' },
  { id: '2', name: 'Beispiel AG', number: '67890' },
  { id: '3', name: 'Test Einzelunternehmen', number: '11111' },
];

export const MandantenDropdown: React.FC<MandantenDropdownProps> = ({ selected, onChange }) => {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const selectedMandant = MOCK_MANDANTEN.find((m) => m.id === selected);

  const filteredMandanten = MOCK_MANDANTEN.filter(
    (m) => m.name.toLowerCase().includes(searchTerm.toLowerCase()) || m.number.includes(searchTerm)
  );

  // Disabled until DATEV integration is complete
  const isDisabled = true;

  return (
    <DropdownMenu open={!isDisabled && open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          disabled={isDisabled}
          className={cn(
            'flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm transition-colors',
            isDisabled && 'opacity-50 cursor-not-allowed',
            selected
              ? 'bg-orange-50 border-orange-300 text-orange-700'
              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
          )}
        >
          <Users className="w-4 h-4" />
          <span>{selectedMandant?.name ?? 'Mandant'}</span>
          <ChevronDown className="w-3 h-3" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="min-w-[250px] p-2" sideOffset={5}>
        {/* Search input */}
        <div className="px-2 py-1.5 mb-1">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Mandant suchen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-sm h-8"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>

        <DropdownMenuSeparator />

        {/* Clear selection */}
        {selected && (
          <>
            <DropdownMenuItem onSelect={() => onChange(undefined)}>
              <span className="text-sm text-gray-600">Kein Mandant</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}

        {/* Mandanten list */}
        <div className="max-h-[200px] overflow-y-auto">
          {filteredMandanten.map((mandant) => (
            <DropdownMenuItem
              key={mandant.id}
              onSelect={() => onChange(mandant.id)}
              className={cn(selected === mandant.id && 'bg-orange-50')}
            >
              <div className="flex flex-col">
                <span className="text-sm font-medium">{mandant.name}</span>
                <span className="text-xs text-gray-500">Nr. {mandant.number}</span>
              </div>
            </DropdownMenuItem>
          ))}
          {filteredMandanten.length === 0 && (
            <div className="px-3 py-2 text-sm text-gray-500 text-center">
              Keine Mandanten gefunden
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
