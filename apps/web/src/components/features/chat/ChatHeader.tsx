import { ChevronDown, Pencil, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

type ChatHeaderProps = {
  title: string;
  onRename: () => void;
  onDelete: () => void;
};

export const ChatHeader = ({ title, onRename, onDelete }: ChatHeaderProps): React.ReactElement => {
  return (
    <div className="h-10 border-b border-border px-6 flex items-center">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="hover:bg-muted rounded-md px-2 py-1 flex items-center gap-1.5 max-w-md">
            <span className="text-sm font-medium text-foreground truncate">{title}</span>
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onClick={onRename}>
            <Pencil className="w-4 h-4" />
            Umbenennen
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onDelete} className="text-destructive">
            <Trash2 className="w-4 h-4" />
            Löschen
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
