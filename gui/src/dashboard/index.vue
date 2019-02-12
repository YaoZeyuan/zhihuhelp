<template>
  <div>
    <el-input type="textarea" :rows="2" placeholder="请输入内容" v-model="rawTaskContent"></el-input>
  </div>
</template>

<script>
  export default {
    name: 'dashboard',
    data(){
        return {
            // 页面数据
            database:{
                rawTaskContent:'',
            },
            // 页面状态
            status:{
            }
        }
    },
    methods:{
        handleSelect(){

        }
    },
    computed:{
        taskConfigList(){
            return 
        }
    }
  }
</script>

<style scoped>
</style>
