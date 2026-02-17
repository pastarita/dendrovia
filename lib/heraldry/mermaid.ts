/**
 * Mermaid Diagram Generation for PR Heraldry
 *
 * Generates accessibility-compliant Mermaid flowcharts
 * representing PR domain coverage and architecture.
 */

import type { Domain, PRCoatOfArms } from './types.js';
import { DOMAIN_TINCTURES } from './types.js';

/**
 * Generate a Mermaid flowchart showing the domains touched by a PR.
 * All style directives include explicit text color for accessibility.
 */
export function generateDomainDiagram(coatOfArms: PRCoatOfArms): string {
  const domains = coatOfArms.shield.domains;
  if (domains.length === 0) return '';

  const lines: string[] = ['flowchart LR'];

  // Create nodes for each domain
  for (const domain of domains) {
    const _tincture = DOMAIN_TINCTURES[domain];
    const nodeId = domain.toUpperCase();
    lines.push(`    ${nodeId}["${domain}"]`);
  }

  // Connect domains in sequence
  if (domains.length > 1) {
    const ids = domains.map((d) => d.toUpperCase());
    lines.push(`    ${ids.join(' --> ')}`);
  }

  // Add accessible styles
  lines.push('');
  for (const domain of domains) {
    const tincture = DOMAIN_TINCTURES[domain];
    const nodeId = domain.toUpperCase();
    lines.push(`    style ${nodeId} fill:${tincture.hex},stroke:#444,color:${tincture.textColor}`);
  }

  return lines.join('\n');
}

/**
 * Generate a Mermaid flowchart for the Dendrovia pipeline
 * with the PR's touched domains highlighted.
 */
export function generatePipelineDiagram(touchedDomains: Domain[]): string {
  const touched = new Set(touchedDomains);
  const allPillars: Domain[] = ['chronos', 'imaginarium', 'architectus', 'ludus', 'oculus', 'operatus'];

  const lines: string[] = [
    'flowchart TB',
    '    subgraph PIPELINE["Dendrovia Pipeline"]',
    '        CHR["CHRONOS"] --> IMG["IMAGINARIUM"]',
    '        IMG --> ARC["ARCHITECTUS"]',
    '        ARC --> LUD["LUDUS"]',
    '        ARC --> OCU["OCULUS"]',
    '        LUD --> OPE["OPERATUS"]',
    '        OCU --> OPE',
    '    end',
    '',
  ];

  // Style pipeline subgraph
  lines.push('    style PIPELINE fill:#1e3a5f,stroke:#3b82f6,color:#ffffff');

  // Style each pillar node
  const nodeMap: Record<Domain, string> = {
    chronos: 'CHR',
    imaginarium: 'IMG',
    architectus: 'ARC',
    ludus: 'LUD',
    oculus: 'OCU',
    operatus: 'OPE',
    shared: '',
    app: '',
    docs: '',
    infra: '',
  };

  for (const pillar of allPillars) {
    const nodeId = nodeMap[pillar];
    if (!nodeId) continue;
    const tincture = DOMAIN_TINCTURES[pillar];

    if (touched.has(pillar)) {
      // Highlighted: full tincture color
      lines.push(`    style ${nodeId} fill:${tincture.hex},stroke:#fff,color:${tincture.textColor},stroke-width:3px`);
    } else {
      // Dimmed: neutral gray
      lines.push(`    style ${nodeId} fill:#374151,stroke:#555,color:#9ca3af`);
    }
  }

  return lines.join('\n');
}

/**
 * Generate a Level 2 (Simulated) Coat of Arms as a Mermaid diagram.
 */
export function generateHeraldryDiagram(coatOfArms: PRCoatOfArms): string {
  const { crest, shield, charges, motto } = coatOfArms;
  const primaryTincture = shield.primaryTincture;

  const chargeList = charges.map((c) => `${c.symbol} x${c.count}`).join(', ');

  const domainList = shield.domains.join(', ');

  const lines: string[] = [
    'flowchart TB',
    `    CREST["${crest.magnitude.toUpperCase()} ${crest.symbol}"]`,
    `    SHIELD["${domainList}<br/>${chargeList}"]`,
    `    STATS["files: ${crest.fileCount} | +${crest.linesAdded} / -${crest.linesRemoved}"]`,
    `    MOTTO["${motto}"]`,
    '',
    '    CREST --> SHIELD --> STATS --> MOTTO',
    '',
    `    style CREST fill:#1e3a5f,stroke:#3b82f6,color:#ffffff`,
    `    style SHIELD fill:${primaryTincture.hex},stroke:#444,color:${primaryTincture.textColor}`,
    `    style STATS fill:#1F2937,stroke:#444,color:#ffffff`,
    `    style MOTTO fill:#3c6b63,stroke:#22c55e,color:#ffffff`,
  ];

  return lines.join('\n');
}
