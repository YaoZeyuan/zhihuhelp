<template>
  <div>
    <h1>任务输入框</h1>
    <el-card>
      <el-form label-width="100px">
        <el-form-item label="排序依据">
          <el-radio-group v-model="database.taskConfig.orderBy">
            <el-radio :label="constant.OrderBy.创建时间">创建时间</el-radio>
            <el-radio :label="constant.OrderBy.更新时间">更新时间</el-radio>
            <el-radio :label="constant.OrderBy.赞同数">赞同数</el-radio>
            <el-radio :label="constant.OrderBy.评论数">评论数</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="排序顺序">
          <el-radio-group v-model="database.taskConfig.order">
            <el-radio :label="constant.Order.从低到高_从旧到新">从低到高/从旧到新</el-radio>
            <el-radio :label="constant.Order.从高到低_从新到旧">从高到低/从新到旧</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="图片质量">
          <el-radio-group v-model="database.taskConfig.imageQuilty">
            <el-radio :label="constant.ImageQuilty.高清">高清</el-radio>
            <el-radio :label="constant.ImageQuilty.无图">无图</el-radio>
            <el-radio :label="constant.ImageQuilty.原图">原图</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="this.database.taskConfig.comment"></el-input>
        </el-form-item>
        <el-form-item label="电子书名">
          <el-input v-model="this.database.taskConfig.bookTitle"></el-input>
        </el-form-item>
      </el-form>
    </el-card>
    <div>
      <pre>
        {{JSON.stringify(database, null , 4)}}
      </pre>
      <br>
      <el-button type="primary" round @click="asyncHandleStartTask">开始执行</el-button>
    </div>
    <h1>解析结果</h1>
    <el-table :data="taskConfigList" style="width: 100%">
      <el-table-column prop="type" label="任务类型" width="180"></el-table-column>
      <el-table-column prop="id" label="id" width="180"></el-table-column>
      <el-table-column prop="comment" label="备注"></el-table-column>
    </el-table>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'

import _ from 'lodash'
import fs from 'fs'
import http from '~/gui/src/library/http'
import util from '~/gui/src/library/util'
import querystring from 'query-string'
import { TypeTaskConfig } from './task_type'
import { Task } from 'electron'

let TaskConfigType = TypeTaskConfig

const electron = require('electron')
const ipcRenderer = electron.ipcRenderer
const remote = electron.remote

let pathConfig = remote.getGlobal('pathConfig')

const TaskType = {
  用户提问过的所有问题: 'author-ask-question',
  用户的所有回答: 'author-answer',
  用户发布的所有想法: 'author-pin',
  用户赞同过的所有回答: 'author-agree-answer',
  用户赞同过的所有文章: 'author-agree-article',
  用户关注过的所有问题: 'author-watch-question',
  话题: 'topic',
  收藏夹: 'collection',
  专栏: 'column',
  文章: 'article',
  问题: 'question',
  回答: 'answer',
  想法: 'pin',
}
const OrderBy = {
  创建时间: 'createAt',
  更新时间: 'updateAt',
  赞同数: 'voteUpCount',
  评论数: 'commentCount',
}
const Order = {
  从低到高_从旧到新: 'asc',
  从高到低_从新到旧: 'desc',
}
const ImageQuilty = {
  无图: 'none',
  原图: 'raw',
  高清: 'hd',
}

const Translate_Task_Type = {
  [TaskConfigType.CONST_Task_Type_用户提问过的所有问题]: '用户提问过的所有问题',
  [TaskConfigType.CONST_Task_Type_用户的所有回答]: '用户的所有回答',
  [TaskConfigType.CONST_Task_Type_问题]: '问题',
  [TaskConfigType.CONST_Task_Type_回答]: '回答',
  [TaskConfigType.CONST_Task_Type_想法]: '想法',
  [TaskConfigType.CONST_Task_Type_用户发布的所有想法]: '用户发布的所有想法',
  [TaskConfigType.CONST_Task_Type_用户赞同过的所有回答]: '用户赞同过的所有回答',
  [TaskConfigType.CONST_Task_Type_用户赞同过的所有文章]: '用户赞同过的所有文章',
  [TaskConfigType.CONST_Task_Type_用户关注过的所有问题]: '用户关注过的所有问题',
  [TaskConfigType.CONST_Task_Type_话题]: '话题',
  [TaskConfigType.CONST_Task_Type_收藏夹]: '收藏夹',
  [TaskConfigType.CONST_Task_Type_专栏]: '专栏',
  [TaskConfigType.CONST_Task_Type_文章]: '文章',
}

const Translate_Image_Quilty = {
  [TaskConfigType.CONST_Image_Quilty_高清]: '高清',
  [TaskConfigType.CONST_Image_Quilty_原图]: '原图',
  [TaskConfigType.CONST_Image_Quilty_无图]: '无图',
}

export default Vue.extend({
  name: 'customerTask',
  data(): {
    database: {
      taskConfig: TaskConfigType.Record
    }
    // 页面状态
    status: {
      isLogin: boolean
    }
    constant: {}
  } {
    let configList: Array<TaskConfigType.ConfigItem> = []
    let taskConfig: TaskConfigType.Record = {
      configList: [],
      orderBy: TaskConfigType.CONST_Order_By_创建时间,
      order: TaskConfigType.CONST_Order_Desc,
      imageQuilty: TaskConfigType.CONST_Image_Quilty_高清,
      coverImage: '',
      bookTitle: '',
      comment: '',
    }
    return {
      // 页面数据
      database: {
        taskConfig: taskConfig,
      },
      // 页面状态
      status: {
        isLogin: false,
      },
      constant: {
        TaskType,
        OrderBy,
        Order,
        ImageQuilty,
      },
    }
  },
  async mounted() {
    // let content = util.getFileContent(pathConfig.readListUri)
    // this.database.rawTaskContent = content
    // await this.asyncCheckIsLogin()
  },
  methods: {
    async saveReadListContent() {
      fs.writeFileSync(pathConfig.readListUri, this.database.rawTaskContent)
    },
    async asyncHandleStartTask() {
      this.saveReadListContent()
      // await this.asyncCheckIsLogin()
      if (this.status.isLogin === false) {
        console.log('尚未登陆知乎')
        return
      }

      // 将当前任务配置发送给服务器
      ipcRenderer.sendSync('start', this.taskConfigList)
      // 将面板切换到log上
      this.$emit('update:currentTab', 'log')
    },
    removeTaskId(id: string) {
      console.log('remove scope.row =>', id)
      let newIdList = []
      for (let item of this.database.item.idList) {
        if (item !== id) {
          newIdList.push(item)
        }
      }
      this.database.item.idList = newIdList
    },
    // async asyncCheckIsLogin(){
    //   // 已登陆则返回用户信息 =>
    //   // {"id":"57842aac37ccd0de3965f9b6e17cb555","url_token":"404-Page-Not-found","name":"姚泽源"}
    //   let record = await http.asyncGet('https://www.zhihu.com/api/v4/me')
    //   this.status.isLogin =  _.has(record, ['id'])
    //   if(this.status.isLogin === false){
    //     this.$alert(`检测尚未登陆知乎, 请登陆后再开始执行任务`, {})
    //     this.$emit('update:currentTab', 'login')
    //   }
    //   console.log("checkIsLogin: record =>", record)
    // }
  },
  computed: {
    taskConfigList() {
      let taskList = []
      // let rawTaskContent = this.database.rawTaskContent
      // if (rawTaskContent === '') {
      //   return []
      // }
      // let rawTaskList = rawTaskContent.split('\n')
      // for (let rawTask of rawTaskList) {
      //   let task = {
      //     type: 'author',
      //     id: '404-Page-Not-found',
      //     orderBy: 'createAt',
      //     order: 'asc',
      //     comment: '备注信息',
      //   }

      //   let demo = {
      //     type: 'author',
      //     id: '404-Page-Not-found',
      //     orderBy: 'createAt',
      //     order: 'asc',
      //     comment: '姚泽源的知乎回答集锦',
      //   }
      //   taskList.push(task)
      // }
      return taskList
    },
  },
})
</script>

<style scoped>
</style>
