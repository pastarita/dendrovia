'use client';

/**
 * ComingSoonInput — "Analyze any repository" with SOON pill badge.
 *
 * Replaces the broken-looking disabled input. Styled container with
 * amber-bordered SOON badge matching MagnitudeBadge visual language.
 */

export function ComingSoonInput() {
  return (
    <div
      style={{
        width: '100%',
        maxWidth: '560px',
        marginBottom: '2.5rem',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '12px 16px',
          borderRadius: '10px',
          border: '1px solid rgba(245, 169, 127, 0.2)',
          background: 'rgba(20, 20, 20, 0.6)',
          backdropFilter: 'blur(8px)',
        }}
      >
        <span
          style={{
            flex: 1,
            fontSize: '0.85rem',
            fontFamily: 'var(--font-geist-sans), sans-serif',
            color: 'var(--oculus-text-muted)',
            opacity: 0.5,
          }}
        >
          Analyze any repository
        </span>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '2px 10px',
            borderRadius: '9999px',
            fontSize: '0.65rem',
            fontFamily: 'var(--font-geist-mono), monospace',
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            border: '1px solid var(--oculus-border)',
            color: 'var(--oculus-amber)',
          }}
        >
          SOON
        </span>
      </div>
      <p
        style={{
          marginTop: '0.4rem',
          fontSize: '0.7rem',
          opacity: 0.3,
          textAlign: 'center',
          fontFamily: 'var(--font-geist-sans), sans-serif',
          color: 'var(--oculus-text-muted)',
        }}
      >
        Paste a GitHub URL to grow a new world
      </p>
    </div>
  );
}
