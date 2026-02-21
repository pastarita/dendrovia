import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ornithicus — Spatial Codebase Editor",
  description:
    "Navigate codebases spatially. Ornithicus transforms Git repositories into explorable 3D worlds.",
  openGraph: {
    title: "Ornithicus — Spatial Codebase Editor",
    description:
      "Navigate codebases spatially. Ornithicus transforms Git repositories into explorable 3D worlds.",
    type: "website",
    siteName: "Ornithicus",
  },
  twitter: {
    card: "summary_large_image",
    title: "Ornithicus — Spatial Codebase Editor",
    description:
      "Navigate codebases spatially. Ornithicus transforms Git repositories into explorable 3D worlds.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
