<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

function goBack() {
  router.back()
}

function goHome() {
  if (authStore.isAuthenticated) {
    if (authStore.hasSelectedMember) {
      router.push('/')
    } else {
      router.push('/member-select')
    }
  } else {
    router.push('/login')
  }
}
</script>

<template>
  <div class="not-found-page">
    <div class="not-found-content">
      <div class="error-code">404</div>
      <h1>ページが見つかりません</h1>
      <p>お探しのページは存在しないか、移動した可能性があります。</p>
      <div class="actions">
        <button @click="goBack" class="btn btn-secondary">
          戻る
        </button>
        <button @click="goHome" class="btn btn-primary">
          ホームへ
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.not-found-page {
  min-height: calc(100vh - 64px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.not-found-content {
  text-align: center;
  max-width: 400px;
}

.error-code {
  font-size: 6rem;
  font-weight: 700;
  color: var(--color-primary);
  line-height: 1;
  margin-bottom: 1rem;
}

.not-found-content h1 {
  margin: 0 0 0.5rem;
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--color-text);
}

.not-found-content p {
  margin: 0 0 2rem;
  color: var(--color-text-light);
}

.actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.actions .btn {
  min-width: 120px;
}
</style>
