<template>
  <div>
    <webview
      name="github-readme"
      id="github-readme"
      src="https://github.com/YaoZeyuan/zhihuhelp/blob/master/README.md"
      style
    ></webview>
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
})
</script>

<style scoped>
webview {
  display: inline-flex;
  width: 80vw;
  margin: 0 auto;
  height: 80vh;
}
</style>
