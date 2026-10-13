import { computed, ref, Ref } from 'vue';

export interface TeleportAnchor {
  id: Ref<string>;
  target: Ref<string>;
}

/**
 * Pairs an id ref with its '#'-prefixed Teleport target, for use with ComponentBuilderBase.teleportAnchor(): the id
 * goes into the builder call, the target into <Teleport :to>.
 */
export function useTeleportAnchor(): TeleportAnchor {
  const id = ref('');
  const target = computed(() => `#${id.value}`);
  return { id, target };
}

/**
 * One `useTeleportAnchor()` per name, keyed by that name: `useTeleportAnchors(['firstName', 'lastName'])` returns
 * `{ firstName, lastName }`.
 */
export function useTeleportAnchors<const N extends string>(names: readonly N[]): Record<N, TeleportAnchor> {
  return Object.fromEntries(names.map((name) => [name, useTeleportAnchor()])) as Record<N, TeleportAnchor>;
}
