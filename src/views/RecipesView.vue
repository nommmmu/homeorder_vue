<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { recipeApi } from '@/api/client'
import type { Recipe, Pagination } from '@/types'

const recipes = ref<Recipe[]>([])
const pagination = ref<Pagination | null>(null)
const loading = ref(true)
const searchQuery = ref('')
const showCreateModal = ref(false)

const newRecipe = ref({
  name: '',
  description: '',
  image_icon: '🍽️',
  cooking_time: 30,
  servings: 2,
  difficulty: 'medium' as const,
})

async function loadRecipes(page = 1) {
  loading.value = true
  try {
    const response = await recipeApi.list({ page, limit: 12 })
    recipes.value = response.data.data.items || []
    pagination.value = response.data.data.pagination
  } catch (error) {
    console.error('Failed to load recipes:', error)
  } finally {
    loading.value = false
  }
}

async function searchRecipes() {
  if (!searchQuery.value || searchQuery.value.length < 2) {
    await loadRecipes()
    return
  }

  loading.value = true
  try {
    const response = await recipeApi.search(searchQuery.value)
    recipes.value = response.data.data.recipes || []
    pagination.value = null
  } catch (error) {
    console.error('Failed to search recipes:', error)
  } finally {
    loading.value = false
  }
}

async function createRecipe() {
  try {
    await recipeApi.create(newRecipe.value)
    showCreateModal.value = false
    newRecipe.value = {
      name: '',
      description: '',
      image_icon: '🍽️',
      cooking_time: 30,
      servings: 2,
      difficulty: 'medium',
    }
    await loadRecipes()
  } catch (error) {
    console.error('Failed to create recipe:', error)
  }
}

async function toggleLike(recipe: Recipe) {
  try {
    const response = await recipeApi.toggleLike(recipe.id)
    recipe.is_liked = response.data.data.liked
    recipe.like_count = response.data.data.like_count
  } catch (error) {
    console.error('Failed to toggle like:', error)
  }
}

onMounted(() => {
  loadRecipes()
})
</script>

<template>
  <div class="recipes-page">
    <div class="page-header">
      <h2>レシピ</h2>
      <button @click="showCreateModal = true" class="btn btn-primary">
        + レシピを追加
      </button>
    </div>

    <div class="search-bar">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="レシピを検索..."
        @input="searchRecipes"
      />
    </div>

    <div v-if="loading" class="loading">
      <div class="spinner"></div>
    </div>

    <template v-else>
      <div v-if="recipes.length === 0" class="empty-state">
        <div class="empty-state-icon">📝</div>
        <p>レシピがありません</p>
        <button @click="showCreateModal = true" class="btn btn-primary">
          最初のレシピを追加
        </button>
      </div>

      <div v-else class="grid grid-3">
        <RouterLink
          v-for="recipe in recipes"
          :key="recipe.id"
          :to="`/recipes/${recipe.id}`"
          class="recipe-card card"
        >
          <div class="recipe-icon">{{ recipe.image_icon || '🍽️' }}</div>
          <h4>{{ recipe.name }}</h4>
          <p v-if="recipe.description" class="recipe-description">
            {{ recipe.description }}
          </p>
          <div class="recipe-meta">
            <span v-if="recipe.cooking_time">⏱️ {{ recipe.cooking_time }}分</span>
            <span v-if="recipe.servings">👥 {{ recipe.servings }}人前</span>
          </div>
          <div class="recipe-actions">
            <button
              @click.prevent="toggleLike(recipe)"
              class="like-btn"
              :class="{ liked: recipe.is_liked }"
            >
              {{ recipe.is_liked ? '❤️' : '🤍' }} {{ recipe.like_count || 0 }}
            </button>
          </div>
        </RouterLink>
      </div>

      <div v-if="pagination && pagination.total_pages > 1" class="pagination">
        <button
          v-for="page in pagination.total_pages"
          :key="page"
          @click="loadRecipes(page)"
          class="btn btn-sm"
          :class="{ 'btn-primary': page === pagination.current_page, 'btn-secondary': page !== pagination.current_page }"
        >
          {{ page }}
        </button>
      </div>
    </template>

    <!-- Create Modal -->
    <div v-if="showCreateModal" class="modal-overlay" @click.self="showCreateModal = false">
      <div class="modal card">
        <h3>新しいレシピ</h3>
        <form @submit.prevent="createRecipe">
          <div class="form-group">
            <label for="recipe-icon">アイコン</label>
            <input
              id="recipe-icon"
              v-model="newRecipe.image_icon"
              type="text"
              maxlength="2"
            />
          </div>

          <div class="form-group">
            <label for="recipe-name">名前 *</label>
            <input
              id="recipe-name"
              v-model="newRecipe.name"
              type="text"
              required
            />
          </div>

          <div class="form-group">
            <label for="recipe-description">説明</label>
            <textarea
              id="recipe-description"
              v-model="newRecipe.description"
              rows="3"
            ></textarea>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="cooking-time">調理時間（分）</label>
              <input
                id="cooking-time"
                v-model.number="newRecipe.cooking_time"
                type="number"
                min="1"
              />
            </div>

            <div class="form-group">
              <label for="servings">人数</label>
              <input
                id="servings"
                v-model.number="newRecipe.servings"
                type="number"
                min="1"
              />
            </div>

            <div class="form-group">
              <label for="difficulty">難易度</label>
              <select id="difficulty" v-model="newRecipe.difficulty">
                <option value="easy">簡単</option>
                <option value="medium">普通</option>
                <option value="hard">難しい</option>
              </select>
            </div>
          </div>

          <div class="modal-actions">
            <button type="button" @click="showCreateModal = false" class="btn btn-secondary">
              キャンセル
            </button>
            <button type="submit" class="btn btn-primary">
              作成
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.page-header h2 {
  margin: 0;
}

.search-bar {
  margin-bottom: 1.5rem;
}

.search-bar input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
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
  font-size: 3rem;
  margin-bottom: 0.5rem;
}

.recipe-card h4 {
  margin: 0 0 0.5rem;
}

.recipe-description {
  color: #666;
  font-size: 0.875rem;
  margin: 0 0 0.5rem;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.recipe-meta {
  display: flex;
  gap: 1rem;
  color: #666;
  font-size: 0.875rem;
  margin-bottom: 0.5rem;
}

.recipe-actions {
  display: flex;
  justify-content: flex-end;
}

.like-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1rem;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  transition: background 0.2s;
}

.like-btn:hover {
  background: #f5f5f5;
}

.like-btn.liked {
  color: #e53935;
}

.pagination {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 2rem;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal {
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal h3 {
  margin: 0 0 1.5rem;
}

.form-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1.5rem;
}
</style>
