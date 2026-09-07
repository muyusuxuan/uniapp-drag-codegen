import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import EditorView from '@/views/EditorView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/editor/:modeId', name: 'editor', component: EditorView, props: true },
  ],
})

export default router
