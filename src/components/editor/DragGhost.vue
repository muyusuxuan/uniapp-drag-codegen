<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useEditorStore } from '@/store/editor'
import { findNode } from '@/utils/tree'

const store = useEditorStore()
const { pointerDragging, draggingType, draggingNodeId, ghostX, ghostY, mode, doc } = storeToRefs(store)

const label = computed(() => {
  if (draggingType.value) {
    return mode.value?.blocks.find((b) => b.type === draggingType.value)?.label ?? '组件'
  }
  if (draggingNodeId.value) {
    return findNode(doc.value.nodes, draggingNodeId.value)?.name ?? '组件'
  }
  return '组件'
})
</script>

<template>
  <div
    v-if="pointerDragging && (draggingType || draggingNodeId)"
    class="ghost"
    :style="{ left: `${ghostX + 12}px`, top: `${ghostY + 12}px` }"
  >
    {{ label }}
  </div>
</template>

<style scoped>
.ghost {
  position: fixed;
  z-index: 50;
  pointer-events: none;
  background: #121826;
  color: #fff;
  border-radius: 999px;
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 700;
  box-shadow: 0 8px 24px rgba(18, 24, 38, 0.25);
}
</style>
