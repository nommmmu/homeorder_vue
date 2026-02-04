<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { memberApi } from '@/api/client'
import type { Member } from '@/types'
import IconPicker from '@/components/IconPicker.vue'

const members = ref<Member[]>([])
const loading = ref(true)
const showModal = ref(false)
const editingMember = ref<Member | null>(null)
const saving = ref(false)
const error = ref('')

const formData = ref({
  name: '',
  avatar_icon: '👤',
})

const isFormValid = computed(() => {
  return formData.value.name.trim().length > 0
})

const modalTitle = computed(() => {
  return editingMember.value ? 'メンバーを編集' : '新しいメンバー'
})

const canAddMember = computed(() => {
  return members.value.length < 5
})

async function loadMembers() {
  loading.value = true
  try {
    const response = await memberApi.list()
    members.value = response.data.data.members || []
  } catch (err) {
    console.error('Failed to load members:', err)
  } finally {
    loading.value = false
  }
}

function openCreateModal() {
  if (!canAddMember.value) return
  editingMember.value = null
  formData.value = { name: '', avatar_icon: '👤' }
  error.value = ''
  showModal.value = true
}

function openEditModal(member: Member) {
  editingMember.value = member
  formData.value = {
    name: member.name,
    avatar_icon: member.avatar_icon || '👤',
  }
  error.value = ''
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  editingMember.value = null
  error.value = ''
}

async function saveMember() {
  if (!isFormValid.value) return

  saving.value = true
  error.value = ''

  try {
    const data = {
      name: formData.value.name,
      avatar_icon: formData.value.avatar_icon,
    }
    if (editingMember.value) {
      await memberApi.update(editingMember.value.id, data)
    } else {
      await memberApi.create(data)
    }
    closeModal()
    await loadMembers()
  } catch (err: unknown) {
    const axiosError = err as { response?: { data?: { message?: string } } }
    error.value = axiosError.response?.data?.message || '保存に失敗しました'
  } finally {
    saving.value = false
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

async function deleteMember(member: Member) {
  if (!confirm(`${member.name}を削除しますか？`)) return

  try {
    await memberApi.delete(member.id)
    await loadMembers()
  } catch (err: unknown) {
    const axiosError = err as { response?: { data?: { message?: string } } }
    alert(axiosError.response?.data?.message || '削除に失敗しました')
  }
}

onMounted(() => {
  loadMembers()
})
</script>

<template>
  <div class="members-page">
    <div class="page-header">
      <h2>メンバー</h2>
      <button
        @click="openCreateModal"
        class="btn btn-primary"
        :disabled="!canAddMember"
      >
        + メンバーを追加
      </button>
    </div>

    <p class="page-description">
      家族のメンバーを管理できます（最大5人まで）
    </p>

    <div v-if="loading" class="loading">
      <div class="spinner"></div>
    </div>

    <template v-else>
      <div v-if="members.length === 0" class="empty-state">
        <div class="empty-state-icon">👥</div>
        <p>メンバーがいません</p>
        <button @click="openCreateModal" class="btn btn-primary">
          最初のメンバーを追加
        </button>
      </div>

      <div v-else class="members-grid">
        <div
          v-for="member in members"
          :key="member.id"
          class="member-card card"
        >
          <div v-if="isImageUrl(member.avatar_icon)" class="member-avatar-image">
            <img :src="getImageUrl(member.avatar_icon)" :alt="member.name" />
          </div>
          <div v-else class="member-avatar">{{ member.avatar_icon || '👤' }}</div>
          <div class="member-info">
            <h3>{{ member.name }}</h3>
            <span v-if="member.is_account_linked" class="linked-badge">
              アカウント連携済み
            </span>
          </div>
          <div class="member-actions">
            <button @click="openEditModal(member)" class="btn btn-sm btn-secondary">
              編集
            </button>
            <button
              @click="deleteMember(member)"
              class="btn btn-sm btn-danger"
              :disabled="members.length <= 1"
            >
              削除
            </button>
          </div>
        </div>

        <!-- Add member card -->
        <button
          v-if="canAddMember"
          @click="openCreateModal"
          class="member-card card add-member-card"
        >
          <div class="add-icon">+</div>
          <span>メンバーを追加</span>
        </button>
      </div>
    </template>

    <!-- Modal -->
    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal card">
        <div class="modal-header">
          <h3>{{ modalTitle }}</h3>
          <button type="button" @click="closeModal" class="modal-close">&times;</button>
        </div>

        <div v-if="error" class="alert alert-error">
          {{ error }}
        </div>

        <form @submit.prevent="saveMember">
          <div class="form-group">
            <label>アイコン</label>
            <IconPicker
              v-model="formData.avatar_icon"
              type="avatar"
              size="medium"
            />
          </div>

          <div class="form-group">
            <label for="member-name">名前 <span class="required">*</span></label>
            <input
              id="member-name"
              v-model="formData.name"
              type="text"
              placeholder="メンバーの名前"
              required
            />
          </div>

          <div class="modal-actions">
            <button type="button" @click="closeModal" class="btn btn-secondary">
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
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.page-header h2 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
}

.page-description {
  color: var(--color-text-light);
  font-size: 0.875rem;
  margin: 0 0 1.5rem;
}

.members-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
}

.member-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 1.5rem;
}

.member-avatar {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.member-avatar-image {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  overflow: hidden;
  margin-bottom: 1rem;
}

.member-avatar-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.member-info {
  margin-bottom: 1rem;
}

.member-info h3 {
  margin: 0 0 0.25rem;
  font-size: 1.125rem;
  font-weight: 600;
}

.linked-badge {
  display: inline-block;
  padding: 0.125rem 0.5rem;
  background: #e8f5e9;
  color: #388e3c;
  border-radius: var(--radius-sm);
  font-size: 0.75rem;
}

.member-actions {
  display: flex;
  gap: 0.5rem;
}

.add-member-card {
  border: 2px dashed var(--color-border);
  background: transparent;
  cursor: pointer;
  transition: all 0.2s;
  justify-content: center;
  min-height: 200px;
}

.add-member-card:hover {
  border-color: var(--color-primary);
  background: #fff3e0;
}

.add-icon {
  font-size: 3rem;
  color: var(--color-text-light);
  margin-bottom: 0.5rem;
}

.add-member-card span {
  color: var(--color-text-light);
  font-weight: 500;
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
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--color-border);
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

.modal-close:hover {
  color: var(--color-text);
}

.required {
  color: var(--color-primary);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid var(--color-border);
}
</style>
