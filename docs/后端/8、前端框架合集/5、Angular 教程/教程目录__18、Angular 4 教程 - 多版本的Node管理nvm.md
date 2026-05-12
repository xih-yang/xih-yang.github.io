# 18、Angular 4 教程 - 多版本的Node管理nvm
- 来源：https://ddkk.com/zhuanlan/qianduan/angular/1/18.html
- 分类：前端框架
- 分组：教程目录
在实际的工作中往往需要在开发机上安装多个node的环境，然后在此基础上对应的angular的版本也有所不同。所以往往需要在一台开发机器上保持多个node的版本和相关的依赖是非常常见的需求，尤其是package的更新经常收到各种原因的困扰，保证本地可用的各个版本的node环境对于需要对应不同项目的node环境的开发者者来说可以考虑使用nvm。

## node版本支持计划

根据node.js工作组的计划，对node的支持的状况如下

版本6相关的支持回到2019年4月结束，版本8相关会在2019年第结束，而版本10会在2021年4月结束。结合相关的维护期，具体信息如下

已经完成历史使命的版本

## 概要信息(mac/linux版)

项目
说明

开源/闭源
开源

License类别
MIT License

代码管理地址
https://github.com/creationix/nvm

开发语言
shell

当前稳定版本
0.33.11

更新频度
平均每季度数次

## 概要信息(windows版)

项目
说明

开源/闭源
开源

License类别
MIT License

代码管理地址
https://github.com/coreybutler/nvm-windows

开发语言
go

当前稳定版本
1.1.6

更新频度
平均每年数次

## 安装（mac/linux版）

### 下载

```java
iumiaocn:~ liumiao$ wget https://raw.githubusercontent.com/creationix/nvm/v0.33.11/install.sh
...省略
liumiaocn:~ liumiao$
```

### 执行安装

```java
liumiaocn:~ liumiao$ sh install.sh
=> Downloading nvm from git to '/Users/liumiao/.nvm'
=> Cloning into '/Users/liumiao/.nvm'...
warning: redirecting to https://github.com/creationix/nvm.git/
remote: Counting objects: 267, done.
remote: Compressing objects: 100% (242/242), done.
remote: Total 267 (delta 31), reused 86 (delta 15), pack-reused 0
Receiving objects: 100% (267/267), 119.47 KiB | 116.00 KiB/s, done.
Resolving deltas: 100% (31/31), done.
=> Compressing and cleaning up git repository
=> Appending nvm source string to /Users/liumiao/.bash_profile
=> Appending bash_completion source string to /Users/liumiao/.bash_profile
=> Close and reopen your terminal to start using nvm or run the following to use it now:
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  This loads nvm
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  This loads nvm bash_completion
liumiaocn:~ liumiao$
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  This loads nvm
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  This loads nvm bash_completion
```

没有安装wget可以使用curl或者其他方式将此安装脚本取到然后执行。安装会自动在.bash_profile中添加如上几行NVM_DIR的环境变量的设定的操作，重新登陆或者打开新的终端即可起效，或者将source一下，或者执行一下上述的三条命令均可继续

## 安装node

打开一个新的终端，确认nvm版本

```java
liumiaocn:~ liumiao$ nvm --version
0.33.11
liumiaocn:~ liumiao$ 
```

### 确认可安装的版本

使用如下命令可以确认可安装的node版本，建议结合lts选项，列出Long Term Support的版本进行使用，君子不立于危墙之下，减少被坑的几率

> 确认命令：nvm ls-remote --lts

### 安装node8.9.1

```java
liumiaocn:~ liumiao$ nvm install 8.9.1
Downloading and installing node v8.9.1...
Downloading https://nodejs.org/dist/v8.9.1/node-v8.9.1-darwin-x64.tar.gz...
######################################################################## 100.0%
Computing checksum with shasum -a 256
Checksums matched!
Now using node v8.9.1 (npm v5.5.1)
Creating default alias: default -> 8.9.1 (-> v8.9.1)
liumiaocn:~ liumiao$ 
```

### 安装node8.11.3

```java
liumiaocn:~ liumiao$ nvm install 8.11.3
Downloading and installing node v8.11.3...
Downloading https://nodejs.org/dist/v8.11.3/node-v8.11.3-darwin-x64.tar.gz...
######################################################################## 100.0%
Computing checksum with shasum -a 256
Checksums matched!
Now using node v8.11.3 (npm v5.6.0)
liumiaocn:~ liumiao$ 
```

##确认安装的node版本

```java
liumiaocn:~ liumiao$ nvm ls
         v8.9.1
->      v8.11.3
default -> 8.9.1 (-> v8.9.1)
node -> stable (-> v8.11.3) (default)
stable -> 8.11 (-> v8.11.3) (default)
iojs -> N/A (default)
lts/* -> lts/carbon (-> v8.11.3)
lts/argon -> v4.9.1 (-> N/A)
lts/boron -> v6.14.3 (-> N/A)
lts/carbon -> v8.11.3
liumiaocn:~ liumiao$ 
```

### 切换到8.9.1

```java
liumiaocn:~ liumiao$ nvm use 8.9.1
Now using node v8.9.1 (npm v5.5.1)
liumiaocn:~ liumiao$ node -v
v8.9.1
liumiaocn:~ liumiao$ 
liumiaocn:~ liumiao$ npm -v
5.5.1
liumiaocn:~ liumiao$ 
```

### 切换到8.11.3

```java
liumiaocn:~ liumiao$ nvm use 8.11.3
Now using node v8.11.3 (npm v5.6.0)
liumiaocn:~ liumiao$ node -v
v8.11.3
liumiaocn:~ liumiao$ npm -v
5.6.0
liumiaocn:~ liumiao$ 
```

## 安装不同版本的全局cli

由于angular cli在1.7.3之后发生变化，直接升到了6，这里在8.9.1安装1.7.3，而在8.11.3中安装目前稳定的6.0.8版本

### node8.9.1下安装全局1.7.3版本cli

```java
liumiaocn:~ liumiao$ nvm use 8.9.1
Now using node v8.9.1 (npm v5.5.1)
liumiaocn:~ liumiao$ sudo npm install -g @angular/cli@1.7.3
Password:
...省略
+ @angular/cli@1.7.3
added 998 packages in 97.376s
liumiaocn:~ liumiao$
```

安装后确认版本

```java
liumiaocn:~ liumiao$ ng version
    _                      _                 ____ _     ___
   / \   _ __   __ _ _   _| | __ _ _ __     / ___| |   |_ _|
  / △ \ | '_ \ / _ | | | | |/ _ | '__|   | |   | |    | |
 / ___ \| | | | (_| | |_| | | (_| | |      | |___| |___ | |
/_/   \_\_| |_|\__, |\__,_|_|\__,_|_|       \____|_____|___|
               |___/
Angular CLI: 1.7.3
Node: 8.9.1
OS: darwin x64
Angular: 
...
liumiaocn:~ liumiao$ 
```

### node8.11.3下安装全局6.0.8版本cli

```java
liumiaocn:~ liumiao$ nvm use 8.11.3
Now using node v8.11.3 (npm v5.6.0)
liumiaocn:~ liumiao$
liumiaocn:~ liumiao$ sudo npm install -g @angular/cli@6.0.8
Password:
...
+ @angular/cli@6.0.8
added 314 packages in 16.531s
liumiaocn:~ liumiao$
```

安装后确认版本

```java
liumiaocn:~ liumiao$ ng -v
     _                      _                 ____ _     ___
    / \   _ __   __ _ _   _| | __ _ _ __     / ___| |   |_ _|
   / △ \ | '_ \ / _ | | | | |/ _ | '__|   | |   | |    | |
  / ___ \| | | | (_| | |_| | | (_| | |      | |___| |___ | |
 /_/   \_\_| |_|\__, |\__,_|_|\__,_|_|       \____|_____|___|
                |___/
Angular CLI: 6.0.8
Node: 8.11.3
OS: darwin x64
Angular: 
... 
Package                      Version
------------------------------------------------------
@angular-devkit/architect    0.6.8
@angular-devkit/core         0.6.8
@angular-devkit/schematics   0.6.8
@schematics/angular          0.6.8
@schematics/update           0.6.8
rxjs                         6.2.1
typescript                   2.7.2
liumiaocn:~ liumiao$ 
```

## 不同版本的使用切换

其实原理非常简单，不同版本和相对依赖，对应在不同的目录中

```java
liumiaocn:~ liumiao$ nvm use 8.9.1
Now using node v8.9.1 (npm v5.5.1)
liumiaocn:~ liumiao$ which node
/Users/liumiao/.nvm/versions/node/v8.9.1/bin/node
liumiaocn:~ liumiao$ 
liumiaocn:~ liumiao$ which ng
/Users/liumiao/.nvm/versions/node/v8.9.1/bin/ng
liumiaocn:~ liumiao$ 
liumiaocn:~ liumiao$ nvm use 8.11.3
Now using node v8.11.3 (npm v5.6.0)
liumiaocn:~ liumiao$ which node
/Users/liumiao/.nvm/versions/node/v8.11.3/bin/node
liumiaocn:~ liumiao$ which ng
/Users/liumiao/.nvm/versions/node/v8.11.3/bin/ng
liumiaocn:~ liumiao$
```

## 总结

使用nvm，在使用时只需要使用nvm use既可以切换node版本，不同node下可以设定全局cli，再结合使用package.json，全局的cli和局部的cli在同一个node版本下也可以有多个，这样就可以对应各种情况下的调试需求了。
