# 03、Perl 环境安装
- 来源：https://ddkk.com/zhuanlan/other/perl/3.html
- 分类：Perl 教程
- 分组：教程目录
在我们继续学习 Perl 语言之前，我们需要先搭建 Perl 脚本的运行环境。

Perl 是跨平台的脚本语言，Perl 支持的平台如下：

**1、** Unix(Solaris,Linux,FreeBSD,AIX,HP/UX,SunOS,IRIXetc.)；

**2、** Win9x/NT/2000/；

**3、** WinCE；

**4、** Macintosh(PPC,68K)；

**5、** Solaris(x86,SPARC)；

**6、** OpenVMS；

**7、** Alpha(7.2andlater)；

**8、** Symbian；

**9、** DebianGNU/kFreeBSD；

**10、** MirOSBSD；

**11、** 更多...；

像[1]，[4]，[5]，[9] 这种系统平台上已经默认安装了 Perl。 我们可以使用以下命令来查看是否已安装：

```sh
$ perl -v
This is perl 5, version 18, subversion 2 (v5.18.2) built for darwin-thread-multi-2level
(with 2 registered patches, see perl -V for more detail)
Copyright 1987-2013, Larry Wall
Perl may be copied only under the terms of either the Artistic License or the
GNU General Public License, which may be found in the Perl 5 source kit.
Complete documentation for Perl, including FAQ lists, should be found on
this system using "man perl" or "perldoc perl".  If you have access to the
Internet, point your browser at http://www.perl.org/, the Perl Home Page.
```

如果输出以上信息说明 Perl 已经安装，如果还未安装，那么我们继续接下来的运行环境搭建

## 安装 Perl 脚本运行环境

我们可以在 Perl 的官网下载对应平台的安装包: [https://www.perl.org/get.html](https://www.perl.org/get.html)

### Unix 和 Linux 安装 Perl 运行环境

Unix/Linux 系统上 Perl 安装步骤如下：

**1、** 通过浏览器打开[http://www.perl.org/get.html](http://www.perl.org/get.html)；

2. 下载适用于 Unix/Linux 的源码包 [https://www.perl.org/get.html#unix_like](https://www.perl.org/get.html#unix_like)
**3、** 下载完成**perl-5.x.y.tar.gz**文件后执行以下操作；

```sh
$ tar -zxvf perl-5.x.y.tar.gz
$ cd perl-5.x.y
$ ./Configure -de
$ make
$ make test
$ make install
```

接下来我们使用 perl -v 命令查看是否安装成功。

安装成功后，Perl 的安装路径为 /usr/local/bin ，库安装在 /usr/local/lib/perlXX, XX 为版本号

### Window 安装 Perl

Perl 在 Window 平台上有两种编译器，分别是： ActiveStatePerl 和 Strawberry Perl。

ActiveState Perl 和 Strawberry Perl 最大的区别是 Strawberry Perl 里面有多包含一些 CPAN 里的模块， 所以 Strawberry Perl 下载的安装文件有 80+M, 而 ActiveState Perl 只有 20+M 左右。

我们这里使用了 Strawberry Perl 。

Window 系统上搭建 Perl 运行环境的步骤如下：

**1、** Strawberry安装包链接：[http://strawberryperl.com](http://strawberryperl.com)；

**2、** 下载对应你系统的版本：32bit或64bit现在一般为64bit；

**3、** 下载完成后双击双击打开，按安装向导一步步安装即可；

### Mac OS 安装 Perl

MacOS 系统一般默认已经安装了 Perl，如果未安装则按照以下步骤：

**1、** 通过浏览器打开[http://www.perl.org/get.html](http://www.perl.org/get.html)；

**2、** 下载适用于MacOS的源码包；

**3、** 下载完成**perl-5.x.y.tar.gz**文件后执行以下操作；

```sh
$ tar -xzf perl-5.x.y.tar.gz
$ cd perl-5.x.y
$ ./Configure -de
$ make
$ make test
$ make install
```

**4、** 执行成功后Perl的安装路径为/usr/local/bin*，库安装在/usr/local/lib/perlXX,XX为版本号；

## 运行 Perl

Perl 有不同的运行方式：

### 1. 交互式 shell

可以在命令行中直接运行 perl 进入 perl 交互式 shell

语法格式如下：

```sh
$ perl  -e <perl code>           # Unix/Linux
```

或

```sh
C:> perl -e <perl code>          # Windows/DOS
```

#### 命令行参数解释如下

选项
描述

-d[:debugger]
在调试模式下运行程序

-Idirectory
指定 @INC/#include 目录

-T
允许污染检测

-t
允许污染警告

-U
允许不安全操作

-w
允许很多有用的警告

-W
允许所有警告

-X
禁用使用警告

-e program
执行 perl 代码

file
执行 perl 脚本文件

### 2. 脚本执行

可以将perl 代码放在 .pl 为扩展名的文件中，然后通过以下命令来运行代码

```sh
$ perl  script.pl          # Unix/Linux
```

或

```sh
C:>perl script.pl         # Windows/DOS
```

## Perl IDE 集成开发环境

我们也可以使用一些图形用户界面(GUI) 环境来运行我们的 perl 脚本。

下面推荐两款常用的 Perl 集成开发环境：

**1、**[Padre](http://padre.perlide.org/)；

Padre 是一个为 Perl 语言开发者提供的集成开发环境，提供了语法高亮和代码重构功能
**2、**[EPIC](http://www.epic-ide.org/)Eclipse插件；

EPIC 是 Perl Eclipse IDE 的插件，如果你熟悉 Eclipse，你可以使用它。

安装步骤：Help-->`Eclipse Marketplace-->`输入EPIC-->` 选择安装并更新 即可
