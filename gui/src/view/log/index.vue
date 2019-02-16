<template>
  <div>
    <div class="log-dashboard">
      <pre>{{this.database.log}}</pre>
    </div>
    <el-button @click="this.updateLog">刷新</el-button>
    <el-button @click="this.clearLog">清空日志</el-button>
  </div>
</template>

<script>
  import _ from "lodash"
  import fs from "fs"
  import electron from "electron"
  import util from '~/gui/src/library/util'
  let remote = electron.remote
  let ipcRenderer = electron.ipcRenderer
  
  let pathConfig = remote.getGlobal("pathConfig")

  export default {
    name: 'dashboard',
    data(){
        return {
            // 页面数据
            database:{
                log:'',
            },
        }
    },
    mounted(){
      let that = this
      setInterval(function(){
        // 每0.5s更新一次日志
        that.updateLog()
      }, 1000)
    },
    methods:{
        updateLog(){
          this.database.log = util.getFileContent(pathConfig.runtimeLogUri)
          console.log("updateLog: log =>", this.database.log)
        },
        clearLog(){
          fs.writeFileSync(pathConfig.runtimeLogUri, '')
        }
    },
    computed:{
    }
  }
</script>

<style lang="less" scoped>
.log-dashboard {
  width: 100%;
  // height: 50vh;
  overflow-y: scroll;
  background-color: #fdf6ec;
  pre {
    white-space: pre-line;
    // height: 50vh;
    background-color: #fdf6ec;
  }
}
</style>
