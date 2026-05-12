# 01、Angular 4 教程 - 运行在Docker中的HelloWorld
- 来源：https://ddkk.com/zhuanlan/qianduan/angular/1/1.html
- 分类：前端框架
- 分组：教程目录
Angular作为目前前端的一个重要选择，加之背后站着google，得到了越来越多的开发者的青睐。但是发现没有按照由浅入深地实例化的教程，虽然官网的教程已经不错，但是初始入门的细节没有提到，再加之网络等问题，决定把官网的教程替大家做一遍给大家留个笔记。同时可能会结合docker进行使用，当然没有安装docker也完全没有关系，同样执行就可以了。

## 事前准备

### OS

```java
[root@angular docker]# uname -a
Linux angular 3.10.0-514.el7.x86_641 SMP Tue Nov 22 16:42:41 UTC 2016 x86_64 x86_64 x86_64 GNU/Linux
[root@angular docker]#
```

### Docker

安装了目前最新的稳定的docker-ce版本，安装方法可以参看

[http://blog.csdn.net/liumiaocn/article/details/78349005](http://blog.csdn.net/liumiaocn/article/details/78349005)

```java
[root@angular ~]# docker version
Client:
 Version:      17.09.0-ce
 API version:  1.32
 Go version:   go1.8.3
 Git commit:   afdb6d4
 Built:        Tue Sep 26 22:39:28 2017
 OS/Arch:      linux/amd64
Server:
 Version:      17.09.0-ce
 API version:  1.32 (minimum version 1.12)
 Go version:   go1.8.3
 Git commit:   afdb6d4
 Built:        Tue Sep 26 22:45:38 2017
 OS/Arch:      linux/amd64
 Experimental: false
[root@angular ~]#
```

## 下载Node镜像

node的官方镜像，使用其alpine的会有跟小的尺寸，对那些关心镜像大小的项目很有帮助。

```java
[root@angular docker]# docker pull node:8.7-alpine
8.7-alpine: Pulling from library/node
Digest: sha256:9c6fab2e870c3dac999ae2bae0eeb4e4831aa25561da03cadcf736f4ba9f9cca
Status: Image is up to date for node:8.7-alpine
[root@angular docker]# docker images 
REPOSITORY          TAG                 IMAGE ID            CREATED             SIZE
node                8.7-alpine          a47a5669ac57        2 weeks ago         65.3MB
[root@angular docker]#
```

可以看到，最新的8.7版本的node，只有65M

## 准备Angular的开发环境

我们在这系列教程中将会使用angular-cli来进行开发，所以其实只需要安装angluar/cli即可，同时将typescript和typings也进行安装，而这些我们固化到一个简单的Dockerfile中。

```java
[root@angular docker]# cat Dockerfile 
FROM node:8.7-alpine
RUN npm install -g @angular/cli \
    npm install -g typescript   \
    npm install -g typings
WORKDIR /workspace
CMD ng serve -H 0.0.0.0 --port=4200
[root@angular docker]# 
```

## Docker build

非docker的环境，只需要安装npm，然后使用npm去执行安装@angular/cli等即可。

> 构建命令：docker build -t angular:latest .

```java
[root@angular docker]# docker build -t angular:latest .
Sending build context to Docker daemon  125.6MB
Step 1/4 : FROM node:8.7-alpine
 ---> a47a5669ac57
Step 2/4 : RUN npm install -g @angular/cli     npm install -g typescript       npm install -g typings
 ---> Running in 275cc362f8ea
npm info it worked if it ends with ok
npm info using npm@5.4.2
npm info using node@v8.7.0
...
+ typescript@2.5.3
+ @angular/cli@1.4.9
+ npm@5.5.1
+ npm@5.5.1
+ typings@2.1.1
added 1142 packages, updated 29 packages and moved 2 packages in 226.09s
npm info ok 
 ---> 1b950a9ce633
Removing intermediate container 275cc362f8ea
Step 3/4 : WORKDIR /workspace
 ---> 628dace1dd72
Removing intermediate container 1c9bb2c59b4b
Step 4/4 : CMD ng serve -H 0.0.0.0 --port=4200
 ---> Running in 36a45f999a65
 ---> a6962d3cb379
Removing intermediate container 36a45f999a65
Successfully built a6962d3cb379
Successfully tagged angular:latest
[root@angular docker]#
```

> 确认构建结果：docker images

```java
[root@angular docker]# docker images
REPOSITORY          TAG                 IMAGE ID            CREATED             SIZE
angular             latest              a6962d3cb379        12 minutes ago      227MB
node                8.7-alpine          a47a5669ac57        2 weeks ago         65.3MB
[root@angular docker]# 
```

可以看到安装这些之后镜像已经达到227M

## 第一个Angular的HelloWorld程序

### docker run

不使用docker的话，可以忽略

```java
[root@angular docker]# docker run -p 4200:4200 -it angular sh
/workspace ls
/workspace hostname
60d12e58d5db
/workspace
```

可以看到已经在一个新启动的容器之中了

### 确认版本

```java
/workspace ng -v
    _                      _                 ____ _     ___
   / \   _ __   __ _ _   _| | __ _ _ __     / ___| |   |_ _|
  / △ \ | '_ \ / _ | | | | |/ _ | '__|   | |   | |    | |
 / ___ \| | | | (_| | |_| | | (_| | |      | |___| |___ | |
/_/   \_\_| |_|\__, |\__,_|_|\__,_|_|       \____|_____|___|
               |___/
@angular/cli: 1.4.9
node: 8.7.0
os: linux x64
/workspace
```

### ng new

使用Angular cli的ng系列命令可以快速创建一个项目，后面会专门来介绍如何使用ng系列命令。

> 命令：ng new HelloAngular

创建一个HelloAngular的项目

```java
/workspace ng new HelloAngular
  create HelloAngular/README.md (1028 bytes)
  create HelloAngular/.angular-cli.json (1290 bytes)
  create HelloAngular/.editorconfig (245 bytes)
  create HelloAngular/.gitignore (516 bytes)
  create HelloAngular/src/assets/.gitkeep (0 bytes)
  create HelloAngular/src/environments/environment.prod.ts (51 bytes)
  create HelloAngular/src/environments/environment.ts (387 bytes)
  create HelloAngular/src/favicon.ico (5430 bytes)
  create HelloAngular/src/index.html (299 bytes)
  create HelloAngular/src/main.ts (370 bytes)
  create HelloAngular/src/polyfills.ts (2667 bytes)
  create HelloAngular/src/styles.css (80 bytes)
  create HelloAngular/src/test.ts (1085 bytes)
  create HelloAngular/src/tsconfig.app.json (211 bytes)
  create HelloAngular/src/tsconfig.spec.json (304 bytes)
  create HelloAngular/src/typings.d.ts (104 bytes)
  create HelloAngular/e2e/app.e2e-spec.ts (295 bytes)
  create HelloAngular/e2e/app.po.ts (208 bytes)
  create HelloAngular/e2e/tsconfig.e2e.json (235 bytes)
  create HelloAngular/karma.conf.js (923 bytes)
  create HelloAngular/package.json (1318 bytes)
  create HelloAngular/protractor.conf.js (722 bytes)
  create HelloAngular/tsconfig.json (363 bytes)
  create HelloAngular/tslint.json (2985 bytes)
  create HelloAngular/src/app/app.module.ts (314 bytes)
  create HelloAngular/src/app/app.component.css (0 bytes)
  create HelloAngular/src/app/app.component.html (1120 bytes)
  create HelloAngular/src/app/app.component.spec.ts (986 bytes)
  create HelloAngular/src/app/app.component.ts (207 bytes)
You can ng set --global packageManager=yarn.
Installing packages for tooling via npm.
module.js:529
    throw err;
    ^
Error: Cannot find module 'semver'
    at Function.Module._resolveFilename (module.js:527:15)
    at Function.Module._load (module.js:476:23)
    at Module.require (module.js:568:17)
    at require (internal/module.js:11:18)
    at Object.<anonymous> (/usr/local/lib/node_modules/npm/lib/utils/unsupported.js:2:14)
    at Module._compile (module.js:624:30)
    at Object.Module._extensions..js (module.js:635:10)
    at Module.load (module.js:545:32)
    at tryModuleLoad (module.js:508:12)
    at Function.Module._load (module.js:500:3)
Package install failed, see above.
Package install failed, see above.
/workspace ng set --global packageManager=yarn
/workspace ls
HelloAngular
/workspace rm -rf HelloAngular
```

发现提示出错了，这个是需要设定packageManager为yarn，入门的时候让做什么就做什么，安装依赖使用yarn也很好，只要能很好的装上就行。

```java
/workspace ng set --global packageManager=yarn
/workspace ls
HelloAngular
/workspace rm -rf HelloAngula
```

发现项目目录实际已经创建了，所以设定之后删除重新再来。

```java
/workspace ng new HelloAngular
  create HelloAngular/README.md (1028 bytes)
  create HelloAngular/.angular-cli.json (1290 bytes)
  create HelloAngular/.editorconfig (245 bytes)
  create HelloAngular/.gitignore (516 bytes)
  create HelloAngular/src/assets/.gitkeep (0 bytes)
  create HelloAngular/src/environments/environment.prod.ts (51 bytes)
  create HelloAngular/src/environments/environment.ts (387 bytes)
  create HelloAngular/src/favicon.ico (5430 bytes)
  create HelloAngular/src/index.html (299 bytes)
  create HelloAngular/src/main.ts (370 bytes)
  create HelloAngular/src/polyfills.ts (2667 bytes)
  create HelloAngular/src/styles.css (80 bytes)
  create HelloAngular/src/test.ts (1085 bytes)
  create HelloAngular/src/tsconfig.app.json (211 bytes)
  create HelloAngular/src/tsconfig.spec.json (304 bytes)
  create HelloAngular/src/typings.d.ts (104 bytes)
  create HelloAngular/e2e/app.e2e-spec.ts (295 bytes)
  create HelloAngular/e2e/app.po.ts (208 bytes)
  create HelloAngular/e2e/tsconfig.e2e.json (235 bytes)
  create HelloAngular/karma.conf.js (923 bytes)
  create HelloAngular/package.json (1318 bytes)
  create HelloAngular/protractor.conf.js (722 bytes)
  create HelloAngular/tsconfig.json (363 bytes)
  create HelloAngular/tslint.json (2985 bytes)
  create HelloAngular/src/app/app.module.ts (314 bytes)
  create HelloAngular/src/app/app.component.css (0 bytes)
  create HelloAngular/src/app/app.component.html (1120 bytes)
  create HelloAngular/src/app/app.component.spec.ts (986 bytes)
  create HelloAngular/src/app/app.component.ts (207 bytes)
Installing packages for tooling via yarn.
Installed packages for tooling via yarn.
Project 'HelloAngular' successfully created.
```

这里可能会等一会时间，因为要安装依赖，可以发现安装的时候已经通过我们设定的yarn了（Installing packages for tooling via yarn.）

### 启动

> 启动命令：ng serve -H 0.0.0.0 –port=4200 –open

注意点：在容器内需要指定-H，缺省端口为4200，如果希望改变使用port选项进行修正即可。

```java
/workspace cd HelloAngular
/workspace/HelloAngular ng serve -H 0.0.0.0 --port=4200 --open
** NG Live Development Server is listening on 0.0.0.0:4200, open your browser on http://localhost:4200/ **
 10% building modules 3/3 modules 0 active(node:146) UnhandledPromiseRejectionWarning: Unhandled promise rejection (rejection id: 1): Error: Exited with code 3
(node:146) [DEP0018] DeprecationWarning: Unhandled promise rejections are deprecated. In the future, promise rejections that are not handled will terminate the Node.js process with a non-zero exit code.                                                                      Date: 2017-10-26T22:02:09.332Z            Hash: c5e9842219db972ca0d2                    
Time: 28679ms
chunk {inline} inline.bundle.js, inline.bundle.js.map (inline) 5.83 kB [entry] [rendered]
chunk {main} main.bundle.js, main.bundle.js.map (main) 8.65 kB {vendor} [initial] [rendered]
chunk {polyfills} polyfills.bundle.js, polyfills.bundle.js.map (polyfills) 199 kB {inline} [initial] [rendered]
chunk {styles} styles.bundle.js, styles.bundle.js.map (styles) 11.3 kB {inline} [initial] [rendered]
chunk {vendor} vendor.bundle.js, vendor.bundle.js.map (vendor) 2.32 MB [initial] [rendered]
webpack: Compiled successfully.
```

可以看到webpack已经编译成功，DeprecationWarning的Warning可以忽略。

### 确认结果

可以看到我们第一个应用程序就看到结果了。

### 修改内容

```java
[root@angular ~]# docker ps
CONTAINER ID        IMAGE               COMMAND             CREATED             STATUS              PORTS                    NAMES
60d12e58d5db        angular             "sh"                16 minutes ago      Up 16 minutes       0.0.0.0:4200->4200/tcp   festive_johnson
[root@angular ~]# docker exec -it festive_johnson sh
/workspace ls
HelloAngular
/workspace cd HelloAngular
/workspace/HelloAngular cd src/app
/workspace/HelloAngular/src/app ls
app.component.css      app.component.html     app.component.spec.ts  app.component.ts       app.module.ts
/workspace/HelloAngular/src/app
```

可以清楚的看到，页面显示的信息在html页面里面

```java
/workspace/HelloAngular/src/app cat app.component.html
<!--The content below is only a placeholder and can be replaced.-->
<div style="text-align:center">
  <h1>
    Welcome to {
     {
     title}}!
  </h1>
  <img width="300" src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNTAgMjUwIj4KICAgIDxwYXRoIGZpbGw9IiNERDAwMzEiIGQ9Ik0xMjUgMzBMMzEuOSA2My4ybDE0LjIgMTIzLjFMMTI1IDIzMGw3OC45LTQzLjcgMTQuMi0xMjMuMXoiIC8+CiAgICA8cGF0aCBmaWxsPSIjQzMwMDJGIiBkPSJNMTI1IDMwdjIyLjItLjFWMjMwbDc4LjktNDMuNyAxNC4yLTEyMy4xTDEyNSAzMHoiIC8+CiAgICA8cGF0aCAgZmlsbD0iI0ZGRkZGRiIgZD0iTTEyNSA1Mi4xTDY2LjggMTgyLjZoMjEuN2wxMS43LTI5LjJoNDkuNGwxMS43IDI5LjJIMTgzTDEyNSA1Mi4xem0xNyA4My4zaC0zNGwxNy00MC45IDE3IDQwLjl6IiAvPgogIDwvc3ZnPg==">
</div>
<h2>Here are some links to help you start: </h2>
<ul>
  <li>
    <h2><a target="_blank" rel="noopener" href="https://angular.io/tutorial">Tour of Heroes</a></h2>
  </li>
  <li>
    <h2><a target="_blank" rel="noopener" href="https://github.com/angular/angular-cli/wiki">CLI Documentation</a></h2>
  </li>
  <li>
    <h2><a target="_blank" rel="noopener" href="https://blog.angular.io/">Angular blog</a></h2>
  </li>
</ul>
/workspace/HelloAngular/src/app 
```

而这个HelloWorld的核心则是在这一句：Welcome to { {title}}!

通过{ {}}差指表达式的语法绑定数据进来，而数据则保存在app.component.ts之中。

```java
/workspace/HelloAngular/src/app cat app.component.ts
import { Component } from '@angular/core';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'app';
}
/workspace/HelloAngular/src/app
```

修改title内容为Angular Examples

```java
/workspace/HelloAngular/src/app cat app.component.ts
import { Component } from '@angular/core';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'Angular Examples';
}
/workspace/HelloAngular/src/app 
```

### 确认结果

此时你会发现在刚刚ng serve启动的窗口，webpack开始重新编译了一遍，因为我们刚刚修改了代码

```java
webpack: Compiling...
Date: 2017-10-26T22:13:15.311Z                                                     
Hash: 2991e5ee5a558b91ce4b
Time: 716ms
chunk {inline} inline.bundle.js, inline.bundle.js.map (inline) 5.83 kB [entry]
chunk {main} main.bundle.js, main.bundle.js.map (main) 8.66 kB {vendor} [initial] [rendered]
chunk {polyfills} polyfills.bundle.js, polyfills.bundle.js.map (polyfills) 199 kB {inline} [initial]
chunk {styles} styles.bundle.js, styles.bundle.js.map (styles) 11.3 kB {inline} [initial]
chunk {vendor} vendor.bundle.js, vendor.bundle.js.map (vendor) 2.32 MB [initial]
webpack: Compiled successfully.
```

### 确认页面显示

如果你的浏览器还在打开着，再次刷新一下，就可以看到修改的结果了

## 总结

这篇文章我们学习到了如何使用Angluarcli进行开发第一个HelloWorld，并且如何将其放到node的官方容器之中，下篇开始我们开始拆官方教程。
