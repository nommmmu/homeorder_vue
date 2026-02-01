<script setup lang="ts">
import { ref, computed } from 'vue'
import { uploadApi } from '@/api/client'

const props = withDefaults(defineProps<{
  modelValue?: string
  type: 'avatar' | 'recipe' | 'general'
  placeholder?: string
  size?: 'small' | 'medium' | 'large'
}>(), {
  placeholder: '',
  size: 'medium',
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'uploaded', data: { path: string; url: string }): void
  (e: 'error', message: string): void
}>()

const fileInput = ref<HTMLInputElement | null>(null)
const uploading = ref(false)
const dragOver = ref(false)
const error = ref('')

const sizeClass = computed(() => `size-${props.size}`)

const previewUrl = computed(() => {
  if (props.modelValue) {
    // 絶対URLかどうかチェック
    if (props.modelValue.startsWith('http')) {
      return props.modelValue
    }
    // 既に/storage/で始まっている場合はそのまま
    if (props.modelValue.startsWith('/storage/')) {
      return props.modelValue
    }
    // 相対パスの場合は/storageを付ける
    return `/storage/${props.modelValue}`
  }
  return ''
})

function triggerFileSelect() {
  fileInput.value?.click()
}

async function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    await uploadFile(file)
  }
  // リセットして同じファイルを再選択可能に
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
  // バリデーション
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    error.value = 'JPEG、PNG、GIF、WebP形式の画像のみアップロードできます'
    emit('error', error.value)
    return
  }

  const maxSize = 5 * 1024 * 1024 // 5MB
  if (file.size > maxSize) {
    error.value = 'ファイルサイズは5MB以下にしてください'
    emit('error', error.value)
    return
  }

  uploading.value = true
  error.value = ''

  try {
    const response = await uploadApi.uploadImage(file, props.type)
    const data = response.data.data
    emit('update:modelValue', data.url)
    emit('uploaded', { path: data.path, url: data.url })
  } catch (err: unknown) {
    const axiosError = err as { response?: { data?: { error?: { message?: string } } } }
    error.value = axiosError.response?.data?.error?.message || 'アップロードに失敗しました'
    emit('error', error.value)
  } finally {
    uploading.value = false
  }
}

function clearImage() {
  emit('update:modelValue', '')
}
</script>

<template>
  <div class="image-upload" :class="[sizeClass, { 'drag-over': dragOver }]">
    <input
      ref="fileInput"
      type="file"
      accept="image/jpeg,image/png,image/gif,image/webp"
      @change="handleFileSelect"
      class="file-input"
    />

    <!-- プレビュー表示 -->
    <div
      v-if="previewUrl"
      class="preview-container"
      @click="triggerFileSelect"
    >
      <img :src="previewUrl" alt="プレビュー" class="preview-image" />
      <div class="preview-overlay">
        <span class="overlay-text">変更</span>
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

    <!-- アップロードエリア -->
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
        <span>アップロード中...</span>
      </div>
      <div v-else class="upload-content">
        <svg class="upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
        <span class="upload-text">{{ placeholder || 'クリックまたはドラッグして画像をアップロード' }}</span>
        <span class="upload-hint">JPEG, PNG, GIF, WebP (最大5MB)</span>
      </div>
    </div>

    <div v-if="error" class="upload-error">
      {{ error }}
    </div>
  </div>
</template>

<style scoped>
.image-upload {
  position: relative;
}

.file-input {
  display: none;
}

/* サイズバリエーション */
.size-small .upload-area,
.size-small .preview-container {
  width: 80px;
  height: 80px;
}

.size-medium .upload-area,
.size-medium .preview-container {
  width: 120px;
  height: 120px;
}

.size-large .upload-area,
.size-large .preview-container {
  width: 200px;
  height: 200px;
}

/* アップロードエリア */
.upload-area {
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

.size-small .upload-icon {
  width: 20px;
  height: 20px;
}

.size-large .upload-icon {
  width: 32px;
  height: 32px;
}

.upload-text {
  font-size: 0.75rem;
  color: var(--color-text-light);
  line-height: 1.3;
}

.size-small .upload-text,
.size-small .upload-hint {
  display: none;
}

.size-large .upload-text {
  font-size: 0.875rem;
}

.upload-hint {
  font-size: 0.625rem;
  color: #9e9e9e;
  margin-top: 0.25rem;
}

/* アップロード中スピナー */
.upload-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.upload-spinner .spinner {
  width: 24px;
  height: 24px;
  border: 2px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.upload-spinner span {
  font-size: 0.75rem;
  color: var(--color-text-light);
}

/* プレビュー */
.preview-container {
  position: relative;
  border-radius: var(--radius-md);
  overflow: hidden;
  cursor: pointer;
}

.preview-image {
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

.preview-container:hover .preview-overlay {
  opacity: 1;
}

.overlay-text {
  color: white;
  font-size: 0.875rem;
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

.preview-container:hover .clear-btn {
  opacity: 1;
}

.clear-btn:hover {
  background: rgba(0, 0, 0, 0.8);
}

/* エラー */
.upload-error {
  margin-top: 0.5rem;
  font-size: 0.75rem;
  color: var(--color-danger);
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
