<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { memberApi } from '@/api/client'
import IconPicker from '@/components/IconPicker.vue'

const router = useRouter()
const authStore = useAuthStore()

const loading = ref(true)
const selecting = ref(false)
const showCreateModal = ref(false)
const createError = ref('')
const creating = ref(false)

const newMember = ref({
  name: '',
  avatar_icon: '👤',
})

const isFormValid = computed(() => {
  return newMember.value.name.trim().length > 0
})

onMounted(async () => {
  // メンバー一覧を再取得
  await authStore.refreshMembers()
  loading.value = false

  // メンバーがいない場合は作成モーダルを表示
  if (!authStore.hasMembers) {
    showCreateModal.value = true
  }
})

async function selectMember(memberId: string) {
  selecting.value = true
  try {
    await authStore.selectMember(memberId)
    router.push('/')
  } catch (err) {
    console.error('Failed to select member:', err)
  } finally {
    selecting.value = false
  }
}

function openCreateModal() {
  newMember.value = { name: '', avatar_icon: '👤' }
  createError.value = ''
  showCreateModal.value = true
}

function closeCreateModal() {
  // メンバーがいない場合は閉じられない
  if (!authStore.hasMembers) return
  showCreateModal.value = false
}

async function createMember() {
  if (!isFormValid.value) return

  creating.value = true
  createError.value = ''

  try {
    const data = {
      name: newMember.value.name,
      avatar_icon: newMember.value.avatar_icon,
    }
    const response = await memberApi.create(data)
    const member = response.data.data.member

    // メンバー一覧を更新
    await authStore.refreshMembers()

    // 作成したメンバーを自動選択
    await authStore.selectMember(member.id)

    showCreateModal.value = false
    router.push('/')
  } catch (err: unknown) {
    const axiosError = err as { response?: { data?: { message?: string } } }
    createError.value = axiosError.response?.data?.message || 'メンバーの作成に失敗しました'
  } finally {
    creating.value = false
  }
}

function isImageUrl(icon: string | undefined): boolean {
  return !!icon && (icon.startsWith('http') || icon.startsWith('/storage/') || icon.includes('/'))
}

function getImageUrl(url: string | undefined): string {
  if (!url) return ''
  if (url.startsWith('http') || url.startsWith('/storage/')) return url
  return `/storage/${url}`
}
</script>

<template>
  <div class="member-select-page">
    <div class="select-container">
      <h1>メンバーを選択</h1>
      <p class="subtitle">使用するプロフィールを選んでください</p>

      <div v-if="loading" class="loading">
        <div class="spinner"></div>
      </div>

      <template v-else>
        <div class="members-grid">
          <button
            v-for="member in authStore.members"
            :key="member.id"
            class="member-card"
            :class="{ selected: authStore.currentMember?.id === member.id }"
            :disabled="selecting"
            @click="selectMember(member.id)"
          >
            <span v-if="isImageUrl(member.avatar_icon)" class="member-avatar-image">
              <img :src="getImageUrl(member.avatar_icon)" :alt="member.name" />
            </span>
            <span v-else class="member-avatar">{{ member.avatar_icon }}</span>
            <span class="member-name">{{ member.name }}</span>
          </button>

          <!-- 追加ボタン -->
          <button
            v-if="authStore.members.length < 5"
            class="member-card add-card"
            @click="openCreateModal"
          >
            <span class="add-icon">+</span>
            <span class="member-name">追加</span>
          </button>
        </div>

        <div v-if="authStore.currentMember" class="current-info">
          <p>
            現在選択中:
            <strong>{{ authStore.currentMember.avatar_icon }} {{ authStore.currentMember.name }}</strong>
          </p>
          <button @click="router.push('/')" class="btn btn-primary">
            続ける
          </button>
        </div>
      </template>
    </div>

    <!-- Create Modal -->
    <div v-if="showCreateModal" class="modal-overlay" @click.self="closeCreateModal">
      <div class="modal card">
        <div class="modal-header">
          <h3>{{ authStore.hasMembers ? '新しいメンバー' : 'メンバーを作成' }}</h3>
          <button
            v-if="authStore.hasMembers"
            type="button"
            @click="closeCreateModal"
            class="modal-close"
          >
            &times;
          </button>
        </div>

        <p v-if="!authStore.hasMembers" class="modal-description">
          アプリを使用するにはメンバーを作成してください
        </p>

        <div v-if="createError" class="alert alert-error">
          {{ createError }}
        </div>

        <form @submit.prevent="createMember">
          <div class="form-group">
            <label>アイコン</label>
            <IconPicker
              v-model="newMember.avatar_icon"
              type="avatar"
              size="medium"
            />
          </div>

          <div class="form-group">
            <label for="member-name">名前 <span class="required">*</span></label>
            <input
              id="member-name"
              v-model="newMember.name"
              type="text"
              placeholder="メンバーの名前"
              required
            />
          </div>

          <div class="modal-actions">
            <button
              v-if="authStore.hasMembers"
              type="button"
              @click="closeCreateModal"
              class="btn btn-secondary"
            >
              キャンセル
            </button>
            <button type="submit" class="btn btn-primary" :disabled="!isFormValid || creating">
              {{ creating ? '作成中...' : '作成して選択' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.member-select-page {
  min-height: calc(100vh - 64px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.select-container {
  text-align: center;
  max-width: 600px;
  width: 100%;
}

.select-container h1 {
  margin: 0 0 0.5rem;
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--color-text);
}

.subtitle {
  margin: 0 0 2rem;
  color: var(--color-text-light);
}

.members-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.member-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1.5rem 1rem;
  background: var(--color-card);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.2s ease;
}

.member-card:hover {
  border-color: var(--color-primary);
  background: #fff3e0;
}

.member-card.selected {
  border-color: var(--color-primary);
  background: #fff3e0;
  box-shadow: 0 0 0 3px rgba(255, 112, 67, 0.2);
}

.member-card:disabled {
  opacity: 0.6;
  cursor: wait;
}

.member-avatar {
  font-size: 3rem;
  margin-bottom: 0.5rem;
}

.member-avatar-image {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.member-avatar-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.member-name {
  font-size: 0.9375rem;
  font-weight: 500;
  color: var(--color-text);
}

.add-card {
  border-style: dashed;
  background: transparent;
}

.add-card:hover {
  background: #fff3e0;
}

.add-icon {
  font-size: 2.5rem;
  color: var(--color-text-light);
  margin-bottom: 0.5rem;
}

.add-card .member-name {
  color: var(--color-text-light);
}

.current-info {
  padding: 1.5rem;
  background: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}

.current-info p {
  margin: 0 0 1rem;
  color: var(--color-text-light);
}

.current-info strong {
  color: var(--color-text);
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
  align-items: center;
  padding: 1rem;
  z-index: 1000;
}

.modal {
  width: 100%;
  max-width: 400px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.125rem;
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

.modal-description {
  margin: 0 0 1rem;
  color: var(--color-text-light);
  font-size: 0.875rem;
}

.required {
  color: var(--color-primary);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1.5rem;
}
</style>
