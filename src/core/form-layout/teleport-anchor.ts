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
