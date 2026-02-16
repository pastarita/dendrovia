import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Quest Iteration 1 — Thin Shell Demo',
  description: 'Archived experimental iteration: narrative landing + toy dendrite scene',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: '#0a0a0a', color: '#ededed' }}>
        {children}
      </body>
    </html>
  );
}
