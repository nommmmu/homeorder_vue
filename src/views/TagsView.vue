<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { tagApi } from '@/api/client'
import type { Tag } from '@/types'

const tags = ref<Tag[]>([])
const loading = ref(true)

// 新規作成フォーム
const showCreateForm = ref(false)
const newTagName = ref('')
const newTagColor = ref('#e11d48')
const creating = ref(false)
const createError = ref('')

// 編集
const editingTagId = ref<string | null>(null)
const editName = ref('')
const editColor = ref('')
const saving = ref(false)
const editError = ref('')

// 削除
const deletingTagId = ref<string | null>(null)

const presetColors = [
  '#e11d48', '#dc2626', '#ea580c', '#ca8a04',
  '#16a34a', '#059669', '#0891b2', '#2563eb',
  '#7c3aed', '#c026d3', '#64748b', '#171717',
]

function randomColor(): string {
  const hex = Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0')
  return `#${hex}`
}

async function loadTags() {
  loading.value = true
  try {
    const response = await tagApi.list()
    tags.value = response.data.data.tags || []
  } catch (error) {
    console.error('Failed to load tags:', error)
  } finally {
    loading.value = false
  }
}

function openCreateForm() {
  showCreateForm.value = true
  newTagName.value = ''
  newTagColor.value = presetColors[Math.floor(Math.random() * presetColors.length)]
  createError.value = ''
}

function closeCreateForm() {
  showCreateForm.value = false
  createError.value = ''
}

async function createTag() {
  if (!newTagName.value.trim()) return

  creating.value = true
  createError.value = ''

  try {
    await tagApi.create({
      name: newTagName.value.trim(),
      color: newTagColor.value,
    })
    closeCreateForm()
    await loadTags()
  } catch (error: unknown) {
    const axiosError = error as { response?: { data?: { message?: string } } }
    createError.value = axiosError.response?.data?.message || 'タグの作成に失敗しました'
  } finally {
    creating.value = false
  }
}

function startEdit(tag: Tag) {
  editingTagId.value = tag.id
  editName.value = tag.name
  editColor.value = tag.color
  editError.value = ''
}

function cancelEdit() {
  editingTagId.value = null
  editError.value = ''
}

async function saveEdit() {
  if (!editingTagId.value || !editName.value.trim()) return

  saving.value = true
  editError.value = ''

  try {
    await tagApi.update(editingTagId.value, {
      name: editName.value.trim(),
      color: editColor.value,
    })
    editingTagId.value = null
    await loadTags()
  } catch (error: unknown) {
    const axiosError = error as { response?: { data?: { message?: string } } }
    editError.value = axiosError.response?.data?.message || 'タグの更新に失敗しました'
  } finally {
    saving.value = false
  }
}

async function deleteTag(tag: Tag) {
  if (!confirm(`タグ「${tag.name}」を削除しますか？`)) return

  deletingTagId.value = tag.id

  try {
    await tagApi.delete(tag.id)
    await loadTags()
  } catch (error) {
    console.error('Failed to delete tag:', error)
  } finally {
    deletingTagId.value = null
  }
}

onMounted(() => {
  loadTags()
})
</script>

<template>
  <div class="tags-page">
    <div class="page-header">
      <h2>タグ管理</h2>
      <button @click="openCreateForm" class="btn btn-primary">
        + 新しいタグ
      </button>
    </div>

    <div v-if="loading" class="loading">
      <div class="spinner"></div>
    </div>

    <template v-else>
      <!-- タグ一覧 -->
      <div class="tags-list card">
        <div v-if="tags.length === 0 && !showCreateForm" class="empty-state">
          <div class="empty-state-icon">🏷️</div>
          <p>タグがありません</p>
          <button @click="openCreateForm" class="btn btn-primary">
            最初のタグを作成
          </button>
        </div>

        <div v-for="tag in tags" :key="tag.id" class="tag-row">
          <!-- 表示モード -->
          <template v-if="editingTagId !== tag.id">
            <div class="tag-info">
              <span class="tag-dot" :style="{ backgroundColor: tag.color }"></span>
              <span class="tag-name">{{ tag.name }}</span>
              <span class="tag-color-code">{{ tag.color }}</span>
            </div>
            <div class="tag-actions">
              <button @click="startEdit(tag)" class="btn btn-sm btn-secondary">
                編集
              </button>
              <button
                @click="deleteTag(tag)"
                class="btn btn-sm btn-danger"
                :disabled="deletingTagId === tag.id"
              >
                {{ deletingTagId === tag.id ? '削除中...' : '削除' }}
              </button>
            </div>
          </template>

          <!-- 編集モード -->
          <template v-else>
            <div class="tag-edit-form">
              <div class="edit-row">
                <span class="tag-dot" :style="{ backgroundColor: editColor }"></span>
                <input
                  v-model="editName"
                  type="text"
                  class="edit-name-input"
                  placeholder="タグ名"
                  @keydown.enter="saveEdit"
                  @keydown.escape="cancelEdit"
                />
                <input
                  v-model="editColor"
                  type="color"
                  class="edit-color-input"
                />
              </div>
              <div class="color-presets">
                <button
                  v-for="color in presetColors"
                  :key="color"
                  class="color-preset-btn"
                  :class="{ active: editColor === color }"
                  :style="{ backgroundColor: color }"
                  @click="editColor = color"
                ></button>
                <button class="color-preset-btn random-btn" @click="editColor = randomColor()">
                  🎲
                </button>
              </div>
              <div v-if="editError" class="edit-error">{{ editError }}</div>
              <div class="edit-actions">
                <button @click="cancelEdit" class="btn btn-sm btn-secondary">
                  キャンセル
                </button>
                <button
                  @click="saveEdit"
                  class="btn btn-sm btn-primary"
                  :disabled="!editName.trim() || saving"
                >
                  {{ saving ? '保存中...' : '保存' }}
                </button>
              </div>
            </div>
          </template>
        </div>

        <!-- 新規作成フォーム -->
        <div v-if="showCreateForm" class="create-form">
          <div class="create-form-title">新しいタグ作成</div>
          <div class="form-group">
            <label for="new-tag-name">タグ名</label>
            <input
              id="new-tag-name"
              v-model="newTagName"
              type="text"
              placeholder="例: 和食"
              @keydown.enter="createTag"
            />
          </div>

          <div class="form-group">
            <label>色</label>
            <div class="color-picker-row">
              <span class="tag-dot large" :style="{ backgroundColor: newTagColor }"></span>
              <input
                v-model="newTagColor"
                type="color"
                class="color-input"
              />
              <span class="color-code">{{ newTagColor }}</span>
              <button type="button" @click="newTagColor = randomColor()" class="btn btn-sm btn-secondary">
                ランダム
              </button>
            </div>
          </div>

          <div class="color-presets">
            <button
              v-for="color in presetColors"
              :key="color"
              class="color-preset-btn"
              :class="{ active: newTagColor === color }"
              :style="{ backgroundColor: color }"
              @click="newTagColor = color"
            ></button>
          </div>

          <div class="preview">
            <span class="preview-label">プレビュー:</span>
            <span class="tag-badge" :style="{ backgroundColor: newTagColor + '20', color: newTagColor, borderColor: newTagColor }">
              <span class="tag-dot small" :style="{ backgroundColor: newTagColor }"></span>
              {{ newTagName || 'タグ名' }}
            </span>
          </div>

          <div v-if="createError" class="alert alert-error">{{ createError }}</div>

          <div class="create-form-actions">
            <button @click="closeCreateForm" class="btn btn-secondary">
              キャンセル
            </button>
            <button
              @click="createTag"
              class="btn btn-primary"
              :disabled="!newTagName.trim() || creating"
            >
              {{ creating ? '作成中...' : '作成' }}
            </button>
          </div>
        </div>
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

.tags-list {
  display: flex;
  flex-direction: column;
}

.tag-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.875rem 0;
  border-bottom: 1px solid var(--color-border);
}

.tag-row:last-child {
  border-bottom: none;
}

.tag-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.tag-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
}

.tag-dot.large {
  width: 20px;
  height: 20px;
}

.tag-dot.small {
  width: 8px;
  height: 8px;
}

.tag-name {
  font-weight: 500;
  font-size: 0.9375rem;
  color: var(--color-text);
}

.tag-color-code {
  font-size: 0.75rem;
  color: var(--color-text-light);
  font-family: monospace;
}

.tag-actions {
  display: flex;
  gap: 0.5rem;
}

/* Edit form */
.tag-edit-form {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.edit-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.edit-name-input {
  flex: 1;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-size: 0.875rem;
}

.edit-name-input:focus {
  outline: none;
  border-color: var(--color-primary);
}

.edit-color-input {
  width: 36px;
  height: 36px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  cursor: pointer;
  padding: 2px;
}

.edit-error {
  color: var(--color-error);
  font-size: 0.8125rem;
}

.edit-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

/* Color presets */
.color-presets {
  display: flex;
  gap: 0.375rem;
  flex-wrap: wrap;
}

.color-preset-btn {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.15s ease;
}

.color-preset-btn:hover {
  transform: scale(1.15);
}

.color-preset-btn.active {
  border-color: var(--color-text);
  box-shadow: 0 0 0 2px #fff, 0 0 0 4px var(--color-text);
}

.random-btn {
  background: #f5f5f5 !important;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
}

/* Create form */
.create-form {
  padding-top: 1.25rem;
  margin-top: 0.5rem;
  border-top: 2px solid var(--color-border);
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.create-form-title {
  font-weight: 600;
  font-size: 0.9375rem;
  color: var(--color-text);
}

.color-picker-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.color-input {
  width: 36px;
  height: 36px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  cursor: pointer;
  padding: 2px;
}

.color-code {
  font-size: 0.8125rem;
  color: var(--color-text-light);
  font-family: monospace;
}

.preview {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: var(--color-secondary);
  border-radius: var(--radius-sm);
}

.preview-label {
  font-size: 0.8125rem;
  color: var(--color-text-light);
}

.tag-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.25rem 0.75rem;
  border-radius: var(--radius-full);
  font-size: 0.8125rem;
  font-weight: 500;
  border: 1px solid;
}

.create-form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding-top: 0.5rem;
}
</style>
