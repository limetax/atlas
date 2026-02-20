import { useMemo, useState } from 'react';
import { Check, FileImage, FileText, Loader2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { cn, formatFileSize } from '@/lib/utils';
import { trpc } from '@/lib/trpc';
import { type Document } from '@atlas/shared';

type DocumentPickerModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (docs: Document[]) => void;
  excludedIds?: Set<string>;
};

export const DocumentPickerModal = ({
  isOpen,
  onClose,
  onSelect,
  excludedIds,
}: DocumentPickerModalProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const { data: documents = [], isLoading } = trpc.document.listDocuments.useQuery(undefined, {
    enabled: isOpen,
    staleTime: 60 * 1000,
  });

  const availableDocuments = useMemo(
    () => documents.filter((d: Document) => d.status === 'ready' && !excludedIds?.has(d.id)),
    [documents, excludedIds]
  );

  const filteredDocuments = useMemo(() => {
    if (!searchTerm.trim()) return availableDocuments;
    const term = searchTerm.toLowerCase();
    return availableDocuments.filter((d: Document) => d.name.toLowerCase().includes(term));
  }, [availableDocuments, searchTerm]);

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleAttach = () => {
    if (selectedIds.size === 0) return;
    const selectedDocs = availableDocuments.filter((d) => selectedIds.has(d.id));
    onSelect(selectedDocs);
    handleClose();
  };

  const handleClose = () => {
    setSearchTerm('');
    setSelectedIds(new Set());
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Dokument aus Bibliothek anhängen</DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Nach Name suchen…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            autoFocus
          />
        </div>

        <div className="min-h-[200px] max-h-[320px] overflow-y-auto -mx-6 px-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-[200px]">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="flex items-center justify-center h-[200px]">
              <p className="text-sm text-muted-foreground">
                {searchTerm.trim()
                  ? 'Keine Dokumente gefunden'
                  : 'Keine Dokumente in der Bibliothek'}
              </p>
            </div>
          ) : (
            <ul className="space-y-1 py-1">
              {filteredDocuments.map((doc) => {
                const isSelected = selectedIds.has(doc.id);
                const isImage = doc.mimeType.startsWith('image/');
                const FileIcon = isImage ? FileImage : FileText;

                return (
                  <li key={doc.id}>
                    <button
                      type="button"
                      onClick={() => toggleSelection(doc.id)}
                      className={cn(
                        'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors',
                        isSelected
                          ? 'bg-primary/10 text-foreground'
                          : 'hover:bg-muted text-foreground'
                      )}
                    >
                      <div
                        className={cn(
                          'flex items-center justify-center w-8 h-8 rounded-md shrink-0 transition-colors',
                          isSelected ? 'bg-primary/20' : 'bg-muted'
                        )}
                      >
                        {isSelected ? (
                          <Check className="w-4 h-4 text-primary" />
                        ) : (
                          <FileIcon className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{doc.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(doc.sizeBytes)}
                        </p>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Abbrechen
          </Button>
          <Button onClick={handleAttach} disabled={selectedIds.size === 0}>
            {selectedIds.size > 0 ? `${selectedIds.size} anhängen` : 'Anhängen'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
