# 43、Angular 4 教程 - Karma测试的持续集成实践
- 来源：https://ddkk.com/zhuanlan/qianduan/angular/1/43.html
- 分类：前端框架
- 分组：教程目录
使用Angular + Karma + Jasmine可以进行前端的单体测试，从前面的文章中我们了解到了Karma的工作原理，它会启动一个指定种类的浏览器，然后在此浏览器中运行测试用例。如果需要进行持续集成，比如结合Jenkins或者其他方式进行自动化的测试，如果需要手动关闭浏览器的操作，或者无法提供图形化的界面的情况保证测试的执行这些都会成为持续集成的障碍，这篇文章整理一下解决的常见方法。

## 可使用浏览器的测试环境

当测试环境可以使用浏览器，在这台机器上使用ng test则能进行测试，Karma会启动Chrome浏览器，然后执行测试用例，持续集成的时候，Jenkins通过远程命令执行的方式到可使用浏览器的测试环境中执行ng test完成测试。

这种方式非常简单，需要解决的只有一个问题，Angular 的demo应用执行ng test时，执行完毕之后，Chrome浏览器也不会退出，这样Jenkins的调用部分也不会返回，只需要保证其执行结束后立即关闭浏览器，这种方式就没有问题了。而实际上Karma的设定文件中，singleRun正是这个选项，缺省被设定为false，这就是其不退出的原因。只需要将此选项设定为true即可。demo示例的Karma设定文件改成如下即可：

```java
liumiaocn:demo liumiao$ cp karma.conf.js karma.conf.js.origin
liumiaocn:demo liumiao$ vi karma.conf.js
liumiaocn:demo liumiao$ diff karma.conf.js karma.conf.js.origin 
29c29
<     singleRun: true,
---
>     singleRun: false,
liumiaocn:demo liumiao$
```

执行日志如下所示：

```java
liumiaocn:demo liumiao$ rm -rf coverage/
liumiaocn:demo liumiao$ ls
README.md            e2e                  node_modules         src                  tsconfig.spec.json
angular.json         karma.conf.js        package-lock.json    tsconfig.app.json    tslint.json
browserslist         karma.conf.js.origin package.json         tsconfig.json
liumiaocn:demo liumiao$ 
liumiaocn:demo liumiao$ ng test --code-coverage
30% building 12/12 modules 0 active31 10 2019 20:19:39.308:INFO [karma-server]: Karma v4.1.0 server started at http://0.0.0.0:9876/
31 10 2019 20:19:39.314:INFO [launcher]: Launching browsers Chrome with concurrency unlimited
30% building 13/13 modules 0 active31 10 2019 20:19:39.324:INFO [launcher]: Starting browser Chrome
31 10 2019 20:19:43.028:INFO [Chrome 78.0.3904 (Mac OS X 10.14.0)]: Connected on socket Pwhf3R-KNkzVDi1AAAAA with id 46366297
Chrome 78.0.3904 (Mac OS X 10.14.0): Executed 3 of 3 SUCCESS (0.373 secs / 0.321 secs)
TOTAL: 3 SUCCESS
TOTAL: 3 SUCCESS
TOTAL: 3 SUCCESS
=============================== Coverage summary ===============================
Statements   : 100% ( 6/6 )
Branches     : 100% ( 0/0 )
Functions    : 100% ( 1/1 )
Lines        : 100% ( 5/5 )
================================================================================
liumiaocn:demo liumiao$ ls
README.md            coverage             karma.conf.js.origin package.json         tsconfig.json
angular.json         e2e                  node_modules         src                  tsconfig.spec.json
browserslist         karma.conf.js        package-lock.json    tsconfig.app.json    tslint.json
liumiaocn:demo liumiao$ 
```

在这个过程中可以看到Chrome被自动打开、执行测试用例并显示结果然后自动退出了。通过远程方式调用应该也没有问题。不评价解决方法的好坏与局限性，这也是一种实现的方式。

## 无需打开浏览器的测试环境: PhantomJS

比如测试环境在一个基于Alpine版Linux的容器之中的情况下，无法使用或者不希望使用图形化的浏览器的情况下，可以使用浏览器的Headless模式或者无界面方式的浏览器。PhantomJS就是这样的一种解决方法，Phantom是一个隐形的浏览器，就像它的名字那样，像一个“鬼魂/幻影/幽灵”，而事实上并没有那么高深。PhantomJS是基于Webkit内核的Headless模式，所以Webkit浏览器能做的事情，基本上它都能做，在之前爬虫的一些使用场景中有需要爱好者的追随。目前稳定版本为2.1，短时间内将为稳定在这一版本，因为目前其已经暂停更新了，更新时间据说会另行通知，但是迟迟未到。使用这个暂时停更的PhantomJS也是一种解决方法，具体步骤如下。

### 步骤1: 安装PhantomJS

安装非常简单，PhantomJS提供Windows/Linux/MacOS的二进制文件，只需要将相应的bin目录加入到PATH搜素路径中即完成了安装，此处以MacOS上的安装为例。

- 下载地址：https://bitbucket.org/ariya/phantomjs/downloads/phantomjs-2.1.1-macosx.zip
- 解压：解压至/usr/local/phantomjs下
- 版本确认：phantomjs --version

```java
liumiaocn:demo liumiao$ export PATH=$PATH:/usr/local/phantomjs/phantomjs-2.1.1-macosx/bin
liumiaocn:demo liumiao$ which phantomjs
/usr/local/phantomjs/phantomjs-2.1.1-macosx/bin/phantomjs
liumiaocn:demo liumiao$ phantomjs --version
2.1.1
liumiaocn:demo liumiao$ 
```

### 步骤2: 安装karma-phantomjs-launcher

执行日志入如下所示：

```java
liumiaocn:demo liumiao$ npm install --save-dev karma-phantomjs-launcher
> phantomjs-prebuilt@2.1.16 install /Users/liumiao/Desktop/demo/node_modules/phantomjs-prebuilt
> node install.js
Considering PhantomJS found at /usr/local/phantomjs/phantomjs-2.1.1-macosx/bin/phantomjs
Found PhantomJS at /usr/local/phantomjs/phantomjs-2.1.1-macosx/bin/phantomjs ...verifying
Writing location.js file
PhantomJS is already installed on PATH at /usr/local/phantomjs/phantomjs-2.1.1-macosx/bin/phantomjs
npm WARN eslint-plugin-compat@3.3.0 requires a peer of eslint@^3.0.0 || ^4.0.0 || ^5.0.0 || ^6.0.0 but none is installed. You must install peer dependencies yourself.
+ karma-phantomjs-launcher@1.0.4
added 16 packages from 36 contributors in 9.804s
liumiaocn:demo liumiao$ 
```

### 步骤3: 修改Karma的配置文件

将缺省的karma配置文件做如下修改即可

```java
liumiaocn:demo liumiao$ diff karma.conf.js karma.conf.js.origin 
10c10
<       require('karma-phantomjs-launcher'),
---
>       require('karma-chrome-launcher'),
28,29c28,29
<     browsers: ['PhantomJS'],
<     singleRun: true,
---
>     browsers: ['Chrome'],
>     singleRun: false,
liumiaocn:demo liumiao$ 
```

修改说明：

- 仍然需要将singleRun设定为true
- 将chrome的launcher换成phantomjs
- 将浏览器也从Chrome换成PhantomJS

如果使用的是Angular 8或者是es6的target设定需要将target做如下修改

```java
liumiaocn:demo liumiao$ diff tsconfig.json tsconfig.json.org 
13c13
<     "target": "es5",
---
>     "target": "es2015",
liumiaocn:demo liumiao$ 
```

### 步骤3: 执行测试

执行ng test可以看到使用的是PhantomJS进行的测试，而且在执行过程中并没有浏览器被打开和执行。

```java
liumiaocn:demo liumiao$ ng test --code-coverage
25% building 94/94 modules 0 active01 11 2019 06:11:48.490:INFO [karma-server]: Karma v4.1.0 server started at http://0.0.0.0:9876/
01 11 2019 06:11:48.493:INFO [launcher]: Launching browsers PhantomJS with concurrency unlimited
25% building 96/96 modules 0 active01 11 2019 06:11:48.573:INFO [launcher]: Starting browser PhantomJS
01 11 2019 06:11:52.035:INFO [PhantomJS 2.1.1 (Mac OS X 0.0.0)]: Connected on socket PTR3E6eTdHOW0JcEAAAA with id 8370488
PhantomJS 2.1.1 (Mac OS X 0.0.0): Executed 3 of 3 SUCCESS (0.512 secs / 0.769 secs)
TOTAL: 3 SUCCESS
TOTAL: 3 SUCCESS
TOTAL: 3 SUCCESS
=============================== Coverage summary ===============================
Statements   : 100% ( 7/7 )
Branches     : 100% ( 0/0 )
Functions    : 100% ( 2/2 )
Lines        : 100% ( 6/6 )
================================================================================
liumiaocn:demo liumiao$ 
```

此中方式由于PhantomJS已经暂停更新，碰到问题时可能会较为尴尬，比如目前就出现在Angular 8升级是PhantomJS无法正常动作的网上发帖求助，实际上修改为es5能解决大部分问题，所以选择时需要慎重考虑。

## 无需打开浏览器的测试环境: Chrome的无头模式

PhantomJS使用Webkit内核，无需打开浏览器来完成测试，而实际上除去IE的很多浏览器都提供这种所谓的无头（Headless）模式，Chrome也可以直接提供，在Chrome 59开始提供了headless mode（无头模式）。在Angular 8中使用Chrome的无头模式进行测试非常简单，只需要修改缺省的浏览器从Chrome到ChromeHeadless即可。

### 步骤1: 修改Karma的配置文件

将缺省的karma配置文件做如下修改即可

```java
liumiaocn:demo liumiao$ diff karma.conf.js karma.conf.js.origin 
28,29c28,29
<     browsers: ['ChromeHeadless'],
<     singleRun: true,
---
>     browsers: ['Chrome'],
>     singleRun: false,
liumiaocn:demo liumiao$ 
```

修改说明：

- 仍然需要将singleRun设定为true
- 将浏览器从Chrome改成ChromeHeadless

### 步骤2: 执行测试

执行ng test可以看到使用的是ChromeHeadless进行的测试，而且在执行过程中并没有浏览器被打开和执行。

```java
liumiaocn:demo liumiao$ ng test --code-coverage
25% building 15/15 modules 0 active01 11 2019 06:37:05.037:INFO [karma-server]: Karma v4.1.0 server started at http://0.0.0.0:9876/
01 11 2019 06:37:05.040:INFO [launcher]: Launching browsers ChromeHeadless with concurrency unlimited
25% building 93/93 modules 0 active01 11 2019 06:37:05.154:INFO [launcher]: Starting browser ChromeHeadless
01 11 2019 06:37:08.720:INFO [HeadlessChrome 78.0.3904 (Mac OS X 10.14.0)]: Connected on socket Br7fkzwejyGNs2WgAAAA with id 35869507
HeadlessChrome 78.0.3904 (Mac OS X 10.14.0): Executed 3 of 3 SUCCESS (0.374 secs / 0.319 secs)
TOTAL: 3 SUCCESS
TOTAL: 3 SUCCESS
TOTAL: 3 SUCCESS
=============================== Coverage summary ===============================
Statements   : 100% ( 7/7 )
Branches     : 100% ( 0/0 )
Functions    : 100% ( 2/2 )
Lines        : 100% ( 6/6 )
================================================================================
liumiaocn:demo liumiao$ 
```

## 总结

这篇文章介绍了三种常见的Karma的集成方式，由于PhantomJS暂停更新，并且其内核只是Webkit，所以大多数情况直接使用浏览器的Headless Mode可能是个更好的主意。
