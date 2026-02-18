import { DomainSubNav } from "@repo/ui/domain-sub-nav";
import type { PillarName } from "@repo/ui/domain-registry";
import { isDomainSlug, isPillarName } from "@repo/ui/domain-registry";
import { notFound } from "next/navigation";

export default async function DomainLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ pillar: string; domain: string }>;
}) {
  const { pillar: pillarSlug, domain } = await params;
  const pillarMaybe = pillarSlug.toUpperCase();
  if (!isPillarName(pillarMaybe) || !isDomainSlug(domain)) {
    notFound();
  }
  const pillar: PillarName = pillarMaybe;

  return (
    <div style={{ contain: "layout" }}>
      <DomainSubNav domain={domain} pillar={pillar} />
      {children}
    </div>
  );
}
