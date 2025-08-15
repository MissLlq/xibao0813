import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
    {
        path: '/',
        name: 'Gallery',
        component: () => import('./pages/Gallery.vue'),
    },
]

export const router = createRouter({
    history: createWebHistory(),
    routes,
})

export default router


