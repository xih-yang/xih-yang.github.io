# 01、TypeScript 实战 - 准备工作
- 来源：https://ddkk.com/zhuanlan/qianduan/typescript/1/1.html
- 分类：前端框架
- 分组：教程目录
前言：Vue3.0更好的支持TypeScript ，所以学习Ts是非常有必要的，本人也开始零基础学习，并将学习成果分享在博客上，供大家参考学习！
开发工具：VisualStudioCode（VSCode）安装方便插件种类多!

## 1. 安装node.js的环境

```java
Node.js官网(https://node.js.org)去下载进行安装
```

## 2. 全局安装 TypeScript

```java
npm install typescript -g
```

## 3.开始学习

在VSCode中创建demo1.js文件

```java
function xiaoha() {
  let web: string = "Hello World";
  console.log(web);
}
xiaoha();
```

此时运行 *node demo1.ts* 是执行失败的因为node不能直接运行TS文件的

需要要用 *tsc demo1.ts* 转换一下，ts文件被编译成js代码并且生成新的demo1.js文件

在demo1.js中 输入 *node demo1.js* , 在终端就输出了“Hello World”

## 4.ts-node 的安装和使用

按照上面步骤是是可以输出ts文件的内容，但是效率太低了，所以我们安装一个小插件来解决这个问题

使用npm命令来全局安装

```java
npm install -g ts-node
```

安装完成后，就可以在*demo1.ts*文件的终端输入命令

```java
ts-node demo1.ts
```

此时就可以看到xiaoha输出的内容了

说明你的环境和插件都安装好了接下来就可以愉快的学习使用了
