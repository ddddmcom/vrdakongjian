import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/login'
    },
    {
      path: '/login',
      name: 'Login',
      component: () => import('@/views/Login.vue')
    },
    {
      path: '/admin',
      name: 'AdminDashboard',
      component: () => import('@/views/admin/Dashboard.vue'),
      meta: { requiresAuth: true, role: 'admin' },
      children: [
        {
          path: 'shops',
          name: 'ShopManagement',
          component: () => import('@/views/admin/ShopManagement.vue')
        },
        {
          path: 'content',
          name: 'ContentManagement', 
          component: () => import('@/views/admin/ContentManagement.vue')
        },
        {
          path: 'monitoring',
          name: 'RealTimeMonitoring',
          component: () => import('@/views/admin/RealTimeMonitoring.vue')
        },
        {
          path: 'statistics',
          name: 'AdminStatistics',
          component: () => import('@/views/admin/Statistics.vue')
        }
      ]
    },
    {
      path: '/shop',
      name: 'ShopDashboard',
      component: () => import('@/views/shop/Dashboard.vue'),
      meta: { requiresAuth: true, role: 'shop' },
      children: [
        {
          path: 'content',
          name: 'ShopContent',
          component: () => import('@/views/shop/Content.vue')
        },
        {
          path: 'devices',
          name: 'DeviceControl',
          component: () => import('@/views/shop/DeviceControl.vue')
        },
        {
          path: 'statistics',
          name: 'ShopStatistics',
          component: () => import('@/views/shop/Statistics.vue')
        }
      ]
    }
  ]
})

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/login')
  } else if (to.meta.role && authStore.userRole !== to.meta.role) {
    next('/login')
  } else {
    next()
  }
})

export default router