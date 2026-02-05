<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { recipeApi, tagApi } from '@/api/client'
import type { Recipe, Tag } from '@/types'

const recipes = ref<Recipe[]>([])
const loading = ref(false)
const hasSearched = ref(false)
const totalResults = ref(0)

// 検索条件
const searchName = ref('')
const searchIngredient = ref('')
const selectedTagIds = ref<string[]>([])
const recentlyCooked = ref<string>('')

// タグ
const allTags = ref<Tag[]>([])
const loadingTags = ref(false)

async function loadTags() {
  loadingTags.value = true
  try {
    const response = await tagApi.list()
    allTags.value = response.data.data.tags || []
  } catch (error) {
    console.error('Failed to load tags:', error)
  } finally {
    loadingTags.value = false
  }
}

function toggleTag(tagId: string) {
  const index = selectedTagIds.value.indexOf(tagId)
  if (index >= 0) {
    selectedTagIds.value.splice(index, 1)
  } else {
    selectedTagIds.value.push(tagId)
  }
}

async function search() {
  loading.value = true
  hasSearched.value = true
  try {
    const response = await recipeApi.advancedSearch({
      name: searchName.value || undefined,
      ingredient: searchIngredient.value || undefined,
      tag_ids: selectedTagIds.value.length > 0 ? selectedTagIds.value : undefined,
      recently_cooked: recentlyCooked.value || undefined,
    })
    recipes.value = response.data.data.recipes || []
    totalResults.value = response.data.data.total || 0
  } catch (error) {
    console.error('Failed to search recipes:', error)
  } finally {
    loading.value = false
  }
}

function clearSearch() {
  searchName.value = ''
  searchIngredient.value = ''
  selectedTagIds.value = []
  recentlyCooked.value = ''
  recipes.value = []
  hasSearched.value = false
  totalResults.value = 0
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
  loadTags()
})
</script>

<template>
  <div class="search-page">
    <div class="page-header">
      <h2>レシピ検索</h2>
      <RouterLink to="/recipes" class="btn btn-secondary btn-sm">
        一覧に戻る
      </RouterLink>
    </div>

    <!-- 検索条件パネル -->
    <div class="search-panel card">
      <div class="search-fields">
        <div class="form-group">
          <label for="search-name">レシピ名</label>
          <input
            id="search-name"
            v-model="searchName"
            type="text"
            placeholder="レシピ名で検索..."
            @keydown.enter="search"
          />
        </div>

        <div class="form-group">
          <label for="search-ingredient">材料名</label>
          <input
            id="search-ingredient"
            v-model="searchIngredient"
            type="text"
            placeholder="材料名で検索..."
            @keydown.enter="search"
          />
        </div>
      </div>

      <div v-if="allTags.length > 0" class="search-section">
        <label class="section-label">タグ</label>
        <div class="tag-filter">
          <button
            v-for="tag in allTags"
            :key="tag.id"
            class="tag-chip"
            :class="{ active: selectedTagIds.includes(tag.id) }"
            :style="selectedTagIds.includes(tag.id)
              ? { backgroundColor: tag.color, borderColor: tag.color, color: '#fff' }
              : { borderColor: tag.color, color: tag.color }"
            @click="toggleTag(tag.id)"
          >
            <span class="tag-chip-dot" :style="{ backgroundColor: selectedTagIds.includes(tag.id) ? '#fff' : tag.color }"></span>
            {{ tag.name }}
          </button>
        </div>
      </div>

      <div class="search-section">
        <label class="section-label">最近作ったかどうか</label>
        <div class="radio-group">
          <label class="radio-label">
            <input
              v-model="recentlyCooked"
              type="radio"
              name="recently_cooked"
              value=""
            />
            <span>指定なし</span>
          </label>
          <label class="radio-label">
            <input
              v-model="recentlyCooked"
              type="radio"
              name="recently_cooked"
              value="true"
            />
            <span>最近作った（2週間以内）</span>
          </label>
          <label class="radio-label">
            <input
              v-model="recentlyCooked"
              type="radio"
              name="recently_cooked"
              value="false"
            />
            <span>しばらく作ってない</span>
          </label>
        </div>
      </div>

      <div class="search-actions">
        <button @click="clearSearch" class="btn btn-secondary">
          クリア
        </button>
        <button @click="search" class="btn btn-primary">
          検索
        </button>
      </div>
    </div>

    <!-- 検索結果 -->
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
    </div>

    <template v-else-if="hasSearched">
      <div class="results-header">
        <p class="results-count">検索結果: {{ totalResults }}件</p>
      </div>

      <div v-if="recipes.length === 0" class="empty-state">
        <div class="empty-state-icon">🔍</div>
        <p>条件に合うレシピが見つかりませんでした</p>
      </div>

      <div v-else class="grid grid-3">
        <RouterLink
          v-for="recipe in recipes"
          :key="recipe.id"
          :to="`/recipes/${recipe.id}`"
          class="recipe-card card"
        >
          <div v-if="recipe.image_url" class="recipe-image">
            <img :src="recipe.image_url.startsWith('http') || recipe.image_url.startsWith('/storage/') ? recipe.image_url : `/storage/${recipe.image_url}`" :alt="recipe.name" />
          </div>
          <div v-else class="recipe-icon">{{ recipe.image_icon || '🍽️' }}</div>
          <h4>{{ recipe.name }}</h4>
          <p v-if="recipe.description" class="recipe-description">
            {{ recipe.description }}
          </p>
          <div v-if="recipe.tags && recipe.tags.length > 0" class="recipe-tags">
            <span
              v-for="tag in recipe.tags"
              :key="tag.id"
              class="recipe-tag"
              :style="{ backgroundColor: tag.color + '20', color: tag.color, borderColor: tag.color + '40' }"
            >
              <span class="recipe-tag-dot" :style="{ backgroundColor: tag.color }"></span>
              {{ tag.name }}
            </span>
          </div>
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
    </template>
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
  font-size: 1.25rem;
  font-weight: 600;
}

.search-panel {
  margin-bottom: 2rem;
}

.search-fields {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1.25rem;
}

@media (max-width: 640px) {
  .search-fields {
    grid-template-columns: 1fr;
  }
}

.search-section {
  margin-bottom: 1.25rem;
}

.section-label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: var(--color-text);
  font-size: 0.9rem;
}

.tag-filter {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.tag-chip {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.875rem;
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-full);
  background: var(--color-card);
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
}

.tag-chip:hover {
  opacity: 0.85;
}

.tag-chip.active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: #ffffff !important;
}

.tag-chip-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.radio-group {
  display: flex;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.radio-label {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  cursor: pointer;
  font-size: 0.875rem;
  color: var(--color-text);
  font-weight: normal;
}

.radio-label input[type="radio"] {
  width: auto;
  margin: 0;
  accent-color: var(--color-primary);
  cursor: pointer;
}

.search-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding-top: 1rem;
  border-top: 1px solid var(--color-border);
}

.results-header {
  margin-bottom: 1rem;
}

.results-count {
  margin: 0;
  font-size: 0.875rem;
  color: var(--color-text-light);
  font-weight: 500;
}

/* Recipe card styles */
.recipe-card {
  text-decoration: none;
  color: inherit;
  transition: transform 0.2s, box-shadow 0.2s;
}

.recipe-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-hover);
  text-decoration: none;
}

.recipe-icon {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
}

.recipe-image {
  width: 100%;
  height: 120px;
  margin-bottom: 0.5rem;
  border-radius: var(--radius-sm);
  overflow: hidden;
}

.recipe-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.recipe-card h4 {
  margin: 0 0 0.5rem;
  font-size: 1rem;
  font-weight: 600;
}

.recipe-description {
  color: var(--color-text-light);
  font-size: 0.8125rem;
  margin: 0 0 0.5rem;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.recipe-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  margin-bottom: 0.5rem;
}

.recipe-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.125rem 0.5rem;
  border: 1px solid;
  border-radius: var(--radius-sm);
  font-size: 0.6875rem;
  font-weight: 500;
}

.recipe-tag-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.recipe-meta {
  display: flex;
  gap: 0.75rem;
  color: var(--color-text-light);
  font-size: 0.8125rem;
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
  font-size: 0.9rem;
  padding: 0.25rem 0.5rem;
  border-radius: var(--radius-sm);
  transition: background 0.2s;
}

.like-btn:hover {
  background: #fff3e0;
}

.like-btn.liked {
  color: var(--color-primary);
}
</style>
