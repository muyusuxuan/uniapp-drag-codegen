<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useEditorStore } from '@/store/editor'

const store = useEditorStore()
const { hoverDropSlot, ghostX, ghostY, draggingType, draggingNodeId } = storeToRefs(store)

const box = computed(() => {
  void ghostX.value
  void ghostY.value
  const slot = hoverDropSlot.value
  if (!slot || (!draggingType.value && !draggingNodeId.value)) return null
  const el =
    slot.refId === 'root'
      ? document.querySelector<HTMLElement>('[data-drop-id="root"]')
      : document.querySelector<HTMLElement>(`[data-node-id="${slot.refId}"]`)
  if (!el) return null
  const rect = el.getBoundingClientRect()
  if (slot.placement === 'inside') {
    return {
      kind: 'box' as const,
      left: `${rect.left}px`,
      top: `${rect.top}px`,
      width: `${rect.width}px`,
      height: `${rect.height}px`,
    }
  }
  if (slot.axis === 'y') {
    const y = slot.placement === 'before' ? rect.top : rect.bottom
    return {
      kind: 'line' as const,
      left: `${rect.left}px`,
      top: `${y - 1.5}px`,
      width: `${rect.width}px`,
      height: '3px',
    }
  }
  const x = slot.placement === 'before' ? rect.left : rect.right
  return {
    kind: 'line' as const,
    left: `${x - 1.5}px`,
    top: `${rect.top}px`,
    width: '3px',
    height: `${rect.height}px`,
  }
})
</script>

<template>
  <Teleport to="body">
    <div
      v-if="box"
      class="indicator"
      :class="box.kind"
      :style="{ left: box.left, top: box.top, width: box.width, height: box.height }"
    />
  </Teleport>
</template>

<style scoped>
.indicator {
  position: fixed;
  z-index: 40;
  pointer-events: none;
}
.indicator.line {
  background: var(--ok);
  border-radius: 99px;
  box-shadow: 0 0 0 2px rgba(7, 193, 96, 0.25);
}
.indicator.box {
  border: 2px dashed var(--ok);
  border-radius: 10px;
  background: rgba(7, 193, 96, 0.06);
}
</style>
