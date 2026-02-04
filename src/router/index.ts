import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import HomeView from '@/views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      meta: { requiresAuth: true, requiresMember: true },
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      meta: { guest: true },
    },
    {
      path: '/signup',
      name: 'signup',
      component: () => import('@/views/SignupView.vue'),
      meta: { guest: true },
    },
    {
      path: '/member-select',
      name: 'member-select',
      component: () => import('@/views/MemberSelectView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/recipes',
      name: 'recipes',
      component: () => import('@/views/RecipesView.vue'),
      meta: { requiresAuth: true, requiresMember: true },
    },
    {
      path: '/recipes/:id',
      name: 'recipe-detail',
      component: () => import('@/views/RecipeDetailView.vue'),
      meta: { requiresAuth: true, requiresMember: true },
    },
    {
      path: '/meal-plans',
      name: 'meal-plans',
      component: () => import('@/views/MealPlansView.vue'),
      meta: { requiresAuth: true, requiresMember: true },
    },
    {
      path: '/requests',
      name: 'requests',
      component: () => import('@/views/RequestsView.vue'),
      meta: { requiresAuth: true, requiresMember: true },
    },
    {
      path: '/members',
      name: 'members',
      component: () => import('@/views/MembersView.vue'),
      meta: { requiresAuth: true, requiresMember: true },
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('@/views/SettingsView.vue'),
      meta: { requiresAuth: true, requiresMember: true },
    },
    // 404 Not Found - 最後に配置
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/views/NotFoundView.vue'),
    },
  ],
})

router.beforeEach((to, _from, next) => {
  const authStore = useAuthStore()

  // 未認証の場合
  if (!authStore.isAuthenticated) {
    // ゲストページ（ログイン・サインアップ）はOK
    if (to.meta.guest) {
      next()
      return
    }
    // それ以外（404含む）はすべてログインページへリダイレクト
    next({ name: 'login' })
    return
  }

  // 認証済みの場合
  // ゲストページにアクセスしようとした場合
  if (to.meta.guest) {
    // メンバー選択済みならホームへ、未選択ならメンバー選択へ
    if (authStore.hasSelectedMember) {
      next({ name: 'home' })
    } else {
      next({ name: 'member-select' })
    }
    return
  }

  // メンバー選択が必要なページ
  if (to.meta.requiresMember && !authStore.hasSelectedMember) {
    next({ name: 'member-select' })
    return
  }

  next()
})

export default router
