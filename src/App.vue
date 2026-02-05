<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { computed } from 'vue'

const authStore = useAuthStore()

const memberAvatarUrl = computed(() => {
  const icon = authStore.currentMember?.avatar_icon
  if (!icon) return ''
  if (icon.startsWith('http') || icon.startsWith('/storage/')) return icon
  if (icon.includes('/')) return `/storage/${icon}`
  return ''
})

const isImageAvatar = computed(() => {
  const icon = authStore.currentMember?.avatar_icon
  return !!icon && (icon.startsWith('http') || icon.startsWith('/storage/') || icon.includes('/'))
})
</script>

<template>
  <header>
    <div class="header-content">
      <h1>
        <RouterLink to="/">HomeOrder</RouterLink>
      </h1>
      <nav>
        <!-- 認証済み＆メンバー選択済み -->
        <template v-if="authStore.isAuthenticated && authStore.hasSelectedMember">
          <RouterLink to="/">ホーム</RouterLink>
          <RouterLink to="/recipes">レシピ</RouterLink>
          <RouterLink to="/tags" class="tags-link" title="タグ管理">
            <svg class="tags-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
              <line x1="7" y1="7" x2="7.01" y2="7"/>
            </svg>
          </RouterLink>
          <RouterLink to="/recipes/search" class="search-link" title="レシピ検索">
            <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </RouterLink>
          <RouterLink to="/meal-plans">献立</RouterLink>
          <RouterLink to="/requests">リクエスト</RouterLink>
          <RouterLink to="/member-select" class="member-link">
            <span v-if="isImageAvatar" class="member-avatar-img">
              <img :src="memberAvatarUrl" :alt="authStore.currentMember?.name" />
            </span>
            <span v-else class="member-avatar">{{ authStore.currentMember?.avatar_icon || '👤' }}</span>
            <span class="member-name">{{ authStore.currentMember?.name }}</span>
          </RouterLink>
          <RouterLink to="/settings" class="settings-link" title="設定">
            <svg class="settings-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
          </RouterLink>
        </template>
        <!-- 認証済みだがメンバー未選択 -->
        <template v-else-if="authStore.isAuthenticated">
          <span class="nav-text">メンバーを選択してください</span>
        </template>
        <!-- 未認証 -->
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
  background: #ffffff;
  padding: 0 2rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  border-bottom: 1px solid #e0e0e0;
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 64px;
}

h1 {
  margin: 0;
  font-size: 1.25rem;
}

h1 a {
  color: #ff7043;
  text-decoration: none;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

nav {
  display: flex;
  gap: 0.25rem;
  align-items: center;
}

nav a {
  color: #616161;
  text-decoration: none;
  font-weight: 500;
  font-size: 0.9375rem;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  transition: all 0.15s ease;
}

nav a:hover {
  color: #ff7043;
  background: #fff3e0;
}

nav a.router-link-active {
  color: #ff7043;
  background: #fff3e0;
}

.nav-text {
  color: #9e9e9e;
  font-size: 0.875rem;
}

.member-link {
  display: flex !important;
  align-items: center;
  gap: 0.5rem;
  margin-left: 0.5rem;
  padding: 0.375rem 0.75rem !important;
  background: #f5f5f5 !important;
  border-radius: 20px !important;
}

.member-link:hover {
  background: #fff3e0 !important;
}

.member-avatar {
  font-size: 1.25rem;
  line-height: 1;
}

.member-avatar-img {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.member-avatar-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.member-name {
  font-size: 0.8125rem;
  max-width: 80px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tags-link {
  padding: 0.5rem !important;
  color: #757575 !important;
  margin-left: -0.5rem;
}

.tags-link:hover {
  color: #ff7043 !important;
  background: #fff3e0 !important;
}

.tags-link.router-link-active {
  color: #ff7043 !important;
  background: #fff3e0 !important;
}

.tags-icon {
  width: 18px;
  height: 18px;
}

.search-link {
  padding: 0.5rem !important;
  color: #757575 !important;
  margin-left: -0.5rem;
}

.search-link:hover {
  color: #ff7043 !important;
  background: #fff3e0 !important;
}

.search-link.router-link-active {
  color: #ff7043 !important;
  background: #fff3e0 !important;
}

.search-icon {
  width: 18px;
  height: 18px;
}

.settings-link {
  margin-left: 0.25rem;
  padding: 0.5rem !important;
  color: #757575 !important;
}

.settings-link:hover {
  color: #ff7043 !important;
  background: #fff3e0 !important;
}

.settings-link.router-link-active {
  color: #ff7043 !important;
  background: #fff3e0 !important;
}

.settings-icon {
  width: 20px;
  height: 20px;
}

main {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

@media (max-width: 768px) {
  header {
    padding: 0 1rem;
  }

  nav {
    gap: 0;
  }

  nav a {
    padding: 0.5rem 0.75rem;
    font-size: 0.875rem;
  }

  main {
    padding: 1.5rem 1rem;
  }
}
</style>
