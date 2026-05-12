# 18、Python 教程 - 程序打包
- 来源：https://ddkk.com/zhuanlan/other/python/6/18.html
- 分类：Python 基础入门
- 分组：教程目录
Setuptools和较旧的Distutils都是用于发布Python包的工具包，能够使用Python轻松地编写安装脚本。这些脚本可用于生成可发布的归档文档，供用户用来编译和安装编写库。

Setuptools并非只能用于创建基于脚本的Python安装程序，还可用于编译扩展。

通过将其与扩展py2exe和py2app结合起来使用，还可创建独立的Windows和macOS可执行程序。

## Setuptools基础

如果没有安装Setuptools，可使用pip安装

**简单的Setuptools安装脚本（setup.py）**

请将代码所示的脚本存储为setup.py（这适用于所有的Setuptools安装脚本），并确保其所在目录包含简单模块**beyond.py**。

```java
from setuptools import setup
setup(name='Beyond',version='1.0',description='A simple example',author='beyondyanyu',py_modules=['beyond'])
```

**使用这个简单的脚本**

```java
python setup.py
```

将出现类似于下面的输出：

```java
usage: setup.py [global_opts] cmd1 [cmd1_opts] [cmd2 [cmd2_opts] ...]
   or: setup.py --help [cmd1 cmd2 ...]
   or: setup.py --help-commands
   or: setup.py cmd --help
error: no commands supplied
```

要获得更多的信息，可使用开关`--help`或`--help-commands`。

执行命令**build**，让Setuptools行动起来。

```java
python setup.py build
```

将出现类似于下面的输出：

```java
running build 
running build_py 
creating build 
creating build/lib 
copying beyond.py -> build/lib
```

Setuptools创建了一个名为build的目录，其中包含子目录lib。同时将将beyond.py复制到了这个子目录中。目录build相当于工作区，Setuptools在其中组装包（以及编译扩展库等）。安装时不需要执行命令build，因为当你执行命令install时，如果需要，命令build会自动运行。

在上述这个示例中，命令install将把模块beyond.py复制到PYTHONPATH指定的特定目录中。这应该不会带来风险，但如果你不想弄乱系统，应该将其删除。

安装**install**这个模块

```java
python setup.py install
```

输出应该非常多，其末尾的内容类似于下面这样：

```java
Installed /path/to/python3.5/site-packages/Beyond-1.0-py3.5.egg 
Processing dependencies for Beyond==1.0 
Finished processing dependencies for Beyond==1.0 byte-compiling
```

在安装过程中，Setuptools创建了一个.egg文件，这是一个独立的Python包。

在这个脚本中，只使用了Setuptools指令py_modules。如果要安装整个包，可以类似的方式（列出包名）使用指令packages。

## 打包

编写让用户能够安装模块的脚本setup.py后，就可使用它来创建归档文件了。

这里主要介绍如何创建`.tar.gz`文件

要创建源代码归档文件，可使用命令**sdist**（表示source distribution）。

```java
python setup.py sdist
```

如果执行上述命令，可能出现大量的输出，其中包括一些警告。完全可以对这些警告置若罔闻，但也可在脚本**setup.py**中添加**author_email**（类似于选项author），并在当前目录中添加文本文件**README.txt**。

现在，除目录build外，应该还有一个名为dist的目录。在这个目录中，有一个名为`Beyond-1.0.tar.gz`的文件。

可将其分发给他人，而对方可将其解压缩，再使用脚本**setup.py**进行安装。

不想生成`.tar.gz`文件，还有其他几种分发格式可供使用。要设置分发格式，可使用命令行开关`--formats`（这个开关为复数形式，表明你可指定多种用逗号分隔的格式，这样将一次性创建多个归档文件）。要获悉可使用的格式列表，可给命令sdist指定开关`--help-formats`。

## 编译扩展

假设这个源代码文件（**palindrome2.c**）位于当前目录中（第17章中程序palindrome的源代码），则可使用下面的**setup.py**脚本来编译（并安装）它：

**一个回文检查示例（palindrome2.c）**

```java
#include <Python.h>
static PyObject *is_palindrome(PyObject *self, PyObject *args) {
	int i, n;
	const char *text;
	int result;
	if (!PyArg_ParseTuple(args, "s", &text)) {
		 return NULL;
	}
	n=strlen(text);
	result = 1;
	for (i = 0; i <= n/2; ++i) {
		if (text[i] != text[n-i-1]) {
			result = 0;
			break;
		}
	}
	return Py_BuildValue("i", result); /* "i"表示一个整数：*/
}
static PyMethodDef PalindromeMethods[] = {
     /* 方法/函数列表：*/
	{
     "is_palindrome", is_palindrome, METH_VARARGS, "Detect palindromes"},{
     NULL, NULL, 0, NULL}
};
static struct PyModuleDef palindrome =
{
	PyModuleDef_HEAD_INIT,
	"palindrome", /* 模块名 */
	"", /* 文档字符串 */
	-1, /*存储在全局变量中的信号状态 */
	PalindromeMethods
};
/* 初始化模块的函数：*/ 
PyMODINIT_FUNC PyInit_palindrome(void)
{
	return PyModule_Create(&palindrome);
}	
```

**setup.py脚本**

```java
from setuptools import setup, Extension
setup(name='palindrome',version='1.0',ext_modules = [Extension('palindrome', ['palindrome2.c'])] )
```

如果使用这个脚本运行命令install，将自动编译扩展模块palindrome再安装它。

这里没有指定一个模块名列表，而是将参数ext_modules设置为一个Extension实例列表。构造函数Extension将一个名称和一个相关文件列表作为参数；

如果只想就地编译扩展（在大多数UNIX系统中，这都将在当前目录中生成一个名为palindrome.so的文件），可使用如下命令：

```java
python setup.py build_ext --inplace
```

如果安装了SWIG（参见第17章），可让Setuptools直接使用它！

代码**palindrome.c**的源代码，显然比包装后的版本简单得多。能够让Setuptools使用SWIG并直接将其作为Python扩展确实非常方便。

为此，需要做的非常简单，只需将接口文件（.i文件，**palindrome.i**）的名称加入到Extension实例的文件列表中即可。

**palindrome.c的源代码**

```java
#include <string.h>
int is_palindrome(char *text) {
	int i, n=strlen(text);
	for (i = 0; I <= n/2; ++i) {
		if (text[i] != text[n-i-1]) return 0;
	}
	return 1;
}
```

**接口文件（palindrome.i）**

```java
%module palindrome
%{
#include <string.h>
%}
extern int is_palindrome(char *text);
```

**Extension实例的文件列表**

```java
from setuptools import setup, Extension
setup(name='palindrome',version='1.0',ext_modules = [Extension('_palindrome', ['palindrome.c','palindrome.i'])])
```

如果用刚才的命令（build_ext，可能还要加上开关–inplace）运行这个脚本，也将生成一个.so文件（或与之等价的文件），但这次无需自己编写包装代码。

这个扩展指定了名称`_palindrome`，因为SWIG将创建一个名为`palindrom.py`的包装器，而这个包装器将通过名称`_palindrome`导入一个C语言库。

## 使用py2exe创建可执行程序

py2exe是Setuptools的一个扩展（可通过pip来安装它），能够创建可执行的Windows程序（.exe文件）。

py2exe包可用来创建带GUI（参见第12章）的可执行文件。

```java
print('Hello, world!') 
input('Press <enter>')
```

创建一个空目录，再将这个文件（hello.py）放到这个目录中，然后创建一个类似于下面的setup.py文件：

**beyond.py**

```java
from setuptools import setup
setup(name='Beyond',version='1.0',description='A simple example',author='beyondyanyu',py_modules=['beyond'])
```

**setup.py**

```java
from distutils.core import setup
import py2exe
setup(console=['beyond.py'])
```

**接着运行这个脚本：**

```java
python setup.py py2exe
```

这将创建一个控制台应用程序（beyond.exe），还将在子目录dist中创建其他几个文件。

有关py2exe的工作原理和高级用法的详细信息，可以查阅[py2exe官网](http://www.py2exe.org)。

## 小结

概念
解释

Setuptools
Setuptools工具包让你能够编写安装脚本。根据约定，这种安装脚本被命名为setup.py。使用这种脚本，可安装模块、包和扩展。

Setuptools的命令
可使用多个命令来运行setup.py脚本，如build、build_ext、install、sdist和bdist。

编译扩展
可使用Setuptools来自动编译C语言扩展，并让Setuptools自动确定Python安装位置以及该使用哪个编译器。还可让它自动运行SWIG。

可执行的二进制文件
Setuptools扩展py2exe可用来从Python程序创建可执行的Windows二进制文件以及其他一些文件（可使用安装程序方便地安装）。无需单独安装Python解释器，就可运行这些.exe文件。在macOS中，扩展py2app提供了与py2exe类似的功能。

### 本章介绍的新函数

函数
描述

setuptools.setup(…)
在脚本setup.py中使用关键字参数配置Setuptools
