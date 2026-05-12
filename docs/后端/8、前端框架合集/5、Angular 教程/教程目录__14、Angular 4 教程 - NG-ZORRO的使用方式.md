# 14、Angular 4 教程 - NG-ZORRO的使用方式
- 来源：https://ddkk.com/zhuanlan/qianduan/angular/1/14.html
- 分类：前端框架
- 分组：教程目录
这篇文章介绍一下Angular的优秀国内UI组件库NG-ZORRO，并演示一下如何使引入NG-ZORRO到项目之中。

## Why NG-ZORRO

NG-ZORRO由阿里计算平台事业部、阿里云等不同部门的开发人员在原业务组件的基础上构建而成，于2017/8/15在github上发布了第一个对外的版本0.5.0-rc.0，版本更新很快，三个月已经接近有12次更新之多，基本周发布的快速迭代，目前最新版本为0.6.0-rc.3。使用NG-ZORRO有很多原因，比如

- **组件类型丰富**
- **生态可以结合ant-design**
- **结合阿里在自己项目中的经验**
- **版本更新迭代很快**
- **界面漂亮一些**
- **E文不好的开发者的福音**
- **……**

## NG-ZORRO网址

- **详细信息：[https://ng.ant.design/#/docs/angular/introduce](https://ng.ant.design/#/docs/angular/introduce)**
- **github地址：[https://github.com/NG-ZORRO/ng-zorro-antd](https://github.com/NG-ZORRO/ng-zorro-antd)**
- **ant desgin: [https://ant.design/index-cn](https://ant.design/index-cn)**

## 事前准备

### 安装node

详细可以参照：[http://blog.csdn.net/liumiaocn/article/details/78510679](http://blog.csdn.net/liumiaocn/article/details/78510679)

```java
[root@angular ~]# npm -v
5.5.1
[root@angular ~]# 
[root@angular ~]# node -v
v9.1.0
[root@angular ~]#
```

### 安装angular-cli

> 安装命令：npm install -g @angular/cli –unsafe-perm

```java
[root@angular ~]# npm install -g @angular/cli --unsafe-perm
/usr/local/npm/node/bin/ng -> /usr/local/npm/node/lib/node_modules/@angular/cli/bin/ng
> node-sass@4.6.1 install /usr/local/npm/node/lib/node_modules/@angular/cli/node_modules/node-sass
> node scripts/install.js
Downloading binary from https://github.com/sass/node-sass/releases/download/v4.6.1/linux-x64-59_binding.node
Download complete  ] - :
Binary saved to /usr/local/npm/node/lib/node_modules/@angular/cli/node_modules/node-sass/vendor/linux-x64-59/binding.node
Caching binary to /root/.npm/node-sass/4.6.1/linux-x64-59_binding.node
> node-sass@4.6.1 postinstall /usr/local/npm/node/lib/node_modules/@angular/cli/node_modules/node-sass
> node scripts/build.js
Binary found at /usr/local/npm/node/lib/node_modules/@angular/cli/node_modules/node-sass/vendor/linux-x64-59/binding.node
Testing binary
Binary is fine
npm WARN optional SKIPPING OPTIONAL DEPENDENCY: fsevents@1.1.3 (node_modules/@angular/cli/node_modules/fsevents):
npm WARN notsup SKIPPING OPTIONAL DEPENDENCY: Unsupported platform for fsevents@1.1.3: wanted {
    "os":"darwin","arch":"any"} (current: {
    "os":"linux","arch":"x64"})
+ @angular/cli@1.5.0
added 148 packages and updated 1 package in 122.371s
[root@angular ~]#
```

设定link

```java
[root@angular ~]# ln -s /usr/local/npm/node/lib/node_modules/@angular/cli/bin/ng /usr/local/bin/ng
[root@angular ~]# which ng
/usr/local/bin/ng
[root@angular ~]# ng version
    _                      _                 ____ _     ___
   / \   _ __   __ _ _   _| | __ _ _ __     / ___| |   |_ _|
  / △ \ | '_ \ / _ | | | | |/ _ | '__|   | |   | |    | |
 / ___ \| | | | (_| | |_| | | (_| | |      | |___| |___ | |
/_/   \_\_| |_|\__, |\__,_|_|\__,_|_|       \____|_____|___|
               |___/
Angular CLI: 1.5.0
Node: 9.1.0
OS: linux x64
Angular: 
...
[root@angular ~]# 
```

### 安装typescript

```java
[root@angular ~]# npm install -g typescript
/usr/local/npm/node/bin/tsc -> /usr/local/npm/node/lib/node_modules/typescript/bin/tsc
/usr/local/npm/node/bin/tsserver -> /usr/local/npm/node/lib/node_modules/typescript/bin/tsserver
+ typescript@2.6.1
updated 1 package in 9.327s
[root@angular ~]# 
```

## 创建cli项目骨架

```java
[root@angular ~]# ng new NgzorroProject
  create NgzorroProject/README.md (1030 bytes)
  create NgzorroProject/.angular-cli.json (1250 bytes)
  create NgzorroProject/.editorconfig (245 bytes)
  create NgzorroProject/.gitignore (516 bytes)
  create NgzorroProject/src/assets/.gitkeep (0 bytes)
  create NgzorroProject/src/environments/environment.prod.ts (51 bytes)
  create NgzorroProject/src/environments/environment.ts (387 bytes)
  create NgzorroProject/src/favicon.ico (5430 bytes)
  create NgzorroProject/src/index.html (301 bytes)
  create NgzorroProject/src/main.ts (370 bytes)
  create NgzorroProject/src/polyfills.ts (2667 bytes)
  create NgzorroProject/src/styles.css (80 bytes)
  create NgzorroProject/src/test.ts (1085 bytes)
  create NgzorroProject/src/tsconfig.app.json (211 bytes)
  create NgzorroProject/src/tsconfig.spec.json (304 bytes)
  create NgzorroProject/src/typings.d.ts (104 bytes)
  create NgzorroProject/e2e/app.e2e-spec.ts (297 bytes)
  create NgzorroProject/e2e/app.po.ts (208 bytes)
  create NgzorroProject/e2e/tsconfig.e2e.json (235 bytes)
  create NgzorroProject/karma.conf.js (923 bytes)
  create NgzorroProject/package.json (1320 bytes)
  create NgzorroProject/protractor.conf.js (722 bytes)
  create NgzorroProject/tsconfig.json (363 bytes)
  create NgzorroProject/tslint.json (2985 bytes)
  create NgzorroProject/src/app/app.module.ts (316 bytes)
  create NgzorroProject/src/app/app.component.css (0 bytes)
  create NgzorroProject/src/app/app.component.html (1120 bytes)
  create NgzorroProject/src/app/app.component.spec.ts (986 bytes)
  create NgzorroProject/src/app/app.component.ts (207 bytes)
Installing packages for tooling via npm.
Installed packages for tooling via npm.
Project 'NgzorroProject' successfully created.
[root@angular ~]# 
```

## 确认结果

```java
[root@angular ~]# cd NgzorroProject/
[root@angular NgzorroProject]# ng serve -H 0.0.0.0 --open
** NG Live Development Server is listening on 0.0.0.0:4200, open your browser on http://localhost:4200/ **
 10% building modules 5/5 modules 0 active(node:2129) UnhandledPromiseRejectionWarning: Unhandled promise rejection (rejection id: 1): Error: Exited with code 3
(node:2129) [DEP0018] DeprecationWarning: Unhandled promise rejections are deprecated. In the future, promise rejections that are not handled will terminate the Node.js process with a non-zero exit code.                   Date: 2017-11-13T21:48:17.734Z            Hash: 90e96d65fc65e5d3a5ba                    
Time: 27952ms
chunk {inline} inline.bundle.js (inline) 5.79 kB [entry] [rendered]
chunk {main} main.bundle.js (main) 20.1 kB [initial] [rendered]
chunk {polyfills} polyfills.bundle.js (polyfills) 547 kB [initial] [rendered]
chunk {styles} styles.bundle.js (styles) 33.4 kB [initial] [rendered]
chunk {vendor} vendor.bundle.js (vendor) 7.02 MB [initial] [rendered]
webpack: Compiled successfully.
```

## 安装NG-ZORRO

```java
[root@angular NgzorroProject]# npm install ng-zorro-antd --save --unsafe-perm
> node-sass@4.6.1 install /root/NgzorroProject/node_modules/node-sass
> node scripts/install.js
Cached binary found at /root/.npm/node-sass/4.6.1/linux-x64-59_binding.node
> node-sass@4.6.1 postinstall /root/NgzorroProject/node_modules/node-sass
> node scripts/build.js
Binary found at /root/NgzorroProject/node_modules/node-sass/vendor/linux-x64-59/binding.node
Testing binary
Binary is fine
npm WARN codelyzer@3.2.2 requires a peer of @angular/compiler@^2.3.1 || >=4.0.0-beta <5.0.0 but none is installed. You must install peer dependencies yourself.
npm WARN codelyzer@3.2.2 requires a peer of @angular/core@^2.3.1 || >=4.0.0-beta <5.0.0 but none is installed. You must install peer dependencies yourself.
npm WARN ng-zorro-antd@0.6.0-rc.3 requires a peer of @angular/animations@^4.4.4 but none is installed. You must install peer dependencies yourself.
npm WARN ng-zorro-antd@0.6.0-rc.3 requires a peer of @angular/common@^4.4.4 but none is installed. You must install peer dependencies yourself.
npm WARN ng-zorro-antd@0.6.0-rc.3 requires a peer of @angular/core@^4.4.4 but none is installed. You must install peer dependencies yourself.
npm WARN ng-zorro-antd@0.6.0-rc.3 requires a peer of @angular/forms@^4.4.4 but none is installed. You must install peer dependencies yourself.
npm WARN @angular/cdk@2.0.0-beta.12 requires a peer of @angular/core@~4.4.4 but none is installed. You must install peer dependencies yourself.
npm WARN @angular/cdk@2.0.0-beta.12 requires a peer of @angular/common@~4.4.4 but none is installed. You must install peer dependencies yourself.
npm WARN optional SKIPPING OPTIONAL DEPENDENCY: fsevents@1.1.3 (node_modules/fsevents):
npm WARN notsup SKIPPING OPTIONAL DEPENDENCY: Unsupported platform for fsevents@1.1.3: wanted {
    "os":"darwin","arch":"any"} (current: {
    "os":"linux","arch":"x64"})
+ ng-zorro-antd@0.6.0-rc.3
added 148 packages and updated 1 package in 35.176s
[root@angular NgzorroProject]#
```

## NG-ZORRO设定

### 代码

修改app.module.ts，将NgZorroAntdModule给import进来，只需要添加两行即可。

```java
[root@angular app]# cat app.module.ts 
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { NgZorroAntdModule } from 'ng-zorro-antd';
import { AppComponent } from './app.component';
@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    NgZorroAntdModule.forRoot()
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
[root@angular app]#
```

### 特点

- **根 module 使用 NgZorroAntdModule.forRoot()**
- **子 module 使用 NgZorroAntdModule**
- **NgZorroAntdModule.forRoot() 方法可以接受配置文件**

## 修改HTML模板

### 代码

修改app.component.html

```java
[root@angular app]# cat app.component.html 
<!--The content below is only a placeholder and can be replaced.-->
<div style="text-align:center">
  <h1>
    Welcome to {
    {title}}!
  </h1>
</div>
<h2>Buttons</h2>
<button nz-button [nzType]="'primary'">primary</button>
<button nz-button [nzType]="'dashed'">dashed</button>
<button nz-button [nzType]="'default'">default</button>
<button nz-button [nzType]="'danger'">danger</button>
<button nz-button [nzShape]="'default'">defaultShape</button>
<button nz-button [nzShape]="'circle'">O</button>
<button nz-button [nzSize]="'large'">L</button>
<button nz-button [nzSize]="'default'">M</button>
<button nz-button [nzSize]="'small'">S</button>
<button nz-button [nzGhost]="true">L</button>
<button nz-button [nzLoading]="true">L</button>
[root@angular app]# 
```

### 特点

- **组件和指令都是以nz-打头，比如按钮的nz-button**
- **组件和指令的属性都是nz打头其后驼峰命名，比如nzSize**
- **栅格划为24等分**

## 结果确认

## 总结

这篇文章介绍了如何在项目中使用NG-ZORRO，期待国产能够走得更好。
