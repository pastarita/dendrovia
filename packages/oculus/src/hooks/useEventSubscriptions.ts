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
  type EncounterTriggeredEvent,
} from '@dendrovia/shared';
import { useOculusStore } from '../store/useOculusStore';

export function useEventSubscriptions(eventBus: EventBus) {
  const store = useOculusStore;

  useEffect(() => {
    const unsubs: Array<() => void> = [];

    // Health changes
    unsubs.push(
      eventBus.on<{ health: number; maxHealth?: number }>(
        GameEvents.HEALTH_CHANGED,
        (data) => store.getState().setHealth(data.health, data.maxHealth)
      )
    );

    // Mana changes
    unsubs.push(
      eventBus.on<{ mana: number; maxMana?: number }>(
        GameEvents.MANA_CHANGED,
        (data) => store.getState().setMana(data.mana, data.maxMana)
      )
    );

    // Quest updates
    unsubs.push(
      eventBus.on<QuestUpdatedEvent>(
        GameEvents.QUEST_UPDATED,
        (data) =>
          store.getState().updateQuest(data.questId, {
            status: data.status === 'started' ? 'active' : data.status === 'completed' ? 'completed' : 'active',
          })
      )
    );

    // Combat started
    unsubs.push(
      eventBus.on<EncounterTriggeredEvent>(
        GameEvents.COMBAT_STARTED,
        (_data) => {
          // Actual bug + spells data will come via direct store calls
          // from LUDUS integration layer
        }
      )
    );

    // Combat ended
    unsubs.push(
      eventBus.on(GameEvents.COMBAT_ENDED, () => {
        store.getState().endCombat();
      })
    );

    // Player movement
    unsubs.push(
      eventBus.on<PlayerMovedEvent>(
        GameEvents.PLAYER_MOVED,
        (data) => store.getState().setPlayerPosition(data.position)
      )
    );

    // Node clicked → open code reader
    unsubs.push(
      eventBus.on<NodeClickedEvent>(
        GameEvents.NODE_CLICKED,
        (data) => {
          store.getState().addVisitedNode(data.nodeId);
          // Code loading happens in the component via OPERATUS
        }
      )
    );

    // Damage animation trigger
    unsubs.push(
      eventBus.on<{ amount: number; target: string; message?: string }>(
        GameEvents.DAMAGE_DEALT,
        (data) => {
          if (data.message) {
            store.getState().addBattleLog(data.message);
          }
        }
      )
    );

    // Topology loaded
    unsubs.push(
      eventBus.on(GameEvents.TOPOLOGY_GENERATED, (data: any) => {
        if (data?.tree) store.getState().setTopology(data.tree);
        if (data?.hotspots) store.getState().setHotspots(data.hotspots);
      })
    );

    return () => unsubs.forEach((fn) => fn());
  }, [eventBus]);
}
