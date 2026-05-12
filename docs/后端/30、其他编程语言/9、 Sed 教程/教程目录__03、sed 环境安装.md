# 03、sed 环境安装
- 来源：https://ddkk.com/zhuanlan/other/sed/3.html
- 分类：Sed 教程
- 分组：教程目录
sed一般内置于所有的现代 Linux / Unix 系统，比如 **苹果电脑**、Ubuntu 系统、CentOS 系统。成为现代操作系统除 Windows 之外必备的工具之一。

如果你是用的是 Windows 微软的电脑，那么没办法，你只能先安装 cygwin 或 mingw 。

如果你使用的是 Linux/Unix 系统，比如 **苹果电脑**、Ubuntu 系统、CentOS 系统，那么 sed 已经内置了。

> 苹果操作系统是 Unix 的一个分支，它不属于 Linux 的分支。

要检查你的电脑是否安装了 sed，可以打开终端或 shell 然后输入以下命令来检查是否安装

```sh
[www.ddkk.com]$ sed --version
```

如果你使用的是 **苹果电脑**，结果如下

```sh
sed: illegal option -- -
usage: sed script [-Ealn] [-i extension] [file ...]
       sed [-Ealn] [-i extension] [-e script] ... [-f script_file] ... [file ...]
```

如果你使用的是 Ubuntu 系统、CentOS 系统等 Linux 系统，则输出结果如下

```sh
GNU sed 版本 4.2.1
Copyright (C) 2009 Free Software Foundation, Inc.
This is free software; see the source for copying conditions.  There is NO
warranty; not even for MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE,
to the extent permitted by law.
GNU sed home page: <http://www.gnu.org/software/sed/>.
General help using GNU software: <http://www.gnu.org/gethelp/>.
E-mail bug reports to: <bug-gnu-utils@gnu.org>.
Be sure to include the word sed'' somewhere in the Subject:'' field.
```

如果你的电脑并没有出现类似上面的结果，那么，我们只好自己手动安装了

如果要检查你电脑上的 sed 的安装位置，可以使用 which 命令

```sh
[www.ddkk.com]$ which sed
```

如果你使用的是 **苹果电脑**，输出结果如下

```sh
/usr/bin/sed
```

如果你使用的是 Ubuntu 系统、CentOS 系统等 Linux 系统，输出结果如下

```sh
/bin/sed
```

## 使用包管理器安装

- Ubuntu 等 debian 系统

在 Ubuntu 等 debian 系统上，可以使用 apt 包管理器来安装 sed。安装命令如下

```sh
sudo apt-get install sed
```

安装完成后可以使用 sed --version 来检查下安装是否成功。

如果安装成功，输出结果类似于

```sh
sed (GNU sed) 4.2.2 
Copyright (C) 2012 Free Software Foundation, Inc. 
License GPLv3+: GNU GPL version 3 or later. 
This is free software: you are free to change and redistribute it. 
There is NO WARRANTY, to the extent permitted by law.  
Written by Jay Fenlason, Tom Lord, Ken Pizzini, 
and Paolo Bonzini. 
GNU sed home page:. 
General help using GNU software:. 
E-mail bug reports to:. 
Be sure to include the word "sed" somewhere in the "Subject:" field.
```

- CentOS 等 RedHat 系统

在 CentOS 等 RedHat 系统上，可以使用 rpm 包管理器来安装 sed。安装命令如下

```sh
yum -y install sed
```

安装完成后可以使用 sed --version 来检查下安装是否成功。

如果安装成功，输出结果类似于

```sh
sed (GNU sed) 4.2.2 
Copyright (C) 2012 Free Software Foundation, Inc. 
License GPLv3+: GNU GPL version 3 or later. 
This is free software: you are free to change and redistribute it. 
There is NO WARRANTY, to the extent permitted by law.  
Written by Jay Fenlason, Tom Lord, Ken Pizzini, 
and Paolo Bonzini. 
GNU sed home page:. 
General help using GNU software:. 
E-mail bug reports to:. 
Be sure to include the word "sed" somewhere in the "Subject:" field.
```

- 苹果操作系统 ( darwin )

如果你使用的是苹果操作系统，则可以使用 brew 这个最流行的包管理器来安装。

如果你直接使用 brew install sed 命令安装则会报错

```sh
Error: No available formula with the name "sed" 
==> Searching for a previously deleted formula (in the last month)...
Warning: homebrew/core is shallow clone. To get complete history run:
  git -C "$(brew --repo homebrew/core)" fetch --unshallow
```

这是因为 **brew** 中的 sed 并不叫 sed 而是其它名字。

我们可以使用 brew search sed 搜索看看 sed 包有没有？输出结果类似于

```sh
==> Formulae
gnu-sed                         libxdg-basedir                  minised                         ssed
==> Casks
eclipse-dsl                     google-ads-editor               marsedit                        physicseditor
focused                         licensed                        osxfuse-dev                     prefs-editor
```

可以发现 brew 中还是有 sed 的，只不过名字叫做 gun-sed。

我们使用 brew info gnu-sed 看看 gnu-sed 的详细信息

```sh
gnu-sed: stable 4.7 (bottled)
GNU implementation of the famous stream editor
https://www.gnu.org/software/sed/
Conflicts with:
  ssed (because both install share/info/sed.info)
Not installed
From: https://github.com/Homebrew/homebrew-core/blob/master/Formula/gnu-sed.rb
==> Caveats
GNU "sed" has been installed as "gsed".
If you need to use it as "sed", you can add a "gnubin" directory
to your PATH from your bashrc like:
    PATH="/usr/local/opt/gnu-sed/libexec/gnubin:$PATH"
==> Analytics
install: 9,993 (30 days), 32,668 (90 days), 160,813 (365 days)
install_on_request: 7,853 (30 days), 25,119 (90 days), 114,312 (365 days)
build_error: 0 (30 days)
```

从输出结果中可以看出，如果使用 brew 安装 gnu-sed ，那么安装完成后的命令并不是 sed 而是 gsed。

好了，不管它了，先用 brew info gnu-sed 来安装吧

```sh
brew install gnu-sed
```

安装完成后可以使用 gsed --version 来检查下安装是否成功。

如果安装成功，输出结果类似于

```sh
gsed (GNU sed) 4.7
Copyright (C) 2018 Free Software Foundation, Inc.
License GPLv3+: GNU GPL version 3 or later <https://gnu.org/licenses/gpl.html>.
This is free software: you are free to change and redistribute it.
There is NO WARRANTY, to the extent permitted by law.
Written by Jay Fenlason, Tom Lord, Ken Pizzini,
Paolo Bonzini, Jim Meyering, and Assaf Gordon.
GNU sed home page: <https://www.gnu.org/software/sed/>.
General help using GNU software: <https://www.gnu.org/gethelp/>.
E-mail bug reports to: <bug-sed@gnu.org>.
```

## 源代码编译安装

sed由 **自由软件基金会** （ 英文全称 Free Software Foundation，英文简称 FSF ）开发与维护。由 GNU/Linux 分发，因此也常常被称为 GNU SED。

也就是说，目前我们所使用的 sed 是 GNU 项目的一部分，它是开源的，源代码我们可以免费下载。

如果你能通过包管理器安装，我们绝对推荐你通过包管理器安装，如果不能，那么只好跟着下面的步骤一步一步源代码编译安装啦。

下面的安装方式适用于所有的 Linux / Unix 系统，包括 **苹果电脑**。

> 下面的安装步骤是所有 GNU 软件的标准安装流程，如果你会其它项目的编译安装，那么下面的流程就是小 case 了。

**1、** 从[ftp://ftp.gnu.org/gnu/sed](ftp://ftp.gnu.org/gnu/sed)GNUFTP上下载最新的版本；

截止今天 2019-06-01，最新的 sed 版本为 4.7。

你可以点击 [sed-4.7.tar.xz](ftp://ftp.gnu.org/gnu/sed/sed-4.7.tar.xz) 下载或者使用下面的 wget 命令来下载

```sh
wget ftp://ftp.gnu.org/gnu/sed/sed-4.7.tar.xz
```

**2、** 下载完成后使用tar命令来解压sed-4.7.tar.xz；

```sh
tar xvf sed-4.7.tar.xz
```

**3、** 使用cdsed-4.7命令进入解压的目录；

**4、** 运行./configure来配置编译环境；

```sh
./configure
```

**5、** 如果没有出任何问题则可以使用make命令来编译；

```sh
make
```

**6、** 编译完成后，我们可以使用check命令来运行测试，确保我们的编译是成功的；

```sh
make check
```

这是一个可选的步骤，但我们推荐你这么做。
**7、** 检查通过后，我们可以运行makeinstall命令来安装；

```sh
sudo make install
```

注意，该命令可能会提示你需要管理权限，给就是了。

好了，到目前为止，安装已经完成了，我们可以输入下面的命令来检查安装是否正确

```sh
sed --version
```

如果不出任何问题，输出结果类似于

```sh
GNU sed 版本 4.7
Copyright (C) 2009 Free Software Foundation, Inc.
This is free software; see the source for copying conditions.  There is NO
warranty; not even for MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE,
to the extent permitted by law.
GNU sed home page: <http://www.gnu.org/software/sed/>.
General help using GNU software: <http://www.gnu.org/gethelp/>.
E-mail bug reports to: <bug-gnu-utils@gnu.org>.
Be sure to include the word sed'' somewhere in the Subject:'' field.
```
