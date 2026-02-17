import type { RepositoryMetadata } from '@dendrovia/shared';
import Link from 'next/link';
import { loadTopologyData } from '../../../lib/load-data';

interface Check {
  name: string;
  group: string;
  pass: boolean;
  detail: string;
}

export default async function ContractPage() {
  const data = await loadTopologyData();
  const checks: Check[] = [];

  // --- File presence checks ---
  const fileChecks: [string, unknown][] = [
    ['topology.json', data.topology],
    ['commits.json', data.commits],
    ['complexity.json', data.complexity],
    ['hotspots.json', data.hotspots],
    ['contributors.json', data.contributors],
  ];

  for (const [name, val] of fileChecks) {
    checks.push({
      name: `${name} exists`,
      group: 'Files',
      pass: val !== null,
      detail: val !== null ? 'File loaded' : 'File not found',
    });
  }

  // --- Topology enrichment checks ---
  const topo = data.topology;
  if (topo) {
    checks.push({
      name: 'topology.version',
      group: 'Topology',
      pass: typeof topo.version === 'string' && topo.version.length > 0,
      detail: `value: ${topo.version}`,
    });

    checks.push({
      name: 'topology.analyzedAt',
      group: 'Topology',
      pass: typeof topo.analyzedAt === 'string' && !Number.isNaN(Date.parse(topo.analyzedAt)),
      detail: `value: ${topo.analyzedAt}`,
    });

    const repo = topo.repository;
    const isRepoObject = repo !== null && typeof repo === 'object';
    checks.push({
      name: 'topology.repository (RepositoryMetadata)',
      group: 'Enrichment',
      pass: isRepoObject,
      detail: isRepoObject ? 'Present as object' : `Got ${typeof repo}`,
    });

    if (isRepoObject) {
      const rm = repo as RepositoryMetadata;
      for (const field of ['name', 'remoteUrl', 'currentBranch', 'headHash', 'analyzedAt'] as const) {
        checks.push({
          name: `repository.${field}`,
          group: 'Enrichment',
          pass: typeof rm[field] === 'string' && rm[field].length > 0,
          detail: `value: ${String(rm[field]).slice(0, 60)}`,
        });
      }
      for (const field of ['branchCount', 'fileCount', 'commitCount', 'contributorCount'] as const) {
        checks.push({
          name: `repository.${field}`,
          group: 'Enrichment',
          pass: typeof rm[field] === 'number' && rm[field] >= 0,
          detail: `value: ${rm[field]}`,
        });
      }
      checks.push({
        name: 'repository.languages',
        group: 'Enrichment',
        pass: Array.isArray(rm.languages) && rm.languages.length > 0,
        detail: `${rm.languages?.length ?? 0} languages`,
      });
    }

    // Language distribution
    const ld = topo.languageDistribution;
    checks.push({
      name: 'topology.languageDistribution',
      group: 'Enrichment',
      pass: Array.isArray(ld) && ld.length > 0,
      detail: `${ld?.length ?? 0} entries`,
    });

    if (Array.isArray(ld) && ld.length > 0) {
      const sample = ld[0]!;
      checks.push({
        name: 'languageDistribution[0] shape',
        group: 'Enrichment',
        pass:
          typeof sample.language === 'string' &&
          typeof sample.fileCount === 'number' &&
          typeof sample.locTotal === 'number' &&
          typeof sample.percentage === 'number',
        detail: `language=${sample.language}, fileCount=${sample.fileCount}`,
      });
    }

    // Contributor summary
    const cs = topo.contributorSummary;
    checks.push({
      name: 'topology.contributorSummary',
      group: 'Enrichment',
      pass: cs !== null && typeof cs === 'object' && cs !== undefined,
      detail: cs ? `top: ${cs.topContributor}, total: ${cs.totalContributors}` : 'missing',
    });

    if (cs) {
      checks.push({
        name: 'contributorSummary.archetypeDistribution',
        group: 'Enrichment',
        pass: typeof cs.archetypeDistribution === 'object' && Object.keys(cs.archetypeDistribution).length > 0,
        detail: `${Object.keys(cs.archetypeDistribution).length} archetypes`,
      });
    }

    // Temporal couplings
    const tc = topo.temporalCouplings;
    checks.push({
      name: 'topology.temporalCouplings',
      group: 'Enrichment',
      pass: Array.isArray(tc),
      detail: `${tc?.length ?? 0} couplings`,
    });
  }

  // --- Commit enrichment checks ---
  const commits = data.commits;
  if (commits && commits.length > 0) {
    const withType = commits.filter((c) => c.type !== undefined);
    const withConfidence = commits.filter((c) => c.confidence !== undefined);
    const withBreaking = commits.filter((c) => c.isBreaking !== undefined);

    checks.push({
      name: 'commits[].type populated',
      group: 'Commits',
      pass: withType.length === commits.length,
      detail: `${withType.length}/${commits.length} have type`,
    });

    checks.push({
      name: 'commits[].confidence populated',
      group: 'Commits',
      pass: withConfidence.length === commits.length,
      detail: `${withConfidence.length}/${commits.length} have confidence`,
    });

    checks.push({
      name: 'commits[].isBreaking populated',
      group: 'Commits',
      pass: withBreaking.length === commits.length,
      detail: `${withBreaking.length}/${commits.length} have isBreaking`,
    });

    // Validate type values
    const validTypes = new Set([
      'bug-fix',
      'feature',
      'refactor',
      'docs',
      'test',
      'performance',
      'merge',
      'revert',
      'dependency',
      'breaking-change',
      'chore',
      'style',
      'maintenance',
    ]);
    const invalidTypes = withType.filter((c) => !validTypes.has(c.type!));
    checks.push({
      name: 'commits[].type values valid',
      group: 'Commits',
      pass: invalidTypes.length === 0,
      detail: invalidTypes.length === 0 ? 'All valid' : `${invalidTypes.length} invalid`,
    });
  }

  // --- Contributor checks ---
  const contributors = data.contributors?.contributors;
  if (contributors && contributors.length > 0) {
    const c0 = contributors[0]!;
    checks.push({
      name: 'contributors[0].archetype',
      group: 'Contributors',
      pass: typeof c0.archetype === 'string' && c0.archetype.length > 0,
      detail: `value: ${c0.archetype}`,
    });
    checks.push({
      name: 'contributors[0].facets',
      group: 'Contributors',
      pass: typeof c0.facets === 'object' && 'energy' in c0.facets,
      detail: `keys: ${Object.keys(c0.facets).join(', ')}`,
    });
    checks.push({
      name: 'contributors[0].typeDistribution',
      group: 'Contributors',
      pass: typeof c0.typeDistribution === 'object' && Object.keys(c0.typeDistribution).length > 0,
      detail: `${Object.keys(c0.typeDistribution).length} types`,
    });
  }

  const passed = checks.filter((c) => c.pass).length;
  const failed = checks.filter((c) => !c.pass).length;

  // Group checks
  const groups = new Map<string, Check[]>();
  for (const c of checks) {
    if (!groups.has(c.group)) groups.set(c.group, []);
    groups.get(c.group)!.push(c);
  }

  return (
    <div>
      <Link href="/zoos" style={{ fontSize: '0.85rem', opacity: 0.5 }}>
        &larr; Zoos
      </Link>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '1rem' }}>✅ Contract Validator</h1>
      <p style={{ opacity: 0.5, marginTop: '0.25rem', fontSize: '0.85rem' }}>
        Validates all enriched contract fields exist and are well-formed
      </p>

      {/* Summary */}
      <div
        style={{
          display: 'flex',
          gap: '1rem',
          marginTop: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        <div
          style={{
            padding: '0.75rem 1.25rem',
            borderRadius: '8px',
            background: failed === 0 ? '#22c55e11' : '#ef444411',
            border: `1px solid ${failed === 0 ? '#22c55e44' : '#ef444444'}`,
          }}
        >
          <span
            style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              color: failed === 0 ? '#22c55e' : '#ef4444',
            }}
          >
            {failed === 0 ? 'ALL PASS' : `${failed} FAILED`}
          </span>
          <span style={{ fontSize: '0.85rem', opacity: 0.5, marginLeft: '0.75rem' }}>
            {passed}/{checks.length} checks
          </span>
        </div>
      </div>

      {/* Grouped checks */}
      {Array.from(groups.entries()).map(([group, groupChecks]) => {
        const groupPassed = groupChecks.filter((c) => c.pass).length;

        return (
          <div key={group} style={{ marginBottom: '1.5rem' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '0.5rem',
                borderBottom: '1px solid #222',
                paddingBottom: '0.3rem',
              }}
            >
              <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{group}</span>
              <span
                style={{
                  fontSize: '0.75rem',
                  color: groupPassed === groupChecks.length ? '#22c55e' : '#ef4444',
                  opacity: 0.7,
                }}
              >
                {groupPassed}/{groupChecks.length}
              </span>
            </div>

            {groupChecks.map((c) => (
              <div
                key={c.name}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.35rem 0.5rem',
                  borderBottom: '1px solid #1a1a1a',
                  fontSize: '0.8rem',
                }}
              >
                <span style={{ fontSize: '1rem', width: '20px' }}>{c.pass ? '✓' : '✗'}</span>
                <span
                  style={{
                    fontFamily: 'var(--font-geist-mono)',
                    flex: 1,
                    color: c.pass ? '#ccc' : '#ef4444',
                  }}
                >
                  {c.name}
                </span>
                <span
                  style={{
                    fontSize: '0.75rem',
                    opacity: 0.4,
                    maxWidth: '300px',
                    textAlign: 'right',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {c.detail}
                </span>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
