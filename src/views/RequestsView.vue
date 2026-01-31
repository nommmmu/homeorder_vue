<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { requestApi } from '@/api/client'
import type { FoodRequest } from '@/types'

const requests = ref<FoodRequest[]>([])
const loading = ref(true)
const statusFilter = ref<string>('')
const showCreateModal = ref(false)

const newRequest = ref({
  comment: '',
})

const filteredRequests = computed(() => {
  if (!statusFilter.value) return requests.value
  return requests.value.filter((r) => r.status === statusFilter.value)
})

const statusLabels = {
  active: 'アクティブ',
  completed: '完了',
  cancelled: 'キャンセル',
}

async function loadRequests() {
  loading.value = true
  try {
    const params = statusFilter.value ? { status: statusFilter.value } : undefined
    const response = await requestApi.list(params)
    requests.value = response.data.data.requests || []
  } catch (error) {
    console.error('Failed to load requests:', error)
  } finally {
    loading.value = false
  }
}

async function createRequest() {
  try {
    await requestApi.create(newRequest.value)
    showCreateModal.value = false
    newRequest.value = { comment: '' }
    await loadRequests()
  } catch (error) {
    console.error('Failed to create request:', error)
  }
}

async function completeRequest(id: string) {
  try {
    await requestApi.complete(id)
    await loadRequests()
  } catch (error) {
    console.error('Failed to complete request:', error)
  }
}

async function cancelRequest(id: string) {
  if (!confirm('このリクエストをキャンセルしますか？')) return

  try {
    await requestApi.cancel(id)
    await loadRequests()
  } catch (error) {
    console.error('Failed to cancel request:', error)
  }
}

async function deleteRequest(id: string) {
  if (!confirm('このリクエストを削除しますか？')) return

  try {
    await requestApi.delete(id)
    await loadRequests()
  } catch (error) {
    console.error('Failed to delete request:', error)
  }
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr)
  return date.toLocaleDateString('ja-JP', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

onMounted(() => {
  loadRequests()
})
</script>

<template>
  <div class="requests-page">
    <div class="page-header">
      <h2>リクエスト</h2>
      <button @click="showCreateModal = true" class="btn btn-primary">
        + リクエスト
      </button>
    </div>

    <div class="filters">
      <button
        @click="statusFilter = ''; loadRequests()"
        class="filter-btn"
        :class="{ active: !statusFilter }"
      >
        すべて
      </button>
      <button
        @click="statusFilter = 'active'; loadRequests()"
        class="filter-btn"
        :class="{ active: statusFilter === 'active' }"
      >
        アクティブ
      </button>
      <button
        @click="statusFilter = 'completed'; loadRequests()"
        class="filter-btn"
        :class="{ active: statusFilter === 'completed' }"
      >
        完了
      </button>
      <button
        @click="statusFilter = 'cancelled'; loadRequests()"
        class="filter-btn"
        :class="{ active: statusFilter === 'cancelled' }"
      >
        キャンセル
      </button>
    </div>

    <div v-if="loading" class="loading">
      <div class="spinner"></div>
    </div>

    <template v-else>
      <div v-if="filteredRequests.length === 0" class="empty-state">
        <div class="empty-state-icon">🙋</div>
        <p>リクエストがありません</p>
        <button @click="showCreateModal = true" class="btn btn-primary">
          リクエストを作成
        </button>
      </div>

      <div v-else class="requests-list">
        <div v-for="request in filteredRequests" :key="request.id" class="request-card card">
          <div class="request-header">
            <span class="badge" :class="`badge-${request.status}`">
              {{ statusLabels[request.status] }}
            </span>
            <span class="request-date">{{ formatDate(request.created_at) }}</span>
          </div>

          <div class="request-content">
            <p class="request-comment">{{ request.comment || '（コメントなし）' }}</p>

            <div v-if="request.recipe" class="request-recipe">
              <span class="recipe-icon">{{ request.recipe.image_icon || '🍽️' }}</span>
              <span>{{ request.recipe.name }}</span>
            </div>

            <div v-if="request.requester_member" class="request-member">
              <span>{{ request.requester_member.avatar_icon }}</span>
              <span>{{ request.requester_member.name }}からのリクエスト</span>
            </div>
          </div>

          <div class="request-actions">
            <template v-if="request.status === 'active'">
              <button @click="completeRequest(request.id)" class="btn btn-sm btn-primary">
                完了
              </button>
              <button @click="cancelRequest(request.id)" class="btn btn-sm btn-secondary">
                キャンセル
              </button>
            </template>
            <button @click="deleteRequest(request.id)" class="btn btn-sm btn-danger">
              削除
            </button>
          </div>
        </div>
      </div>
    </template>

    <!-- Create Modal -->
    <div v-if="showCreateModal" class="modal-overlay" @click.self="showCreateModal = false">
      <div class="modal card">
        <h3>新しいリクエスト</h3>
        <form @submit.prevent="createRequest">
          <div class="form-group">
            <label for="request-comment">リクエスト内容</label>
            <textarea
              id="request-comment"
              v-model="newRequest.comment"
              rows="4"
              placeholder="食べたいものを教えてください..."
            ></textarea>
          </div>

          <div class="modal-actions">
            <button type="button" @click="showCreateModal = false" class="btn btn-secondary">
              キャンセル
            </button>
            <button type="submit" class="btn btn-primary">
              送信
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

.filters {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.filter-btn {
  padding: 0.5rem 1rem;
  border: 1px solid #ddd;
  background: white;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.2s;
}

.filter-btn:hover {
  border-color: #667eea;
}

.filter-btn.active {
  background: #667eea;
  color: white;
  border-color: #667eea;
}

.requests-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.request-card {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.request-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.request-date {
  color: #666;
  font-size: 0.875rem;
}

.request-comment {
  margin: 0;
  font-size: 1.125rem;
}

.request-recipe {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: #f5f5f5;
  border-radius: 4px;
}

.recipe-icon {
  font-size: 1.5rem;
}

.request-member {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #666;
  font-size: 0.875rem;
}

.request-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
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
