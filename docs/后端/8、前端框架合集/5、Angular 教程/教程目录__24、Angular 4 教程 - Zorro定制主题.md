# 24、Angular 4 教程 - Zorro定制主题
- 来源：https://ddkk.com/zhuanlan/qianduan/angular/1/24.html
- 分类：前端框架
- 分组：教程目录
与之前的版本相比，稳定版本的zorro提供了定制主题的功能，而且和Ant Design React一样，主题定制文件是可以通用的。因为Ant Design的样式本身就是Less的，所以整体的调整会非常的简单。主题可定制可调整，应该是这个版本的zorro的最大亮点之一。

## 使用前提

Less的版本需要降到2.7.3，其实，Angular 5所支持的版本即为2.7.3:

```java
liumiaocn:ng6demo liumiao$ ng version
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
liumiaocn:ng5demo liumiao$ yarn list less
yarn list v1.7.0
warning Filtering by arguments is deprecated. Please use the pattern option instead.
└─ less@2.7.3
✨  Done in 0.70s.
liumiaocn:ng5demo liumiao$ 
```

而Angular 6的是这样的：

```java
liumiaocn:ng6demo liumiao$ ng version
     _                      _                 ____ _     ___
    / \   _ __   __ _ _   _| | __ _ _ __     / ___| |   |_ _|
   / △ \ | '_ \ / _ | | | | |/ _ | '__|   | |   | |    | |
  / ___ \| | | | (_| | |_| | | (_| | |      | |___| |___ | |
 /_/   \_\_| |_|\__, |\__,_|_|\__,_|_|       \____|_____|___|
                |___/
Angular CLI: 6.0.8
Node: 8.11.3
OS: darwin x64
Angular: 6.1.0
... animations, common, compiler, compiler-cli, core, forms
... http, language-service, platform-browser
... platform-browser-dynamic, router
Package                           Version
-----------------------------------------------------------
@angular-devkit/architect         0.6.8
@angular-devkit/build-angular     0.6.8
@angular-devkit/build-optimizer   0.6.8
@angular-devkit/core              0.6.8
@angular-devkit/schematics        0.6.8
@angular/cli                      6.0.8
@ngtools/webpack                  6.0.8
@schematics/angular               0.6.8
@schematics/update                0.6.8
rxjs                              6.2.2
typescript                        2.7.2
webpack                           4.8.3
liumiaocn:ng6demo liumiao$ yarn list less
yarn list v1.7.0
warning Filtering by arguments is deprecated. Please use the pattern option instead.
└─ less@3.8.0
✨  Done in 0.68s.
liumiaocn:ng6demo liumiao$ 
```

而现在的Angular Cli所依赖的是Less 3.x，3.x和2.x对于使用zorro最大的区别在于antd的目前的less需要提供Javascript的支持，

而Less 3.x是不能直接这样做的，所以最简单的方式是降回去，当然后续zorro是否会重构一下也未可知。

## 定制方式

最简单的方式就是在初始化的时候使用–theme选项即可，以下为在前面的Angular 6 + 非定制方式的zorro的构成，使用ng add ng-zorro-antd –theme，在命令执行的过程中会自动将项目使用的less降到2.7.3

```java
liumiaocn:ng6demo liumiao$ yarn list less
yarn list v1.7.0
warning Filtering by arguments is deprecated. Please use the pattern option instead.
└─ less@3.8.0
✨  Done in 0.68s.
liumiaocn:ng6demo liumiao$ ng add ng-zorro-antd --theme
Installing packages for tooling via yarn.
CREATE src/theme.less (15558 bytes)
UPDATE package.json (1364 bytes)
UPDATE angular.json (3621 bytes)
warning " > ng-zorro-antd@1.2.0" has unmet peer dependency "@angular/cdk@^6.0.0".
liumiaocn:ng6demo liumiao$ yarn list less
yarn list v1.7.0
warning Filtering by arguments is deprecated. Please use the pattern option instead.
├─ @angular-devkit/build-angular@0.6.8
│  └─ less@3.8.0
└─ less@2.7.3
✨  Done in 0.64s.
liumiaocn:ng6demo liumiao$ 
```

### theme.less & angular.json

主题定制的方式会创建theme.less文件，zorro可以定制的内容都在这个文件之中：

```java
liumiaocn:ng6demo liumiao$ wc -l src/theme.less 
     474 src/theme.less
liumiaocn:ng6demo liumiao$ grep @ src/theme.less |wc -l
     314
liumiaocn:ng6demo liumiao$ grep @ src/theme.less |head -n3
@import "../node_modules/ng-zorro-antd/src/ng-zorro-antd.less";
@ant-prefix             : ant;
@primary-color          : @blue-6;
liumiaocn:ng6demo liumiao$
```

可以看到大概313个左右可以设定的Less变量用于自定义。

### angular.json

定制主题方式：可以看到style的地方引入theme.less，而theme.less中引入了ng-zorro-antd.less

```java
            "styles": [
              "src/theme.less",
              "src/styles.css"
            ], 
```

非定制主题方式,则是直接在styles中引入

```java
            "styles": [
              "node_modules/ng-zorro-antd/src/ng-zorro-antd.min.css",
              "src/styles.css"
            ],
```

### package.json

Less降级到2.7.3

```java
liumiaocn:ng6demo liumiao$ grep less package.json
    "less": "^2.7.3"
liumiaocn:ng6demo liumiao$
```

## 验证

### app.component.html

修改此模版文件，用于显示几个zorro的组件

```java
liumiaocn:app liumiao$ cat app.component.html 
<nz-divider nzText="Step display"></nz-divider>
<nz-steps>
  <nz-step nzTitle="Todo"></nz-step>
  <nz-step nzTitle="Doing"></nz-step>
  <nz-step nzTitle="Done"></nz-step>
</nz-steps>
<nz-divider nzText="Process display"></nz-divider>
<div style="background: gray" align="middle" >
    <nz-progress [nzPercent]="75" nzType="circle" [nzFormat]="formatOne"></nz-progress>
    <nz-progress [nzPercent]="15" nzType="circle" [nzFormat]="formatOne"></nz-progress>
    <nz-progress [nzPercent]="15" nzType="circle" [nzFormat]="formatOne"></nz-progress>
    <nz-progress [nzPercent]="45" nzType="circle" [nzFormat]="formatOne"></nz-progress>
    <nz-progress [nzPercent]="100" nzType="circle" [nzFormat]="formatTwo"></nz-progress>
</div>
<div>
<nz-divider nzText="card display"></nz-divider>
</div>
<div style="background: gray" align="middle">
<div nz-row [nzGutter]="4">
  <div nz-col [nzSpan]="8">
    <nz-card nzTitle="xxx"><br>XXXX<br><br></nz-card>
  </div>
  <div nz-col [nzSpan]="8">
    <nz-card nzTitle="xxx"><br>XXXX<br><br></nz-card>
  </div>
  <div nz-col [nzSpan]="8">
    <nz-card nzTitle="xxx"><br>XXXX<br><br></nz-card>
  </div>
</div>
</div>
<div align=right >
  <button nz-button nzType="primary">Confirm</button>
</div>
liumiaocn:app liumiao$
```

## 主题修改前

主题修改前，显示是这样的

## 修改主题

修改一下theme文件中的primary color，目前的版本，缺省值为@blue-6，我们直接修改成颜色值：#11aabb或者其他任意颜色

```java
liumiaocn:src liumiao$ grep @primary-color theme.less  |head -n1
@primary-color          :11aabb;
liumiaocn:src liumiao$ 
```

## 修改后

## 问题对应

定制主题方式的时候，遇到如下问题，现简单记录当前版本遇到的问题和解决方法

### 问题现象

在ngserve的时候提示如下信息

```java
ERROR in ./src/theme.less (./node_modules/raw-loader!./node_modules/postcss-loader/lib??embedded!./node_modules/@angular-devkit/build-angular/node_modules/less-loader/dist/cjs.js??ref--15-3!./src/theme.less)
Module build failed: 
// https://github.com/ant-design/ant-motion/issues/44
.bezierEasingMixin();
^
Inline JavaScript is not enabled. Is it set in your options?
      in /Users/liumiao/WebstormProjects/ng6demo/node_modules/ng-zorro-antd/src/style/color/bezierEasing.less (line 110, column 0)
```

### 原因

提示信息为：Inline JavaScript is not enabled. 基本断定还是less版本的因为，因为尚未手写一行代码，一定是环境或者依赖的问题。

### 对应方式

使用yarn重新设定，清除缓存，重新yarn add less的相关版本等都试了，没有起到作用。

将node_modules删除，打开ss，使用npm install安装解决了问题，没有纠结具体原因，yarn/npm/cnpm/pnpm，碰到这种问题，按照顺序来一遍哪个能解决问题用哪个

## 参考文献

[http://ng.ant.design/docs/customize-theme/zh](http://ng.ant.design/docs/customize-theme/zh)
