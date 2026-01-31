export interface User {
  id: string
  email: string
  name: string
  avatar_icon?: string
  family_id: string
  created_at: string
}

export interface Recipe {
  id: string
  family_id: string
  created_by: string
  name: string
  description?: string
  image_icon?: string
  image_url?: string
  cooking_time?: number
  servings?: number
  difficulty?: 'easy' | 'medium' | 'hard'
  tags?: string[]
  ingredients?: Ingredient[]
  steps?: Step[]
  memo?: string
  like_count: number
  cooked_count: number
  is_public: boolean
  is_liked?: boolean
  is_favorited?: boolean
  created_at: string
  updated_at: string
}

export interface Ingredient {
  name: string
  amount?: string
  unit?: string
}

export interface Step {
  step_number: number
  description: string
  image_url?: string
}

export interface MealPlan {
  id: string
  family_id: string
  created_by: string
  date: string
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  name?: string
  icon?: string
  recipes: MealPlanRecipe[]
  memo?: string
  created_at: string
  updated_at: string
}

export interface MealPlanRecipe {
  recipe_id: string
  recipe_name: string
  cooking_time?: number
  image_icon?: string
}

export interface FoodRequest {
  id: string
  family_id: string
  recipe_id?: string
  recipe?: Recipe
  requester_id: string
  requester?: User
  requester_member_id?: string
  requester_member?: Member
  comment?: string
  status: 'active' | 'completed' | 'cancelled'
  completed_by?: string
  completed_at?: string
  meal_plan_id?: string
  created_at: string
  updated_at: string
}

export interface Member {
  id: string
  family_id: string
  user_id?: string
  name: string
  avatar_icon?: string
  is_account_linked: boolean
  created_at: string
  updated_at: string
}

export interface Family {
  id: string
  name: string
  invite_code: string
  owner_id?: string
  max_members: number
  created_at: string
  updated_at: string
}

export interface Pagination {
  current_page: number
  total_pages: number
  total_items: number
  items_per_page: number
}

export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
  error?: {
    code: string
    message: string
  }
}

export interface PaginatedResponse<T> {
  items: T[]
  pagination: Pagination
}
