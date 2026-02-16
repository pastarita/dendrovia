/**
 * Quest Generator — Git History → Quest Graph
 *
 * Converts CHRONOS-parsed commits into a quest DAG.
 * Each quest has prerequisites, rewards, and a type derived
 * from the commit it was generated from.
 *
 * Quest types:
 *   bug-hunt     → Bug-fix commits: defeat the bug monster
 *   refactor     → Large change commits: restructure the code
 *   feature      → Feature commits: build the new thing
 *   archaeology  → Old/untouched files: explore legacy code
 */

import type {
  Quest,
  QuestReward,
  ParsedCommit,
  ParsedFile,
  Hotspot,
} from '@dendrovia/shared';

// ─── Quest Budget ───────────────────────────────────────────

/** Hard cap on total quests to prevent unbounded generation */
const MAX_QUESTS_DEFAULT = 100;

// ─── Quest ID Generation ────────────────────────────────────

let questIdCounter = 0;

function nextQuestId(): string {
  return `quest-${++questIdCounter}`;
}

/** Reset ID counter (for testing) */
export function resetQuestIds(): void {
  questIdCounter = 0;
}

// ─── Reward Scaling ─────────────────────────────────────────

function xpForCommit(commit: ParsedCommit): number {
  const totalChanges = commit.insertions + commit.deletions;
  if (totalChanges > 200) return 500;
  if (totalChanges > 100) return 300;
  if (totalChanges > 50) return 200;
  if (totalChanges > 20) return 100;
  return 50;
}

function itemRewardForCommit(commit: ParsedCommit): QuestReward | null {
  const totalChanges = commit.insertions + commit.deletions;
  if (totalChanges > 200) return { type: 'item', value: 'item-root-cause' };
  if (totalChanges > 100) return { type: 'item', value: 'item-memory-snapshot' };
  if (totalChanges > 50) return { type: 'item', value: 'item-core-dump' };
  return null;
}

// ─── Quest Type Inference ───────────────────────────────────

function inferQuestType(commit: ParsedCommit): Quest['type'] {
  if (commit.isBugFix) return 'bug-hunt';
  if (commit.isFeature) return 'feature';
  // Large changes without a clear category = refactor
  if (commit.insertions + commit.deletions > 80) return 'refactor';
  return 'feature';
}

// ─── Quest Title Generation ─────────────────────────────────

const BUG_HUNT_VERBS = ['Squash', 'Hunt', 'Debug', 'Exterminate', 'Patch'];
const FEATURE_VERBS = ['Build', 'Implement', 'Forge', 'Craft', 'Deploy'];
const REFACTOR_VERBS = ['Refactor', 'Restructure', 'Optimize', 'Rebuild', 'Rewrite'];
const ARCHAEOLOGY_VERBS = ['Explore', 'Excavate', 'Unearth', 'Discover', 'Decode'];

function generateQuestTitle(type: Quest['type'], commitMessage: string): string {
  const verbs = {
    'bug-hunt': BUG_HUNT_VERBS,
    'feature': FEATURE_VERBS,
    'refactor': REFACTOR_VERBS,
    'archaeology': ARCHAEOLOGY_VERBS,
  };

  // Extract the subject from conventional commit format: "type: subject" or "type(scope): subject"
  const subject = commitMessage
    .replace(/^(fix|feat|refactor|chore|docs|style|test|perf|ci|build)(\([^)]+\))?:\s*/i, '')
    .trim();

  const verbList = verbs[type];
  // Deterministic pick based on message length
  const verb = verbList[commitMessage.length % verbList.length];

  // Capitalize first letter of subject
  const capitalizedSubject = subject.charAt(0).toUpperCase() + subject.slice(1);

  return `${verb} the ${capitalizedSubject}`;
}

function generateQuestDescription(type: Quest['type'], commit: ParsedCommit): string {
  const hash = commit.hash.slice(0, 7);
  const fileCount = commit.filesChanged.length;

  switch (type) {
    case 'bug-hunt':
      return `A bug was introduced in commit ${hash}. Track it down across ${fileCount} file${fileCount > 1 ? 's' : ''} and defeat the monster it spawned.`;
    case 'feature':
      return `New functionality was added in commit ${hash}. Navigate the ${fileCount} changed file${fileCount > 1 ? 's' : ''} and master the new code paths.`;
    case 'refactor':
      return `A major restructuring occurred in commit ${hash}. ${commit.insertions} lines added, ${commit.deletions} removed. Survive the refactoring storm.`;
    case 'archaeology':
      return `Ancient code from commit ${hash} lies dormant. Explore its ${fileCount} artifact${fileCount > 1 ? 's' : ''} to uncover forgotten knowledge.`;
  }
}

// ─── Sampling ───────────────────────────────────────────────

/**
 * Evenly sample `n` items from an array, preserving order.
 * Picks items at regular intervals so the sample spans the full range.
 */
function sampleEvenly<T>(items: T[], n: number): T[] {
  if (items.length <= n) return items;
  const step = items.length / n;
  const result: T[] = [];
  for (let i = 0; i < n; i++) {
    result.push(items[Math.floor(i * step)]);
  }
  return result;
}

// ─── Main Generation Functions ──────────────────────────────

/** Generate a quest graph from a list of parsed commits */
export function generateQuestGraph(
  commits: ParsedCommit[],
  maxQuests: number = MAX_QUESTS_DEFAULT,
): Quest[] {
  // Sample commits evenly across history for diverse coverage
  const sampled = sampleEvenly(commits, maxQuests);
  const quests: Quest[] = [];
  let prevQuestId: string | null = null;

  for (const commit of sampled) {
    const type = inferQuestType(commit);
    const id = nextQuestId();

    const rewards: QuestReward[] = [
      { type: 'experience', value: xpForCommit(commit) },
    ];

    const itemReward = itemRewardForCommit(commit);
    if (itemReward) rewards.push(itemReward);

    // Knowledge reward for significant commits
    if (commit.filesChanged.length >= 3) {
      rewards.push({ type: 'knowledge', value: `knowledge-${commit.hash.slice(0, 7)}` });
    }

    const quest: Quest = {
      id,
      title: generateQuestTitle(type, commit.message),
      description: generateQuestDescription(type, commit),
      type,
      status: prevQuestId ? 'locked' : 'available',
      requirements: prevQuestId ? [prevQuestId] : [],
      rewards,
    };

    quests.push(quest);
    prevQuestId = id;
  }

  return quests;
}

/** Generate quests specifically from bug-fix commits */
export function generateBugHuntQuests(
  commits: ParsedCommit[],
  maxQuests: number = MAX_QUESTS_DEFAULT,
): Quest[] {
  const bugCommits = commits.filter(c => c.isBugFix);
  return generateQuestGraph(bugCommits, maxQuests);
}

/** Generate archaeology quests from old/high-complexity files */
export function generateArchaeologyQuests(
  files: ParsedFile[],
  complexityThreshold: number = 15,
  maxQuests: number = MAX_QUESTS_DEFAULT,
): Quest[] {
  // Sort by complexity desc so we get the most interesting files first
  const complexFiles = files
    .filter(f => f.complexity > complexityThreshold)
    .sort((a, b) => b.complexity - a.complexity);
  const sampled = sampleEvenly(complexFiles, maxQuests);
  const quests: Quest[] = [];

  for (const file of sampled) {
    const id = nextQuestId();
    const xp = Math.floor(50 + file.complexity * 5);

    quests.push({
      id,
      title: `${ARCHAEOLOGY_VERBS[file.path.length % ARCHAEOLOGY_VERBS.length]} the ${file.path.split('/').pop() ?? file.path}`,
      description: `Ancient code at ${file.path} has cyclomatic complexity of ${file.complexity}. Navigate its depths to uncover hidden knowledge.`,
      type: 'archaeology',
      status: 'available',
      requirements: [],
      rewards: [
        { type: 'experience', value: xp },
        { type: 'knowledge', value: `knowledge-${file.path.replace(/[/\\]/g, '-')}` },
      ],
    });
  }

  return quests;
}

/** Generate boss quests from hotspots */
export function generateHotspotQuests(
  hotspots: Hotspot[],
  maxQuests: number = MAX_QUESTS_DEFAULT,
): Quest[] {
  // Sort by risk desc so we get the most dangerous hotspots first
  const sorted = [...hotspots].sort((a, b) => b.riskScore - a.riskScore);
  const sampled = sampleEvenly(sorted, maxQuests);
  const quests: Quest[] = [];

  for (const hotspot of sampled) {
    const id = nextQuestId();
    const fileName = hotspot.path.split('/').pop() ?? hotspot.path;
    const xp = Math.floor(100 + hotspot.riskScore * 50);

    quests.push({
      id,
      title: `Confront the ${fileName} Hotspot`,
      description: `The file ${hotspot.path} has a risk score of ${hotspot.riskScore}. It has been changed ${hotspot.churnRate} times and has complexity ${hotspot.complexity}. A powerful enemy guards this code.`,
      type: 'bug-hunt',
      status: 'available',
      requirements: [],
      rewards: [
        { type: 'experience', value: xp },
        { type: 'item', value: 'item-core-dump' },
      ],
    });
  }

  return quests;
}

// ─── Quest State Management ─────────────────────────────────

/** Unlock quests whose prerequisites are all completed */
export function unlockAvailableQuests(
  quests: Quest[],
  completedIds: Set<string>,
): Quest[] {
  return quests.map(quest => {
    if (quest.status !== 'locked') return quest;
    const allMet = quest.requirements.every(reqId => completedIds.has(reqId));
    if (allMet) {
      return { ...quest, status: 'available' };
    }
    return quest;
  });
}

/** Start a quest (available → active) */
export function startQuest(quests: Quest[], questId: string): Quest[] {
  return quests.map(q =>
    q.id === questId && q.status === 'available'
      ? { ...q, status: 'active' }
      : q
  );
}

/** Complete a quest (active → completed) and unlock dependents */
export function completeQuest(quests: Quest[], questId: string): Quest[] {
  const updated = quests.map(q =>
    q.id === questId && q.status === 'active'
      ? { ...q, status: 'completed' }
      : q
  );

  const completedIds = new Set(
    updated.filter(q => q.status === 'completed').map(q => q.id)
  );

  return unlockAvailableQuests(updated, completedIds);
}

/** Get all quests in a given status */
export function getQuestsByStatus(quests: Quest[], status: Quest['status']): Quest[] {
  return quests.filter(q => q.status === status);
}

/** Get the reward totals from a quest */
export function getQuestRewards(quest: Quest): { xp: number; items: string[]; knowledge: string[] } {
  let xp = 0;
  const items: string[] = [];
  const knowledge: string[] = [];

  for (const reward of quest.rewards) {
    switch (reward.type) {
      case 'experience':
        xp += reward.value as number;
        break;
      case 'item':
        items.push(reward.value as string);
        break;
      case 'knowledge':
        knowledge.push(reward.value as string);
        break;
    }
  }

  return { xp, items, knowledge };
}
