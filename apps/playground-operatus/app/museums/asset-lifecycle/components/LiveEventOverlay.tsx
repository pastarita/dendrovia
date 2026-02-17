'use client';

export function LiveEventOverlay({ toasts }: { toasts: Array<{ id: number; event: string }> }) {
  if (toasts.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: '1rem',
        right: '1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        zIndex: 50,
      }}
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          style={{
            padding: '0.4rem 0.75rem',
            background: '#1a1a1a',
            border: '1px solid #333',
            borderRadius: '4px',
            fontSize: '0.75rem',
            fontFamily: 'var(--font-geist-mono)',
            color: '#93c5fd',
            animation: 'fadeInOut 2s ease-in-out',
          }}
        >
          {toast.event}
        </div>
      ))}
      <style>{`
        @keyframes fadeInOut {
          0% { opacity: 0; transform: translateX(20px); }
          15% { opacity: 1; transform: translateX(0); }
          85% { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
