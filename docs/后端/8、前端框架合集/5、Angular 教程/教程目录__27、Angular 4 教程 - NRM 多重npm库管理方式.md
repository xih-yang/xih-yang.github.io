# 27、Angular 4 教程 - NRM 多重npm库管理方式
- 来源：https://ddkk.com/zhuanlan/qianduan/angular/1/27.html
- 分类：前端框架
- 分组：教程目录
nrm是一个MIT的开源的npm package，使用npm install nrm即可。它的作用在于管理各种常用的库，比如taobao的cnpm或者缺省的npm，其作用基本等于npm get/set registry + 常用的registry的地址。

## 概要信息

项目
说明

开源/闭源
开源

License类别
MIT License

代码管理地址
https://github.com/Pana/nrm

开发语言
JavaScript

当前稳定版本
1.0.2

## 基本信息

### 设定命令

命令
执行例

确认当前使用的registry
npm get registry

设定要使用的registry
npm set registry=“xxx”

### 常用的registry

registry
地址

缺省的npm
https://registry.npmjs.org/

淘宝镜像
https://registry.npm.taobao.org/

…

## 安装nrm

```java
liumiaocn:~ liumiao$ npm install -g nrm
npm WARN deprecated coffee-script@1.7.1: CoffeeScript on NPM has moved to "coffeescript" (no hyphen)
/Users/liumiao/.nvm/versions/node/v8.11.3/bin/nrm -> /Users/liumiao/.nvm/versions/node/v8.11.3/lib/node_modules/nrm/cli.js
+ nrm@1.0.2
added 322 packages from 561 contributors in 104.359s
liumiaocn:~ liumiao$
```

## nrm ls

这个是nrm最重要的功能，记忆力不好或者不愿意记的开发者可以使用这个以有效减少google的次数

```java
liumiaocn:~ liumiao$ nrm ls
  npm ---- https://registry.npmjs.org/
  cnpm --- http://r.cnpmjs.org/
  taobao - https://registry.npm.taobao.org/
  nj ----- https://registry.nodejitsu.com/
  rednpm - http://registry.mirror.cqupt.edu.cn/
  npmMirror  https://skimdb.npmjs.com/registry/
  edunpm - http://registry.enpmjs.org/
liumiaocn:~ liumiao$
```

## nrm current

使用nrm current能够看出使用的是哪个registry，会返回nrm定义的mapping的名字，比如npm

## nrm use

使用nrm use进行切换

## 使用例

```java
liumiaocn:~ liumiao$ nrm -V
1.0.2
liumiaocn:~ liumiao$ npm get registry
https://registry.npmjs.org/
liumiaocn:~ liumiao$ nrm current
npm
liumiaocn:~ liumiao$ nrm use taobao
                         verb config Skipping project config: /Users/liumiao/.npmrc. (matches userconfig)
   Registry has been set to: https://registry.npm.taobao.org/
liumiaocn:~ liumiao$ nrm current
taobao
liumiaocn:~ liumiao$ npm get registry
https://registry.npm.taobao.org/
liumiaocn:~ liumiao$
```

## ng的packageManager

顺便memo一下angular cli的ng的packageManager的设定方式

版本6之前，比如1.7.3，使用诸如ng set --global 的命令进行设定，而版本6之后使用ng config

### 版本1.7.3

> 使用例：ng set --global packageManager=yarn

### 版本6

> 使用例：获取：ng config -g cli.packageManager
>
> 设定：ng config -g cli.packageManager yarn
