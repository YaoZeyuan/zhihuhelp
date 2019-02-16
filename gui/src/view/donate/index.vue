<template>
  <div class="donate">
    <el-card class="box-card">
      <div class="support-img">
        <img alt="感谢支持" src="http://ww1.sinaimg.cn/large/6671cfa8ly1g08k8rm5grj20ri16sq4r.jpg">
      </div>
      <br>
      <el-table :data="this.database.thankYouList">
        <el-table-column prop="time" label="时间"></el-table-column>
        <el-table-column prop="reason" label></el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script>
  import _ from "lodash"
  import http from "~/gui/src/library/http"

  export default {
    name: 'donate',
    data(){
        return {
          database:{
            thankYouList:[]
          }
        }
    },
    async mounted(){
      await this.asyncGetDonateList()
    },
    methods:{
      async asyncGetDonateList(){
        this.database.thankYouList = await http.asyncGet("https://www.easy-mock.com/mock/5c680a151b1cdb683581355c/zhihuhelp/thank_you/list")
      }
    }
  }
</script>

<style lang="less" scoped>
.donate {
  display: flex;
  width: 50vw;
  align-items: center;
  justify-content: center;
  .box-card {
    width: 40vw;
  }
  .support-img {
    display: flex;
    width: 30vw;
    margin: 0 auto;
    align-items: center;
    justify-content: center;
    img {
      max-width: 60vw;
      max-height: 40vw;
    }
  }
}
</style>
