
import { createRouter, createWebHashHistory } from 'vue-router';

const routes = [
  { path: '/', redirect: '/character' },
  { path: '/character', component: () => import('../views/Character.vue') },
  { path: '/outline', component: () => import('../views/Outline.vue') },
  { path: '/chapter', component: () => import('../views/Chapter.vue') },
  { path: '/expansion', component: () => import('../views/Expansion.vue') },
  { path: '/knowledge-base', component: () => import('../views/KnowledgeBase.vue') },
  { path: '/settings', component: () => import('../views/Settings.vue') },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

export default router;
