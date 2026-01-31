import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { authApi } from '@/api/client'
import router from '@/router'

interface User {
  id: string
  email: string
  name: string
  avatar_icon?: string
  family_id: string
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('auth_token'))
  const user = ref<User | null>(
    localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!) : null
  )
  const loading = ref(false)
  const error = ref<string | null>(null)

  const isAuthenticated = computed(() => !!token.value)

  async function login(email: string, password: string) {
    loading.value = true
    error.value = null

    try {
      const response = await authApi.login(email, password)
      const data = response.data.data

      token.value = data.token
      user.value = data.user

      localStorage.setItem('auth_token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))

      const redirect = router.currentRoute.value.query.redirect as string
      router.push(redirect || '/')
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
      const responseData = response.data.data

      token.value = responseData.token
      user.value = responseData.user

      localStorage.setItem('auth_token', responseData.token)
      localStorage.setItem('user', JSON.stringify(responseData.user))

      router.push('/')
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
      localStorage.removeItem('auth_token')
      localStorage.removeItem('user')
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
      localStorage.removeItem('auth_token')
      localStorage.removeItem('user')
    }
  }

  return {
    token,
    user,
    loading,
    error,
    isAuthenticated,
    login,
    signup,
    logout,
    fetchUser,
  }
})
