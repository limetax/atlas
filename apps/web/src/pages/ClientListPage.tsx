import { useState, useMemo } from 'react';

import { Building2, Mail, MapPin, Search } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { trpc } from '@/lib/trpc';
import { useNavigate } from '@tanstack/react-router';

export const ClientListPage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const { data: clients, isLoading } = trpc.datev.listClients.useQuery(undefined, {
    staleTime: 5 * 60 * 1000,
  });

  const filteredClients = useMemo(() => {
    if (!clients) return [];
    if (!searchTerm.trim()) return clients;

    const term = searchTerm.toLowerCase();
    return clients.filter(
      (c) => c.clientName.toLowerCase().includes(term) || String(c.clientNumber).includes(term)
    );
  }, [clients, searchTerm]);

  const handleClientClick = (clientId: string) => {
    navigate({ to: '/mandanten/$clientId', params: { clientId } });
  };

  return (
    <main className="flex-1 overflow-y-auto bg-background">
      <div className="px-8 pt-10 pb-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Mandanten</h1>
            <p className="text-muted-foreground">Übersicht aller aktiven Mandanten Ihrer Kanzlei</p>
          </div>

          <div className="relative mb-6 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Nach Name oder Nummer suchen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {isLoading ? (
            <ClientListSkeleton />
          ) : filteredClients.length === 0 ? (
            <EmptyState hasSearch={searchTerm.trim().length > 0} />
          ) : (
            <div className="space-y-2">
              {filteredClients.map((client) => (
                <ClientRow
                  key={client.clientId}
                  client={client}
                  onClick={() => handleClientClick(client.clientId)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
};

// Subcomponents

type ClientRowProps = {
  client: {
    clientId: string;
    clientNumber: number;
    clientName: string;
    companyForm: string | null;
    mainEmail: string | null;
    correspondenceCity: string | null;
  };
  onClick: () => void;
};

const ClientRow = ({ client, onClick }: ClientRowProps) => (
  <button
    onClick={onClick}
    className="w-full text-left flex items-center gap-4 p-4 rounded-lg border border-border bg-card hover:bg-muted transition-colors group"
  >
    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-muted">
      <Building2 className="w-5 h-5 text-muted-foreground" />
    </div>

    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">
          {client.clientName}
        </span>
        {client.companyForm && (
          <Badge variant="neutral" className="text-[11px] shrink-0">
            {client.companyForm}
          </Badge>
        )}
      </div>
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span>Nr. {client.clientNumber}</span>
        {client.correspondenceCity && (
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {client.correspondenceCity}
          </span>
        )}
        {client.mainEmail && (
          <span className="flex items-center gap-1 truncate">
            <Mail className="w-3 h-3" />
            {client.mainEmail}
          </span>
        )}
      </div>
    </div>
  </button>
);

const ClientListSkeleton = () => (
  <div className="space-y-2">
    {Array.from({ length: 6 }).map((_, i) => (
      <div key={i} className="flex items-center gap-4 p-4 rounded-lg border border-border bg-card">
        <Skeleton className="w-10 h-10 rounded-lg" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-3 w-32" />
        </div>
      </div>
    ))}
  </div>
);

type EmptyStateProps = {
  hasSearch: boolean;
};

const EmptyState = ({ hasSearch }: EmptyStateProps) => (
  <div className="text-center py-16">
    <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-3" strokeWidth={1.5} />
    <p className="text-muted-foreground">
      {hasSearch ? 'Keine Mandanten gefunden' : 'Noch keine Mandanten vorhanden'}
    </p>
  </div>
);
