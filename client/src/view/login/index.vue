<template>
  <div class="login-container">
    <div class="item">
      <button @click="openDevtools">打开调试工具</button>
    </div>
    <div class="item">
      <webview
        name="zhihu"
        id="zhihu-login"
        src="https://www.zhihu.com/"
        useragent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/106.0.0.0 Safari/537.36"
        style
      ></webview>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import _ from 'lodash'

export default defineComponent({
  name: 'dashboard',
  data() {
    return {}
  },
  methods: {
    openDevtools() {
      let webviewEle = document.querySelector('webview#zhihu-login')
      console.log('webviewEle => ', webviewEle)
      // @ts-ignore
      webviewEle?.openDevTools()
    },
  },
})
</script>

<style scoped>
.login-container {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
}
webview {
  display: inline-flex;
  width: 80vw;
  margin: 0 auto;
  height: 80vh;
}
</style>
