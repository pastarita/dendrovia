/**
 * StatLabel — Key/value display (e.g., "Level: 5")
 */

export interface StatLabelProps {
  label: string;
  value: string | number;
  color?: string;
  className?: string;
}

export function StatLabel({ label, value, color = 'var(--oculus-amber)', className = '' }: StatLabelProps) {
  return (
    <div
      className={`oculus-stat ${className}`}
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 'var(--oculus-space-sm)',
        fontSize: 'var(--oculus-font-sm)',
        lineHeight: 1.6,
      }}
    >
      <span style={{ color: 'var(--oculus-text-muted)' }}>{label}</span>
      <span style={{ color, fontWeight: 600 }}>{value}</span>
    </div>
  );
}
