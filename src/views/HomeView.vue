<script setup lang="ts">
import { useRouter } from 'vue-router'
import { allModes } from '@/modes/registry'

const router = useRouter()

function enter(modeId: string, available: boolean) {
  if (!available) return
  router.push({ name: 'editor', params: { modeId } })
}
</script>

<template>
  <div class="home">
    <header class="hero">
      <div class="brand">
        <span class="mark">U</span>
        <div>
          <p class="kicker">可视化代码生成</p>
          <h1>拖拽搭建，导出完整 UniApp 工程</h1>
        </div>
      </div>
      <p class="lead">
        从左侧组件库拖入按钮、文本、图片、容器与底部标签栏，右侧手机框实时预览。
        导出即可得到可在 HBuilderX / CLI 打开的 Vue3 uni-app 项目。
      </p>
    </header>

    <section class="modes">
      <h2>选择生成模式</h2>
      <p class="hint">模式决定导出语法与目录结构。当前主模式为 UniApp，后续可继续扩展。</p>
      <div class="grid">
        <button
          v-for="mode in allModes"
          :key="mode.id"
          class="card"
          :class="{ locked: !mode.available }"
          type="button"
          @click="enter(mode.id, mode.available)"
        >
          <div class="card-top">
            <span class="dot" :style="{ background: mode.accent }" />
            <span class="tag">{{ mode.available ? '可用' : '即将推出' }}</span>
          </div>
          <h3>{{ mode.name }}</h3>
          <p class="tagline">{{ mode.tagline }}</p>
          <p class="desc">{{ mode.description }}</p>
          <span class="cta">{{ mode.available ? '进入编辑器' : '暂未开放' }}</span>
        </button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.home {
  min-height: 100vh;
  padding: 56px 28px 80px;
  max-width: 1080px;
  margin: 0 auto;
}
.hero { margin-bottom: 48px; }
.brand { display: flex; gap: 16px; align-items: center; }
.mark {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  background: var(--accent);
  color: #fff;
  display: grid;
  place-items: center;
  font-weight: 800;
  font-size: 24px;
  box-shadow: 0 10px 24px rgba(43, 108, 255, 0.28);
}
.kicker {
  margin: 0;
  color: var(--accent-ink);
  font-size: 12px;
  letter-spacing: 0.14em;
  font-weight: 700;
}
h1 {
  margin: 4px 0 0;
  font-size: 36px;
  letter-spacing: -0.03em;
  line-height: 1.2;
}
.lead {
  max-width: 720px;
  color: var(--muted);
  font-size: 16px;
  line-height: 1.7;
  margin: 18px 0 0;
}
.modes h2 { margin: 0 0 6px; font-size: 20px; }
.hint { margin: 0 0 20px; color: var(--muted); }
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}
.card {
  text-align: left;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 18px;
  padding: 20px;
  box-shadow: var(--shadow);
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 230px;
  transition: transform 0.15s ease, border-color 0.15s ease;
}
.card:hover:not(.locked) {
  transform: translateY(-3px);
  border-color: #c9d7ff;
}
.card.locked {
  opacity: 0.62;
  cursor: not-allowed;
}
.card-top { display: flex; justify-content: space-between; align-items: center; }
.dot { width: 10px; height: 10px; border-radius: 50%; }
.tag {
  font-size: 12px;
  color: var(--accent-ink);
  background: var(--accent-soft);
  padding: 3px 8px;
  border-radius: 99px;
}
.locked .tag { background: #eef0f4; color: var(--muted); }
h3 { margin: 8px 0 0; font-size: 22px; }
.tagline { margin: 0; color: var(--accent-ink); font-weight: 600; }
.desc { margin: 0; color: var(--muted); line-height: 1.6; flex: 1; }
.cta {
  margin-top: 8px;
  font-weight: 700;
  color: var(--accent);
}
.locked .cta { color: var(--muted); }
</style>
