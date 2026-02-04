<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { uploadApi } from '@/api/client'

const props = withDefaults(defineProps<{
  modelValue?: string
  type: 'avatar' | 'recipe'
  emojiOptions?: string[]
  size?: 'small' | 'medium' | 'large'
}>(), {
  modelValue: '',
  size: 'medium',
  emojiOptions: () => ['👤', '👩', '👨', '👧', '👦', '👶', '🧑', '👵', '👴', '🐱', '🐶', '🐰', '🦊', '🐻', '🐼', '🐨'],
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const fileInput = ref<HTMLInputElement | null>(null)
const uploading = ref(false)
const dragOver = ref(false)
const error = ref('')

// 現在の値が画像URLかどうか判定
const isImageUrl = computed(() => {
  const value = props.modelValue
  return !!value && (value.startsWith('http') || value.startsWith('/storage/') || value.includes('/'))
})

// プレビュー用URL
const previewImageUrl = computed(() => {
  if (!isImageUrl.value) return ''
  const value = props.modelValue
  if (value.startsWith('http') || value.startsWith('/storage/')) return value
  return `/storage/${value}`
})

// 現在選択されている絵文字
const selectedEmoji = computed(() => {
  if (isImageUrl.value) return ''
  return props.modelValue || props.emojiOptions[0]
})

function selectEmoji(emoji: string) {
  emit('update:modelValue', emoji)
}

function triggerFileSelect() {
  fileInput.value?.click()
}

async function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    await uploadFile(file)
  }
  target.value = ''
}

function handleDragOver(event: DragEvent) {
  event.preventDefault()
  dragOver.value = true
}

function handleDragLeave() {
  dragOver.value = false
}

async function handleDrop(event: DragEvent) {
  event.preventDefault()
  dragOver.value = false
  const file = event.dataTransfer?.files[0]
  if (file) {
    await uploadFile(file)
  }
}

async function uploadFile(file: File) {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    error.value = 'JPEG、PNG、GIF、WebP形式の画像のみアップロードできます'
    return
  }

  const maxSize = 5 * 1024 * 1024
  if (file.size > maxSize) {
    error.value = 'ファイルサイズは5MB以下にしてください'
    return
  }

  uploading.value = true
  error.value = ''

  try {
    const response = await uploadApi.uploadImage(file, props.type)
    const data = response.data.data
    emit('update:modelValue', data.url)
  } catch (err: unknown) {
    const axiosError = err as { response?: { data?: { error?: { message?: string } } } }
    error.value = axiosError.response?.data?.error?.message || 'アップロードに失敗しました'
  } finally {
    uploading.value = false
  }
}

function clearImage() {
  // 画像をクリアして最初の絵文字に戻す
  emit('update:modelValue', props.emojiOptions[0])
}
</script>

<template>
  <div class="icon-picker" :class="[`size-${size}`, { 'drag-over': dragOver }]">
    <input
      ref="fileInput"
      type="file"
      accept="image/jpeg,image/png,image/gif,image/webp"
      @change="handleFileSelect"
      class="file-input"
    />

    <div class="picker-content">
      <!-- 画像アップロードエリア -->
      <div class="upload-section">
        <div
          v-if="isImageUrl"
          class="image-preview"
          @click="triggerFileSelect"
        >
          <img :src="previewImageUrl" alt="プレビュー" />
          <div class="preview-overlay">
            <span>変更</span>
          </div>
          <button
            type="button"
            class="clear-btn"
            @click.stop="clearImage"
            title="画像を削除"
          >
            &times;
          </button>
        </div>
        <div
          v-else
          class="upload-area"
          :class="{ uploading }"
          @click="triggerFileSelect"
          @dragover="handleDragOver"
          @dragleave="handleDragLeave"
          @drop="handleDrop"
        >
          <div v-if="uploading" class="upload-spinner">
            <div class="spinner"></div>
          </div>
          <div v-else class="upload-content">
            <svg class="upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <span class="upload-text">画像をアップロード</span>
          </div>
        </div>
      </div>

      <!-- 区切り -->
      <div class="divider">
        <span>または</span>
      </div>

      <!-- 絵文字選択 -->
      <div class="emoji-section">
        <div class="emoji-grid">
          <button
            v-for="emoji in emojiOptions"
            :key="emoji"
            type="button"
            class="emoji-btn"
            :class="{ selected: !isImageUrl && selectedEmoji === emoji }"
            @click="selectEmoji(emoji)"
          >
            {{ emoji }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="error" class="picker-error">
      {{ error }}
    </div>
  </div>
</template>

<style scoped>
.icon-picker {
  width: 100%;
}

.file-input {
  display: none;
}

.picker-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* 画像アップロードセクション */
.upload-section {
  display: flex;
  justify-content: center;
}

.upload-area {
  width: 100px;
  height: 100px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 2px dashed var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg);
  cursor: pointer;
  transition: all 0.2s ease;
}

.upload-area:hover,
.drag-over .upload-area {
  border-color: var(--color-primary);
  background: #fff3e0;
}

.upload-area.uploading {
  cursor: wait;
}

.upload-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 0.5rem;
}

.upload-icon {
  width: 24px;
  height: 24px;
  color: var(--color-text-light);
  margin-bottom: 0.25rem;
}

.upload-text {
  font-size: 0.625rem;
  color: var(--color-text-light);
  line-height: 1.3;
}

.upload-spinner {
  display: flex;
  align-items: center;
  justify-content: center;
}

.upload-spinner .spinner {
  width: 24px;
  height: 24px;
  border: 2px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

/* 画像プレビュー */
.image-preview {
  position: relative;
  width: 100px;
  height: 100px;
  border-radius: var(--radius-md);
  overflow: hidden;
  cursor: pointer;
  border: 2px solid var(--color-primary);
  box-shadow: 0 0 0 3px rgba(255, 112, 67, 0.2);
}

.image-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.preview-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.image-preview:hover .preview-overlay {
  opacity: 1;
}

.preview-overlay span {
  color: white;
  font-size: 0.75rem;
  font-weight: 500;
}

.clear-btn {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 20px;
  height: 20px;
  border: none;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  font-size: 14px;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.image-preview:hover .clear-btn {
  opacity: 1;
}

.clear-btn:hover {
  background: rgba(0, 0, 0, 0.8);
}

/* 区切り */
.divider {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--color-border);
}

.divider span {
  font-size: 0.75rem;
  color: var(--color-text-light);
}

/* 絵文字セクション */
.emoji-section {
  /* 絵文字のグリッド */
}

.emoji-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: center;
}

.emoji-btn {
  width: 44px;
  height: 44px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-card);
  font-size: 1.5rem;
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

/* サイズバリエーション */
.size-small .upload-area,
.size-small .image-preview {
  width: 80px;
  height: 80px;
}

.size-small .emoji-btn {
  width: 36px;
  height: 36px;
  font-size: 1.25rem;
}

.size-large .upload-area,
.size-large .image-preview {
  width: 120px;
  height: 120px;
}

.size-large .emoji-btn {
  width: 48px;
  height: 48px;
  font-size: 1.75rem;
}

/* エラー */
.picker-error {
  margin-top: 0.5rem;
  font-size: 0.75rem;
  color: var(--color-danger);
  text-align: center;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
