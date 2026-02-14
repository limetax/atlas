/**
 * ChatEmptyState Component
 * Minimal welcoming empty state for new chats
 */

export const ChatEmptyState = () => {
  return (
    <div className="flex-1 flex items-center justify-center px-4">
      <div className="text-center max-w-2xl">
        <h1 className="text-4xl font-bold text-foreground mb-4">Willkommen bei limetaxIQ</h1>
        <p className="text-lg text-muted-foreground">
          Ihr KI-Assistent für steuerrechtliche Fragen und Kanzleiunterstützung
        </p>
      </div>
    </div>
  );
};
