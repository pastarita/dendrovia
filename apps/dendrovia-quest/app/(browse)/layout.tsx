/**
 * Browse Layout — Shared shell for browsable (non-game) pages.
 *
 * Provides: shader-bg + particles background, top nav bar,
 * collapsible domain sidebar, and scrollable main content area.
 */
import { BrowseNav } from './BrowseNav';
import { BrowseSidebar } from './BrowseSidebar';
import { LandingBackground } from '../components/LandingBackground';

export default function BrowseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* Ambient backgrounds */}
      <div className="shader-bg" />
      <LandingBackground />

      {/* Top navigation bar */}
      <BrowseNav />

      {/* Sidebar + main content */}
      <BrowseSidebar />
      <main
        style={{
          position: 'relative',
          zIndex: 1,
          minHeight: '100vh',
          paddingTop: '72px',
          paddingLeft: '220px',
          paddingRight: '1.5rem',
          paddingBottom: '2rem',
        }}
      >
        {children}
      </main>
    </>
  );
}
