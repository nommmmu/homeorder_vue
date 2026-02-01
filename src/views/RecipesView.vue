<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { recipeApi } from '@/api/client'
import type { Recipe, Pagination, Ingredient, Step } from '@/types'
import ImageUpload from '@/components/ImageUpload.vue'

const recipes = ref<Recipe[]>([])
const pagination = ref<Pagination | null>(null)
const loading = ref(true)
const searchQuery = ref('')
const showCreateModal = ref(false)
const createError = ref('')
const creating = ref(false)

const emptyRecipe = () => ({
  name: '',
  description: '',
  image_icon: '🍽️',
  image_url: '',
  cooking_time: 30,
  servings: 2,
  difficulty: 'medium' as const,
  ingredients: [] as Ingredient[],
  steps: [] as Step[],
  tags: [] as string[],
  memo: '',
})

const newRecipe = ref(emptyRecipe())
const newTag = ref('')
const useImageIcon = ref(false)

const emojiOptions = ['🍽️', '🍳', '🍲', '🍜', '🍝', '🍛', '🍣', '🍱', '🥗', '🍔', '🍕', '🥘', '🍰', '🍩', '☕', '🥤']

const isFormValid = computed(() => {
  return newRecipe.value.name.trim().length > 0
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

function openCreateModal() {
  newRecipe.value = emptyRecipe()
  useImageIcon.value = false
  createError.value = ''
  showCreateModal.value = true
}

function closeCreateModal() {
  showCreateModal.value = false
  createError.value = ''
}

async function createRecipe() {
  if (!isFormValid.value) return

  creating.value = true
  createError.value = ''

  try {
    const recipeData = {
      ...newRecipe.value,
      image_icon: useImageIcon.value ? undefined : newRecipe.value.image_icon,
      image_url: useImageIcon.value ? newRecipe.value.image_url : undefined,
    }
    await recipeApi.create(recipeData)
    closeCreateModal()
    await loadRecipes()
  } catch (error: unknown) {
    const axiosError = error as { response?: { data?: { message?: string } } }
    createError.value = axiosError.response?.data?.message || 'レシピの作成に失敗しました'
  } finally {
    creating.value = false
  }
}

function handleRecipeImageUploaded(data: { url: string }) {
  newRecipe.value.image_url = data.url
}

function addIngredient() {
  newRecipe.value.ingredients.push({ name: '', amount: '', unit: '' })
}

function removeIngredient(index: number) {
  newRecipe.value.ingredients.splice(index, 1)
}

function addStep() {
  const stepNumber = newRecipe.value.steps.length + 1
  newRecipe.value.steps.push({ step_number: stepNumber, description: '' })
}

function removeStep(index: number) {
  newRecipe.value.steps.splice(index, 1)
  newRecipe.value.steps.forEach((step, i) => {
    step.step_number = i + 1
  })
}

function addTag() {
  const tag = newTag.value.trim()
  if (tag && !newRecipe.value.tags.includes(tag)) {
    newRecipe.value.tags.push(tag)
    newTag.value = ''
  }
}

function removeTag(index: number) {
  newRecipe.value.tags.splice(index, 1)
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
      <button @click="openCreateModal" class="btn btn-primary">
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
        <button @click="openCreateModal" class="btn btn-primary">
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
          <div v-if="recipe.image_url" class="recipe-image">
            <img :src="recipe.image_url.startsWith('http') || recipe.image_url.startsWith('/storage/') ? recipe.image_url : `/storage/${recipe.image_url}`" :alt="recipe.name" />
          </div>
          <div v-else class="recipe-icon">{{ recipe.image_icon || '🍽️' }}</div>
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
    <div v-if="showCreateModal" class="modal-overlay" @click.self="closeCreateModal">
      <div class="modal card">
        <div class="modal-header">
          <h3>新しいレシピ</h3>
          <button type="button" @click="closeCreateModal" class="modal-close">&times;</button>
        </div>

        <div v-if="createError" class="alert alert-error">
          {{ createError }}
        </div>

        <form @submit.prevent="createRecipe">
          <!-- Basic Info -->
          <div class="form-section">
            <h4>基本情報</h4>

            <div class="form-group">
              <label>アイコン</label>
              <div class="icon-type-toggle">
                <button
                  type="button"
                  class="toggle-btn"
                  :class="{ active: !useImageIcon }"
                  @click="useImageIcon = false"
                >
                  絵文字
                </button>
                <button
                  type="button"
                  class="toggle-btn"
                  :class="{ active: useImageIcon }"
                  @click="useImageIcon = true"
                >
                  画像
                </button>
              </div>

              <div v-if="!useImageIcon" class="emoji-picker">
                <button
                  v-for="emoji in emojiOptions"
                  :key="emoji"
                  type="button"
                  class="emoji-btn"
                  :class="{ selected: newRecipe.image_icon === emoji }"
                  @click="newRecipe.image_icon = emoji"
                >
                  {{ emoji }}
                </button>
              </div>

              <div v-else class="image-upload-area">
                <ImageUpload
                  v-model="newRecipe.image_url"
                  type="recipe"
                  size="large"
                  placeholder="レシピ画像"
                  @uploaded="handleRecipeImageUploaded"
                />
              </div>
            </div>

            <div class="form-group">
              <label for="recipe-name">レシピ名 <span class="required">*</span></label>
              <input
                id="recipe-name"
                v-model="newRecipe.name"
                type="text"
                placeholder="例: 肉じゃが"
                required
              />
            </div>

            <div class="form-group">
              <label for="recipe-description">説明</label>
              <textarea
                id="recipe-description"
                v-model="newRecipe.description"
                rows="2"
                placeholder="簡単な説明を入力..."
              ></textarea>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="cooking-time">調理時間</label>
                <div class="input-with-unit">
                  <input
                    id="cooking-time"
                    v-model.number="newRecipe.cooking_time"
                    type="number"
                    min="1"
                    max="999"
                  />
                  <span class="unit">分</span>
                </div>
              </div>

              <div class="form-group">
                <label for="servings">人数</label>
                <div class="input-with-unit">
                  <input
                    id="servings"
                    v-model.number="newRecipe.servings"
                    type="number"
                    min="1"
                    max="99"
                  />
                  <span class="unit">人前</span>
                </div>
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
          </div>

          <!-- Ingredients -->
          <div class="form-section">
            <div class="section-header">
              <h4>材料</h4>
              <button type="button" @click="addIngredient" class="btn btn-sm btn-secondary">
                + 追加
              </button>
            </div>

            <div v-if="newRecipe.ingredients.length === 0" class="empty-hint">
              材料を追加してください
            </div>

            <div v-for="(ingredient, index) in newRecipe.ingredients" :key="index" class="ingredient-row">
              <input
                v-model="ingredient.name"
                type="text"
                placeholder="材料名"
                class="ingredient-name"
              />
              <input
                v-model="ingredient.amount"
                type="text"
                placeholder="量"
                class="ingredient-amount"
              />
              <input
                v-model="ingredient.unit"
                type="text"
                placeholder="単位"
                class="ingredient-unit"
              />
              <button type="button" @click="removeIngredient(index)" class="remove-btn">
                &times;
              </button>
            </div>
          </div>

          <!-- Steps -->
          <div class="form-section">
            <div class="section-header">
              <h4>作り方</h4>
              <button type="button" @click="addStep" class="btn btn-sm btn-secondary">
                + 追加
              </button>
            </div>

            <div v-if="newRecipe.steps.length === 0" class="empty-hint">
              手順を追加してください
            </div>

            <div v-for="(step, index) in newRecipe.steps" :key="index" class="step-row">
              <span class="step-number">{{ step.step_number }}</span>
              <textarea
                v-model="step.description"
                placeholder="手順を入力..."
                rows="2"
              ></textarea>
              <button type="button" @click="removeStep(index)" class="remove-btn">
                &times;
              </button>
            </div>
          </div>

          <!-- Tags -->
          <div class="form-section">
            <h4>タグ</h4>
            <div class="tag-input-row">
              <input
                v-model="newTag"
                type="text"
                placeholder="タグを入力"
                @keydown.enter.prevent="addTag"
              />
              <button type="button" @click="addTag" class="btn btn-sm btn-secondary">
                追加
              </button>
            </div>
            <div v-if="newRecipe.tags.length > 0" class="tags-list">
              <span v-for="(tag, index) in newRecipe.tags" :key="index" class="tag">
                {{ tag }}
                <button type="button" @click="removeTag(index)" class="tag-remove">&times;</button>
              </span>
            </div>
          </div>

          <!-- Memo -->
          <div class="form-section">
            <h4>メモ</h4>
            <textarea
              v-model="newRecipe.memo"
              rows="2"
              placeholder="メモを入力..."
            ></textarea>
          </div>

          <div class="modal-actions">
            <button type="button" @click="closeCreateModal" class="btn btn-secondary">
              キャンセル
            </button>
            <button type="submit" class="btn btn-primary" :disabled="!isFormValid || creating">
              {{ creating ? '作成中...' : '作成' }}
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
  font-size: 1.25rem;
  font-weight: 600;
}

.search-bar {
  margin-bottom: 1.5rem;
}

.search-bar input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-size: 1rem;
}

.search-bar input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(255, 112, 67, 0.15);
}

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

.pagination {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 2rem;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 2rem 1rem;
  z-index: 1000;
  overflow-y: auto;
}

.modal {
  width: 100%;
  max-width: 600px;
  margin: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--color-border);
}

.modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: var(--color-text-light);
  cursor: pointer;
  padding: 0;
  line-height: 1;
}

.modal-close:hover {
  color: var(--color-text);
}

.form-section {
  margin-bottom: 1.5rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid var(--color-border);
}

.form-section:last-of-type {
  border-bottom: none;
}

.form-section h4 {
  margin: 0 0 1rem;
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--color-text);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.section-header h4 {
  margin: 0;
}

.required {
  color: var(--color-primary);
}

.icon-type-toggle {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.toggle-btn {
  flex: 1;
  padding: 0.5rem 1rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-card);
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.15s;
}

.toggle-btn:hover {
  border-color: var(--color-primary);
}

.toggle-btn.active {
  border-color: var(--color-primary);
  background: #fff3e0;
  color: var(--color-primary);
  font-weight: 500;
}

.image-upload-area {
  margin-bottom: 0.5rem;
}

.emoji-picker {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.emoji-btn {
  width: 40px;
  height: 40px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-card);
  font-size: 1.25rem;
  cursor: pointer;
  transition: all 0.15s;
}

.emoji-btn:hover {
  border-color: var(--color-primary);
  background: #fff3e0;
}

.emoji-btn.selected {
  border-color: var(--color-primary);
  background: #fff3e0;
  box-shadow: 0 0 0 2px rgba(255, 112, 67, 0.2);
}

.form-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

@media (max-width: 640px) {
  .form-row {
    grid-template-columns: 1fr;
  }
}

.input-with-unit {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.input-with-unit input {
  flex: 1;
}

.input-with-unit .unit {
  color: var(--color-text-light);
  font-size: 0.875rem;
}

.empty-hint {
  color: var(--color-text-light);
  font-size: 0.875rem;
  text-align: center;
  padding: 1rem;
  background: var(--color-secondary);
  border-radius: var(--radius-sm);
}

/* Ingredient rows */
.ingredient-row {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr auto;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  align-items: center;
}

.ingredient-row input {
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-size: 0.875rem;
}

.ingredient-row input:focus {
  outline: none;
  border-color: var(--color-primary);
}

/* Step rows */
.step-row {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
  align-items: start;
}

.step-number {
  width: 28px;
  height: 28px;
  background: var(--color-primary);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8125rem;
  font-weight: 600;
  margin-top: 0.5rem;
}

.step-row textarea {
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-size: 0.875rem;
  resize: vertical;
}

.step-row textarea:focus {
  outline: none;
  border-color: var(--color-primary);
}

.remove-btn {
  width: 28px;
  height: 28px;
  background: none;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text-light);
  cursor: pointer;
  font-size: 1rem;
  line-height: 1;
  transition: all 0.15s;
}

.remove-btn:hover {
  background: var(--color-error-bg);
  border-color: var(--color-error);
  color: var(--color-error);
}

/* Tags */
.tag-input-row {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.tag-input-row input {
  flex: 1;
}

.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.tag {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.625rem;
  background: #fff3e0;
  color: var(--color-primary-dark);
  border-radius: var(--radius-sm);
  font-size: 0.8125rem;
}

.tag-remove {
  background: none;
  border: none;
  color: var(--color-primary);
  cursor: pointer;
  padding: 0;
  font-size: 1rem;
  line-height: 1;
}

.tag-remove:hover {
  color: var(--color-primary-dark);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--color-border);
}
</style>
