<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { recipeApi, requestApi } from '@/api/client'
import type { Recipe, FoodRequest } from '@/types'

const authStore = useAuthStore()

const recentRecipes = ref<Recipe[]>([])
const activeRequests = ref<FoodRequest[]>([])
const loading = ref(true)

onMounted(async () => {
  if (authStore.isAuthenticated) {
    try {
      const [recipesRes, requestsRes] = await Promise.all([
        recipeApi.list({ limit: 6 }),
        requestApi.list({ status: 'active' }),
      ])
      recentRecipes.value = recipesRes.data.data.items || []
      activeRequests.value = requestsRes.data.data.requests || []
    } catch (error) {
      console.error('Failed to load data:', error)
    }
  }
  loading.value = false
})
</script>

<template>
  <div class="home">
    <template v-if="!authStore.isAuthenticated">
      <section class="hero">
        <h1>HomeOrder</h1>
        <p>家族のための献立管理アプリ</p>
        <div class="hero-actions">
          <RouterLink to="/signup" class="btn btn-primary">新規登録</RouterLink>
          <RouterLink to="/login" class="btn btn-secondary">ログイン</RouterLink>
        </div>
      </section>

      <section class="features">
        <div class="feature card">
          <div class="feature-icon">📝</div>
          <h3>レシピ管理</h3>
          <p>家族のお気に入りレシピを保存・整理</p>
        </div>
        <div class="feature card">
          <div class="feature-icon">📅</div>
          <h3>献立計画</h3>
          <p>週間献立を簡単に作成・共有</p>
        </div>
        <div class="feature card">
          <div class="feature-icon">🙋</div>
          <h3>リクエスト</h3>
          <p>家族からの「食べたい！」をキャッチ</p>
        </div>
      </section>
    </template>

    <template v-else>
      <section class="welcome">
        <h2>おかえりなさい、{{ authStore.user?.name }}さん</h2>
      </section>

      <div v-if="loading" class="loading">
        <div class="spinner"></div>
      </div>

      <template v-else>
        <section class="dashboard-section">
          <div class="card-header">
            <h3 class="card-title">アクティブなリクエスト</h3>
            <RouterLink to="/requests" class="btn btn-sm btn-secondary">すべて見る</RouterLink>
          </div>
          <div v-if="activeRequests.length === 0" class="empty-state">
            <div class="empty-state-icon">🙋</div>
            <p>アクティブなリクエストはありません</p>
          </div>
          <div v-else class="requests-list">
            <div v-for="request in activeRequests.slice(0, 3)" :key="request.id" class="request-item card">
              <span class="request-comment">{{ request.comment || 'コメントなし' }}</span>
              <span v-if="request.recipe" class="request-recipe">
                {{ request.recipe.image_icon }} {{ request.recipe.name }}
              </span>
            </div>
          </div>
        </section>

        <section class="dashboard-section">
          <div class="card-header">
            <h3 class="card-title">最近のレシピ</h3>
            <RouterLink to="/recipes" class="btn btn-sm btn-secondary">すべて見る</RouterLink>
          </div>
          <div v-if="recentRecipes.length === 0" class="empty-state">
            <div class="empty-state-icon">📝</div>
            <p>レシピがまだありません</p>
            <RouterLink to="/recipes" class="btn btn-primary">レシピを追加</RouterLink>
          </div>
          <div v-else class="grid grid-3">
            <RouterLink
              v-for="recipe in recentRecipes"
              :key="recipe.id"
              :to="`/recipes/${recipe.id}`"
              class="recipe-card card"
            >
              <div class="recipe-icon">{{ recipe.image_icon || '🍽️' }}</div>
              <h4>{{ recipe.name }}</h4>
              <p class="recipe-meta">
                <span v-if="recipe.cooking_time">⏱️ {{ recipe.cooking_time }}分</span>
                <span>❤️ {{ recipe.like_count || 0 }}</span>
              </p>
            </RouterLink>
          </div>
        </section>
      </template>
    </template>
  </div>
</template>

<style scoped>
.hero {
  text-align: center;
  padding: 4rem 2rem;
  background: linear-gradient(135deg, #ff7043 0%, #ff8a65 100%);
  border-radius: var(--radius-lg);
  color: white;
  margin-bottom: 2rem;
  box-shadow: 0 8px 32px rgba(255, 112, 67, 0.25);
}

.hero h1 {
  font-size: 2.5rem;
  margin: 0 0 0.75rem;
  font-weight: 700;
}

.hero p {
  font-size: 1.125rem;
  margin: 0 0 2rem;
  opacity: 0.9;
}

.hero-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: center;
}

.hero-actions .btn-primary {
  background: white;
  color: #ff7043;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.hero-actions .btn-primary:hover {
  background: #fff;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.hero-actions .btn-secondary {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.hero-actions .btn-secondary:hover {
  background: rgba(255, 255, 255, 0.3);
}

.features {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
}

@media (max-width: 768px) {
  .features {
    grid-template-columns: 1fr;
  }

  .hero h1 {
    font-size: 2rem;
  }

  .hero {
    padding: 3rem 1.5rem;
  }
}

.feature {
  text-align: center;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.feature:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-hover);
}

.feature-icon {
  font-size: 2.5rem;
  margin-bottom: 1rem;
  display: block;
}

.feature h3 {
  margin: 0 0 0.5rem;
  color: var(--color-text);
  font-size: 1rem;
  font-weight: 600;
}

.feature p {
  margin: 0;
  color: var(--color-text-light);
  font-size: 0.875rem;
}

.welcome {
  margin-bottom: 2rem;
}

.welcome h2 {
  margin: 0;
  color: var(--color-text);
  font-size: 1.25rem;
  font-weight: 600;
}

.dashboard-section {
  margin-bottom: 2rem;
}

.dashboard-section .card-header {
  background: transparent;
  padding: 0;
  margin-bottom: 1rem;
}

.requests-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.request-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: box-shadow 0.2s ease;
}

.request-item:hover {
  box-shadow: var(--shadow-hover);
}

.request-comment {
  font-weight: 500;
  color: var(--color-text);
}

.request-recipe {
  color: var(--color-text-light);
  background: var(--color-secondary);
  padding: 0.25rem 0.625rem;
  border-radius: var(--radius-sm);
  font-size: 0.8125rem;
}

.recipe-card {
  text-decoration: none;
  color: inherit;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.recipe-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-hover);
  text-decoration: none;
}

.recipe-icon {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
  display: block;
}

.recipe-card h4 {
  margin: 0 0 0.375rem;
  color: var(--color-text);
  font-size: 1rem;
  font-weight: 600;
}

.recipe-meta {
  display: flex;
  gap: 0.75rem;
  color: var(--color-text-light);
  font-size: 0.8125rem;
  margin: 0;
}

.recipe-meta span {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}
</style>
