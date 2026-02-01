<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const errorMessage = ref('')

async function handleSubmit() {
  errorMessage.value = ''
  try {
    await authStore.login(email.value, password.value)
  } catch {
    errorMessage.value = authStore.error || 'ログインに失敗しました'
  }
}
</script>

<template>
  <div class="login-page">
    <div class="login-card card">
      <h2>ログイン</h2>
      <p class="card-subtitle">アカウントにサインイン</p>

      <div v-if="errorMessage" class="alert alert-error">
        {{ errorMessage }}
      </div>

      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <label for="email">メールアドレス</label>
          <input
            id="email"
            v-model="email"
            type="email"
            placeholder="example@email.com"
            required
            autocomplete="email"
          />
        </div>

        <div class="form-group">
          <label for="password">パスワード</label>
          <input
            id="password"
            v-model="password"
            type="password"
            placeholder="パスワードを入力"
            required
            autocomplete="current-password"
          />
        </div>

        <button type="submit" class="btn btn-primary btn-full" :disabled="authStore.loading">
          <span v-if="authStore.loading" class="btn-loading">
            <span class="spinner-small"></span>
            ログイン中...
          </span>
          <span v-else>ログイン</span>
        </button>
      </form>

      <p class="signup-link">
        アカウントをお持ちでない方は
        <RouterLink to="/signup">新規登録</RouterLink>
      </p>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: calc(100vh - 200px);
  padding: 2rem 1rem;
}

.login-card {
  width: 100%;
  max-width: 400px;
}

.login-card h2 {
  margin: 0 0 0.25rem;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-text);
}

.card-subtitle {
  margin: 0 0 1.5rem;
  color: var(--color-text-light);
  font-size: 0.875rem;
}

.btn-full {
  width: 100%;
  margin-top: 0.5rem;
  padding: 0.875rem;
}

.btn-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.spinner-small {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.signup-link {
  margin: 1.5rem 0 0;
  text-align: center;
  color: var(--color-text-light);
  font-size: 0.875rem;
}

.signup-link a {
  color: var(--color-primary);
  font-weight: 600;
}

.signup-link a:hover {
  color: var(--color-primary-dark);
  text-decoration: underline;
}
</style>
