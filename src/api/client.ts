import axios, { type AxiosInstance, type AxiosError } from 'axios'

function serializeParams(params: Record<string, unknown>): string {
  const parts: string[] = []
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue
    if (Array.isArray(value)) {
      value.forEach(v => parts.push(`${encodeURIComponent(key)}[]=${encodeURIComponent(String(v))}`))
    } else {
      parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    }
  }
  return parts.join('&')
}

const apiClient: AxiosInstance = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  paramsSerializer: {
    serialize: serializeParams as (params: Record<string, unknown>) => string,
  },
})

// Request interceptor - add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor - handle errors
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // 認証エラー時はすべての認証情報をクリア
      localStorage.removeItem('auth_token')
      localStorage.removeItem('user')
      localStorage.removeItem('members')
      localStorage.removeItem('current_member')
      // ログインページ以外にいる場合のみリダイレクト
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default apiClient

// API functions
export const authApi = {
  login: (email: string, password: string) =>
    apiClient.post('/login', { email, password }),

  signup: (data: { email: string; password: string; password_confirmation: string; name: string }) =>
    apiClient.post('/signup', data),

  logout: () => apiClient.post('/logout'),

  me: () => apiClient.get('/user'),
}

export const tagApi = {
  list: () => apiClient.get('/tags'),

  create: (data: { name: string; color: string }) =>
    apiClient.post('/tags', data),

  update: (id: string, data: { name?: string; color?: string }) =>
    apiClient.put(`/tags/${id}`, data),

  delete: (id: string) => apiClient.delete(`/tags/${id}`),
}

export const recipeApi = {
  list: (params?: { page?: number; limit?: number; tag_ids?: string[] }) =>
    apiClient.get('/recipes', { params }),

  get: (id: string) => apiClient.get(`/recipes/${id}`),

  create: (data: Record<string, unknown>) =>
    apiClient.post('/recipes', data),

  update: (id: string, data: Record<string, unknown>) =>
    apiClient.put(`/recipes/${id}`, data),

  delete: (id: string) => apiClient.delete(`/recipes/${id}`),

  search: (query: string) =>
    apiClient.get('/recipes/search', { params: { q: query } }),

  advancedSearch: (params: {
    name?: string
    ingredient?: string
    tag_ids?: string[]
    recently_cooked?: string
  }) =>
    apiClient.get('/recipes/advanced-search', {
      params: {
        name: params.name || undefined,
        ingredient: params.ingredient || undefined,
        tag_ids: params.tag_ids?.length ? params.tag_ids : undefined,
        recently_cooked: params.recently_cooked || undefined,
      },
    }),

  toggleLike: (id: string) => apiClient.post(`/recipes/${id}/like`),
}

export const mealPlanApi = {
  list: (params?: { start_date?: string; end_date?: string }) =>
    apiClient.get('/meal-plans', { params }),

  get: (id: string) => apiClient.get(`/meal-plans/${id}`),

  create: (data: Record<string, unknown>) =>
    apiClient.post('/meal-plans', data),

  update: (id: string, data: Record<string, unknown>) =>
    apiClient.put(`/meal-plans/${id}`, data),

  delete: (id: string) => apiClient.delete(`/meal-plans/${id}`),

  addRecipe: (id: string, recipeId: string) =>
    apiClient.post(`/meal-plans/${id}/recipes`, { recipe_id: recipeId }),

  removeRecipe: (id: string, recipeId: string) =>
    apiClient.delete(`/meal-plans/${id}/recipes/${recipeId}`),
}

export const requestApi = {
  list: (params?: { status?: string }) =>
    apiClient.get('/requests', { params }),

  get: (id: string) => apiClient.get(`/requests/${id}`),

  create: (data: Record<string, unknown>) =>
    apiClient.post('/requests', data),

  update: (id: string, data: Record<string, unknown>) =>
    apiClient.put(`/requests/${id}`, data),

  delete: (id: string) => apiClient.delete(`/requests/${id}`),

  complete: (id: string) => apiClient.post(`/requests/${id}/complete`),

  cancel: (id: string) => apiClient.post(`/requests/${id}/cancel`),
}

export const memberApi = {
  list: () => apiClient.get('/members'),

  get: (id: string) => apiClient.get(`/members/${id}`),

  create: (data: { name: string; avatar_icon?: string }) =>
    apiClient.post('/members', data),

  update: (id: string, data: { name?: string; avatar_icon?: string }) =>
    apiClient.put(`/members/${id}`, data),

  delete: (id: string) => apiClient.delete(`/members/${id}`),

  select: (id: string) => apiClient.post(`/members/${id}/select`),

  current: () => apiClient.get('/members/current'),
}

export const userApi = {
  updateProfile: (data: { name?: string; avatar_icon?: string }) =>
    apiClient.put('/users/profile', data),

  updateSettings: (data: { appearance_mode?: string; push_notifications?: boolean }) =>
    apiClient.put('/users/settings', data),
}

export const uploadApi = {
  uploadImage: (file: File, type: 'avatar' | 'recipe' | 'general') => {
    const formData = new FormData()
    formData.append('image', file)
    formData.append('type', type)
    return apiClient.post('/upload/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  },

  deleteImage: (path: string) =>
    apiClient.delete('/upload/image', { data: { path } }),
}
