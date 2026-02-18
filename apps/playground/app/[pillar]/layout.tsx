import { PILLAR_META } from "@repo/ui/pillar-data";
import { PlaygroundLayout } from "@repo/ui/playground-layout";
import type { PillarName } from "@repo/ui/domain-registry";
import { isPillarName } from "@repo/ui/domain-registry";
import { notFound } from "next/navigation";

function toPillarName(slug: string): PillarName | null {
  const upper = slug.toUpperCase();
  return isPillarName(upper) ? upper : null;
}

export function generateStaticParams() {
  return Object.keys(PILLAR_META).map((p) => ({ pillar: p.toLowerCase() }));
}

export default async function PillarLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ pillar: string }>;
}) {
  const { pillar: slug } = await params;
  const pillar = toPillarName(slug);

  if (!pillar) {
    notFound();
  }

  const meta = PILLAR_META[pillar];

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `:root { --pillar-accent: ${meta.hex}; --pillar-accent-dim: ${meta.hexDim}; }`,
        }}
      />
      <PlaygroundLayout pillar={pillar} unifiedMode>
        {children}
      </PlaygroundLayout>
    </>
  );
}
