import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { authApi, memberApi } from '@/api/client'
import router from '@/router'

interface User {
  id: string
  email: string
  name: string
  avatar_icon?: string
  family_id: string | null
  current_member_id: string | null
}

interface SimpleMember {
  id: string
  name: string
  avatar_icon: string
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('auth_token'))
  const user = ref<User | null>(
    localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!) : null
  )
  const members = ref<SimpleMember[]>(
    localStorage.getItem('members') ? JSON.parse(localStorage.getItem('members')!) : []
  )
  const currentMember = ref<SimpleMember | null>(
    localStorage.getItem('current_member') ? JSON.parse(localStorage.getItem('current_member')!) : null
  )
  const loading = ref(false)
  const error = ref<string | null>(null)

  const isAuthenticated = computed(() => !!token.value)
  const hasSelectedMember = computed(() => !!currentMember.value)
  const hasMembers = computed(() => members.value.length > 0)

  function saveToStorage() {
    if (token.value) localStorage.setItem('auth_token', token.value)
    if (user.value) localStorage.setItem('user', JSON.stringify(user.value))
    localStorage.setItem('members', JSON.stringify(members.value))
    if (currentMember.value) {
      localStorage.setItem('current_member', JSON.stringify(currentMember.value))
    } else {
      localStorage.removeItem('current_member')
    }
  }

  function clearStorage() {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user')
    localStorage.removeItem('members')
    localStorage.removeItem('current_member')
  }

  async function login(email: string, password: string) {
    loading.value = true
    error.value = null

    try {
      const response = await authApi.login(email, password)
      const data = response.data

      token.value = data.token
      user.value = data.user
      members.value = data.members || []
      currentMember.value = data.current_member || null

      saveToStorage()

      // メンバー選択画面へリダイレクト
      router.push('/member-select')
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } }
      error.value = axiosError.response?.data?.message || 'ログインに失敗しました'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function signup(data: {
    email: string
    password: string
    password_confirmation: string
    name: string
  }) {
    loading.value = true
    error.value = null

    try {
      const response = await authApi.signup(data)
      const responseData = response.data

      token.value = responseData.token
      user.value = responseData.user
      members.value = responseData.members || []
      currentMember.value = responseData.current_member || null

      saveToStorage()

      // メンバー選択画面へリダイレクト
      router.push('/member-select')
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } }
      error.value = axiosError.response?.data?.message || '登録に失敗しました'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function logout() {
    try {
      await authApi.logout()
    } catch {
      // Ignore logout errors
    } finally {
      token.value = null
      user.value = null
      members.value = []
      currentMember.value = null
      clearStorage()
      router.push('/login')
    }
  }

  async function fetchUser() {
    if (!token.value) return

    try {
      const response = await authApi.me()
      user.value = response.data.data.user
      localStorage.setItem('user', JSON.stringify(user.value))
    } catch {
      // Token invalid, clear auth
      token.value = null
      user.value = null
      members.value = []
      currentMember.value = null
      clearStorage()
    }
  }

  async function fetchCurrentMember() {
    if (!token.value) return

    try {
      const response = await memberApi.current()
      const data = response.data.data

      if (data.member) {
        currentMember.value = data.member
        localStorage.setItem('current_member', JSON.stringify(data.member))
      } else {
        currentMember.value = null
        localStorage.removeItem('current_member')
      }

      return data
    } catch (err) {
      console.error('Failed to fetch current member:', err)
      return null
    }
  }

  async function selectMember(memberId: string) {
    try {
      const response = await memberApi.select(memberId)
      const member = response.data.data.member

      currentMember.value = member
      if (user.value) {
        user.value.current_member_id = member.id
      }

      saveToStorage()

      return member
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } }
      throw new Error(axiosError.response?.data?.message || 'メンバー選択に失敗しました')
    }
  }

  async function refreshMembers() {
    if (!token.value) return

    try {
      const response = await memberApi.list()
      members.value = response.data.data.members || []
      localStorage.setItem('members', JSON.stringify(members.value))
    } catch (err) {
      console.error('Failed to refresh members:', err)
    }
  }

  async function initAuth() {
    // トークンがない場合は何もしない
    if (!token.value) return

    try {
      // トークンの有効性を確認
      await fetchUser()

      // ユーザー情報が取得できた場合、現在のメンバー情報も取得
      if (user.value) {
        await fetchCurrentMember()
        await refreshMembers()
      }
    } catch {
      // トークンが無効な場合はクリア（fetchUser内で処理済み）
    }
  }

  return {
    token,
    user,
    members,
    currentMember,
    loading,
    error,
    isAuthenticated,
    hasSelectedMember,
    hasMembers,
    login,
    signup,
    logout,
    fetchUser,
    fetchCurrentMember,
    selectMember,
    refreshMembers,
    initAuth,
  }
})
