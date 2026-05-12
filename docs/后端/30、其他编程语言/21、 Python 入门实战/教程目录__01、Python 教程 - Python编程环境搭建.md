# 01、Python 教程 - Python编程环境搭建
- 来源：https://ddkk.com/zhuanlan/other/python/4/1.html
- 分类：Python 入门实战
- 分组：教程目录
## 1 前言

本节介绍在主流平台下搭建Python编程环境。（基础）

## 2 安装Python

以Windows系统为例，介绍Python的安装过程。

先下载安装包：[Python安装包下载地址](https://www.python.org/downloads/)，选择合适的版本，下载即可。

对前缀的说明：

- 以Windows x86-64开头的是 64 位的 Python 安装程序；
- 以Windows x86开头的是 32 位的 Python 安装程序。

对后缀的说明：

- embeddable zip file表示.zip格式的绿色免安装版本，可以直接嵌入（集成）到其它的应用程序中；
- executable installer表示.exe格式的可执行程序，这是完整的离线安装包，**一般选择这个即可**；
- web-based installer表示通过网络安装的，也就是说下载到的是一个空壳，安装过程中还需要联网下载真正的 Python 安装包。

这里以“Windows x86-64 executable installer”，也即 64 位的完整的离线安装包，下载得到python-3.8.1-amd64.exe，双击开始安装，如下图:

需要将`Add Python 3.8 to PATH`勾选上，这样可以将Python命令路径加到Path环境变量，后面无需再单独配置环境变量。

接下来选择自定义安装（默认安装的话会Python安装在系统盘中，我不太习惯将这些装在C盘），选择要安装的组件，一般默认即可，如下图所示：

完成后点击“Next”继续，选择安装位置：

点击“Install”开始安装，等待几分钟即可完成。

安装完成后，按下`win+R`，输入`cmd`，点击确定即可打开命令行提示符：

输入python，出现上图所示的交互式环境即表示**Python安装成功**！在`>>>`后面即可输入python命令执行，如下图：

最后输入`exit()`即可退出该交互环境。

以上即为`Windows`系统上安装Python的步骤，Linux与Mac系统上的安装方法可参考[博客](https://blog.csdn.net/zhangyasuo/article/details/120624036)及官方文档。

## 3 Python程序运行

### 3.1 交互式编程

Python安装完成后，会自带一个简易的开发环境，称为IDLE：

打开后是一个Python的交互式（即有“>>>”符号）编程环境，如下如所示

利用IDLE，即可进行python的交互式编程，使用第二小节打开的交互式界面与IDLE一致。这种编程方式的缺点是运行多个命令时较为繁琐易错，且代码只能暂时保留，无法进行调试等。

### 3.2 脚本编程

考虑到交互式编程的缺点，可以将python代码放入一个脚本（以`.py`为后缀的文件）中，这样便于代码的更新及归档。

Python脚本是一种纯文本文件，内部没有任何特殊格式，你可以使用任何文本编辑器打开它，比如：

- Windows 下的记事本程序；
- Linux 下的 Vim、gedit 等；
- Mac OS 下的 TextEdit 工具；
- 跨平台的 Notepad++、EditPlus、UltraEdit 等；
- 更加专业和现代化的 VS Code 和 Sublime Text（也支持多种平台）。

以Windows中的记事本为例，新建记事本输入python代码：

**在文件系统查看选项中将显示文件后缀名选项打开**，将该文件的后缀名命名为`.py`，这里修改后的文件名为`123.py`，在当前位置打开命令行，方法如下图：

输入`python 123.py`（文件名改为相应的即可）：

## 4 后记

本节配置较为简单基础的python开发环境，下节将介绍集成的开发环境的搭建。
