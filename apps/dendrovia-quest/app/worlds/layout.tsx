/**
 * Worlds Section Layout
 *
 * Minimal pass-through — individual routes handle their own viewport needs.
 * The /worlds index page uses a scrollable content layout, while
 * /worlds/[...slug] uses a full-viewport 3D layout.
 */

export default function WorldsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
