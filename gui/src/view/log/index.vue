<template>
  <div>
    <div class="log-dashboard">
      <pre>
        {{this.logString}}
      </pre>
    </div>
    <el-button @click="this.getLogList">刷新</el-button>
    <el-button @click="this.clearLogList">清空日志</el-button>
  </div>
</template>

<script>
  import _ from "lodash"
  import elecrton from "electron"
  let remote = elecrton.remote
  let ipcRenderer = elecrton.ipcRenderer

  export default {
    name: 'dashboard',
    data(){
        return {
            // 页面数据
            database:{
                logList:[],
            },
        }
    },
    mounted(){
      let that = this
      setInterval(function(){
        // 每0.5s更新一次日志
        that.getLogList()
      }, 500)
    },
    methods:{
        getLogList(){
          this.database.logList = remote.getGlobal("logList")
        },
        clearLogList(){
          ipcRenderer.sendSync("clearLogList")
        }
    },
    computed:{
      logTableList(){
        let tableList = []
        for(let item of this.database.logList){
          tableList.push({
            log:item
          })
        }
        return tableList
      },
      logString(){
        return this.database.logList.join("\n")
      }
    }
  }
</script>

<style lang="less" scoped>
.log-dashboard {
  width: 100%;
  height: 50vh;
  overflow-y: scroll;
  pre {
    height: 50vh;
    background-color: #000;
  }
}
</style>
