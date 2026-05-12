# 09、Angular 4 教程 - TypeScript：结合gulp的第一个Helloworld
- 来源：https://ddkk.com/zhuanlan/qianduan/angular/1/9.html
- 分类：前端框架
- 分组：教程目录
这篇文章开始来简单地进行一下typescript的入门。为了简单练习，结合使用前端构建工具gulp进行第一个typescript的HelloWorld程序。

## 学习目标

- **安装gulp**
- **初始化一个练习用的小的工程结构**
- **写第一个typescript的程序**
- **使用gulp确认结果**

## 学习时长

预计时间为5分钟

## 事前准备

### 安装node

事先安装了node，没有安装可以参看下面文章中用到的一键安装脚本，亲测可用。

**[http://blog.csdn.net/liumiaocn/article/details/78510679](http://blog.csdn.net/liumiaocn/article/details/78510679)**

```java
[root@angular tmp]# node -v
v9.1.0
[root@angular tmp]# npm -v
5.5.1
[root@angular tmp]# 
```

### 准备工程目录

```java
[root@angular tmp]# mkdir -p proj/src proj/dist
[root@angular tmp]# find proj -type d
proj
proj/src
proj/dist
[root@angular tmp]# 
```

### npm init

使用npm init对工程进行初期化, 信息可以自己随意填写。

```java
[root@angular tmp]# cd proj
[root@angular proj]# npm init
This utility will walk you through creating a package.json file.
It only covers the most common items, and tries to guess sensible defaults.
See npm help json for definitive documentation on these fields
and exactly what they do.
Use npm install `<pkg>` afterwards to install a package and
save it as a dependency in the package.json file.
Press ^C at any time to quit.
package name: (proj) 
version: (1.0.0) 
description: typescript practice project
entry point: (index.js) 
test command: 
git repository: 
keywords: 
author: liumiaocn
license: (ISC) MIT
About to write to /tmp/proj/package.json:
{
  "name": "proj",
  "version": "1.0.0",
  "description": "typescript practice project",
  "main": "index.js",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "author": "liumiaocn",
  "license": "MIT"
}
Is this ok? (yes) yes
[root@angular proj]#
```

我们来确认一下发生了什么变化：

```java
[root@angular proj]# find . -type f
./package.json
[root@angular proj]# 
```

只是给我们生成了一个文件，来看一下具体内容

```java
[root@angular proj]# cat package.json 
{
  "name": "proj",
  "version": "1.0.0",
  "description": "typescript practice project",
  "main": "index.js",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "author": "liumiaocn",
  "license": "MIT"
}
[root@angular proj]# 
```

就是刚才初始化的信息，npm要用的package.json文件。

### 安装gulp相关依赖

### gulp-cli

> npm install -g gulp-cli

```java
[root@angular proj]# npm install -g gulp-cli
/usr/local/npm/node/bin/gulp -> /usr/local/npm/node/lib/node_modules/gulp-cli/bin/gulp.js
+ gulp-cli@1.4.0
added 139 packages in 59.518s
[root@angular proj]#
```

### typescript gulp gulp-typescript

> npm install –save-dev typescript gulp gulp-typescript

```java
[root@angular proj]# npm install --save-dev typescript gulp gulp-typescript
npm WARN deprecated minimatch@2.0.10: Please update to minimatch 3.0.2 or higher to avoid a RegExp DoS issue
npm WARN deprecated minimatch@0.2.14: Please update to minimatch 3.0.2 or higher to avoid a RegExp DoS issue
npm WARN deprecated graceful-fs@1.2.3: graceful-fs v3.0.0 and before will fail on node releases >= v7.0. Please update to graceful-fs@^4.0.0 as soon as possible. Use 'npm ls graceful-fs' to find it in the tree.
npm notice created a lockfile as package-lock.json. You should commit this file.
npm WARN proj@1.0.0 No repository field.
+ gulp@3.9.1
+ gulp-typescript@3.2.3
+ typescript@2.6.1
added 241 packages in 78.927s
[root@angular proj]#
```

然后此时再来确认一下内容

```java
[root@angular proj]# ls
dist  node_modules  package.json  package-lock.json  src
[root@angular proj]# 
```

因为安装没有加上-g所以在本地node_modules下有刚刚安装的内容，除此之外，还生成了一个package-lock.json用来保存当前依赖的快照，有兴趣的可以看一下具体的内容。而此时src和dist中仍空空如也

```java
[root@angular proj]# ls src dist
dist:
src:
[root@angular proj]# 
```

### 设定一下link

如果不是手动安装的npm，只要你的gulp -v能正常动作，此步骤即可跳过。

确认link源：

```java
[root@angular proj]# ls -l /usr/local/npm/node/lib/node_modules/gulp-cli/bin
total 4
-rwxr-xr-x. 1 root root 54 Nov 11 22:31 gulp.js
[root@angular proj]#
```

设定：

```java
[root@angular proj]# ln -s /usr/local/npm/node/lib/node_modules/gulp-cli/bin/gulp.js /usr/local/bin/gulp
[root@angular proj]#
```

结果确认：

```java
[root@angular proj]# gulp -v
[22:54:48] CLI version 1.4.0
[22:54:48] Local version 3.9.1
[root@angular proj]# 
```

自此，环境的准备就已经全部OK，可以写第一个HelloWorld了。

## typescript的第一个HelloWorld

### index.ts

相对于javascript的弱类型，typescript的静态类型是很重要的区别，使用官方的例子，我们定义一个string的类型然后作为参数进行传递，而这一切都在我们创建在src下面的一个index.ts中进行。

```java
[root@angular proj]# cat src/index.ts 
function hello(compiler: string) {
    console.log(Hello from ${compiler});
}
hello("TypeScript");
[root@angular proj]#
```

### tsconfig.json

为了进行typescript的编译，我们在proj目录下创建如下的设定文件

```java
[root@angular proj]# cat tsconfig.json 
{
    "files": [
        "src/index.ts"
    ],
    "compilerOptions": {
        "noImplicitAny": true,
        "target": "es5"
    }
}
[root@angular proj]#
```

### gulpfile

gulp需要一个gulpfile才能进行工作，我们写一个最简单的gulpfile，如下：

```java
[root@angular proj]# cat gulpfile.js 
var gulp = require("gulp");
var ts = require("gulp-typescript");
var tsProject = ts.createProject("tsconfig.json");
gulp.task("default", function () {
    return tsProject.src()
        .pipe(tsProject())
        .js.pipe(gulp.dest("dist"));
});
[root@angular proj]#
```

可能你还会觉得这有点复杂，但是如果你是从grunt走过来，你会发现简化好多，但是方式似乎有些不同，就是其所谓的流式的构建。gulp会将这一切穿起来，通过它的pipe。

自此，第一个程序就全部OK了，可以确认结果了

## 结果确认

### 执行gulp

```java
[root@angular proj]# ll dist
total 0
[root@angular proj]# gulp
[23:14:05] Using gulpfile /tmp/proj/gulpfile.js
[23:14:05] Starting 'default'...
[23:14:16] Finished 'default' after 11 s
[root@angular proj]# ll dist
total 4
-rw-r--r--. 1 root root 93 Nov 11 23:14 index.js
[root@angular proj]# 
```

可以看到gulp的执行结果是将这一切联系了起来，从我们的src/index.ts最终生成了我们要的dist/index.js

再来看一下编译生成的js代码

```java
[root@angular proj]# cat dist/index.js 
function hello(compiler) {
    console.log("Hello from " + compiler);
}
hello("TypeScript");
[root@angular proj]#
```

### node结果

```java
[root@angular proj]# node dist/index.js 
Hello from TypeScript
[root@angular proj]#
```

这样，我们看到了第一个HelloWorld的执行结果。

## 总结

通过使用gulp，我们第一个typescript的HelloWorld程序到此结束。
