<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { recipeApi } from '@/api/client'
import type { Recipe } from '@/types'

const route = useRoute()
const router = useRouter()

const recipe = ref<Recipe | null>(null)
const loading = ref(true)
const error = ref('')

async function loadRecipe() {
  loading.value = true
  error.value = ''

  try {
    const response = await recipeApi.get(route.params.id as string)
    recipe.value = response.data.data.recipe
  } catch (err) {
    error.value = 'レシピの読み込みに失敗しました'
    console.error('Failed to load recipe:', err)
  } finally {
    loading.value = false
  }
}

async function toggleLike() {
  if (!recipe.value) return

  try {
    const response = await recipeApi.toggleLike(recipe.value.id)
    recipe.value.is_liked = response.data.data.liked
    recipe.value.like_count = response.data.data.like_count
  } catch (err) {
    console.error('Failed to toggle like:', err)
  }
}

async function deleteRecipe() {
  if (!recipe.value || !confirm('このレシピを削除しますか？')) return

  try {
    await recipeApi.delete(recipe.value.id)
    router.push('/recipes')
  } catch (err) {
    console.error('Failed to delete recipe:', err)
  }
}

function getDifficultyLabel(difficulty: string | undefined) {
  switch (difficulty) {
    case 'easy':
      return '簡単'
    case 'medium':
      return '普通'
    case 'hard':
      return '難しい'
    default:
      return ''
  }
}

onMounted(() => {
  loadRecipe()
})
</script>

<template>
  <div class="recipe-detail-page">
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
    </div>

    <div v-else-if="error" class="alert alert-error">
      {{ error }}
    </div>

    <template v-else-if="recipe">
      <div class="recipe-header">
        <RouterLink to="/recipes" class="back-link">← レシピ一覧に戻る</RouterLink>

        <div class="recipe-title-section">
          <span class="recipe-icon">{{ recipe.image_icon || '🍽️' }}</span>
          <div>
            <h1>{{ recipe.name }}</h1>
            <div class="recipe-meta">
              <span v-if="recipe.cooking_time">⏱️ {{ recipe.cooking_time }}分</span>
              <span v-if="recipe.servings">👥 {{ recipe.servings }}人前</span>
              <span v-if="recipe.difficulty">📊 {{ getDifficultyLabel(recipe.difficulty) }}</span>
            </div>
          </div>
        </div>

        <div class="recipe-actions">
          <button @click="toggleLike" class="btn" :class="recipe.is_liked ? 'btn-primary' : 'btn-secondary'">
            {{ recipe.is_liked ? '❤️' : '🤍' }} {{ recipe.like_count || 0 }}
          </button>
          <button @click="deleteRecipe" class="btn btn-danger">
            削除
          </button>
        </div>
      </div>

      <div class="recipe-content">
        <div v-if="recipe.description" class="card recipe-description">
          <h3>説明</h3>
          <p>{{ recipe.description }}</p>
        </div>

        <div v-if="recipe.ingredients && recipe.ingredients.length > 0" class="card">
          <h3>材料</h3>
          <ul class="ingredients-list">
            <li v-for="(ingredient, index) in recipe.ingredients" :key="index">
              <span class="ingredient-name">{{ ingredient.name }}</span>
              <span class="ingredient-amount">
                {{ ingredient.amount }}{{ ingredient.unit }}
              </span>
            </li>
          </ul>
        </div>

        <div v-if="recipe.steps && recipe.steps.length > 0" class="card">
          <h3>作り方</h3>
          <ol class="steps-list">
            <li v-for="step in recipe.steps" :key="step.step_number">
              {{ step.description }}
            </li>
          </ol>
        </div>

        <div v-if="recipe.memo" class="card">
          <h3>メモ</h3>
          <p>{{ recipe.memo }}</p>
        </div>

        <div v-if="recipe.tags && recipe.tags.length > 0" class="tags">
          <span v-for="tag in recipe.tags" :key="tag" class="tag">
            {{ tag }}
          </span>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.back-link {
  display: inline-block;
  margin-bottom: 1rem;
  color: #667eea;
}

.recipe-header {
  margin-bottom: 2rem;
}

.recipe-title-section {
  display: flex;
  align-items: flex-start;
  gap: 1.5rem;
  margin-bottom: 1rem;
}

.recipe-icon {
  font-size: 4rem;
}

.recipe-title-section h1 {
  margin: 0 0 0.5rem;
}

.recipe-meta {
  display: flex;
  gap: 1.5rem;
  color: #666;
}

.recipe-actions {
  display: flex;
  gap: 1rem;
}

.recipe-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.recipe-content h3 {
  margin: 0 0 1rem;
  border-bottom: 1px solid #eee;
  padding-bottom: 0.5rem;
}

.ingredients-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.ingredients-list li {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
  border-bottom: 1px solid #f5f5f5;
}

.ingredients-list li:last-child {
  border-bottom: none;
}

.ingredient-name {
  font-weight: 500;
}

.ingredient-amount {
  color: #666;
}

.steps-list {
  padding-left: 1.5rem;
  margin: 0;
}

.steps-list li {
  margin-bottom: 1rem;
  padding-left: 0.5rem;
}

.steps-list li:last-child {
  margin-bottom: 0;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.tag {
  background: #e3f2fd;
  color: #1976d2;
  padding: 0.25rem 0.75rem;
  border-radius: 16px;
  font-size: 0.875rem;
}
</style>
