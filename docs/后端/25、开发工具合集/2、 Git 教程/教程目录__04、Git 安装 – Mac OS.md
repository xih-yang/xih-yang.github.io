# 04、Git 安装 – Mac OS
- 来源：https://ddkk.com/zhuanlan/tools/git/4.html
- 分类：开发工具
- 分组：教程目录
Git不是系统内置的软件，需要安装才能使用

Git是垮平台的，支持的系统有 Linux/Unix、Solaris、Mac和 Windows

Git各个平台的安装包下载地址为 [http://git-scm.com/downloads](http://git-scm.com/downloads)

## Mac 平台上安装

Mac平台上有两种安装 Git 的方法

**1、** 官方安装包；

在官方下载界面下载 Git [https://git-scm.com/download/mac](https://git-scm.com/download/mac)

这个网址会跳转到以下地址 [https://sourceforge.net/projects/git-osx-installer/?source=typ_redirect](https://sourceforge.net/projects/git-osx-installer/?source=typ_redirect)

**1、** 下载完然后双击安装；

**1、** 然后右键点击git-2.14.1-intel-universal-mavericks.pkg；

**1、** 一路向下点击Next直至安装完成；

**2、** 使用brew包管理工具安装；

```sh
$ brew install git
```

### 查看 Git 版本

```sh
$ git --version
git version 2.14.2
```
