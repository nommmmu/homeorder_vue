<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

const name = ref('')
const email = ref('')
const password = ref('')
const passwordConfirmation = ref('')
const errorMessage = ref('')

async function handleSubmit() {
  errorMessage.value = ''

  if (password.value !== passwordConfirmation.value) {
    errorMessage.value = 'パスワードが一致しません'
    return
  }

  try {
    await authStore.signup({
      name: name.value,
      email: email.value,
      password: password.value,
      password_confirmation: passwordConfirmation.value,
    })
  } catch {
    errorMessage.value = authStore.error || '登録に失敗しました'
  }
}
</script>

<template>
  <div class="signup-page">
    <div class="signup-card card">
      <h2>アカウント作成</h2>
      <p class="card-subtitle">HomeOrderをはじめましょう</p>

      <div v-if="errorMessage" class="alert alert-error">
        {{ errorMessage }}
      </div>

      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <label for="name">お名前</label>
          <input
            id="name"
            v-model="name"
            type="text"
            placeholder="お名前を入力"
            required
            autocomplete="name"
          />
        </div>

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
            placeholder="8文字以上"
            required
            minlength="8"
            autocomplete="new-password"
          />
          <span class="input-hint">8文字以上で設定してください</span>
        </div>

        <div class="form-group">
          <label for="password-confirmation">パスワード（確認）</label>
          <input
            id="password-confirmation"
            v-model="passwordConfirmation"
            type="password"
            placeholder="パスワードを再入力"
            required
            minlength="8"
            autocomplete="new-password"
          />
        </div>

        <button type="submit" class="btn btn-primary btn-full" :disabled="authStore.loading">
          <span v-if="authStore.loading" class="btn-loading">
            <span class="spinner-small"></span>
            登録中...
          </span>
          <span v-else>アカウントを作成</span>
        </button>
      </form>

      <p class="login-link">
        すでにアカウントをお持ちの方は
        <RouterLink to="/login">ログイン</RouterLink>
      </p>
    </div>
  </div>
</template>

<style scoped>
.signup-page {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: calc(100vh - 200px);
  padding: 2rem 1rem;
}

.signup-card {
  width: 100%;
  max-width: 400px;
}

.signup-card h2 {
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

.input-hint {
  display: block;
  margin-top: 0.375rem;
  font-size: 0.75rem;
  color: var(--color-text-light);
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

.login-link {
  margin: 1.5rem 0 0;
  text-align: center;
  color: var(--color-text-light);
  font-size: 0.875rem;
}

.login-link a {
  color: var(--color-primary);
  font-weight: 600;
}

.login-link a:hover {
  color: var(--color-primary-dark);
  text-decoration: underline;
}
</style>
