import { DomainSubNav } from "@repo/ui/domain-sub-nav";

export default function MuseumsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ contain: "layout" }}>
      <DomainSubNav domain="museums" pillar="OCULUS" />
      {children}
    </div>
  );
}
