import { ArrowLeft, Building2, FileText, Mail, MessageSquare, Phone } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useClientDetail } from '@/hooks/useClientDetail';
import type { DatevClient } from '@atlas/shared';
import { Link, useNavigate, useParams } from '@tanstack/react-router';

export const ClientDetailPage = () => {
  const { clientId } = useParams({ from: '/_authenticated/mandanten/$clientId' });
  const navigate = useNavigate();
  const { client, isLoading, isError } = useClientDetail(clientId);

  if (isLoading) return <DetailSkeleton />;

  if (isError || !client) {
    return (
      <main className="flex flex-1 items-center justify-center bg-background">
        <div className="text-center">
          <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-3" strokeWidth={1.5} />
          <p className="text-muted-foreground mb-4">Mandant nicht gefunden</p>
          <Link to="/mandanten" className="text-primary hover:underline text-sm">
            Zurück zur Übersicht
          </Link>
        </div>
      </main>
    );
  }

  const handleOpenChat = () => {
    navigate({ to: '/chat', search: { mandantId: client.client_id } });
  };

  return (
    <main className="flex-1 overflow-y-auto bg-background">
      <div className="px-8 pt-8 pb-8">
        <div className="max-w-4xl mx-auto">
          <Link
            to="/mandanten"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Mandanten
          </Link>

          <ClientHeader client={client} onOpenChat={handleOpenChat} />
          <StammdatenSection client={client} />
          <DocumentsPlaceholder />
        </div>
      </div>
    </main>
  );
};

// Subcomponents

type ClientHeaderProps = {
  client: DatevClient;
  onOpenChat: () => void;
};

const ClientHeader = ({ client, onOpenChat }: ClientHeaderProps) => (
  <div className="flex items-start justify-between mb-8">
    <div>
      <div className="flex items-center gap-3 mb-2">
        <h1 className="text-2xl font-bold text-foreground">{client.client_name}</h1>
        {client.company_form && <Badge variant="neutral">{client.company_form}</Badge>}
        <Badge variant={client.client_status === '1' ? 'success' : 'destructive'}>
          {client.client_status === '1' ? 'Aktiv' : 'Inaktiv'}
        </Badge>
      </div>
      <p className="text-sm text-muted-foreground">Mandantennummer {client.client_number}</p>
    </div>

    <button
      onClick={onOpenChat}
      className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors shrink-0"
    >
      <MessageSquare className="w-4 h-4" />
      Chat öffnen
    </button>
  </div>
);

type StammdatenSectionProps = {
  client: DatevClient;
};

const StammdatenSection = ({ client }: StammdatenSectionProps) => (
  <div className="rounded-xl border border-border bg-card p-6 mb-6">
    <h2 className="text-lg font-semibold text-foreground mb-6">Stammdaten</h2>

    <div className="space-y-8">
      <FieldGroup title="Unternehmensdaten">
        <DataField label="Name" value={client.client_name} />
        <DataField label="Abweichender Name" value={client.differing_name} />
        <DataField label="Rechtsform" value={client.company_form} />
        <DataField label="Branche" value={client.industry_description} />
        <DataField label="Mandantennummer" value={client.client_number} />
      </FieldGroup>

      <FieldGroup title="Kontaktdaten">
        <DataField
          label="E-Mail"
          value={client.main_email}
          icon={<Mail className="w-3.5 h-3.5" />}
        />
        <DataField
          label="Telefon"
          value={client.main_phone}
          icon={<Phone className="w-3.5 h-3.5" />}
        />
        <DataField label="Fax" value={client.main_fax} />
      </FieldGroup>

      <FieldGroup title="Adresse">
        <DataField label="Straße" value={client.correspondence_street} />
        <DataField label="PLZ" value={client.correspondence_zip_code} />
        <DataField label="Ort" value={client.correspondence_city} />
      </FieldGroup>

      <FieldGroup title="Steuerdaten">
        <DataField label="USt-IdNr." value={client.tax_number_vat} />
        <DataField label="Identifikationsnummer" value={client.identification_number} />
      </FieldGroup>

      {(client.managing_director_name ?? client.managing_director_email) && (
        <FieldGroup title="Geschäftsführung">
          <DataField label="Name" value={client.managing_director_name} />
          <DataField label="Titel" value={client.managing_director_title} />
          <DataField
            label="E-Mail"
            value={client.managing_director_email}
            icon={<Mail className="w-3.5 h-3.5" />}
          />
          <DataField
            label="Telefon"
            value={client.managing_director_phone}
            icon={<Phone className="w-3.5 h-3.5" />}
          />
        </FieldGroup>
      )}
    </div>
  </div>
);

const DocumentsPlaceholder = () => (
  <div className="rounded-xl border border-border bg-card p-6">
    <h2 className="text-lg font-semibold text-foreground mb-4">Dokumente</h2>
    <div className="text-center py-12">
      <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" strokeWidth={1.5} />
      <p className="text-sm text-muted-foreground">Dokumentenverwaltung wird bald verfügbar sein</p>
    </div>
  </div>
);

type FieldGroupProps = {
  title: string;
  children: React.ReactNode;
};

const FieldGroup = ({ title, children }: FieldGroupProps) => (
  <div>
    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
      {title}
    </h3>
    <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">{children}</dl>
  </div>
);

type DataFieldProps = {
  label: string;
  value: string | number | null | undefined;
  icon?: React.ReactNode;
};

const DataField = ({ label, value, icon }: DataFieldProps) => (
  <div>
    <dt className="text-xs font-medium text-muted-foreground mb-1">{label}</dt>
    <dd className="text-sm text-foreground flex items-center gap-1.5">
      {icon && value && <span className="text-muted-foreground">{icon}</span>}
      {value ?? <span className="text-muted-foreground">—</span>}
    </dd>
  </div>
);

const DetailSkeleton = () => (
  <main className="flex-1 overflow-y-auto bg-background">
    <div className="px-8 pt-8 pb-8">
      <div className="max-w-4xl mx-auto">
        <Skeleton className="h-4 w-24 mb-6" />
        <div className="flex items-start justify-between mb-8">
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-40" />
          </div>
          <Skeleton className="h-10 w-36 rounded-lg" />
        </div>
        <div className="rounded-xl border border-border bg-card p-6">
          <Skeleton className="h-6 w-32 mb-6" />
          <div className="grid grid-cols-3 gap-6">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i}>
                <Skeleton className="h-3 w-20 mb-2" />
                <Skeleton className="h-4 w-32" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </main>
);
