# 02、Git 安装 – Linux
- 来源：https://ddkk.com/zhuanlan/tools/git/2.html
- 分类：开发工具
- 分组：教程目录
Git不是系统内置的软件，需要安装才能使用

Git是垮平台的，支持的系统有 Linux/Unix、Solaris、Mac和 Windows

Git各个平台的安装包下载地址为 [http://git-scm.com/downloads](http://git-scm.com/downloads)

下面我们就来介绍如何在 Linux 平台安装 Git

## Linux 平台上安装 Git

Git需要依赖 curl，zlib，openssl，expat，libiconv 等第三方库，因此在安装之前我们先要安装这些依赖

各个系统都有包管理工具，我们可以很容易使用这些包管理工具协助安装

安装完依赖后我们就能安装 Git 了，各个 Linux 平台安装 Git 步骤如下

### Debian/Ubuntu

**1、** 安装依赖；

```sh
$ apt-get install libcurl4-gnutls-dev libexpat1-dev gettext libz-dev libssl-dev
```

**2、** 安装Git；

```sh
$ apt-get install git-core
```

**3、** 查看Git版本；

```sh
$ git --version
git version 1.8.3.1
```

### Centos/RedHat

**1、** 安装依赖；

```sh
$ yum install curl-devel expat-devel gettext-devel openssl-devel zlib-devel
```

**2、** 安装Git；

```sh
$ yum -y install git-core
```

**3、** 查看安装的Git版本；

```sh
$ git --version
git version 1.8.3.1
```
