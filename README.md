#   知乎助手 with TS

##  项目说明

**知乎助手** 由 [姚泽源](http://www.yaozeyuan.online/) 创作，采用 [MIT](http://opensource.org/licenses/MIT) 协议进行许可。

*   项目基于知乎现有接口+TypeScript构建，希望能借此探索TypeScript的使用方式, 同时为知友提供将知乎内容转为Epub电子书的途径

##  使用说明

1.  下载[软件安装包(Windows版)](https://pan.baidu.com/s/19Uj4bBzQzrtarwdmCJkO7w), 双击安装
2.  在`任务输入框`中输入待抓取的网址信息
3.  点击`开始执行`按钮
4.  执行完毕后会打开电子书所在文件夹, 使用**多看阅读**或双击使用Edge浏览器打开均可
5.  输出文件
    1.  `知乎助手输出的电子书\epub`内, 为输出的Epub电子书, 可以直接使用电子书阅读器阅读
    2.  `知乎助手输出的电子书\html`内, 为输出的网页版答案列表
        1.   `html`文件夹中为按回答分割的单个回答页面列表, `index.html`为目录页
        2.   `单文件版`文件夹中为整个文件, 可以使用浏览器打开后, 直接打印为PDF书籍
6.  使用示例 =>
![使用说明](http://ww1.sinaimg.cn/large/6671cfa8ly1g095scec8hj20uy0pfaau.jpg)

#   注意事项

1.  在生成电子书时可能会有卡顿, 根据电子书的体积(100k~2G)卡顿时间在1s~1分钟不等, 函请谅解
2.  所有图片缓存都会存在安装目录下, 随着制作的电子书数量增加, 体积可能会非常大, 因此建议将软件安装在非系统盘根目录, 体积大了直接删除即可

##  知乎助手支持收集的网址类型

| 网址类型                          | 描述                                                                                             | 示例                                                                                                                                                                             |
| --------------------------------- | ------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 指定知乎用户赞同过的全部回答&文章 | 用户个人主页地址 + `activities/`                                                                 | `http://www.zhihu.com/people/yolfilm/activities/`,<br /> `http://www.zhihu.com/people/ying-ye-78/activities/`,<br />`http://www.zhihu.com/people/bo-cai-28-7/activities/` <br /> |
| 指定知乎用户的全部回答            | 用户个人主页地址                                                                                 | `http://www.zhihu.com/people/yolfilm`,<br /> `http://www.zhihu.com/people/ying-ye-78/answers`,<br />`http://www.zhihu.com/people/bo-cai-28-7/logs` <br />                        |
| 话题                              | 知乎话题地址，<br />保存话题信息和话题精华中的答案                                               | `http://www.zhihu.com/topic/19552430`,<br /> `http://www.zhihu.com/topic/19551147/top-answers`,<br />`http://www.zhihu.com/topic/19554859` <br />                                |
| 公开收藏夹                        | 知乎公开收藏夹地址，<br />保存收藏夹信息和收藏夹内的答案                                         | `http://www.zhihu.com/collection/26489045`,<br /> `http://www.zhihu.com/collection/19633165`,<br /> `http://www.zhihu.com/collection/19641505`<br />                             |
| 私人收藏夹                        | 知乎私人收藏夹地址，<br />保存收藏夹信息和收藏夹内的答案，<br />需要创建者用自己的ID登陆知乎助手 | `和正常收藏夹地址一样`                                                                                                                                                           |
| 专栏                              | 专栏的网址                                                                                       | `http://zhuanlan.zhihu.com/yolfilm`, <br />`http://zhuanlan.zhihu.com/epiccomposer`,<br /> `http://zhuanlan.zhihu.com/Wisdom`<br />                                              |

#   目标分解
1.  基础功能
    - [x]    抓取用户回答
    - [x]    导出用户回答
    - [x]    抓取收藏夹
    - [x]    导出收藏夹
    - [x]    抓取话题精华回答
    - [x]    导出话题精华回答
    - [ ]    自定义抓取问题/回答/文章列表
    - [x]    抓取专栏文章
    - [x]    导出专栏文章
    - [x]    抓取用户行为记录
    - [x]    导出用户点赞的所有文章/回答
    - [x]    使用基础命令, 派发进程
2.  扩展功能
    - [x]    导出为单页HTML
    - [x]    导出为epub
    - [ ]    支持通过配置, 按赞同数/创建时间 正序/倒序 导出文章/答案
    - [x]    添加升级检测, 从服务器获取cookie
    - [x]    添加图形界面, 利用Electron创建图形界面/登陆知乎/生成命令配置
    - [x]    利用Electron根据命令启动配置
    - [x]    在Electron展示后端运行日志
    - [ ]    获取问题/回答/文章时, 统一使用标准的answer/article接口进行获取, 保证数据结构一致性(需要了解知乎接口相关参数原理)
    - [x]    能够自动读取上一次生成的配置文件, 而不是每次都需要重新输入
    - [ ]    能够按照赞同/答案长度等指标过滤答案
    - [ ]    开始运行时在前端界面自动检测升级, 并给与提示
    - [ ]    导出文件时, 支持自定义配置(电子书名/封面/作者/etc)
3.  todo
    - [x]    将type声明改为使用namespace形式进行声明
    - [x]    将view改为使用类继承方式进行实现
    - [x]    输出目录结构
    - [x]    当用户回答为空时, 需要跳过渲染环节
    - [x]    解决GUI下看不到运行日志的问题
    - [x]    解决GUI版本无法生成epub文件
    - [x]    解决GUI版本无法将生成结果从缓存文件夹中复制到输出文件夹中的问题
    - [x]    为电子书添加封面
    - [x]    解决Edge浏览器下用户头像过大问题
    - [x]    解决目录列表页显示有空行的问题
    - [x]    解决多看电子书结尾处右下角会换行的问题
    - [x]    添加一个tab, 作为使用说明
    - [x]    运行日志刷新频率过高会导致页面卡死, 定时刷新需要延长执行时间
    - [x]    展示日志应该限制总高度, 每次刷新后应自动滚动到最下方
4.  fixed bug list
    - [x]    输出图片的时候, 本应该替换src属性, 但是替换成了data-default-watermark-src属性
    - [x]    致谢列表溢出了背景颜色区域

#   代码规范
1.  变量命名规范
    1.  类型统一使用namespace方式声明, 导入时使用`Type + xxx`形式进行导入
    2.  Model导入时统一使用`M + xxx`形式进行导入
    3.  View导入时统一使用`View + xxx`形式进行导入
    4.  Util工具函数导入时统一使用`xxx + Util`形式进行导入
    5.  async函数前统一添加`async`前缀, 以和正常函数进行区分
2.  文件命名规范
    1.  统一使用下划线方式命名

#   开发说明

1.  建议只开发命令版
    1.  使用`npm run ace`启动
2.  GUI版需要为Electron编译sqlite3, 非常麻烦, 不建议尝试
    1.  编译指南: https://www.cnblogs.com/DonaHero/p/9809325.html
    2.  流程
        1.  Windows用户
            1.  安装[VS 2015社区版](http://download.microsoft.com/download/B/4/8/B4870509-05CB-447C-878F-2F80E4CB464C/vs2015.com_chs.iso), 是的你没看错
            2.  文件-新建项目-Visual C++ -> 选择 安装vs2015所需的C++开发环境
            3.  好了一个小时过去了
            6.  执行 `npm run rebuild-electron-with-sqlite3`, 编译完成sqlite3之后, 就可以启动GUI界面了
        2.  Mac用户
            1.  我没有mac谢谢
    3.  注意:
        1.  打包时会向dist目录中复制一份node_modules目录, 导致npm run 时优先从dist中获取node_module信息, 导致无法启动
            1.  因此, 打包结束后需要将dist里的node_modules目录删掉, 以免影响后续开发工作
3.  电子书封面分辨率为: 100 * 130(宽*高)
4.  commit信息规范 => 
    | 关键字 | 功能          |
    | ------ | ------------- |
    | feat   | 添加新功能    |
    | format | 调整代码格式  |
    | fix    | 修复错误      |
    | doc    | 修订文档/注释 |


#   功能建议

欢迎通过[issue](https://github.com/YaoZeyuan/zhihuhelp_with_node/issues)提建议

#   支持作者

![感谢支持](http://ww1.sinaimg.cn/large/6671cfa8ly1g08k8rm5grj20ri16sq4r.jpg)

[致谢列表](https://www.easy-mock.com/mock/5c680a151b1cdb683581355c/zhihuhelp/thank_you/list)