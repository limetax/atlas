import { Toaster as Sonner, type ToasterProps } from 'sonner';
import { cn } from '@/lib/utils';

const Toaster = (props: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      toastOptions={{
        unstyled: true,
        classNames: {
          toast: cn(
            'group toast',
            'w-full rounded-lg',
            'py-3 px-4',
            'flex gap-3 items-start',
            'font-normal text-sm',
            'group-[.toaster]:bg-[var(--popover)]',
            'group-[.toaster]:text-[var(--popover-foreground)]',
            'group-[.toaster]:border group-[.toaster]:border-[var(--border)]',
            'group-[.toaster]:shadow-lg'
          ),
          icon: 'mt-0.5 shrink-0',
          title: '!font-medium',
          description: 'text-xs opacity-90',
          success: cn(
            'group-[.toaster]:!bg-[var(--popover)]',
            'group-[.toaster]:!text-[var(--popover-foreground)]',
            'group-[.toaster]:!border-[var(--color-success)]'
          ),
          error: cn(
            'group-[.toaster]:!bg-[var(--color-error-bg)]',
            'group-[.toaster]:!text-[var(--color-error-text)]',
            'group-[.toaster]:!border-[var(--color-error)]'
          ),
          warning: cn(
            'group-[.toaster]:!bg-[var(--color-warning-bg)]',
            'group-[.toaster]:!text-[var(--color-warning-text)]',
            'group-[.toaster]:!border-[var(--color-warning)]'
          ),
          info: cn(
            'group-[.toaster]:!bg-[var(--popover)]',
            'group-[.toaster]:!text-[var(--popover-foreground)]',
            'group-[.toaster]:!border-[var(--color-info)]'
          ),
          closeButton: cn(
            'absolute right-2 top-2',
            'rounded-md p-1',
            'text-[var(--muted-foreground)]',
            'opacity-0 transition-opacity',
            'group-hover:opacity-100',
            'hover:bg-[var(--accent)]'
          ),
        },
        closeButton: true,
        duration: 4000,
      }}
      {...props}
    />
  );
};

export { Toaster };
