'use client';

/**
 * EventBus → Zustand bridge
 *
 * Subscribes to GameEvents and pipes data into the OCULUS store.
 * All subscriptions are cleaned up on unmount.
 */

import { useEffect } from 'react';
import {
  type EventBus,
  GameEvents,
  type NodeClickedEvent,
  type PlayerMovedEvent,
  type QuestUpdatedEvent,
  type HealthChangedEvent,
  type ManaChangedEvent,
  type DamageDealtEvent,
  type CombatStartedEvent,
  type CombatEndedEvent,
  type CombatTurnEvent,
  type SpellResolvedEvent,
  type ExperienceGainedEvent,
  type LevelUpEvent,
  type TopologyGeneratedEvent,
  type ItemUsedEvent,
  type CollisionDetectedEvent,
  type EncounterTriggeredEvent,
  type StatusEffectEvent,
  type LootDroppedEvent,
  type BugType,
} from '@dendrovia/shared';
import type { Bug } from '@dendrovia/shared';
import { useOculusStore } from '../store/useOculusStore';

/** Map file extension to language name for CodeReader */
const EXT_LANG: Record<string, string> = {
  ts: 'typescript', tsx: 'typescript', js: 'javascript', jsx: 'javascript',
  py: 'python', rs: 'rust', go: 'go', md: 'markdown', json: 'json',
  css: 'css', html: 'html', yaml: 'yaml', yml: 'yaml', sh: 'bash',
  sql: 'sql', rb: 'ruby', java: 'java', c: 'c', cpp: 'cpp', h: 'c',
};

function detectLanguage(filePath: string): string {
  const ext = filePath.split('.').pop()?.toLowerCase() ?? '';
  return EXT_LANG[ext] ?? 'plaintext';
}

export function useEventSubscriptions(eventBus: EventBus) {
  const store = useOculusStore;

  useEffect(() => {
    const unsubs: Array<() => void> = [];

    // ── T01: Health changes (uses HealthChangedEvent contract) ──
    unsubs.push(
      eventBus.on<HealthChangedEvent>(
        GameEvents.HEALTH_CHANGED,
        (data) => store.getState().setHealth(data.current, data.max)
      )
    );

    // ── T02: Mana changes (uses ManaChangedEvent contract) ──
    unsubs.push(
      eventBus.on<ManaChangedEvent>(
        GameEvents.MANA_CHANGED,
        (data) => store.getState().setMana(data.current, data.max)
      )
    );

    // ── T10: Quest updates (maps event status → Quest status) ──
    unsubs.push(
      eventBus.on<QuestUpdatedEvent>(
        GameEvents.QUEST_UPDATED,
        (data) => {
          // QuestUpdatedEvent uses 'started'|'in-progress'|'completed'
          // Quest.status uses 'locked'|'available'|'active'|'completed'
          const status = data.status === 'completed' ? 'completed' : 'active';
          store.getState().updateQuest(data.questId, { status });
        }
      )
    );

    // ── T05: Combat started (constructs Bug from CombatStartedEvent) ──
    unsubs.push(
      eventBus.on<CombatStartedEvent>(
        GameEvents.COMBAT_STARTED,
        (data) => {
          const enemy: Bug = {
            id: data.monsterId,
            type: (data.monsterType as BugType) || 'null-pointer',
            severity: (Math.min(5, Math.max(1, data.severity)) as 1 | 2 | 3 | 4 | 5),
            health: data.monsterHealth ?? 100,
            position: [0, 0, 0],
            sourceCommit: '',
          };
          store.getState().startCombat(enemy, []);
        }
      )
    );

    // Combat ended
    unsubs.push(
      eventBus.on<CombatEndedEvent>(GameEvents.COMBAT_ENDED, () => {
        store.getState().endCombat();
      })
    );

    // ── T07: Combat turn phases ──
    unsubs.push(
      eventBus.on<CombatTurnEvent>(
        GameEvents.COMBAT_TURN_START,
        (data) => {
          const actor = data.phase === 'player' ? 'Your' : "Enemy's";
          store.getState().addBattleLog(`Turn ${data.turn}: ${actor} turn begins`);
        }
      )
    );

    unsubs.push(
      eventBus.on<CombatTurnEvent>(
        GameEvents.COMBAT_TURN_END,
        (data) => {
          store.getState().addBattleLog(`Turn ${data.turn} ended`);
        }
      )
    );

    // ── T07: Spell resolved ──
    unsubs.push(
      eventBus.on<SpellResolvedEvent>(
        GameEvents.SPELL_RESOLVED,
        (data) => {
          store.getState().addBattleLog(
            `${data.casterId} cast ${data.spellId} on ${data.targetId}: ${data.effectType} for ${data.value}`
          );
        }
      )
    );

    // ── T06: Experience gained ──
    unsubs.push(
      eventBus.on<ExperienceGainedEvent>(
        GameEvents.EXPERIENCE_GAINED,
        (data) => {
          store.getState().setCharacter({ experience: data.totalExperience } as any);
        }
      )
    );

    // ── T06: Level up ──
    unsubs.push(
      eventBus.on<LevelUpEvent>(
        GameEvents.LEVEL_UP,
        (data) => {
          store.getState().setCharacter({ level: data.newLevel } as any);
          store.getState().addBattleLog(`Level up! Now level ${data.newLevel}`);
        }
      )
    );

    // Player movement
    unsubs.push(
      eventBus.on<PlayerMovedEvent>(
        GameEvents.PLAYER_MOVED,
        (data) => store.getState().setPlayerPosition(data.position)
      )
    );

    // ── T08: Node clicked → open code reader ──
    unsubs.push(
      eventBus.on<NodeClickedEvent>(
        GameEvents.NODE_CLICKED,
        (data) => {
          const state = store.getState();
          state.addVisitedNode(data.nodeId);
          state.openCodeReader(data.filePath, '', detectLanguage(data.filePath));
        }
      )
    );

    // ── T03: Damage dealt (uses DamageDealtEvent contract) ──
    unsubs.push(
      eventBus.on<DamageDealtEvent>(
        GameEvents.DAMAGE_DEALT,
        (data) => {
          const crit = data.isCritical ? ' (CRITICAL!)' : '';
          const msg = `${data.attackerId} dealt ${data.damage} ${data.element} damage to ${data.targetId}${crit}`;
          store.getState().addBattleLog(msg);
        }
      )
    );

    // ── Item used → battle log ──
    unsubs.push(
      eventBus.on<ItemUsedEvent>(
        GameEvents.ITEM_USED,
        (data) => {
          store.getState().addBattleLog(`Used item: ${data.itemId}`);
        }
      )
    );

    // ── Collision detected → open code reader (mirrors NODE_CLICKED) ──
    unsubs.push(
      eventBus.on<CollisionDetectedEvent>(
        GameEvents.COLLISION_DETECTED,
        (data) => {
          const state = store.getState();
          state.addVisitedNode(data.collidedWith);
          state.openCodeReader(data.collidedWith, '', detectLanguage(data.collidedWith));
        }
      )
    );

    // ── Encounter triggered → type-aware battle log ──
    unsubs.push(
      eventBus.on<EncounterTriggeredEvent>(
        GameEvents.ENCOUNTER_TRIGGERED,
        (data) => {
          let msg: string;
          if (data.type === 'boss') {
            msg = `BOSS ENCOUNTER! Severity ${data.severity}`;
          } else if (data.type === 'miniboss') {
            msg = `Mini-boss encountered! Severity ${data.severity}`;
          } else {
            msg = `Encounter: ${data.type} — Severity ${data.severity}`;
          }
          store.getState().addBattleLog(msg);
        }
      )
    );

    // ── Status effect applied ──
    unsubs.push(
      eventBus.on<StatusEffectEvent>(
        GameEvents.STATUS_EFFECT_APPLIED,
        (data) => {
          store.getState().addStatusEffect({
            effectId: data.effectId,
            effectType: data.effectType,
            remainingTurns: data.remainingTurns,
            appliedAt: Date.now(),
          });
          store.getState().addBattleLog(
            `Status: ${data.effectType} applied (${data.remainingTurns} turns)`
          );
        }
      )
    );

    // ── Status effect expired ──
    unsubs.push(
      eventBus.on<StatusEffectEvent>(
        GameEvents.STATUS_EFFECT_EXPIRED,
        (data) => {
          store.getState().removeStatusEffect(data.effectId);
          store.getState().addBattleLog(`Status: ${data.effectType} expired`);
        }
      )
    );

    // ── Loot dropped ──
    unsubs.push(
      eventBus.on<LootDroppedEvent>(
        GameEvents.LOOT_DROPPED,
        (data) => {
          store.getState().addLootDrop({
            id: `loot-${Date.now()}`,
            monsterId: data.monsterId,
            items: data.items,
            droppedAt: Date.now(),
          });
          const names = data.items.map((i) => i.name).join(', ');
          store.getState().addBattleLog(`Loot: ${names}`);
        }
      )
    );

    // ── T04: Topology loaded (uses TopologyGeneratedEvent contract) ──
    unsubs.push(
      eventBus.on<TopologyGeneratedEvent>(
        GameEvents.TOPOLOGY_GENERATED,
        (data) => {
          if (data.tree) store.getState().setTopology(data.tree);
          if (data.hotspots) store.getState().setHotspots(data.hotspots);
          if (data.deepwiki) store.getState().setDeepWiki(data.deepwiki);
        }
      )
    );

    return () => unsubs.forEach((fn) => fn());
  }, [eventBus]);
}
