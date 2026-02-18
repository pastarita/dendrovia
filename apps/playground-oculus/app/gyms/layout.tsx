import { DomainSubNav } from "@repo/ui/domain-sub-nav";

export default function GymsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ contain: "layout" }}>
      <DomainSubNav domain="gyms" pillar="OCULUS" />
      {children}
    </div>
  );
}
