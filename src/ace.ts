import ace from "@adonisjs/ace";

/*
|--------------------------------------------------------------------------
| Ace Setup
|--------------------------------------------------------------------------
|
| Ace is the command line utility to create and run terminal commands.
| Here we setup the environment and register ace commands.
|
*/

const registedCommandList = [
    "./command/demo", //  命令demo
    "./command/init_env", //  初始化运行环境
    "./command/fetch/author", //  按用户抓取回答
    "./command/fetch/column", //  按专栏抓取回答
    "./command/fetch/activity", //  抓取用户活动记录
    "./command/generate/author", //  按用户生成电子书
    "./command/generate/activity", //  按用户点赞回答&文章生成电子书
    "./command/generate/column", //  按专栏生成电子书
];
// register commands
for (const command of registedCommandList) {
    ace.addCommand(require(command)["default"]);
}

// Boot ace to execute commands
ace.wireUpWithCommander();
ace.invoke();
