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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  color: white;
  margin-bottom: 2rem;
}

.hero h1 {
  font-size: 3rem;
  margin: 0 0 1rem;
}

.hero p {
  font-size: 1.25rem;
  margin: 0 0 2rem;
  opacity: 0.9;
}

.hero-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.hero-actions .btn-secondary {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
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
}

.feature {
  text-align: center;
}

.feature-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.feature h3 {
  margin: 0 0 0.5rem;
}

.feature p {
  margin: 0;
  color: #666;
}

.welcome {
  margin-bottom: 2rem;
}

.welcome h2 {
  margin: 0;
}

.dashboard-section {
  margin-bottom: 2rem;
}

.requests-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.request-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.request-comment {
  font-weight: 500;
}

.request-recipe {
  color: #666;
}

.recipe-card {
  text-decoration: none;
  color: inherit;
  transition: transform 0.2s, box-shadow 0.2s;
}

.recipe-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  text-decoration: none;
}

.recipe-icon {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
}

.recipe-card h4 {
  margin: 0 0 0.5rem;
}

.recipe-meta {
  display: flex;
  gap: 1rem;
  color: #666;
  font-size: 0.875rem;
  margin: 0;
}
</style>
