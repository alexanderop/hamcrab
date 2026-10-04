import { createApp } from 'vue'
import { registerSW } from 'virtual:pwa-register'
import App from './app/App.vue'
import { createServices } from './app/bootstrap'
import { servicesKey } from './app/services'
import '@fontsource/press-start-2p/latin.css'
import './style.css'
registerSW({ immediate: true })
const { services, dispose } = createServices()
const app = createApp(App)
app.provide(servicesKey, services)
app.onUnmount(dispose)
app.mount('#app')
if (import.meta.hot) import.meta.hot.dispose(() => app.unmount())
