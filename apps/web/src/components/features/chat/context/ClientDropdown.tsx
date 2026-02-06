import React, { useState } from 'react';

import { ChevronDown, Search, Users } from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { trpc } from '@/lib/trpc';
import { cn } from '@/lib/utils';

type ClientDropdownProps = {
  selected?: string;
  onChange: (clientId: string | undefined) => void;
};

export const ClientDropdown = ({ selected, onChange }: ClientDropdownProps): React.ReactElement => {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  const {
    data: clients,
    isLoading,
    error,
  } = trpc.datev.listClients.useQuery(undefined, {
    staleTime: 5 * 60 * 1000,
  });

  // Auto-focus search input when dropdown opens and reset search when closed (with delay)
  React.useEffect(() => {
    if (open && searchInputRef.current) {
      // Focus immediately when opening
      setTimeout(() => searchInputRef.current?.focus(), 0);
    } else if (!open && searchTerm) {
      // Delay search term reset until after dropdown close animation
      const timer = setTimeout(() => setSearchTerm(''), 150);
      return () => clearTimeout(timer);
    }
  }, [open, searchTerm]);

  const selectedClient = clients?.find((c) => c.clientId === selected);

  const filteredClients = (clients ?? []).filter(
    (c) =>
      c.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.clientNumber.toString().includes(searchTerm)
  );

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          disabled={isLoading}
          className={cn(
            'flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm',
            'w-[160px] transition-colors duration-200',
            isLoading && 'opacity-50 cursor-wait',
            error && 'opacity-50 cursor-not-allowed',
            selected
              ? 'bg-orange-50 border-orange-300 text-orange-700'
              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
          )}
        >
          <Users className="w-4 h-4 flex-shrink-0" />
          <span className="truncate flex-1 text-left">
            {isLoading ? 'Lädt...' : error ? 'Fehler' : (selectedClient?.clientName ?? 'Mandant')}
          </span>
          <ChevronDown
            className={cn(
              'w-3 h-3 flex-shrink-0 transition-transform duration-200',
              open && 'rotate-180'
            )}
          />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="min-w-[300px] p-2" sideOffset={5}>
        {/* Search input */}
        <div className="px-2 py-1.5 mb-1">
          <div className="relative">
            <Search
              className={cn(
                'absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4',
                'text-gray-400 pointer-events-none'
              )}
            />
            <Input
              ref={searchInputRef}
              type="text"
              placeholder="Mandant suchen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-sm h-8"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
              onBlur={(e) => {
                // Refocus if blur was caused by hovering menu items
                if (open && e.relatedTarget?.getAttribute('role') === 'menuitem') {
                  setTimeout(() => searchInputRef.current?.focus(), 0);
                }
              }}
              autoFocus
            />
          </div>
        </div>

        <DropdownMenuSeparator />

        {/* Clear selection */}
        {selected && (
          <>
            <DropdownMenuItem
              onSelect={() => onChange(undefined)}
              onMouseDown={(e) => e.preventDefault()}
              className="transition-colors duration-150 cursor-pointer"
            >
              <span className="text-sm text-gray-600">Kein Mandant</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}

        {/* Clients list */}
        <div className="max-h-[300px] overflow-y-auto">
          {isLoading && (
            <div className="px-3 py-2 text-sm text-gray-500 text-center">Lade Mandanten...</div>
          )}
          {error && (
            <div className="px-3 py-2 text-sm text-red-600 text-center">
              Fehler beim Laden der Mandanten
            </div>
          )}
          {!isLoading && !error && filteredClients.length === 0 && (
            <div className="px-3 py-2 text-sm text-gray-500 text-center">
              Keine Mandanten gefunden
            </div>
          )}
          {!isLoading &&
            !error &&
            filteredClients.map((client) => (
              <DropdownMenuItem
                key={client.clientId}
                onSelect={() => onChange(client.clientId)}
                onMouseDown={(e) => e.preventDefault()}
                className={cn(
                  'transition-colors duration-150 cursor-pointer',
                  selected === client.clientId && 'bg-orange-50'
                )}
              >
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{client.clientName}</span>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>Nr. {client.clientNumber}</span>
                    {client.companyForm && <span>• {client.companyForm}</span>}
                  </div>
                </div>
              </DropdownMenuItem>
            ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
