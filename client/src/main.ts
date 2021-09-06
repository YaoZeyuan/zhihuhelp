import { createApp } from 'vue'
import App from './view/App.vue'

import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'


let app = createApp(App)
// 忽略webview标签
// app.config.compilerOptions.isCustomElement = tag => tag === "webview"

app.use(ElementPlus)
app.mount('#app')
