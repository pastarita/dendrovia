'use client';

/**
 * BrowseNav — Thin persistent top navigation bar.
 *
 * Fixed 56px height, OCULUS glass-morphism styling.
 * Left: DendroviaIcon + "DENDROVIA" branding
 * Center: Worlds / Gyms / Hub nav links with active amber pill
 * Right: reserved for future (world count, user menu)
 */
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { DendroviaIcon } from '@repo/ui/icons';

const NAV_LINKS = [
  { label: 'Worlds', href: '/' },
  { label: 'Gyms', href: '/gyms' },
  { label: 'Hub', href: '/hub' },
] as const;

export function BrowseNav() {
  const pathname = usePathname();

  function isActive(href: string): boolean {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  }

  return (
    <nav
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '56px',
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        padding: '0 1.25rem',
        background: 'var(--oculus-panel-bg)',
        backdropFilter: 'var(--oculus-panel-blur)',
        borderBottom: '1px solid var(--oculus-border)',
      }}
    >
      {/* Left: Brand */}
      <Link
        href="/"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          textDecoration: 'none',
          color: 'var(--oculus-text)',
        }}
      >
        <DendroviaIcon size={24} />
        <span
          style={{
            fontFamily: 'var(--font-geist-mono), monospace',
            fontSize: '0.85rem',
            fontWeight: 600,
            letterSpacing: '0.12em',
          }}
        >
          DENDROVIA
        </span>
      </Link>

      {/* Center: Nav links */}
      <div
        style={{
          display: 'flex',
          gap: '4px',
          marginLeft: '2rem',
        }}
      >
        {NAV_LINKS.map((link) => {
          const active = isActive(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              style={{
                padding: '6px 14px',
                borderRadius: '9999px',
                fontSize: '0.8rem',
                fontFamily: 'var(--font-geist-sans), sans-serif',
                fontWeight: active ? 600 : 400,
                color: active ? 'var(--oculus-bg-solid)' : 'var(--oculus-text)',
                background: active ? 'var(--oculus-amber)' : 'transparent',
                textDecoration: 'none',
                transition: 'background var(--oculus-transition-fast), color var(--oculus-transition-fast)',
                letterSpacing: '0.02em',
              }}
            >
              {link.label}
            </Link>
          );
        })}
      </div>

      {/* Right: reserved */}
      <div style={{ marginLeft: 'auto' }} />
    </nav>
  );
}
