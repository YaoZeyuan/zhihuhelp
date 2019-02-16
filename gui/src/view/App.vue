<template>
  <div class="app">
    <el-container>
      <el-main>
        <el-tabs v-model="status.tab" @tab-click="handleClickTab">
          <el-tab-pane label="任务面板" :name="constant.tab.dashboard">
            <Dashboard :currentTab.sync="status.tab"/>
          </el-tab-pane>
          <el-tab-pane label="运行日志" :name="constant.tab.log">
            <Log/>
          </el-tab-pane>
          <el-tab-pane label="登陆知乎" :name="constant.tab.login">
            <Login/>
          </el-tab-pane>
        </el-tabs>
      </el-main>
      <el-footer></el-footer>
    </el-container>
  </div>
</template>

<script>
  import Dashboard from './dashboard/index.vue'
  import Login from './login/index.vue'
  import Log from './log/index.vue'
  import _ from 'lodash'

  export default {
    name: 'App',
    components:{
      Dashboard,
      Log,
      Login,
    },
    data(){
        return {
          constant:{
            tab:{
              dashboard:'dashboard',
              log:'log',
              login:'login',
            }
          },
            // 页面数据
            database:{
            },
            // 页面状态
            status:{
              tab:'dashboard',
            }
        }
    },
    methods:{
        handleClickTab(){

        },
    },
    computed:{
        taskConfigList(){
            return 
        }
    }
  }
</script>

<style lang="less" scoped>
.app {
  margin: 0 20vw;
  background-color: #f5f7f9;
  height: 100vh;
}
.header {
  .logo {
    width: 2vw;
    height: 2vw;
  }
  h1 {
    display: inline;
  }
}
</style>
