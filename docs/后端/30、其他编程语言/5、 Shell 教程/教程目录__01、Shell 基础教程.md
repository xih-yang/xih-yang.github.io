# 01、Shell 基础教程
- 来源：https://ddkk.com/zhuanlan/other/shell/1.html
- 分类：Shell 教程
- 分组：教程目录
shell 是运维开发最重要的一项语言。几乎所有的运维岗位都要求会 shell 语言，会用 shell 执行一些简单的任务，做一些自动化运维相关的工作。

Shell 既是一种命令语言，又是一种程序设计语言。shell 是用户使用 Linux 的桥梁。

Shell 是指一种应用程序，这个应用程序提供了一个界面，用户通过这个界面访问操作系统内核的服务。

- Ken Thompson 的 sh 是第一种 Unix Shell
- Windows Explorer 是一个典型的图形界面 Shell

## Shell 脚本

Shell 脚本（shell script），是一种为 shell 编写的脚本程序。

业界所说的 shell 通常都是指 shell 脚本。

> 注意: shell 和 shell script 是两个不同的概念。
> ganxie

## Shell 编程环境

Shell 编程跟 JAVA、PHP 编程一样，只要有一个能编写代码的文本编辑器和一个能解释执行的脚本解释器就可以了。

Linux 的 Shell 种类众多，常见的有：

- Bourne Shell（/usr/bin/sh或/bin/sh）
- Bourne Again Shell（/bin/bash）
- C Shell（/usr/bin/csh）
- K Shell（/usr/bin/ksh）
- Shell for Root（/sbin/sh）
- ....

本教程关注的是 Bash，因为 Bash 是大多数Linux 系统默认的 Shell

在一般情况下，人们并不区分 Bourne Shell 和 Bourne Again Shell，所以，像 **#!/bin/sh** ，它同样也可以改为 **#!/bin/bash**

#!/bin/sh 和 #!/bin/bash 中的 # 都是告诉系统其后路径所指定的程序即是解释此脚本文件的 Shell 程序。

### Shell 在线工具

你可以在我们的 shell 在线工具中运行我们教程中所有的范例

[Shell 在线工具](/t/penglei/bash/helloworld)

## 第一个shell脚本

打开文本编辑器(可以使用 vi/vim 命令来创建文件)，新建一个文件 demo.sh，扩展名为 sh（sh代表shell）。

输入以下代码

#### 范例:hello world

```sh
#!/bin/bash
echo "Hello World !"
echo "Hello DDKK.COM 弟弟快看，程序员编程资料站!"
```

[运行脚本 »](/t/penglei/bash/helloworld)

- #! 是一个约定的标记，它告诉系统这个脚本需要什么解释器来执行，即使用哪一种 Shell。
- echo 命令用于向窗口输出文本

### 运行 Shell 脚本有两种方法：

#### 1、作为可执行程序

将上面的代码保存为 demo.sh，并 cd 到相应目录：

```sh
chmod +x ./demo.sh  #使脚本具有执行权限
./demo.sh  #执行脚本
```

> 注意:
>
> 一定要写成./demo.sh，而不是 demo.sh ，直接写 demo.sh，linux 系统会去 PATH 里寻找有没有叫 test.sh 的，而只有 /bin, /sbin, /usr/bin，/usr/sbin 等在 PATH 里，你的当前目录通常不在 PATH 里，所以写成 demo.sh 是会找不到命令的，要用 ./demo.sh 告诉系统说，就在当前目录找。

#### 2、作为解释器参数

这种运行方式是，直接运行解释器，其参数就是 shell 脚本的文件名，形如

```sh
/bin/sh test.sh
/bin/php test.php
```

这种方式运行的脚本，可以不需要在第一行指定解释器信息，因为写了起不了作用

我们使用第二种方式，使用 sh demo.sh 命令运行脚本输出结果如下:

```sh
$ sh demo.sh
Hello World !
Hello DDKK.COM 弟弟快看，程序员编程资料站!
```
