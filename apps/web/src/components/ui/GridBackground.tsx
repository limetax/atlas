export const GridBackground = () => {
  return (
    <div
      className="absolute inset-0 pointer-events-none opacity-50"
      style={{
        backgroundImage: `
          linear-gradient(to right, var(--border) 1px, transparent 1px),
          linear-gradient(to bottom, var(--border) 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px',
      }}
    />
  );
};
