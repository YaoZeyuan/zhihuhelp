<template>
  <div class="app">
    <el-container>
      <el-main>
        <el-tabs v-model="status.tab" @tab-click="handleClickTab">
          <el-tab-pane label="自定义任务" :name="constant.tab.customerTask">
            <CustomerTask @switch-tab="handleSwitchTab" />
          </el-tab-pane>
          <el-tab-pane label="运行日志" :name="constant.tab.log">
            <Log />
          </el-tab-pane>
          <el-tab-pane label="登陆知乎" :name="constant.tab.login">
            <Login />
          </el-tab-pane>
          <el-tab-pane label="使用说明" :name="constant.tab.helper">
            <Helper />
          </el-tab-pane>
        </el-tabs>
      </el-main>
      <el-footer></el-footer>
    </el-container>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import CustomerTask from "./customer_task/index.vue";
import Login from "./login/index.vue";
import Log from "./log/index.vue";
import Helper from "./helper/index.vue";
import _ from "lodash";

type Type_Tab_Dashboard = 'dashboard'
type Type_Tab_CustomerTask= "customerTask"
type Type_Tab_Log= "log"
type Type_Tab_Login= "login"
type Type_Tab_Helper= "helper"
type Type_Tab_Donate= "donate"

type Type_Tab = Type_Tab_Dashboard | Type_Tab_CustomerTask | Type_Tab_Log | Type_Tab_Login | Type_Tab_Helper | Type_Tab_Donate


export default defineComponent({
  name: "App",
  components: {
    CustomerTask,
    Log,
    Login,
    Helper,
  },
  data() {
    return {
      constant: {
        tab: {
          dashboard:'dashboard',
          customerTask: "customerTask",
          log: "log",
          login: "login",
          helper: "helper",
          donate: "donate",
        },
      },
      // 页面数据
      database: {},
      // 页面状态
      status: {
        tab: "customerTask",
      },
    };
  },
  methods: {
    handleClickTab(tab: any, event:any ) {
      this.status.tab = tab.paneName
    },
    handleSwitchTab(tab:Type_Tab ) {
      console.log("tab =>" , tab)
      this.status.tab = tab
    },
  },
  computed: {
    taskConfigList() {
      return;
    },
  },
})
</script>

<style lang="less" scoped>
.app {
  margin: 0 5vw;
  background-color: #f5f7f9;
  min-height: 100vh;
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
