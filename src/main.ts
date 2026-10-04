import { createApp } from 'vue'
import { registerSW } from 'virtual:pwa-register'
import App from './App.vue'
import '@fontsource/press-start-2p/latin.css'
import './style.css'
registerSW({ immediate: true })
createApp(App).mount('#app')
