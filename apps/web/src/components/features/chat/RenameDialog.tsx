import { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

type RenameDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  currentTitle: string;
  onRename: (newTitle: string) => void;
};

export const RenameDialog = ({
  isOpen,
  onClose,
  currentTitle,
  onRename,
}: RenameDialogProps): React.ReactElement => {
  const [title, setTitle] = useState(currentTitle);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTitle(currentTitle);
    }
  }, [isOpen, currentTitle]);

  const trimmedTitle = title.trim();
  const isSaveDisabled = trimmedTitle === '' || trimmedTitle === currentTitle;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSaveDisabled) {
      onRename(trimmedTitle);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          inputRef.current?.focus();
          inputRef.current?.select();
        }}
      >
        <DialogHeader>
          <DialogTitle>Chat umbenennen</DialogTitle>
          <DialogDescription className="sr-only">
            Geben Sie einen neuen Namen für den Chat ein.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <Input
            ref={inputRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Chat-Titel"
            className="mb-4"
          />
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>
              Abbrechen
            </Button>
            <Button type="submit" disabled={isSaveDisabled}>
              Speichern
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
