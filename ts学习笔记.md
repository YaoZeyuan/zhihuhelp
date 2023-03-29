1.  babel默认只编译后缀名为js的代码, 如果想使用babel转义ts, 需要指定`--extensions '.ts'`参数
2.  由于是使用babel进行的转义, 所以`tsconfig.json`事实上是没有用的, 真正起作用的还是`.babelrc`
3.  所以, 根目录别名这种东西还是要用`babel-plugin-root-import`插件
4.  文本教程: [中文](https://www.tslang.cn/docs/handbook/basic-types.html), [英文](http://www.typescriptlang.org/docs/handbook/basic-types.html)
5.  tslint使用命令: `./node_modules/.bin/tslint -c tslint.json src/**/* --fix`

