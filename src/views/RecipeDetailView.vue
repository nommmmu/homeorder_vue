<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { recipeApi, tagApi } from '@/api/client'
import type { Recipe, Ingredient, Step, Tag } from '@/types'
import IconPicker from '@/components/IconPicker.vue'

const route = useRoute()
const router = useRouter()

const recipe = ref<Recipe | null>(null)
const loading = ref(true)
const error = ref('')
const showEditModal = ref(false)
const editError = ref('')
const saving = ref(false)
const allTags = ref<Tag[]>([])

const editRecipe = ref<{
  name: string
  description: string
  image_icon: string
  cooking_time: number
  servings: number
  difficulty: 'easy' | 'medium' | 'hard'
  ingredients: Ingredient[]
  steps: Step[]
  tag_ids: string[]
  memo: string
}>({
  name: '',
  description: '',
  image_icon: '🍽️',
  cooking_time: 30,
  servings: 2,
  difficulty: 'medium',
  ingredients: [],
  steps: [],
  tag_ids: [],
  memo: '',
})

const recipeEmojiOptions = ['🍽️', '🍳', '🍲', '🍜', '🍝', '🍛', '🍣', '🍱', '🥗', '🍔', '🍕', '🥘', '🍰', '🍩', '☕', '🥤']

const isFormValid = computed(() => {
  return editRecipe.value.name.trim().length > 0
})

async function loadTags() {
  try {
    const response = await tagApi.list()
    allTags.value = response.data.data.tags || []
  } catch (err) {
    console.error('Failed to load tags:', err)
  }
}

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

function openEditModal() {
  if (!recipe.value) return

  // image_urlがある場合はそれを使い、なければimage_iconを使う
  const iconValue = recipe.value.image_url || recipe.value.image_icon || '🍽️'

  editRecipe.value = {
    name: recipe.value.name,
    description: recipe.value.description || '',
    image_icon: iconValue,
    cooking_time: recipe.value.cooking_time || 30,
    servings: recipe.value.servings || 2,
    difficulty: recipe.value.difficulty || 'medium',
    ingredients: recipe.value.ingredients ? [...recipe.value.ingredients] : [],
    steps: recipe.value.steps ? [...recipe.value.steps] : [],
    tag_ids: recipe.value.tag_ids ? [...recipe.value.tag_ids] : [],
    memo: recipe.value.memo || '',
  }
  editError.value = ''
  showEditModal.value = true
}

function closeEditModal() {
  showEditModal.value = false
  editError.value = ''
}

async function saveRecipe() {
  if (!recipe.value || !isFormValid.value) return

  saving.value = true
  editError.value = ''

  try {
    // 画像URLかどうかを判定
    const iconValue = editRecipe.value.image_icon
    const isImage = iconValue.startsWith('http') || iconValue.startsWith('/storage/') || iconValue.includes('/')

    const recipeData = {
      ...editRecipe.value,
      image_icon: isImage ? undefined : iconValue,
      image_url: isImage ? iconValue : undefined,
    }
    const response = await recipeApi.update(recipe.value.id, recipeData)
    recipe.value = response.data.data.recipe
    closeEditModal()
  } catch (err: unknown) {
    const axiosError = err as { response?: { data?: { message?: string } } }
    editError.value = axiosError.response?.data?.message || 'レシピの更新に失敗しました'
  } finally {
    saving.value = false
  }
}

function addIngredient() {
  editRecipe.value.ingredients.push({ name: '', amount: '', unit: '' })
}

function removeIngredient(index: number) {
  editRecipe.value.ingredients.splice(index, 1)
}

function addStep() {
  const stepNumber = editRecipe.value.steps.length + 1
  editRecipe.value.steps.push({ step_number: stepNumber, description: '' })
}

function removeStep(index: number) {
  editRecipe.value.steps.splice(index, 1)
  editRecipe.value.steps.forEach((step, i) => {
    step.step_number = i + 1
  })
}

function toggleEditTag(tagId: string) {
  const index = editRecipe.value.tag_ids.indexOf(tagId)
  if (index >= 0) {
    editRecipe.value.tag_ids.splice(index, 1)
  } else {
    editRecipe.value.tag_ids.push(tagId)
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
  loadTags()
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
        <RouterLink to="/recipes" class="back-link">← レシピ一覧</RouterLink>

        <div class="recipe-title-section">
          <div v-if="recipe.image_url" class="recipe-header-image">
            <img :src="recipe.image_url.startsWith('http') || recipe.image_url.startsWith('/storage/') ? recipe.image_url : `/storage/${recipe.image_url}`" :alt="recipe.name" />
          </div>
          <span v-else class="recipe-icon">{{ recipe.image_icon || '🍽️' }}</span>
          <div class="recipe-title-info">
            <h1>{{ recipe.name }}</h1>
            <div class="recipe-meta">
              <span v-if="recipe.cooking_time">⏱️ {{ recipe.cooking_time }}分</span>
              <span v-if="recipe.servings">👥 {{ recipe.servings }}人前</span>
              <span v-if="recipe.difficulty" class="difficulty-badge" :class="recipe.difficulty">
                {{ getDifficultyLabel(recipe.difficulty) }}
              </span>
            </div>
          </div>
        </div>

        <div class="recipe-actions">
          <button @click="toggleLike" class="btn" :class="recipe.is_liked ? 'btn-primary' : 'btn-secondary'">
            {{ recipe.is_liked ? '❤️' : '🤍' }} {{ recipe.like_count || 0 }}
          </button>
          <button @click="openEditModal" class="btn btn-secondary">
            編集
          </button>
          <button @click="deleteRecipe" class="btn btn-danger">
            削除
          </button>
        </div>

        <div v-if="recipe.tags && recipe.tags.length > 0" class="tags-section">
          <span
            v-for="tag in recipe.tags"
            :key="tag.id"
            class="tag"
            :style="{ backgroundColor: tag.color + '20', color: tag.color, borderColor: tag.color + '40' }"
          >
            <span class="tag-dot" :style="{ backgroundColor: tag.color }"></span>
            {{ tag.name }}
          </span>
        </div>
      </div>

      <div class="recipe-content">
        <div v-if="recipe.description" class="card">
          <h3>説明</h3>
          <p class="description-text">{{ recipe.description }}</p>
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
          <div class="steps-list">
            <div v-for="step in recipe.steps" :key="step.step_number" class="step-item">
              <span class="step-number">{{ step.step_number }}</span>
              <p class="step-description">{{ step.description }}</p>
            </div>
          </div>
        </div>

        <div v-if="recipe.memo" class="card">
          <h3>メモ</h3>
          <p class="memo-text">{{ recipe.memo }}</p>
        </div>
      </div>
    </template>

    <!-- Edit Modal -->
    <div v-if="showEditModal" class="modal-overlay" @click.self="closeEditModal">
      <div class="modal card">
        <div class="modal-header">
          <h3>レシピを編集</h3>
          <button type="button" @click="closeEditModal" class="modal-close">&times;</button>
        </div>

        <div v-if="editError" class="alert alert-error">
          {{ editError }}
        </div>

        <form @submit.prevent="saveRecipe">
          <!-- Basic Info -->
          <div class="form-section">
            <h4>基本情報</h4>

            <div class="form-group">
              <label>アイコン</label>
              <IconPicker
                v-model="editRecipe.image_icon"
                type="recipe"
                :emoji-options="recipeEmojiOptions"
                size="medium"
              />
            </div>

            <div class="form-group">
              <label for="edit-recipe-name">レシピ名 <span class="required">*</span></label>
              <input
                id="edit-recipe-name"
                v-model="editRecipe.name"
                type="text"
                required
              />
            </div>

            <div class="form-group">
              <label for="edit-recipe-description">説明</label>
              <textarea
                id="edit-recipe-description"
                v-model="editRecipe.description"
                rows="2"
              ></textarea>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="edit-cooking-time">調理時間</label>
                <div class="input-with-unit">
                  <input
                    id="edit-cooking-time"
                    v-model.number="editRecipe.cooking_time"
                    type="number"
                    min="1"
                    max="999"
                  />
                  <span class="unit">分</span>
                </div>
              </div>

              <div class="form-group">
                <label for="edit-servings">人数</label>
                <div class="input-with-unit">
                  <input
                    id="edit-servings"
                    v-model.number="editRecipe.servings"
                    type="number"
                    min="1"
                    max="99"
                  />
                  <span class="unit">人前</span>
                </div>
              </div>

              <div class="form-group">
                <label for="edit-difficulty">難易度</label>
                <select id="edit-difficulty" v-model="editRecipe.difficulty">
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

            <div v-if="editRecipe.ingredients.length === 0" class="empty-hint">
              材料を追加してください
            </div>

            <div v-for="(ingredient, index) in editRecipe.ingredients" :key="index" class="ingredient-row">
              <input
                v-model="ingredient.name"
                type="text"
                placeholder="材料名"
                class="ingredient-name-input"
              />
              <input
                v-model="ingredient.amount"
                type="text"
                placeholder="量"
                class="ingredient-amount-input"
              />
              <input
                v-model="ingredient.unit"
                type="text"
                placeholder="単位"
                class="ingredient-unit-input"
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

            <div v-if="editRecipe.steps.length === 0" class="empty-hint">
              手順を追加してください
            </div>

            <div v-for="(step, index) in editRecipe.steps" :key="index" class="step-row">
              <span class="step-number-badge">{{ step.step_number }}</span>
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
            <div v-if="allTags.length > 0" class="tag-select-list">
              <button
                v-for="tag in allTags"
                :key="tag.id"
                type="button"
                class="tag-select-chip"
                :class="{ selected: editRecipe.tag_ids.includes(tag.id) }"
                :style="editRecipe.tag_ids.includes(tag.id)
                  ? { backgroundColor: tag.color, borderColor: tag.color, color: '#fff' }
                  : { borderColor: tag.color + '80', color: tag.color }"
                @click="toggleEditTag(tag.id)"
              >
                <span
                  class="tag-select-dot"
                  :style="{ backgroundColor: editRecipe.tag_ids.includes(tag.id) ? '#fff' : tag.color }"
                ></span>
                {{ tag.name }}
              </button>
            </div>
            <div v-else class="empty-hint">
              <RouterLink to="/tags">タグ管理</RouterLink>からタグを作成してください
            </div>
          </div>

          <!-- Memo -->
          <div class="form-section">
            <h4>メモ</h4>
            <textarea
              v-model="editRecipe.memo"
              rows="2"
              placeholder="メモを入力..."
            ></textarea>
          </div>

          <div class="modal-actions">
            <button type="button" @click="closeEditModal" class="btn btn-secondary">
              キャンセル
            </button>
            <button type="submit" class="btn btn-primary" :disabled="!isFormValid || saving">
              {{ saving ? '保存中...' : '保存' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.back-link {
  display: inline-flex;
  align-items: center;
  margin-bottom: 1.5rem;
  color: var(--color-text-light);
  font-size: 0.875rem;
  font-weight: 500;
}

.back-link:hover {
  color: var(--color-primary);
}

.recipe-header {
  margin-bottom: 2rem;
}

.recipe-title-section {
  display: flex;
  align-items: flex-start;
  gap: 1.25rem;
  margin-bottom: 1.25rem;
}

.recipe-icon {
  font-size: 3.5rem;
}

.recipe-header-image {
  width: 100px;
  height: 100px;
  border-radius: var(--radius-md);
  overflow: hidden;
  flex-shrink: 0;
}

.recipe-header-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.recipe-title-info {
  flex: 1;
}

.recipe-title-section h1 {
  margin: 0 0 0.5rem;
  font-size: 1.5rem;
  font-weight: 700;
}

.recipe-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  color: var(--color-text-light);
  font-size: 0.875rem;
}

.difficulty-badge {
  padding: 0.125rem 0.5rem;
  border-radius: var(--radius-sm);
  font-size: 0.75rem;
  font-weight: 500;
}

.difficulty-badge.easy {
  background: #e8f5e9;
  color: #388e3c;
}

.difficulty-badge.medium {
  background: #fff3e0;
  color: #f57c00;
}

.difficulty-badge.hard {
  background: #ffebee;
  color: #d32f2f;
}

.recipe-actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.recipe-content {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.recipe-content h3 {
  margin: 0 0 1rem;
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text);
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--color-border);
}

.description-text,
.memo-text {
  margin: 0;
  color: var(--color-text);
  line-height: 1.7;
  white-space: pre-wrap;
}

.ingredients-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.ingredients-list li {
  display: flex;
  justify-content: space-between;
  padding: 0.625rem 0;
  border-bottom: 1px solid var(--color-border);
}

.ingredients-list li:last-child {
  border-bottom: none;
}

.ingredient-name {
  font-weight: 500;
  color: var(--color-text);
}

.ingredient-amount {
  color: var(--color-text-light);
}

.steps-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.step-item {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
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
  flex-shrink: 0;
}

.step-description {
  margin: 0;
  padding-top: 0.25rem;
  color: var(--color-text);
  line-height: 1.6;
}

.tags-section {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 1rem;
}

.tag {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.25rem 0.75rem;
  border: 1px solid;
  border-radius: var(--radius-sm);
  font-size: 0.8125rem;
  font-weight: 500;
}

.tag-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

/* Modal styles */
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
  border: none;
  padding: 0;
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

.form-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

@media (max-width: 640px) {
  .form-row {
    grid-template-columns: 1fr;
  }

  .recipe-title-section {
    flex-direction: column;
    gap: 1rem;
  }

  .recipe-actions {
    width: 100%;
  }

  .recipe-actions .btn {
    flex: 1;
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

.empty-hint a {
  color: var(--color-primary);
  font-weight: 500;
}

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

.step-row {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
  align-items: start;
}

.step-number-badge {
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

/* Tag select */
.tag-select-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.tag-select-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  border: 1.5px solid;
  border-radius: var(--radius-full);
  background: transparent;
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
}

.tag-select-chip:hover {
  opacity: 0.8;
}

.tag-select-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
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
