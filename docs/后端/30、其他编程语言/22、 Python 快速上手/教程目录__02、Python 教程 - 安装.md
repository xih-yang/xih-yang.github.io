# 02、Python 教程 - 安装
- 来源：https://ddkk.com/zhuanlan/other/python/5/2.html
- 分类：Python 快速上手
- 分组：教程目录
### Python3 环境搭建

本章节我们将向大家介绍如何在本地搭建 Python3 开发环境。

Python3 可应用于多平台包括 Windows、Linux 和 Mac OS X。

Unix (Solaris, Linux, FreeBSD, AIX, HP/UX, SunOS, IRIX, 等等。)

Win9x/NT/2000

Macintosh (Intel, PPC, 68K)

OS/2

DOS(多个DOS版本)

PalmOS

Nokia 移动手机

Windows CE

Acorn/RISC OS

BeOS

Amiga

VMS/OpenVMS

QNX

VxWorks

Psion

Python 同样可以移植到 Java 和 .NET 虚拟机上。

### Python3 下载

Python3 最新源码，二进制文档，新闻资讯等可以在 Python 的官网查看到：

Python 官网：[https://www.python.org/](https://www.python.org/)

你可以在以下链接中下载 Python 的文档，你可以下载 HTML、PDF 和 PostScript 等格式的文档。

Python文档下载地址：[https://www.python.org/doc/](https://www.python.org/doc/)

### Python 安装

Python 已经被移植在许多平台上（经过改动使它能够工作在不同平台上）。

您需要下载适用于您使用平台的二进制代码，然后安装 Python。

如果您平台的二进制代码是不可用的，你需要使用C编译器手动编译源代码。

编译的源代码，功能上有更多的选择性， 为 Python 安装提供了更多的灵活性。

以下是各个平台安装包的下载地址：

Source Code 可用于 Linux 上的安装。

以下为不同平台上安装 Python3 的方法。

#### Unix & Linux 平台安装 Python3:

以下为在 Unix & Linux 平台上安装 Python 的简单步骤：

打开WEB 浏览器访问 https://www.python.org/downloads/source/

选择适用于 Unix/Linux 的源码压缩包。

下载及解压压缩包 Python-3.x.x.tgz，3.x.x 为你下载的对应版本号。

如果你需要自定义一些选项修改 Modules/Setup

**以Python3.6.1 版本为例**：

> #tar -zxvf Python-3.6.1.tgz
>
> #cd Python-3.6.1
>
> #./configure
>
> #make && make install

检查Python3 是否正常可用：

> #python3 -V
>
> Python 3.6.1

#### Window 平台安装 Python:

以下为在 Window 平台上安装 Python 的简单步骤。

打开WEB 浏览器访问 [https://www.python.org/downloads/windows/](https://www.python.org/downloads/windows/) ，一般就下载 executable installer，x86 表示是 32 位机子的，x86-64 表示 64 位机子的。

#### MAC 平台安装 Python:

MAC系统都自带有 Python2.7 环境，你可以在链接 https://www.python.org/downloads/mac-osx/ 上下载最新版安装 Python 3.x。

你也可以参考源码安装的方式来安装。

### 环境变量配置

程序和可执行文件可以在许多目录，而这些路径很可能不在操作系统提供可执行文件的搜索路径中。

path(路径)存储在环境变量中，这是由操作系统维护的一个命名的字符串。这些变量包含可用的命令行解释器和其他程序的信息。

Unix 或 Windows 中路径变量为 PATH（UNIX 区分大小写，Windows 不区分大小写）。

在Mac OS 中，安装程序过程中改变了 Python 的安装路径。如果你需要在其他目录引用 Python，你必须在 path 中添加 Python 目录。

##### 在 Unix/Linux 设置环境变量

**在csh shell: 输入, 按下 Enter。**

> setenv PATH “$PATH:/usr/local/bin/python”

##### 在 bash shell (Linux) 输入, 按下 Enter :

> export PATH=“$PATH:/usr/local/bin/python”

##### 在 sh 或者 ksh shell 输入, 按下 Enter:

> PATH=“$PATH:/usr/local/bin/python”

**注意**: /usr/local/bin/python 是 Python 的安装目录。

##### 在 Windows 设置环境变量

在环境变量中添加Python目录：

在命令提示框中(cmd) : 输入, 按下 Enter

> path=%path%;C:\Python

**注意**: C:\Python 是Python的安装目录。

也可以通过以下方式设置：

右键点击"计算机"，然后点击"属性"

然后点击"高级系统设置"

选择"系统变量"窗口下面的"Path",双击即可！

然后在"Path"行，添加python安装路径即可(我的D:\Python32)，所以在后面，添加该路径即可。 ps：记住，路径直接用分号"；"隔开！

最后设置成功以后，在cmd命令行，输入命令"python"，就可以有相关显示。

### Python 环境变量

下面几个重要的环境变量，它应用于Python：

变量名
描述

PYTHONPATH
PYTHONPATH是Python搜索路径，默认我们import的模块都会从PYTHONPATH里面寻找。

PYTHONSTARTUP
Python启动后，先寻找PYTHONSTARTUP环境变量，然后执行此变量指定的文件中的代码。

PYTHONCASEOK
加入PYTHONCASEOK的环境变量, 就会使python导入模块的时候不区分大小写.

PYTHONHOME
另一种模块搜索路径。它通常内嵌于的PYTHONSTARTUP或PYTHONPATH目录中，使得两个模块库更容易切换。

### 运行 Python

有三种方式可以运行 Python：

**1、交互式解释器：**

你可以通过命令行窗口进入 Python 并开始在交互式解释器中开始编写 Python 代码。

你可以在 Unix、DOS 或任何其他提供了命令行或者 shell 的系统进行 Python 编码工作。

> $ python # Unix/Linux
>
> 或者
>
> C:>python # Windows/DOS

以下为Python 命令行参数：

选项
描述

-d
在解析时显示调试信息

-O
生成优化代码 ( .pyo 文件 )

-S
启动时不引入查找Python路径的位置

-V
输出Python版本号

-X
从 1.6版本之后基于内建的异常（仅仅用于字符串）已过时。

-c cmd
执行 Python 脚本，并将运行结果作为 cmd 字符串。

file
在给定的python文件执行python脚本。

**2、命令行脚本**

在你的应用程序中通过引入解释器可以在命令行中执行Python脚本，如下所示：

> $ python script.py # Unix/Linux
>
> 或者
>
> C:>python script.py # Windows/DOS

**注意**：在执行脚本时，请检查脚本是否有可执行权限。

**3、集成开发环境（IDE：Integrated Development Environment）: PyCharm

PyCharm 是由 JetBrains 打造的一款 Python IDE，支持 macOS、 Windows、 Linux 系统。**

PyCharm 功能 : 调试、语法高亮、Project管理、代码跳转、智能提示、自动完成、单元测试、版本控制……

PyCharm 下载地址 : [https://www.jetbrains.com/pycharm/download/](https://www.jetbrains.com/pycharm/download/)

PyCharm 安装地址：[http://www.jetbrains.com/pycharm/download/#section=windows](http://www.jetbrains.com/pycharm/download/#section=windows)

Professional（专业版，收费）：完整的功能，可试用 30 天。

Community（社区版，免费）：阉割版的专业版。
