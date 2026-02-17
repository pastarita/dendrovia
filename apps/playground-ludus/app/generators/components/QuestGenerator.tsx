'use client';

import { useState } from 'react';
import {
  generateBugHuntQuests,
  generateArchaeologyQuests,
  generateHotspotQuests,
  getQuestRewards,
  resetQuestIds,
} from '@dendrovia/ludus';
import type { Quest, ParsedCommit, ParsedFile, Hotspot } from '@dendrovia/shared';

const MOCK_COMMITS: ParsedCommit[] = [
  {
    hash: 'a1b2c3d4e5f6789012345678901234567890abcd',
    message: 'fix(parser): resolve null pointer in AST traversal',
    author: 'dev@example.com',
    date: new Date('2024-06-15T10:30:00Z'),
    insertions: 45,
    deletions: 12,
    filesChanged: ['src/parser/ast.ts', 'src/parser/visitor.ts'],
    type: 'bug-fix',
    isMerge: false,
  },
  {
    hash: 'b2c3d4e5f6789012345678901234567890abcde1',
    message: 'fix(memory): patch memory leak in event listener cleanup',
    author: 'dev@example.com',
    date: new Date('2024-06-14T14:20:00Z'),
    insertions: 120,
    deletions: 30,
    filesChanged: ['src/events/bus.ts', 'src/events/listener.ts', 'src/events/cleanup.ts'],
    type: 'bug-fix',
    isMerge: false,
  },
  {
    hash: 'c3d4e5f6789012345678901234567890abcde123',
    message: 'feat(combat): implement spell cooldown system',
    author: 'dev@example.com',
    date: new Date('2024-06-13T09:15:00Z'),
    insertions: 250,
    deletions: 80,
    filesChanged: ['src/combat/spells.ts', 'src/combat/cooldowns.ts', 'src/combat/engine.ts', 'src/types/spell.ts'],
    type: 'feature',
    isMerge: false,
  },
  {
    hash: 'd4e5f6789012345678901234567890abcde12345',
    message: 'fix(race): fix race condition in async state update',
    author: 'dev@example.com',
    date: new Date('2024-06-12T16:45:00Z'),
    insertions: 30,
    deletions: 8,
    filesChanged: ['src/state/store.ts'],
    type: 'bug-fix',
    isMerge: false,
  },
  {
    hash: 'e5f6789012345678901234567890abcde1234567',
    message: 'fix(index): off-by-one error in array bounds check',
    author: 'dev@example.com',
    date: new Date('2024-06-11T11:00:00Z'),
    insertions: 8,
    deletions: 3,
    filesChanged: ['src/utils/array.ts'],
    type: 'bug-fix',
    isMerge: false,
  },
];

const MOCK_FILES: ParsedFile[] = [
  { path: 'src/legacy/old-parser.ts', hash: 'aaa111', language: 'typescript', complexity: 28, loc: 450, lastModified: new Date('2024-06-10'), author: 'dev@example.com' },
  { path: 'src/core/engine.ts', hash: 'bbb222', language: 'typescript', complexity: 22, loc: 380, lastModified: new Date('2024-06-11'), author: 'dev@example.com' },
  { path: 'src/utils/helpers.ts', hash: 'ccc333', language: 'typescript', complexity: 18, loc: 200, lastModified: new Date('2024-06-12'), author: 'dev@example.com' },
];

const MOCK_HOTSPOTS: Hotspot[] = [
  { path: 'src/legacy/old-parser.ts', churnRate: 45, complexity: 28, riskScore: 8.5 },
  { path: 'src/core/engine.ts', churnRate: 30, complexity: 22, riskScore: 7.2 },
];

const TYPE_COLORS: Record<string, string> = {
  'bug-hunt': '#EF4444',
  'archaeology': '#A16207',
  'feature': '#22C55E',
  'refactor': '#6366F1',
};

const STATUS_COLORS: Record<string, string> = {
  available: '#22C55E',
  locked: '#6B7280',
  active: '#3B82F6',
  completed: '#A16207',
};

export default function QuestGenerator(): React.JSX.Element {
  const [quests, setQuests] = useState<Quest[]>([]);
  const [activeType, setActiveType] = useState<string | null>(null);

  const generate = (type: string) => {
    resetQuestIds();
    let result: Quest[];
    switch (type) {
      case 'bug-hunt':
        result = generateBugHuntQuests(MOCK_COMMITS);
        break;
      case 'archaeology':
        result = generateArchaeologyQuests(MOCK_FILES);
        break;
      case 'hotspot':
        result = generateHotspotQuests(MOCK_HOTSPOTS);
        break;
      default:
        return;
    }
    setQuests(result);
    setActiveType(type);
  };

  return (
    <div>
      {/* Controls */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        {[
          { type: 'bug-hunt', label: 'Bug Hunt Quests' },
          { type: 'archaeology', label: 'Archaeology Quests' },
          { type: 'hotspot', label: 'Hotspot Quests' },
        ].map(btn => (
          <button
            key={btn.type}
            onClick={() => generate(btn.type)}
            style={{
              padding: '0.4rem 1rem',
              borderRadius: '4px',
              border: activeType === btn.type ? '1px solid var(--pillar-accent)' : '1px solid #333',
              background: activeType === btn.type ? '#222' : 'transparent',
              color: activeType === btn.type ? 'var(--pillar-accent)' : '#ededed',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: activeType === btn.type ? 700 : 400,
            }}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {/* Quest List */}
      {quests.length > 0 && (
        <div style={{ display: 'grid', gap: '0.75rem' }}>
          {quests.map((quest, i) => {
            const rewards = getQuestRewards(quest);
            return (
              <div
                key={quest.id}
                style={{
                  padding: '1rem',
                  border: '1px solid #222',
                  borderRadius: '8px',
                  background: '#111',
                  marginLeft: quest.requirements.length > 0 ? '1.5rem' : 0,
                  borderLeft: quest.requirements.length > 0 ? '2px solid #333' : undefined,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{quest.title}</div>
                  <div style={{ display: 'flex', gap: '0.35rem' }}>
                    <span style={{
                      fontSize: '0.65rem',
                      padding: '0.1rem 0.35rem',
                      borderRadius: '3px',
                      background: TYPE_COLORS[quest.type] ?? '#333',
                      color: '#fff',
                    }}>
                      {quest.type}
                    </span>
                    <span style={{
                      fontSize: '0.65rem',
                      padding: '0.1rem 0.35rem',
                      borderRadius: '3px',
                      border: '1px solid',
                      borderColor: STATUS_COLORS[quest.status] ?? '#555',
                      color: STATUS_COLORS[quest.status] ?? '#555',
                    }}>
                      {quest.status}
                    </span>
                  </div>
                </div>
                <div style={{ fontSize: '0.8rem', opacity: 0.6, marginBottom: '0.35rem' }}>{quest.description}</div>
                {quest.requirements.length > 0 && (
                  <div style={{ fontSize: '0.7rem', opacity: 0.4, marginBottom: '0.25rem' }}>
                    Requires: {quest.requirements.join(', ')}
                  </div>
                )}
                <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.75rem', fontFamily: 'var(--font-geist-mono)', opacity: 0.7 }}>
                  <span style={{ color: '#22C55E' }}>XP {rewards.xp}</span>
                  {rewards.items.length > 0 && <span>{rewards.items.join(', ')}</span>}
                  {rewards.knowledge.length > 0 && <span style={{ color: '#3B82F6' }}>+{rewards.knowledge.length} knowledge</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {quests.length === 0 && (
        <div style={{ padding: '2rem', border: '1px dashed #333', borderRadius: '8px', textAlign: 'center', opacity: 0.4 }}>
          Click a button above to generate quests from mock CHRONOS data
        </div>
      )}
    </div>
  );
}
