# 29、Python 教程 - PIP
- 来源：https://ddkk.com/zhuanlan/other/python/4/29.html
- 分类：Python 入门实战
- 分组：教程目录
## 1 概述

PIP是 Python 包或模块的包管理器。

注释：如果使用的是 Python 3.4 或更高版本，则默认情况下会包含 PIP。

## 2 包（Package）

包中包含模块所需的所有文件。

模块是可以包含在项目中的 Python 代码库。

## 3 检查是否已安装 PIP

将命令行导航到 Python 脚本目录所在的位置，然后键入以下内容：

实例
检查PIP 版本：

```java
C:\Users\Your Name\AppData\Local\Programs\Python\Python36-32\Scripts>pip --version
```

cmd命令行可以直接在文件目录路径处输入`cmd + 回车`可快速打开。

## 4 安装 PIP

如果尚未安装 PIP，可以从此页面下载并安装：https://pypi.org/project/pip/

## 5 下载包

下载包非常容易。

- 打开命令行界面并告诉 PIP 下载您需要的软件包。
- 将命令行导航到 Python 脚本目录的位置，然后键入以下内容：

```java
pip install camelcase
```

现在，您已经下载并安装了第一个包！

## 6 使用包

安装包后，即可使用。

把“camelcase” 包导入您的项目中。

实例
导入并使用 “camelcase”：

```java
import camelcase
c = camelcase.CamelCase()
txt = "hello world"
print(c.hump(txt))  Hello World
```

## 7 查找包

在https://pypi.org/，您可以找到更多的包。

## 8 删除包

请使用`uninstall` 命令来删除包：

实例
卸载名为 “camelcase” 的包：

```java
C:\Users\Your Name\AppData\Local\Programs\Python\Python36-32\Scripts>pip uninstall camelcase
```

PIP包管理器会要求您确认是否需要删除 camelcase 包：

```java
Uninstalling camelcase-02.1:
  Would remove:
    c:\...\python\python36-32\lib\site-packages\camecase-0.2-py3.6.egg-info
    c:\...\python\python36-32\lib\site-packages\camecase\*
Proceed (y/n)?
```

按y键，包就会被删除。

## 9 列出包

请使用`list` 命令列出系统上安装的所有软件包：

实例
列出已安装的包：

```java
C:\Users\Your Name\AppData\Local\Programs\Python\Python36-32\Scripts>pip list
```

结果：

```java
Package         Version
-----------------------
camelcase       0.2
mysql-connector 2.1.6
pip             18.1
pymongo         3.6.1
setuptools      39.0.1
```
