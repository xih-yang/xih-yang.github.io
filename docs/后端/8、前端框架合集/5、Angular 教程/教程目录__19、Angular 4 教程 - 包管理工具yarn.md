# 19、Angular 4 教程 - 包管理工具yarn
- 来源：https://ddkk.com/zhuanlan/qianduan/angular/1/19.html
- 分类：前端框架
- 分组：教程目录
一般安装node之后自带npm管理工具，而操作也基本使用npm install等进行相关的依赖安装非常方便。yarn也是node的包管理工具，聚焦于更加快速/稳定/安全的进行依赖管理，这篇文章介绍一下yarn和其使用上的一些特点。

## 概要信息

项目
说明

官网
https://yarnpkg.com

开源/闭源
开源

License类别
BSD License

代码管理地址
https://github.com/yarnpkg/yarn

开发语言
shell

当前稳定版本
1.7.0

当前版本支持的node版本
^4.8.0 || ^5.7.0 || ^6.2.2 || >=8.0.0

更新频度
平均每季度数次

## semver语义化版本

npm是node的包管理工具，而semver则是一个称为语义化版本管理的规范，这套规则对于软件版本发行做了规范，遵循这套规范，最终使用者可以从版本的变化即可了解版本变化的主要影响程度，最简单的理解这个规则，需要了解如下两条基本规范

### 版本构成

> 版本格式：主版本号（MAJOR）.次版本号（MINOR）.修订号（PATCH）
>
> 比如：angular/cli 1.7.3 主版本号为1，次版本号为7，修订号为3

### 各版本号变化原因

版本号
变化原因

主版本号
发生了不兼容的 API 修改

次版本号
发生了向下兼容的功能性新增

修订号
发生了向下兼容的问题修正

## Why yarn

### 快速

Yarn对其下载的包进行缓存操作，所以相同的包无需重复下载。同时其也尽可能地将可以并行的操作进行并行以提高速度，所以有更快的安装速度。

### 可靠

使用详细精确的lockfile格式，保证安装操作的确定性，这种机制能够是的Yarn能保证安装能够在任何其他的系统上同样的进行。

### 安全

使用checksum也正安装的完整性，确认每次package的安装的有效性

## 特性

Yarn还有如下等特性：

### 离线Offline模式

利用缓存，已经安装过的包，无需联网即可安装

### 特定性

保证依赖能在任何机器上同样的进行安装，不会收到安装顺序等的影响

### 网络性能

有效利用请求队列以最大化网络利用率

### 网络弹性

一个请求的问题不会到证整个安装的失败，失败的请求会自动retry

## 安装

早期的yarn安装直接使用npm install -g yarn即可，而现在这种方式已经不再是推荐方式。目前yarn已经提供各种操作系统的安装包和方式：

操作系统
安装命令

Alpine
apk add yarn

CentOS/RHEL
curl --silent --location https://dl.yarnpkg.com/rpm/yarn.repo | sudo tee /etc/yum.repos.d/yarn.repo; sodu yum install yarn

Ubuntu
curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | sudo apt-key add - echo “deb https://dl.yarnpkg.com/debian/ stable main” | sudo tee /etc/apt/sources.list.d/yarn.list; sudo apt-get update && sudo apt-get install yarn

MacOS
brew install yarn 或者 brew install yarn --without-node (nvm方式)

windows
https://yarnpkg.com/latest.msi

### 安装日志

一下为macOS上结合使用nvm前提下安装yarn的日志

```java
liumiaocn:~ liumiao$ brew install yarn --without-node
Updating Homebrew...
==> Downloading https://homebrew.bintray.com/bottles-portable-ruby/portable-ruby-2.3.7.leopard_64.bottle.tar.gz
######################################################################## 100.0%
==> Pouring portable-ruby-2.3.7.leopard_64.bottle.tar.gz
==> Auto-updated Homebrew!
Updated 1 tap (homebrew/core).
==> New Formulae
...省略
==> Downloading https://yarnpkg.com/downloads/1.7.0/yarn-v1.7.0.tar.gz
==> Downloading from https://github.com/yarnpkg/yarn/releases/download/v1.7.0/yarn-v1.7.0.tar.gz
######################################################################## 100.0%
?  /usr/local/Cellar/yarn/1.7.0: 14 files, 4.2MB, built in 14 seconds
liumiaocn:~ liumiao$ 
```

### 版本确认

```java
liumiaocn:~ liumiao$ yarn --version
1.7.0
liumiaocn:~ liumiao$
```

除了yarn还有其他的包管理工具，比如pnmp和cnmp

## pnmp & cnmp

### cnmp

cnmp是淘宝镜像的npm，由于网络的原因，cnpm在一些场合下对国内的用户来说是很不错的选择，cnmp目前基本只是nmp的镜像,每隔10分钟都会同步一次npmjs.org的官方内容，基本与npm保持一致。

### pnmp

pnmp是另外一个node.js的包管理工具，概要信息如下

## 概要信息

项目
说明

官网
https://pnpm.js.org/

开源/闭源
开源

License类别
BSD License

代码管理地址
https://github.com/pnpm/pnpm

开发语言
typescript

当前稳定版本
2.12.0

更新频度
平均每周数次

## NPM vs YARN vs PNMP

如下从yarn所提示的几个维度，简单比较一下npm/pnmp/yarn，（cnmp基本等同于nmp）

比较项目
nmp
yarn
pnmp

离线模式
无
本地cache，可离线
可离线，并提供–offline参数

安全
无checksum
有checksum
有checksum

速度
慢（install操作串行）
相对较快(install操作可并行)
相对较快

目前用户群
大
中
小

## 速度的对比（angular app）

使用pnmp的官方数据，可以了解一下angular的app下，三种不同的包管理工具的性能。使用如下的package.json：

```java
{
  "name": "angular-quickstart",
  "version": "0.0.0",
  "license": "MIT",
  "scripts": {
    "ng": "ng",
    "start": "ng serve",
    "build": "ng build --prod",
    "test": "ng test",
    "lint": "ng lint",
    "e2e": "ng e2e"
  },
  "private": true,
  "dependencies": {
    "@angular/animations": "^5.2.0",
    "@angular/common": "^5.2.0",
    "@angular/compiler": "^5.2.0",
    "@angular/core": "^5.2.0",
    "@angular/forms": "^5.2.0",
    "@angular/http": "^5.2.0",
    "@angular/platform-browser": "^5.2.0",
    "@angular/platform-browser-dynamic": "^5.2.0",
    "@angular/router": "^5.2.0",
    "core-js": "^2.4.1",
    "rxjs": "^5.5.6",
    "zone.js": "^0.8.19"
  },
  "devDependencies": {
    "@angular/cli": "~1.7.0",
    "@angular/compiler-cli": "^5.2.0",
    "@angular/language-service": "^5.2.0",
    "@types/jasmine": "~2.8.3",
    "@types/jasminewd2": "~2.0.2",
    "@types/node": "~6.0.60",
    "codelyzer": "^4.0.1",
    "jasmine-core": "~2.8.0",
    "jasmine-spec-reporter": "~4.2.1",
    "karma": "~2.0.0",
    "karma-chrome-launcher": "~2.2.0",
    "karma-coverage-istanbul-reporter": "^1.2.1",
    "karma-jasmine": "~1.1.0",
    "karma-jasmine-html-reporter": "^0.2.2",
    "protractor": "~5.1.2",
    "ts-node": "~4.1.0",
    "tslint": "~5.9.1",
    "typescript": "~2.5.3"
  }
}
```

常见的操作所需要的时间信息如下：

各项信息的图形化对比结果

这是pnmp所对比的结论，但是pnmp的速度确实这里面整体最快的。简单来说pnmp实现了链接级别的管理而不是重复的拷贝，这点yarn也希望能够做到但是还没有。

#命令使用对比

pnmp基本可以使用相同的npm命令，而且yarn和npm的命令也基本类似，如下对常见操作做一下简单对比

操作
npm命令
yarn命令

整体安装操作
npm install
yarn或者yarn install

安装并保存到package.json
npm install xxx --save
yarn add xxx

删除并从package.json中移除
npm uninstall xxx --save
yarn remove xxx

全局安装
npm install -g xxx
yarn global add xxx

整体更新
npm update --save
yarn upgrade

初期化
npm init
yarn init

清除缓存
npm cache clean
yarn cache clean

## 总结

虽然有很多种的包管理工具，想yarn add和npm install --save的区别，至于需要不需要多输入几个字母比如–save, 其实使用npm config set save true也可以达到一样的效果，这些都不是主要的问题，说到底还就是依赖的管理，最重要的就是如果用户的很多时间花费在xxx install这样的操作之上，yarn可以并行的安装，可以离线安装，提高速度，降低等待时间，这些都是其在一定阶段存在的重要原因。而且是否能够保持稳定，一个稳定且快速的包管理工具是用户所期待的，多了解一些工具，至少多了几种选择保证依赖的管理。

## 参考文献
