import axios, { type AxiosInstance, type AxiosError } from 'axios'

const apiClient: AxiosInstance = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
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
      localStorage.removeItem('auth_token')
      localStorage.removeItem('user')
      window.location.href = '/login'
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

export const recipeApi = {
  list: (params?: { page?: number; limit?: number }) =>
    apiClient.get('/recipes', { params }),

  get: (id: string) => apiClient.get(`/recipes/${id}`),

  create: (data: Record<string, unknown>) =>
    apiClient.post('/recipes', data),

  update: (id: string, data: Record<string, unknown>) =>
    apiClient.put(`/recipes/${id}`, data),

  delete: (id: string) => apiClient.delete(`/recipes/${id}`),

  search: (query: string) =>
    apiClient.get('/recipes/search', { params: { q: query } }),

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
