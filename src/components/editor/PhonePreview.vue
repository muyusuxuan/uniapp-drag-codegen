<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useEditorStore } from '@/store/editor'
import { allowDrop } from '@/utils/dnd'
import PreviewNode from './PreviewNode.vue'

const store = useEditorStore()
const { doc, hoverDropSlot } = storeToRefs(store)

const clock = computed(() => {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
})

const navColor = computed(() => (doc.value.page.navigationBarTextStyle === 'white' ? '#fff' : '#111'))
const insideRoot = computed(
  () => hoverDropSlot.value?.placement === 'inside' && hoverDropSlot.value.refId === 'root',
)

function onDragOver(event: DragEvent) {
  allowDrop(event, store.draggingNodeId ? 'move' : 'copy')
  store.hoverAt(event.clientX, event.clientY, event.target as Element)
}

function onDrop(event: DragEvent) {
  event.preventDefault()
  event.stopPropagation()
  store.dropAtPoint(event.clientX, event.clientY, event, event.target as Element)
}

function onDragLeave(event: DragEvent) {
  const next = event.relatedTarget as Node | null
  const current = event.currentTarget as HTMLElement | null
  if (current && next && current.contains(next)) return
  if (store.hoverDropSlot?.refId === 'root') store.hoverDropSlot = null
}
</script>

<template>
  <div class="stage" data-drop-root="true" @dragover="onDragOver" @drop="onDrop">
    <div class="phone" @dragover="onDragOver" @drop="onDrop">
      <div class="bezel">
        <div class="status" :style="{ color: navColor, background: doc.page.navigationBarBackgroundColor }">
          <span>{{ clock }}</span>
          <span class="notch" />
          <span>100%</span>
        </div>
        <div
          class="navbar"
          :style="{
            color: navColor,
            background: doc.page.navigationBarBackgroundColor,
          }"
          @click="store.select({ kind: 'page' })"
        >
          {{ doc.page.title }}
        </div>
        <div
          class="screen"
          data-drop-id="root"
          :class="{ drop: insideRoot }"
          :style="{ background: doc.page.backgroundColor }"
          @dragover="onDragOver"
          @drop="onDrop"
          @dragleave="onDragLeave"
          @click.self="store.select({ kind: 'page' })"
        >
          <div v-if="!doc.nodes.length" class="empty">
            <strong>将组件拖到这里</strong>
            <span>可精确插入到行/列的前后或容器内</span>
          </div>
          <PreviewNode v-for="node in doc.nodes" :key="node.id" :node="node" />
        </div>
        <div
          v-if="doc.tabBar.enabled"
          class="tabbar"
          :style="{ background: doc.tabBar.backgroundColor }"
          @click="store.select({ kind: 'tabBar' })"
        >
          <div
            v-for="(item, index) in doc.tabBar.list"
            :key="item.id"
            class="tab"
            :style="{ color: index === 0 ? doc.tabBar.selectedColor : doc.tabBar.color }"
          >
            <i />
            <span>{{ item.text }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.stage {
  height: 100%;
  display: grid;
  place-items: center;
  padding: 24px;
}
.phone {
  width: 390px;
  height: min(760px, calc(100vh - 120px));
  background: var(--phone);
  border-radius: 42px;
  padding: 12px;
  box-shadow: 0 30px 80px rgba(17, 18, 23, 0.28);
}
.bezel {
  height: 100%;
  background: #fff;
  border-radius: 32px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.status {
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 18px;
  font-size: 11px;
  font-weight: 600;
  position: relative;
}
.notch {
  position: absolute;
  left: 50%;
  top: 6px;
  width: 92px;
  height: 18px;
  transform: translateX(-50%);
  background: #111;
  border-radius: 12px;
}
.navbar {
  height: 44px;
  display: grid;
  place-items: center;
  font-weight: 650;
  font-size: 16px;
  border-bottom: 1px solid rgba(0,0,0,.04);
}
.screen {
  flex: 1;
  overflow: auto;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.screen.drop { outline: 2px dashed var(--ok); outline-offset: -6px; }
.empty {
  margin: auto;
  display: flex;
  flex-direction: column;
  gap: 6px;
  color: #98a2b3;
  align-items: center;
  pointer-events: none;
}
.tabbar {
  display: flex;
  border-top: 1px solid #eceff5;
  min-height: 54px;
}
.tab {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  font-size: 11px;
}
.tab i {
  width: 18px;
  height: 18px;
  border-radius: 6px;
  background: currentColor;
  opacity: 0.35;
}
</style>
