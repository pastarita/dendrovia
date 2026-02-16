'use client';

/**
 * BrowseSidebar — SpacePark domain navigation sidebar.
 *
 * Shows all 7 SpacePark domains sorted by general utility for the quest app.
 * Each domain expands to show which pillar playgrounds have content.
 * Collapsible with state persisted to localStorage.
 * Below domains: PillarNav links to pillar playgrounds.
 */
import { useState, useEffect, useCallback } from 'react';
import { DomainIcon, PillarIcon, DendroviaIcon } from '@repo/ui/icons';
import { ALL_DOMAINS, type DomainSlug } from '@repo/ui/domain-registry';
import { ALL_PILLARS } from '@repo/ui/pillar-nav';
const STORAGE_KEY = 'dendrovia:sidebar-collapsed';

function devUrl(port: number, path = ''): string {
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return path || '/';
  }
  return `http://localhost:${port}${path}`;
}
const EXPANDED_KEY = 'dendrovia:sidebar-expanded-domain';

/** Quest app sorts domains by general utility (not pillar-specific affinity) */
const DOMAIN_SORT_ORDER: Record<DomainSlug, number> = {
  gyms: 1,
  museums: 2,
  zoos: 3,
  halls: 4,
  generators: 5,
  foundry: 6,
  'spatial-docs': 7,
};

const SORTED_DOMAINS = [...ALL_DOMAINS].sort(
  (a, b) => DOMAIN_SORT_ORDER[a.slug] - DOMAIN_SORT_ORDER[b.slug]
);

export function BrowseSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [expandedDomain, setExpandedDomain] = useState<string | null>(null);

  // Restore collapsed state from localStorage after mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'true') setCollapsed(true);
      const storedExpanded = sessionStorage.getItem(EXPANDED_KEY);
      if (storedExpanded) setExpandedDomain(storedExpanded);
    } catch { /* SSR / private browsing */ }
  }, []);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      try { localStorage.setItem(STORAGE_KEY, String(next)); } catch {}
      return next;
    });
  }, []);

  const toggleDomain = useCallback((slug: string) => {
    setExpandedDomain((prev) => {
      const next = prev === slug ? null : slug;
      try {
        if (next) sessionStorage.setItem(EXPANDED_KEY, next);
        else sessionStorage.removeItem(EXPANDED_KEY);
      } catch {}
      return next;
    });
  }, []);

  return (
    <aside
      style={{
        position: 'fixed',
        top: '56px',
        left: 0,
        bottom: 0,
        width: collapsed ? '48px' : '220px',
        zIndex: 40,
        background: 'var(--oculus-panel-bg)',
        backdropFilter: 'var(--oculus-panel-blur)',
        borderRight: '1px solid var(--oculus-border)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width var(--oculus-transition-base)',
        overflowX: 'hidden',
        overflowY: 'auto',
      }}
    >
      {/* Collapse toggle */}
      <button
        onClick={toggleCollapsed}
        style={{
          padding: '0.5rem',
          background: 'none',
          border: 'none',
          color: 'var(--oculus-text-muted)',
          cursor: 'pointer',
          fontSize: '0.75rem',
          textAlign: collapsed ? 'center' : 'right',
          flexShrink: 0,
        }}
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? '\u25B8' : '\u25C2'}
      </button>

      {!collapsed && (
        <>
          {/* Domain section header */}
          <div
            style={{
              fontSize: '0.65rem',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              opacity: 0.35,
              padding: '0 0.75rem',
              marginBottom: '0.4rem',
              color: 'var(--oculus-text-muted)',
            }}
          >
            SpacePark Domains
          </div>

          {/* Domain list */}
          <div style={{ padding: '0 0.25rem', flex: 1 }}>
            {SORTED_DOMAINS.map((d) => {
              const isExpanded = expandedDomain === d.slug;
              return (
                <div key={d.slug}>
                  <button
                    onClick={() => toggleDomain(d.slug)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.35rem 0.5rem',
                      borderRadius: '6px',
                      fontSize: '0.82rem',
                      width: '100%',
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--oculus-text)',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <DomainIcon domain={d.slug} size={16} />
                    <span>{d.name}</span>
                    <span
                      style={{
                        marginLeft: 'auto',
                        fontSize: '0.65rem',
                        opacity: 0.4,
                      }}
                    >
                      {isExpanded ? '\u25BE' : '\u25B8'}
                    </span>
                  </button>

                  {isExpanded && (
                    <div style={{ paddingLeft: '0.5rem', marginBottom: '0.25rem' }}>
                      {ALL_PILLARS.map((p) => (
                        <a
                          key={p.name}
                          href={devUrl(p.port, d.path)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            color: 'var(--oculus-text)',
                            opacity: 0.6,
                            textDecoration: 'none',
                          }}
                        >
                          <PillarIcon pillar={p.name} size={13} />
                          <span>{p.name}</span>
                          <span
                            style={{
                              fontSize: '0.6rem',
                              opacity: 0.4,
                              marginLeft: 'auto',
                            }}
                          >
                            :{p.port}
                          </span>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Divider */}
          <div
            style={{
              borderTop: '1px solid rgba(245, 169, 127, 0.15)',
              margin: '0.5rem 0.75rem',
            }}
          />

          {/* Pillar section header */}
          <div
            style={{
              fontSize: '0.65rem',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              opacity: 0.35,
              padding: '0 0.75rem',
              marginBottom: '0.4rem',
              color: 'var(--oculus-text-muted)',
            }}
          >
            Pillars
          </div>

          {/* Pillar links */}
          <div style={{ padding: '0 0.25rem 0.75rem' }}>
            {ALL_PILLARS.map((p) => (
              <a
                key={p.name}
                href={devUrl(p.port)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.3rem 0.5rem',
                  borderRadius: '4px',
                  fontSize: '0.78rem',
                  color: 'var(--oculus-text)',
                  textDecoration: 'none',
                  opacity: 0.7,
                }}
              >
                <PillarIcon pillar={p.name} size={15} />
                <span>{p.name}</span>
                <span
                  style={{
                    fontSize: '0.6rem',
                    opacity: 0.4,
                    marginLeft: 'auto',
                  }}
                >
                  :{p.port}
                </span>
              </a>
            ))}
          </div>
        </>
      )}

      {/* Collapsed state: just icons */}
      {collapsed && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', paddingTop: '0.25rem' }}>
          {SORTED_DOMAINS.map((d) => (
            <div key={d.slug} title={d.name} style={{ cursor: 'default' }}>
              <DomainIcon domain={d.slug} size={18} />
            </div>
          ))}
        </div>
      )}
    </aside>
  );
}
