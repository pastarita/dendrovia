import { DomainSubNav } from "@repo/ui/domain-sub-nav";

export default function FoundryLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ contain: "layout" }}>
      <DomainSubNav domain="foundry" pillar="OCULUS" />
      {children}
    </div>
  );
}
