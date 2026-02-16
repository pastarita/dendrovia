'use client';

import { OrnateFrame, ProgressBar, StatLabel, IconBadge } from '@dendrovia/oculus';
import type { Specimen } from './mock-upstream';
import { PILLAR_EMOJIS } from './mock-upstream';

const ELEMENT_ICONS: Record<string, string> = {
  fire: '\u{1F525}',
  water: '\u{1F4A7}',
  earth: '\u{1F30D}',
  air: '\u{1F4A8}',
  none: '\u{26AA}',
};

const TIER_COLORS: Record<string, string> = {
  common: '#9CA3AF',
  uncommon: '#22C55E',
  rare: '#3B82F6',
  epic: '#A855F7',
  legendary: '#FFD700',
};

function HotspotContent({ data }: { data: Specimen & { kind: 'hotspot' } }) {
  const { riskScore, churnRate, complexity } = data.data;
  return (
    <>
      <ProgressBar value={riskScore * 100} max={100} variant="health" showLabel label={`Risk ${(riskScore * 100).toFixed(0)}%`} height={10} />
      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
        <StatLabel label="Churn" value={churnRate} />
        <StatLabel label="Complexity" value={complexity} />
      </div>
      <div style={{ fontSize: '0.7rem', opacity: 0.5, marginTop: '0.4rem', fontFamily: 'monospace' }}>{data.data.path}</div>
    </>
  );
}

function CommitContent({ data }: { data: Specimen & { kind: 'commit' } }) {
  const c = data.data;
  return (
    <>
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <IconBadge icon={c.isFeature ? '\u{2B50}' : '\u{1F527}'} label={c.type ?? 'unknown'} size="sm" />
        <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', opacity: 0.6 }}>{c.hash}</span>
      </div>
      <div style={{ fontSize: '0.8rem', marginTop: '0.4rem', lineHeight: 1.3 }}>{c.message}</div>
      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.4rem' }}>
        <StatLabel label="Files" value={c.filesChanged.length} />
        <StatLabel label="+" value={c.insertions} color="#22c55e" />
        <StatLabel label="-" value={c.deletions} color="#ef4444" />
      </div>
    </>
  );
}

function ParsedFileContent({ data }: { data: Specimen & { kind: 'parsed-file' } }) {
  const f = data.data;
  return (
    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
      <IconBadge icon="\u{1F4C4}" label={f.language} size="sm" />
      <StatLabel label="LOC" value={f.loc} />
      <StatLabel label="Complexity" value={f.complexity} />
    </div>
  );
}

function MonsterContent({ data }: { data: Specimen & { kind: 'monster' } }) {
  const m = data.data;
  return (
    <>
      <ProgressBar value={m.stats.health} max={m.stats.maxHealth} variant="health" showLabel height={10} />
      <ProgressBar value={m.stats.mana} max={m.stats.maxMana} variant="mana" showLabel height={6} />
      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.4rem', flexWrap: 'wrap' }}>
        <IconBadge icon={ELEMENT_ICONS[m.element] ?? '\u{26AA}'} label={m.element} size="sm" />
        <IconBadge icon="\u{1F41B}" label={m.type} size="sm" color="#EF4444" />
      </div>
      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.4rem', flexWrap: 'wrap' }}>
        <StatLabel label="ATK" value={m.stats.attack} />
        <StatLabel label="DEF" value={m.stats.defense} />
        <StatLabel label="SPD" value={m.stats.speed} />
        <StatLabel label="Severity" value={`${'*'.repeat(m.severity)}`} color="#EF4444" />
      </div>
    </>
  );
}

function SpellContent({ data }: { data: Specimen & { kind: 'spell' } }) {
  const s = data.data;
  return (
    <>
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <IconBadge icon={ELEMENT_ICONS[s.element] ?? '\u{26AA}'} label={s.element} size="sm" />
        <span style={{ fontSize: '0.8rem', fontStyle: 'italic', opacity: 0.7 }}>{s.effect.type}</span>
      </div>
      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.4rem', flexWrap: 'wrap' }}>
        <StatLabel label="Mana" value={s.manaCost} color="#60a5fa" />
        <StatLabel label="CD" value={`${s.cooldown}t`} />
        <StatLabel label="Power" value={s.effect.value} color="#EF4444" />
        {s.effect.duration && <StatLabel label="Duration" value={`${s.effect.duration}t`} />}
      </div>
      <div style={{ fontSize: '0.75rem', opacity: 0.5, marginTop: '0.3rem' }}>{s.description}</div>
    </>
  );
}

function QuestContent({ data }: { data: Specimen & { kind: 'quest' } }) {
  const q = data.data;
  return (
    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
      <IconBadge icon="\u{1F4DC}" label={q.type} size="sm" color="#d97706" />
      <StatLabel label="Status" value={q.status} />
      <StatLabel label="Reqs" value={q.requirements.length} />
    </div>
  );
}

function ItemContent({ data }: { data: Specimen & { kind: 'item' } }) {
  const it = data.data;
  return (
    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
      <IconBadge icon="\u{1F9EA}" label={it.type} size="sm" />
      <StatLabel label="Effect" value={it.effect.value} />
    </div>
  );
}

function FungalContent({ data }: { data: Specimen & { kind: 'fungal' } }) {
  const f = data.data;
  const tierColor = TIER_COLORS[f.lore.tier] ?? '#9CA3AF';
  return (
    <>
      <div style={{ fontFamily: 'monospace', fontSize: '0.7rem', opacity: 0.5, lineHeight: 1.4 }}>
        {f.taxonomy.order} &gt; {f.taxonomy.family} &gt; {f.taxonomy.genus}
      </div>
      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.4rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <IconBadge icon="\u{1F344}" label={f.lore.tier} size="sm" color={tierColor} />
        <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>{f.morphology.bioluminescence} glow</span>
      </div>
      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.4rem', flexWrap: 'wrap' }}>
        <StatLabel label="Cap" value={`${f.morphology.capWidth}cm`} />
        <StatLabel label="Stem" value={`${f.morphology.stem.height}cm`} />
        <StatLabel label="Gills" value={f.morphology.gillCount} />
      </div>
      <div style={{ fontSize: '0.75rem', fontStyle: 'italic', opacity: 0.6, marginTop: '0.3rem' }}>{f.lore.flavorText}</div>
    </>
  );
}

function PaletteContent({ data }: { data: Specimen & { kind: 'palette' } }) {
  const p = data.data;
  const swatches = [
    { label: 'Primary', color: p.primary },
    { label: 'Secondary', color: p.secondary },
    { label: 'Accent', color: p.accent },
    { label: 'Background', color: p.background },
  ];
  return (
    <>
      <div style={{ display: 'flex', gap: '4px', marginBottom: '0.4rem' }}>
        {swatches.map((s) => (
          <div key={s.label} style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ height: 24, borderRadius: 4, background: s.color, border: '1px solid rgba(255,255,255,0.1)' }} />
            <div style={{ fontSize: '0.6rem', opacity: 0.5, marginTop: 2 }}>{s.color}</div>
          </div>
        ))}
      </div>
      <StatLabel label="Mood" value={p.mood} />
    </>
  );
}

function SDFShaderContent({ data }: { data: Specimen & { kind: 'sdf-shader' } }) {
  const s = data.data;
  return (
    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
      <StatLabel label="Params" value={Object.keys(s.parameters).length} />
      <StatLabel label="Complexity" value={s.complexity} />
    </div>
  );
}

function DendriteConfigContent({ data }: { data: Specimen & { kind: 'dendrite-config' } }) {
  const d = data.data;
  return (
    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
      <StatLabel label="Shader" value={d.sdfShader.id.slice(4)} />
      <StatLabel label="Mood" value={d.palette.mood} />
      <StatLabel label="L-iter" value={d.lSystem.iterations} />
      <StatLabel label="Scale" value={d.scale} />
    </div>
  );
}

function WorldStateContent({ data }: { data: Specimen & { kind: 'world-state' } }) {
  const w = data.data;
  return (
    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
      <IconBadge icon={w.cameraMode === 'falcon' ? '\u{1F985}' : '\u{1F3AE}'} label={w.cameraMode} size="sm" />
      <StatLabel label="Visited" value={w.visitedNodes.length} />
      <StatLabel label="Branch" value={w.currentBranch} />
    </div>
  );
}

function OculusInventoryContent({ data }: { data: Specimen & { kind: 'oculus-inventory' } }) {
  const inv = data.data;
  return (
    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
      <StatLabel label="Primitives" value={inv.primitives} />
      <StatLabel label="Hooks" value={inv.hooks} />
      <StatLabel label="Components" value={inv.components} />
      <StatLabel label="Tests" value={inv.tests} />
    </div>
  );
}

function OculusTokensContent({ data }: { data: Specimen & { kind: 'oculus-tokens' } }) {
  const t = data.data;
  return (
    <>
      <div style={{ display: 'flex', gap: '4px', marginBottom: '0.4rem' }}>
        {t.palette.map((hex) => (
          <div key={hex} style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ height: 20, borderRadius: 3, background: hex, border: '1px solid rgba(255,255,255,0.1)' }} />
            <div style={{ fontSize: '0.55rem', opacity: 0.4, marginTop: 1 }}>{hex}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <StatLabel label="Spacing" value={`${t.spacingSteps} steps`} />
        <StatLabel label="Timing" value={`${t.timingCurves} curves`} />
      </div>
    </>
  );
}

function MeshEntryContent({ data }: { data: Specimen & { kind: 'mesh-entry' } }) {
  const m = data.data;
  return (
    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
      <StatLabel label="Format" value={m.format} />
      <StatLabel label="Verts" value={m.vertices.toLocaleString()} />
      <StatLabel label="Faces" value={m.faces.toLocaleString()} />
      <StatLabel label="Tier" value={m.tier} />
      <StatLabel label="Size" value={`${(m.size / 1024).toFixed(0)}KB`} />
    </div>
  );
}

function AssetManifestContent({ data }: { data: Specimen & { kind: 'asset-manifest' } }) {
  const a = data.data;
  return (
    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
      <StatLabel label="Version" value={a.version} />
      <StatLabel label="Shaders" value={Object.keys(a.shaders).length} />
      <StatLabel label="Palettes" value={Object.keys(a.palettes).length} />
      {a.mycology && <StatLabel label="Specimens" value={a.mycology.specimenCount} />}
    </div>
  );
}

function SpecimenBody({ specimen }: { specimen: Specimen }) {
  switch (specimen.kind) {
    case 'hotspot': return <HotspotContent data={specimen} />;
    case 'commit': return <CommitContent data={specimen} />;
    case 'parsed-file': return <ParsedFileContent data={specimen} />;
    case 'monster': return <MonsterContent data={specimen} />;
    case 'spell': return <SpellContent data={specimen} />;
    case 'quest': return <QuestContent data={specimen} />;
    case 'item': return <ItemContent data={specimen} />;
    case 'fungal': return <FungalContent data={specimen} />;
    case 'palette': return <PaletteContent data={specimen} />;
    case 'sdf-shader': return <SDFShaderContent data={specimen} />;
    case 'dendrite-config': return <DendriteConfigContent data={specimen} />;
    case 'world-state': return <WorldStateContent data={specimen} />;
    case 'oculus-inventory': return <OculusInventoryContent data={specimen} />;
    case 'oculus-tokens': return <OculusTokensContent data={specimen} />;
    case 'mesh-entry': return <MeshEntryContent data={specimen} />;
    case 'asset-manifest': return <AssetManifestContent data={specimen} />;
  }
}

export function FrameSpecimen({ specimen }: { specimen: Specimen }) {
  const emoji = PILLAR_EMOJIS[specimen.pillar];
  return (
    <OrnateFrame
      pillar={specimen.pillar}
      variant={specimen.variant}
      header={specimen.variant === 'modal' ? specimen.title : undefined}
      headerIcon={specimen.variant === 'modal' ? specimen.icon : undefined}
    >
      <div style={{ fontSize: '0.7rem', opacity: 0.5, marginBottom: '0.4rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
        {emoji} {specimen.kind.replace(/-/g, ' ')}
      </div>
      {specimen.variant !== 'modal' && (
        <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.5rem' }}>
          {specimen.icon} {specimen.title}
        </div>
      )}
      <SpecimenBody specimen={specimen} />
    </OrnateFrame>
  );
}
