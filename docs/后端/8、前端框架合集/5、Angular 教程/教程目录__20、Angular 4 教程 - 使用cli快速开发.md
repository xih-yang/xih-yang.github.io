# 20、Angular 4 教程 - 使用cli快速开发
- 来源：https://ddkk.com/zhuanlan/qianduan/angular/1/20.html
- 分类：前端框架
- 分组：教程目录
angular-cli是angular开发团队自行维护的一个开发工具，用于快速生成项目或者组件的框架以提高效率，而在此基础上又衍生出了很多的框架进行进一步的封装，比如国内的ng-zorro-antd以及ng-alian等。

## 概要信息

项目
说明

官网
https://cli.angular.io/

开源/闭源
开源

License类别
MIT License

代码管理地址
https://github.com/angular/angular-cli

开发语言
typescript

当前稳定版本
6.0.8

更新频度
平均每月数次

## 安装依赖

cli脚手架对node和npm有如下要求

项目
版本要求

node
>=8.9

npm
>=5.5.1

## 安装方式

使用如下两种方式进行安装

> 安装最新版本的cli： npm install -g @angular/cli
>
> 安装制定版本的cli： npm install -g @angular/cli@1.7.3

## 设定yarn

安装yarn，详细可参看：[https://mp.csdn.net/mdeditor/81063463](https://mp.csdn.net/mdeditor/81063463)

## 使用angular-cli

使用angular-cli，只需要如下步骤即可快速搭建前端框架

步骤
命令
说明

步骤1
ng new demo1 –skip-install
创建angular的项目骨架

步骤2
yarn或者yarn install
如果在步骤1中不使用skip-install选项，其会立即更新相关的package

步骤3
ng serve
启动服务

步骤4
确认结果
-

### 步骤1

```java
liumiaocn:angualr liumiao$ ng new demo1 --skip-install
  create demo1/README.md (1021 bytes)
  create demo1/.angular-cli.json (1240 bytes)
  create demo1/.editorconfig (245 bytes)
  create demo1/.gitignore (544 bytes)
  create demo1/src/assets/.gitkeep (0 bytes)
  create demo1/src/environments/environment.prod.ts (51 bytes)
  create demo1/src/environments/environment.ts (387 bytes)
  create demo1/src/favicon.ico (5430 bytes)
  create demo1/src/index.html (292 bytes)
  create demo1/src/main.ts (370 bytes)
  create demo1/src/polyfills.ts (3114 bytes)
  create demo1/src/styles.css (80 bytes)
  create demo1/src/test.ts (642 bytes)
  create demo1/src/tsconfig.app.json (211 bytes)
  create demo1/src/tsconfig.spec.json (283 bytes)
  create demo1/src/typings.d.ts (104 bytes)
  create demo1/e2e/app.e2e-spec.ts (287 bytes)
  create demo1/e2e/app.po.ts (208 bytes)
  create demo1/e2e/tsconfig.e2e.json (235 bytes)
  create demo1/karma.conf.js (923 bytes)
  create demo1/package.json (1290 bytes)
  create demo1/protractor.conf.js (722 bytes)
  create demo1/tsconfig.json (363 bytes)
  create demo1/tslint.json (3012 bytes)
  create demo1/src/app/app.module.ts (316 bytes)
  create demo1/src/app/app.component.css (0 bytes)
  create demo1/src/app/app.component.html (1141 bytes)
  create demo1/src/app/app.component.spec.ts (986 bytes)
  create demo1/src/app/app.component.ts (207 bytes)
Project 'demo1' successfully created.
liumiaocn:angualr liumiao$
详细的的各个文件的说明，可以参看：https://blog.csdn.net/liumiaocn/article/details/78366404
```

### 步骤2

```java
liumiaocn:demo1 liumiao$ yarn 
yarn install v1.7.0
info No lockfile found.
[1/4] ?  Resolving packages...
warning @angular/cli > autoprefixer > browserslist@2.11.3: Browserslist 2 could fail on reading Browserslist >3.0 config used in other tools.
warning karma > log4js > loggly > request > node-uuid@1.4.8: Use uuid module instead
warning karma > log4js > nodemailer@2.7.2: All versions below 4.0.1 of Nodemailer are deprecated. See https://nodemailer.com/status/
warning karma > socket.io > engine.io > uws@9.14.0: stop using this version
warning karma > log4js > nodemailer > mailcomposer@4.0.1: This project is unmaintained
warning karma > log4js > nodemailer > socks@1.1.9: If using 2.x branch, please upgrade to at least 2.1.6 to avoid a serious bug with socket data flow and an import issue introduced in 2.1.0
warning karma > log4js > mailgun-js > proxy-agent > pac-proxy-agent > socks-proxy-agent > socks@1.1.10: If using 2.x branch, please upgrade to at least 2.1.6 to avoid a serious bug with socket data flow and an import issue introduced in 2.1.0
warning karma > log4js > nodemailer > mailcomposer > buildmail@4.0.1: This project is unmaintained
warning karma-coverage-istanbul-reporter > istanbul-api > istanbul-lib-hook@1.2.1: 1.2.0 should have been a major version bump
[2/4] ?  Fetching packages...
[3/4] ?  Linking dependencies...
[4/4] ?  Building fresh packages...
success Saved lockfile.
✨  Done in 202.07s.
liumiaocn:demo1 liumiao$
```

可以看出，此框架中所使用到的angular的版本为5.2.11, typescript为2.5.3，webpack为3.11.0

```java
liumiaocn:demo1 liumiao$ ng version
    _                      _                 ____ _     ___
   / \   _ __   __ _ _   _| | __ _ _ __     / ___| |   |_ _|
  / △ \ | '_ \ / _ | | | | |/ _ | '__|   | |   | |    | |
 / ___ \| | | | (_| | |_| | | (_| | |      | |___| |___ | |
/_/   \_\_| |_|\__, |\__,_|_|\__,_|_|       \____|_____|___|
               |___/
Angular CLI: 1.7.4
Node: 8.9.1
OS: darwin x64
Angular: 5.2.11
... animations, common, compiler, compiler-cli, core, forms
... http, language-service, platform-browser
... platform-browser-dynamic, router
@angular/cli: 1.7.4
@angular-devkit/build-optimizer: 0.3.2
@angular-devkit/core: 0.3.2
@angular-devkit/schematics: 0.3.2
@ngtools/json-schema: 1.2.0
@ngtools/webpack: 1.10.2
@schematics/angular: 0.3.2
@schematics/package-update: 0.3.2
typescript: 2.5.3
webpack: 3.11.0
liumiaocn:demo1 liumiao$ 
```

### 步骤3

```java
liumiaocn:demo1 liumiao$ ng serve
** NG Live Development Server is listening on localhost:4200, open your browser on http://localhost:4200/ **
Date: 2018-07-15T09:43:38.325Z                                                          
Hash: 12bf8b7b262fc67c2457
Time: 5601ms
chunk {inline} inline.bundle.js (inline) 3.85 kB [entry] [rendered]
chunk {main} main.bundle.js (main) 17.9 kB [initial] [rendered]
chunk {polyfills} polyfills.bundle.js (polyfills) 555 kB [initial] [rendered]
chunk {styles} styles.bundle.js (styles) 41.5 kB [initial] [rendered]
chunk {vendor} vendor.bundle.js (vendor) 7.43 MB [initial] [rendered]
webpack: Compiled successfully.
```

### 步骤4

## 设定选项

除了skip-install之外，ng new还有很多有用的选项，比如

选项
缩写
说明

–dry-run
-d -dryRun
空跑，会列出创建的文件但是不会实际创建

–verbose
-v -verbose
输出详细的日志信息

–directory
-dir
制定项目的目录名称，缺省为项目名称

–inline-style
-is
使用内连样式

–inline-template
-it
使用内连模版样式

–version
-
制定Angular CLI使用的版本

–routing
-
创建带有路由的模块，并添加到根模块中

–prefix
-p
设定选择器制定前缀，缺省为app

–style
-
设定样式类型，缺省为css

–skip-tests
-st
跳过创建测试文件

–skip-install
-
跳过安装依赖包

–skip-git
-sg
跳过初期化git仓库

## ng new VS ng init

除了ng new demo1 的方式，使用ng init也可以创建，使用方式基本一致，不同之处在于ng init会在当前目录初始化项目，而不会创建新的目录。

## 参考文献https://github.com/angular/angular-cli/blob/master/packages/angular/cli/README.md
