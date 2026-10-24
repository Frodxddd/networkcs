import { createRouter, createWebHistory } from 'vue-router'
import DashboardView from '../views/DashboardView.vue'
import UnbanView from '../views/UnbanView.vue'
import AuditLogView from '../views/AuditLogView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'dashboard',
      component: DashboardView
    },
    {
      path: '/unban',
      name: 'unban',
      component: UnbanView
    },
    {
      path: '/logs',
      name: 'audit-logs',
      component: AuditLogView
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/'
    }
  ],
  scrollBehavior() {
    return { top: 0 }
  }
})

export default router
