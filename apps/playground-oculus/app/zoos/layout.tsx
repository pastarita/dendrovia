import { DomainSubNav } from "@repo/ui/domain-sub-nav";

export default function ZoosLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ contain: "layout" }}>
      <DomainSubNav domain="zoos" pillar="OCULUS" />
      {children}
    </div>
  );
}
