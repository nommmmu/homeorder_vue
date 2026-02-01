<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { userApi } from '@/api/client'
import ImageUpload from '@/components/ImageUpload.vue'

const router = useRouter()
const authStore = useAuthStore()

const useImageAvatar = ref(false)
const profileForm = ref({
  name: '',
  avatar_icon: '👤',
  avatar_image: '',
})

const settingsForm = ref({
  appearance_mode: 'system',
  push_notifications: true,
})

const savingProfile = ref(false)
const savingSettings = ref(false)
const profileSuccess = ref(false)
const settingsSuccess = ref(false)
const profileError = ref('')
const settingsError = ref('')

const avatarOptions = ['👤', '👩', '👨', '😊', '😎', '🤓', '🧑‍💻', '👨‍🍳', '👩‍🍳', '🦸', '🧙', '🎅']

onMounted(() => {
  if (authStore.user) {
    const hasImage = authStore.user.avatar_icon?.startsWith('http') || authStore.user.avatar_icon?.includes('/')
    useImageAvatar.value = hasImage
    profileForm.value = {
      name: authStore.user.name || '',
      avatar_icon: hasImage ? '👤' : (authStore.user.avatar_icon || '👤'),
      avatar_image: hasImage ? authStore.user.avatar_icon || '' : '',
    }
  }
})

function handleImageUploaded(data: { url: string }) {
  profileForm.value.avatar_image = data.url
}

function toggleAvatarType() {
  useImageAvatar.value = !useImageAvatar.value
  if (!useImageAvatar.value) {
    profileForm.value.avatar_image = ''
  }
}

async function saveProfile() {
  savingProfile.value = true
  profileError.value = ''
  profileSuccess.value = false

  try {
    const avatarIcon = useImageAvatar.value ? profileForm.value.avatar_image : profileForm.value.avatar_icon
    const response = await userApi.updateProfile({
      name: profileForm.value.name,
      avatar_icon: avatarIcon,
    })

    // Update local user data
    if (authStore.user) {
      authStore.user.name = response.data.data.name
      authStore.user.avatar_icon = response.data.data.avatar_icon
      localStorage.setItem('user', JSON.stringify(authStore.user))
    }

    profileSuccess.value = true
    setTimeout(() => { profileSuccess.value = false }, 3000)
  } catch (err: unknown) {
    const axiosError = err as { response?: { data?: { message?: string } } }
    profileError.value = axiosError.response?.data?.message || 'プロフィールの更新に失敗しました'
  } finally {
    savingProfile.value = false
  }
}

async function saveSettings() {
  savingSettings.value = true
  settingsError.value = ''
  settingsSuccess.value = false

  try {
    await userApi.updateSettings(settingsForm.value)
    settingsSuccess.value = true
    setTimeout(() => { settingsSuccess.value = false }, 3000)
  } catch (err: unknown) {
    const axiosError = err as { response?: { data?: { message?: string } } }
    settingsError.value = axiosError.response?.data?.message || '設定の更新に失敗しました'
  } finally {
    savingSettings.value = false
  }
}

function handleLogout() {
  if (confirm('ログアウトしますか？')) {
    authStore.logout()
  }
}

function goToMembers() {
  router.push('/members')
}
</script>

<template>
  <div class="settings-page">
    <h2>設定</h2>

    <!-- Profile Section -->
    <section class="settings-section card">
      <h3>プロフィール</h3>

      <div v-if="profileSuccess" class="alert alert-success">
        プロフィールを更新しました
      </div>
      <div v-if="profileError" class="alert alert-error">
        {{ profileError }}
      </div>

      <form @submit.prevent="saveProfile">
        <div class="form-group">
          <label>アイコン</label>
          <div class="avatar-type-toggle">
            <button
              type="button"
              class="toggle-btn"
              :class="{ active: !useImageAvatar }"
              @click="useImageAvatar = false"
            >
              絵文字
            </button>
            <button
              type="button"
              class="toggle-btn"
              :class="{ active: useImageAvatar }"
              @click="useImageAvatar = true"
            >
              画像
            </button>
          </div>

          <div v-if="!useImageAvatar" class="avatar-picker">
            <button
              v-for="avatar in avatarOptions"
              :key="avatar"
              type="button"
              class="avatar-btn"
              :class="{ selected: profileForm.avatar_icon === avatar }"
              @click="profileForm.avatar_icon = avatar"
            >
              {{ avatar }}
            </button>
          </div>

          <div v-else class="avatar-upload">
            <ImageUpload
              v-model="profileForm.avatar_image"
              type="avatar"
              size="medium"
              placeholder="アイコン画像"
              @uploaded="handleImageUploaded"
            />
          </div>
        </div>

        <div class="form-group">
          <label for="profile-name">名前</label>
          <input
            id="profile-name"
            v-model="profileForm.name"
            type="text"
            placeholder="お名前"
          />
        </div>

        <div class="form-group">
          <label for="profile-email">メールアドレス</label>
          <input
            id="profile-email"
            type="email"
            :value="authStore.user?.email"
            disabled
            class="disabled-input"
          />
          <span class="input-hint">メールアドレスは変更できません</span>
        </div>

        <button type="submit" class="btn btn-primary" :disabled="savingProfile">
          {{ savingProfile ? '保存中...' : 'プロフィールを保存' }}
        </button>
      </form>
    </section>

    <!-- Members Section -->
    <section class="settings-section card">
      <div class="section-header">
        <div>
          <h3>メンバー管理</h3>
          <p class="section-description">家族のメンバーを管理します</p>
        </div>
        <button @click="goToMembers" class="btn btn-secondary">
          メンバー管理へ
        </button>
      </div>
    </section>

    <!-- App Settings Section -->
    <section class="settings-section card">
      <h3>アプリ設定</h3>

      <div v-if="settingsSuccess" class="alert alert-success">
        設定を更新しました
      </div>
      <div v-if="settingsError" class="alert alert-error">
        {{ settingsError }}
      </div>

      <form @submit.prevent="saveSettings">
        <div class="form-group">
          <label for="appearance-mode">テーマ</label>
          <select id="appearance-mode" v-model="settingsForm.appearance_mode">
            <option value="system">システム設定に従う</option>
            <option value="light">ライトモード</option>
            <option value="dark">ダークモード</option>
          </select>
        </div>

        <div class="form-group">
          <label class="checkbox-label">
            <input
              type="checkbox"
              v-model="settingsForm.push_notifications"
            />
            <span class="checkbox-text">プッシュ通知を受け取る</span>
          </label>
        </div>

        <button type="submit" class="btn btn-primary" :disabled="savingSettings">
          {{ savingSettings ? '保存中...' : '設定を保存' }}
        </button>
      </form>
    </section>

    <!-- Account Section -->
    <section class="settings-section card">
      <h3>アカウント</h3>

      <div class="account-info">
        <div class="info-row">
          <span class="info-label">ユーザーID</span>
          <span class="info-value">{{ authStore.user?.id }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">登録日</span>
          <span class="info-value">-</span>
        </div>
      </div>

      <div class="danger-zone">
        <button @click="handleLogout" class="btn btn-danger">
          ログアウト
        </button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.settings-page {
  max-width: 600px;
}

.settings-page h2 {
  margin: 0 0 1.5rem;
  font-size: 1.25rem;
  font-weight: 600;
}

.settings-section {
  margin-bottom: 1.5rem;
}

.settings-section h3 {
  margin: 0 0 1rem;
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.section-header h3 {
  margin-bottom: 0.25rem;
}

.section-description {
  margin: 0;
  color: var(--color-text-light);
  font-size: 0.875rem;
}

.avatar-type-toggle {
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

.avatar-picker {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.avatar-upload {
  margin-bottom: 0.5rem;
}

.avatar-btn {
  width: 48px;
  height: 48px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-card);
  font-size: 1.5rem;
  cursor: pointer;
  transition: all 0.15s;
}

.avatar-btn:hover {
  border-color: var(--color-primary);
  background: #fff3e0;
}

.avatar-btn.selected {
  border-color: var(--color-primary);
  background: #fff3e0;
  box-shadow: 0 0 0 2px rgba(255, 112, 67, 0.2);
}

.disabled-input {
  background: var(--color-secondary) !important;
  color: var(--color-text-light) !important;
  cursor: not-allowed;
}

.input-hint {
  display: block;
  margin-top: 0.375rem;
  font-size: 0.75rem;
  color: var(--color-text-light);
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
}

.checkbox-label input[type="checkbox"] {
  width: 18px;
  height: 18px;
  accent-color: var(--color-primary);
}

.checkbox-text {
  font-weight: normal;
}

.account-info {
  margin-bottom: 1.5rem;
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 0.75rem 0;
  border-bottom: 1px solid var(--color-border);
}

.info-row:last-child {
  border-bottom: none;
}

.info-label {
  color: var(--color-text-light);
  font-size: 0.875rem;
}

.info-value {
  font-size: 0.875rem;
  font-family: monospace;
}

.danger-zone {
  padding-top: 1rem;
  border-top: 1px solid var(--color-border);
}
</style>
