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
      <h2>新規登録</h2>

      <div v-if="errorMessage" class="alert alert-error">
        {{ errorMessage }}
      </div>

      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <label for="name">名前</label>
          <input
            id="name"
            v-model="name"
            type="text"
            placeholder="お名前"
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
          {{ authStore.loading ? '登録中...' : '登録する' }}
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
}

.signup-card {
  width: 100%;
  max-width: 400px;
}

.signup-card h2 {
  margin: 0 0 1.5rem;
  text-align: center;
}

.btn-full {
  width: 100%;
}

.login-link {
  text-align: center;
  margin: 1.5rem 0 0;
}
</style>
