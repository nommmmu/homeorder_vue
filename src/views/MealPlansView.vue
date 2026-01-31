<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { mealPlanApi } from '@/api/client'
import type { MealPlan } from '@/types'

const mealPlans = ref<MealPlan[]>([])
const loading = ref(true)
const selectedDate = ref(new Date().toISOString().split('T')[0])
const showCreateModal = ref(false)

const newMealPlan = ref({
  date: new Date().toISOString().split('T')[0],
  meal_type: 'dinner' as const,
  name: '',
  memo: '',
})

const mealTypeLabels = {
  breakfast: '朝食',
  lunch: '昼食',
  dinner: '夕食',
  snack: 'おやつ',
}

const mealTypeIcons = {
  breakfast: '🌅',
  lunch: '☀️',
  dinner: '🌙',
  snack: '🍪',
}

const groupedMealPlans = computed(() => {
  const grouped: Record<string, MealPlan[]> = {}
  mealPlans.value.forEach((plan) => {
    const date = plan.date.split('T')[0]
    if (!grouped[date]) {
      grouped[date] = []
    }
    grouped[date].push(plan)
  })
  return grouped
})

async function loadMealPlans() {
  loading.value = true
  try {
    const startDate = new Date(selectedDate.value)
    startDate.setDate(startDate.getDate() - 3)
    const endDate = new Date(selectedDate.value)
    endDate.setDate(endDate.getDate() + 7)

    const response = await mealPlanApi.list({
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
    })
    mealPlans.value = response.data.data.meal_plans || []
  } catch (error) {
    console.error('Failed to load meal plans:', error)
  } finally {
    loading.value = false
  }
}

async function createMealPlan() {
  try {
    await mealPlanApi.create(newMealPlan.value)
    showCreateModal.value = false
    newMealPlan.value = {
      date: new Date().toISOString().split('T')[0],
      meal_type: 'dinner',
      name: '',
      memo: '',
    }
    await loadMealPlans()
  } catch (error) {
    console.error('Failed to create meal plan:', error)
  }
}

async function deleteMealPlan(id: string) {
  if (!confirm('この献立を削除しますか？')) return

  try {
    await mealPlanApi.delete(id)
    await loadMealPlans()
  } catch (error) {
    console.error('Failed to delete meal plan:', error)
  }
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr)
  const options: Intl.DateTimeFormatOptions = {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  }
  return date.toLocaleDateString('ja-JP', options)
}

onMounted(() => {
  loadMealPlans()
})
</script>

<template>
  <div class="meal-plans-page">
    <div class="page-header">
      <h2>献立</h2>
      <button @click="showCreateModal = true" class="btn btn-primary">
        + 献立を追加
      </button>
    </div>

    <div class="date-nav">
      <input type="date" v-model="selectedDate" @change="loadMealPlans" />
    </div>

    <div v-if="loading" class="loading">
      <div class="spinner"></div>
    </div>

    <template v-else>
      <div v-if="Object.keys(groupedMealPlans).length === 0" class="empty-state">
        <div class="empty-state-icon">📅</div>
        <p>この期間の献立はありません</p>
        <button @click="showCreateModal = true" class="btn btn-primary">
          献立を追加
        </button>
      </div>

      <div v-else class="meal-plans-list">
        <div v-for="(plans, date) in groupedMealPlans" :key="date" class="date-group">
          <h3 class="date-header">{{ formatDate(date) }}</h3>
          <div class="plans-grid">
            <div v-for="plan in plans" :key="plan.id" class="meal-plan-card card">
              <div class="meal-plan-header">
                <span class="meal-type-icon">{{ mealTypeIcons[plan.meal_type] }}</span>
                <span class="meal-type-label">{{ mealTypeLabels[plan.meal_type] }}</span>
                <button @click="deleteMealPlan(plan.id)" class="delete-btn">×</button>
              </div>

              <div v-if="plan.name" class="meal-plan-name">{{ plan.name }}</div>

              <div v-if="plan.recipes && plan.recipes.length > 0" class="recipes-list">
                <div v-for="recipe in plan.recipes" :key="recipe.recipe_id" class="recipe-item">
                  <span class="recipe-icon">{{ recipe.image_icon || '🍽️' }}</span>
                  <span>{{ recipe.recipe_name }}</span>
                </div>
              </div>

              <div v-else class="no-recipes">
                レシピが追加されていません
              </div>

              <div v-if="plan.memo" class="meal-plan-memo">
                {{ plan.memo }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Create Modal -->
    <div v-if="showCreateModal" class="modal-overlay" @click.self="showCreateModal = false">
      <div class="modal card">
        <h3>新しい献立</h3>
        <form @submit.prevent="createMealPlan">
          <div class="form-group">
            <label for="meal-date">日付 *</label>
            <input
              id="meal-date"
              v-model="newMealPlan.date"
              type="date"
              required
            />
          </div>

          <div class="form-group">
            <label for="meal-type">食事タイプ *</label>
            <select id="meal-type" v-model="newMealPlan.meal_type" required>
              <option value="breakfast">朝食</option>
              <option value="lunch">昼食</option>
              <option value="dinner">夕食</option>
              <option value="snack">おやつ</option>
            </select>
          </div>

          <div class="form-group">
            <label for="meal-name">名前（任意）</label>
            <input
              id="meal-name"
              v-model="newMealPlan.name"
              type="text"
              placeholder="例：誕生日パーティー"
            />
          </div>

          <div class="form-group">
            <label for="meal-memo">メモ</label>
            <textarea
              id="meal-memo"
              v-model="newMealPlan.memo"
              rows="3"
            ></textarea>
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

.date-nav {
  margin-bottom: 1.5rem;
}

.date-nav input {
  padding: 0.5rem 1rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.meal-plans-list {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.date-header {
  margin: 0 0 1rem;
  font-size: 1.125rem;
  color: #333;
  border-bottom: 2px solid #667eea;
  padding-bottom: 0.5rem;
}

.plans-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
}

.meal-plan-card {
  position: relative;
}

.meal-plan-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.meal-type-icon {
  font-size: 1.5rem;
}

.meal-type-label {
  font-weight: 500;
}

.delete-btn {
  margin-left: auto;
  background: none;
  border: none;
  font-size: 1.25rem;
  color: #999;
  cursor: pointer;
  padding: 0.25rem;
  line-height: 1;
}

.delete-btn:hover {
  color: #e53935;
}

.meal-plan-name {
  font-weight: 500;
  font-size: 1.125rem;
  margin-bottom: 1rem;
}

.recipes-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.recipe-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  background: #f9f9f9;
  border-radius: 4px;
}

.recipe-icon {
  font-size: 1.25rem;
}

.no-recipes {
  color: #999;
  font-size: 0.875rem;
  padding: 1rem;
  text-align: center;
  background: #f9f9f9;
  border-radius: 4px;
}

.meal-plan-memo {
  font-size: 0.875rem;
  color: #666;
  padding-top: 0.5rem;
  border-top: 1px solid #eee;
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

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1.5rem;
}
</style>
