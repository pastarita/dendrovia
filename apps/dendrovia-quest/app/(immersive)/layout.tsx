/**
 * Immersive Layout — viewport lock for game routes.
 * No navbar, no sidebar, overflow hidden.
 */
export default function ImmersiveLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{ position: 'fixed', inset: 0, overflow: 'hidden' }}>
      {children}
    </div>
  );
}
