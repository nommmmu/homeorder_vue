<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
</script>

<template>
  <header>
    <div class="header-content">
      <h1>
        <RouterLink to="/">HomeOrder</RouterLink>
      </h1>
      <nav>
        <RouterLink to="/">ホーム</RouterLink>
        <template v-if="authStore.isAuthenticated">
          <RouterLink to="/recipes">レシピ</RouterLink>
          <RouterLink to="/meal-plans">献立</RouterLink>
          <RouterLink to="/requests">リクエスト</RouterLink>
          <button @click="authStore.logout" class="logout-btn">ログアウト</button>
        </template>
        <template v-else>
          <RouterLink to="/login">ログイン</RouterLink>
          <RouterLink to="/signup">新規登録</RouterLink>
        </template>
      </nav>
    </div>
  </header>

  <main>
    <RouterView />
  </main>
</template>

<style scoped>
header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 1rem 2rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

h1 {
  margin: 0;
  font-size: 1.5rem;
}

h1 a {
  color: white;
  text-decoration: none;
}

nav {
  display: flex;
  gap: 1.5rem;
  align-items: center;
}

nav a {
  color: white;
  text-decoration: none;
  font-weight: 500;
  transition: opacity 0.2s;
}

nav a:hover {
  opacity: 0.8;
}

nav a.router-link-active {
  border-bottom: 2px solid white;
  padding-bottom: 2px;
}

.logout-btn {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: background 0.2s;
}

.logout-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

main {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}
</style>
