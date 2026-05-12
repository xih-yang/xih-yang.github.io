# 03、AWK 环境安装
- 来源：https://ddkk.com/zhuanlan/other/awk/3.html
- 分类：Awk 教程
- 分组：教程目录
AWK命令已经内置于目前几乎所有的 Unix/Linux 系统中。

你可以先使用下面的命令来检查当前的电脑上是否已经装安装 awk。

```sh
[www.ddkk.com]$ which awk
```

不出意外的话，你会看到如下的输入

```sh
/usr/bin/awk
```

如果没看到任何相似的输出，那么就要自己安装了

> 一般情况下，这是不可能存在的

## 使用 Unix/Linux 上自带的包管理器安装 AWK

如果你的电脑是 Debian 的发行版本，也就是大家最熟悉的 Ubuntu 系统，则可以使用 Advance Package Tool **(APT)** 管理器来安装

```sh
[www.ddkk.com]$ sudo apt-get update
[www.ddkk.com]$ sudo apt-get install gawk
```

类似的，如果你使用的是 RedHat 或者 CentOS 系统，也就是使用 RPM 作为包管理器的 GNU/Linux 系统。

那么你可以使用 Yellowdog Updator Modifier ，即 **yum** 命令来安装

```sh
[www.ddkk.com]# sudo yum install gawk
```

安装完毕后，我们就可以新开一个终端，然后使用 which 命令来确定 AWK 是否已经可用了。

> 新开无所谓，但最好还是新开

```sh
[www.ddkk.com]$ which awk
```

不出意外的话，你会看到如下的输入

```sh
/usr/bin/awk
```

## 从源代码编译安装

GNU上的所有应用程序和代码都是可以免费使用的。GNU AWK 作为 GNU 的一部分，我们自然可以从 gnu 的 ftp 上免费得到。

GNUAWK 的源码地址为 http://ftp.gnu.org/gnu/gawk/ ，接下来，我们就来看看如何从源代码安装 AWK 吧

那个，其实，所有的 GNU 应用程序都有着相同的源代码安装步骤。所以，下面的步骤，可以说是非常的标准化了

#### 1. 我们可以从 http://ftp.gnu.org/ 上下载最新版本的 gawk-5.0.0.tar.xz 。你可以直接点击链接 http://ftp.gnu.org/gnu/gawk/gawk-5.0.0.tar.xz 下载，也可以使用 wget 命令来下载。

```sh
[www.ddkk.com]$ wget http://ftp.gnu.org/gnu/gawk/gawk-5.0.0.tar.xz
```

#### 2. 使用 tar 命令解压我们刚刚下载好的 gawk-5.0.0.tar.xz

```sh
[www.ddkk.com]$ tar xvf gawk-5.0.0.tar.xz
```

#### 3. 进入 gawk-5.0.0 目录并运行 configure 命令

```sh
[www.ddkk.com]$ ./configure
```

#### 4. 如果上面的命令没出错的话，那么 configure 命令将会生成 Makefile 文件，这样我们就可以使用 make 命令来编译源码。

```sh
[www.ddkk.com]$ make
```

#### 5. 为了确保我们安装的 AWK 版本是完好的，我们可以运行下面的命令执行测试。当然了，这步是可选的。

```sh
[www.ddkk.com]$ make check
```

#### 6. 最后，安装 AWK。前提是你要先确认拥有超级用户 ( root )。

```sh
[www.ddkk.com]$ sudo make install
```

棒棒的，这样我们就装好了 AWK。

然后我们在 **终端** （ shell ） 中输入以下命令来验证下

```sh
[www.ddkk.com]$ which awk
```

不出意外的话，你会看到如下的输入

```sh
/usr/bin/awk
```
