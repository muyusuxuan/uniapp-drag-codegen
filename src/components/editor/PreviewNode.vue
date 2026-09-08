<script setup lang="ts">
import { computed } from 'vue'
import type { CanvasNode } from '@/types/editor'
import { useEditorStore, type ResizeEdge } from '@/store/editor'
import { canHaveChildren } from '@/utils/tree'
import { allowDrop } from '@/utils/dnd'

defineOptions({ name: 'PreviewNode' })

const props = defineProps<{
  node: CanvasNode
}>()

const store = useEditorStore()

const isContainer = computed(() => canHaveChildren(props.node.type))
const active = computed(() => store.selection?.kind === 'node' && store.selection.id === props.node.id)
const dragging = computed(() => store.pointerDragging && store.draggingNodeId === props.node.id)
const dropInside = computed(
  () => store.hoverDropSlot?.placement === 'inside' && store.hoverDropSlot.refId === props.node.id,
)
const cssVars = computed(() => styleToCss(props.node.style))

function styleToCss(style: CanvasNode['style']): Record<string, string> {
  const out: Record<string, string> = {}
  if (style.width) out.width = style.width
  if (style.height) out.height = style.height
  if (style.minWidth) out.minWidth = style.minWidth
  if (style.minHeight) out.minHeight = style.minHeight
  if (style.padding) out.padding = style.padding
  if (style.margin) out.margin = style.margin
  if (style.backgroundColor) out.backgroundColor = style.backgroundColor
  if (style.color) out.color = style.color
  if (style.fontSize) out.fontSize = style.fontSize
  if (style.fontWeight) out.fontWeight = style.fontWeight
  if (style.textAlign) out.textAlign = style.textAlign
  if (style.lineHeight) out.lineHeight = style.lineHeight
  if (style.borderRadius) out.borderRadius = style.borderRadius
  if (style.border) out.border = style.border
  if (style.display) out.display = style.display
  if (style.flexDirection) out.flexDirection = style.flexDirection
  if (style.flexWrap) out.flexWrap = style.flexWrap
  if (style.justifyContent) out.justifyContent = style.justifyContent
  if (style.alignItems) out.alignItems = style.alignItems
  if (style.gap) out.gap = style.gap
  if (style.flex) out.flex = style.flex
  if (style.overflow) out.overflow = style.overflow
  if (style.position) out.position = style.position
  if (style.left) out.left = style.left
  if (style.top) out.top = style.top
  return out
}

function select(event: Event) {
  event.stopPropagation()
  if (store.consumeClickSuppressed()) return
  store.select({ kind: 'node', id: props.node.id })
}

function onPointerDown(event: PointerEvent) {
  if (event.button !== 0) return
  if ((event.target as HTMLElement | null)?.closest('[data-resize]')) return
  event.stopPropagation()
  store.select({ kind: 'node', id: props.node.id })
  store.beginPointer('node', props.node.id, event.clientX, event.clientY)
}

function onDragOver(event: DragEvent) {
  allowDrop(event, store.draggingNodeId ? 'move' : 'copy')
  event.stopPropagation()
  store.hoverAt(event.clientX, event.clientY, event.currentTarget as Element)
}

function onDrop(event: DragEvent) {
  event.preventDefault()
  event.stopPropagation()
  store.dropAtPoint(event.clientX, event.clientY, event, event.currentTarget as Element)
}

function imageSrc(src?: string) {
  if (!src || src.startsWith('/static/')) return ''
  return src
}

function onResizeDown(edge: ResizeEdge, event: PointerEvent) {
  event.preventDefault()
  event.stopPropagation()
  const el = event.currentTarget as HTMLElement
  const wrap = el.closest('[data-node-id]') as HTMLElement | null
  const rect = wrap?.getBoundingClientRect()
  if (!rect) return
  store.beginResize(props.node.id, edge, event.clientX, event.clientY, rect.width, rect.height)
}

const slides = computed(() =>
  [props.node.props.src1, props.node.props.src2, props.node.props.src3].filter(Boolean) as string[],
)
</script>

<template>
  <div
    class="wrap"
    :data-node-id="node.id"
    :data-drop-id="node.id"
    :class="[
      `is-${node.type}`,
      {
        active,
        drop: dropInside,
        dragging,
        container: isContainer,
      },
    ]"
    :style="cssVars"
    @click="select"
    @pointerdown="onPointerDown"
    @dragover="onDragOver"
    @drop="onDrop"
  >
    <template v-if="node.type === 'view' || node.type === 'row' || node.type === 'scroll-view'">
      <PreviewNode v-for="child in node.children" :key="child.id" :node="child" />
      <p v-if="!node.children?.length" class="slot" :class="{ row: node.type === 'row' || node.style.flexDirection === 'row' }">
        {{
          node.type === 'scroll-view'
            ? '滚动区域，拖入子组件'
            : node.type === 'row' || node.style.flexDirection === 'row'
              ? '横向：拖入多个组件到同一行'
              : '纵向：拖入子组件'
        }}
      </p>
    </template>

    <template v-else-if="node.type === 'text'">{{ node.props.text }}</template>

    <template v-else-if="node.type === 'button'">{{ node.props.text }}</template>

    <template v-else-if="node.type === 'image'">
      <img v-if="imageSrc(node.props.src)" :src="imageSrc(node.props.src)" alt="" />
      <div v-else class="ph">图片占位</div>
    </template>

    <input
      v-else-if="node.type === 'input'"
      class="uni-input"
      :placeholder="node.props.placeholder"
      :value="node.props.value"
      readonly
    />

    <template v-else-if="node.type === 'swiper'">
      <div class="slide">
        <img v-if="imageSrc(slides[0])" :src="imageSrc(slides[0])" alt="" />
        <div v-else class="ph">轮播占位</div>
      </div>
      <div class="dots">
        <i v-for="i in (slides.length || 3)" :key="i" :class="{ on: i === 1 }" />
      </div>
    </template>

    <template v-else-if="node.type === 'navigator'">
      <span>{{ node.props.text }}</span>
      <span class="arrow">›</span>
    </template>

    <template v-if="active && !dragging">
      <i data-resize="e" class="handle e" @pointerdown="onResizeDown('e', $event)" />
      <i data-resize="s" class="handle s" @pointerdown="onResizeDown('s', $event)" />
      <i data-resize="se" class="handle se" @pointerdown="onResizeDown('se', $event)" />
    </template>
  </div>
</template>

<style scoped>
.wrap {
  position: relative;
  box-sizing: border-box;
  min-width: 0;
  outline: 1px solid transparent;
  border-radius: 6px;
  user-select: none;
  touch-action: none;
}
.wrap.active { outline: 1.5px solid var(--accent); outline-offset: 1px; }
.wrap.drop { outline: 1.5px dashed var(--ok); background: rgba(7, 193, 96, 0.08); }
.wrap.dragging { opacity: 0.28; pointer-events: none; }
.wrap.container { min-height: 36px; }
.wrap.is-scroll-view { overflow: auto; }
.wrap.is-text { display: block; white-space: pre-wrap; word-break: break-word; }
.wrap.is-button {
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
}
.wrap.is-image, .wrap.is-swiper { overflow: hidden; }
.wrap.is-image img, .slide img { width: 100%; height: 100%; object-fit: cover; display: block; }
.wrap.is-input, .uni-input {
  border: none;
  outline: none;
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  background: transparent;
  color: inherit;
  font: inherit;
  pointer-events: none;
}
.wrap.is-navigator {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.arrow { color: #c0c6d4; font-size: 18px; }
.ph {
  width: 100%;
  height: 100%;
  min-height: 80px;
  display: grid;
  place-items: center;
  background: linear-gradient(135deg, #2b6cff, #7aa2ff);
  color: #fff;
  font-size: 13px;
  letter-spacing: 0.08em;
}
.slot {
  margin: 0;
  color: #b0b8c7;
  font-size: 12px;
  text-align: center;
  flex: 1;
  min-width: 72px;
  min-height: 48px;
  display: grid;
  place-items: center;
  pointer-events: none;
  border: 1px dashed #d5def0;
  border-radius: 8px;
}
.slot.row {
  min-height: 64px;
  border-style: dashed;
  color: #5b6b8c;
  background: repeating-linear-gradient(
    90deg,
    rgba(43, 108, 255, 0.04),
    rgba(43, 108, 255, 0.04) 48%,
    transparent 48%,
    transparent 52%
  );
}
.dots {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 8px;
  display: flex;
  justify-content: center;
  gap: 5px;
}
.dots i { width: 6px; height: 6px; border-radius: 50%; background: rgba(255,255,255,.55); display: block; }
.dots i.on { background: #fff; }
.handle {
  position: absolute;
  z-index: 3;
  background: var(--accent);
  border: 2px solid #fff;
  box-shadow: 0 1px 4px rgba(18, 24, 38, 0.2);
}
.handle.e {
  top: 50%;
  right: -5px;
  width: 9px;
  height: 18px;
  border-radius: 99px;
  transform: translateY(-50%);
  cursor: ew-resize;
}
.handle.s {
  left: 50%;
  bottom: -5px;
  width: 18px;
  height: 9px;
  border-radius: 99px;
  transform: translateX(-50%);
  cursor: ns-resize;
}
.handle.se {
  right: -5px;
  bottom: -5px;
  width: 10px;
  height: 10px;
  border-radius: 2px;
  cursor: nwse-resize;
}
</style>
