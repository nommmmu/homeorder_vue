import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/auth'

import './assets/main.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

// アプリマウント前に認証状態を初期化
const authStore = useAuthStore()
authStore.initAuth().finally(() => {
  app.mount('#app')
})
