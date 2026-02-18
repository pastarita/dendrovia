import { notFound, redirect } from "next/navigation";
import { getDefaultSubPage, isDomainSlug, isPillarName } from "@repo/ui/domain-registry";
import type { PillarName } from "@repo/ui/domain-registry";
import Link from "next/link";

export default async function DomainIndexPage({
  params,
}: {
  params: Promise<{ pillar: string; domain: string }>;
}) {
  const { pillar: pillarSlug, domain } = await params;
  const pillarMaybe = pillarSlug.toUpperCase();
  if (!isPillarName(pillarMaybe) || !isDomainSlug(domain)) {
    notFound();
  }
  const pillar: PillarName = pillarMaybe;

  // If this pillar has sub-pages for this domain, redirect to the default one
  const defaultSub = getDefaultSubPage(pillar, domain);
  if (defaultSub) {
    redirect(`/${pillarSlug}/${domain}/${defaultSub}`);
  }

  // Otherwise show a placeholder page
  const domainName =
    domain === "spatial-docs"
      ? "Spatial Docs"
      : domain.charAt(0).toUpperCase() + domain.slice(1);

  const descriptions: Record<string, string> = {
    generators: "Creation tools",
    halls: "Reference documentation",
    "spatial-docs": "API reference surfaces",
  };

  return (
    <div>
      <Link
        href={`/${pillarSlug}`}
        style={{ fontSize: "0.85rem", opacity: 0.5 }}
      >
        &larr; {pillar} Dashboard
      </Link>
      <h1
        style={{
          fontSize: "1.75rem",
          fontWeight: 700,
          marginTop: "1rem",
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
        }}
      >
        {domainName}
      </h1>
      <p style={{ opacity: 0.5, marginTop: "0.5rem" }}>
        {descriptions[domain] ?? domainName} &mdash; {pillar}
      </p>
      <div
        style={{
          marginTop: "2rem",
          padding: "2rem",
          border: "1px dashed #333",
          borderRadius: "8px",
          textAlign: "center",
          opacity: 0.4,
        }}
      >
        Coming soon &mdash; {pillar} {domainName.toLowerCase()}
      </div>
    </div>
  );
}
