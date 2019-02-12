<template>
  <div class="app">
    <el-container>
      <el-header>
        <div class="header">
          <!-- <img src="http://ww1.sinaimg.cn/large/6671cfa8ly1g041j9cmdqj208c08cweq.jpg" class="logo"> -->
          <h1>知乎助手</h1>
        </div>
      </el-header>
      <el-main>
        <el-tabs :value="status.tab" @tab-click="handleClickTab">
          <el-tab-pane label="任务面板" :name="constant.tab.dashboard">
            <Dashboard/>
          </el-tab-pane>
          <el-tab-pane label="登陆管理" :name="constant.tab.login">
            <div>login</div>
          </el-tab-pane>
        </el-tabs>
      </el-main>
      <el-footer></el-footer>
    </el-container>
  </div>
</template>

<script>
  import Dashboard from './dashboard/index.vue'
  export default {
    name: 'App',
    components:{
      Dashboard,
    },
    data(){
        return {
          constant:{
            tab:{
              dashboard:'dashboard',
              login:'login',
            }
          },
            // 页面数据
            database:{
            },
            // 页面状态
            status:{
              tab:'dashboard'
            }
        }
    },
    methods:{
        handleClickTab(){

        }
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
