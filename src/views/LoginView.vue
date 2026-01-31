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
            placeholder="パスワード"
            required
            autocomplete="current-password"
          />
        </div>

        <button type="submit" class="btn btn-primary btn-full" :disabled="authStore.loading">
          {{ authStore.loading ? 'ログイン中...' : 'ログイン' }}
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
}

.login-card {
  width: 100%;
  max-width: 400px;
}

.login-card h2 {
  margin: 0 0 1.5rem;
  text-align: center;
}

.btn-full {
  width: 100%;
}

.signup-link {
  text-align: center;
  margin: 1.5rem 0 0;
}
</style>
