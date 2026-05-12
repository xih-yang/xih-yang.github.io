# 17、Python 教程 - 扩展Python
- 来源：https://ddkk.com/zhuanlan/other/python/6/17.html
- 分类：Python 基础入门
- 分组：教程目录
Python什么都能做，真的是这样。这门语言功能强大，但有时候`速度有点慢`。

## 鱼和熊掌兼得

本章讨论确实需要进一步提升速度的情形。在这种情况下，最佳的解决方案可能不是完全转向C语言（或其他中低级语言），建议你采用下面的方法（这可满足众多的速度至上需求）。

**1、** 使用Python开发原型（有关原型开发的详细信息，请参阅第19章）；

**2、** 对程序进行性能分析以找出瓶颈（有关测试，请参阅第16章）；

3. 使用C（或者C++、C#、Java、Fortran等）扩展重写瓶颈部分。

这样得到的架构（包含一个或多个C语言组件的Python框架）将非常强大，因为它兼具这两门语言的优点。

## 简单易行的方式：Jython 和 IronPython

使用Jython（http://jython.org）或IronPython（http://ironpython.net），可轻松地使用原生模块来扩展Python。

Jython和IronPython能够让你访问底层语言中的模块和类（对Jython来说，底层语言为Java；对IronPython来说，为C#和其他.NET语言）

**一个简单的Java类（JythonTest.java）**

```java
public class JythonTest {
	public void greeting() {
		System.out.println("Hello, world!")
	}
}
```

使用Java编译器（如javac）来编译这个类。`javac JythonTest.java`

编译这个类后，启动Jython（并将.class文件放到当前目录或Java CLASSPATH包含的目录中）

`CLASSPATH=JythonTest.class jython`

然后，就可直接导入这个类了。

```java
import JythonTest
test = JythonTest()
test.greeting()#输出结果如下：
'''
Hello, world!
'''
```

**一个简单的C#类（IronPythonTest.cs）**

```java
using System;
namespace FePyTest {
  public class IronPythonTest {
    public void greeting() {
      Console.WriteLine("Hello, world!");
    }
  }
}
```

选择的编译器来编译这个类，对于Microsoft .NET，命令如下：`csc.exe /t:library IronPythonTest.cs`

要在IronPython中使用这个类，一种方法是将其编译为动态链接库(DLL)，并根据需要修改相关的环境变量（如PATH），然后就应该能够像下面这样使用它了（这里使用的是IronPython交互式解释器）：

```java
import clr
clr.AddReferenceToFile("IronPythonTest.dll")
import FePyTest
f = FePyTest.IronPythonTest()
f.greeting()
```

## 编写C语言扩展

扩展Python通常意味着扩展CPython——使用编程语言C实现的Python标准版

C语言的动态性不如Java和C#，而且对Python来说，编译后的C语言代码也不那么容易理解。因此，使用C语言编写Python扩展时，必须遵循严格的API。

**其他方法**

使用Cpython，有很多工具可帮助提高程序的速度，这是通过生成和使用C语言库或提高Python代码的速度实现的。

工具
描述

Cython（http://cython.org）
这其实是一个Python编译器！它还提供了扩展的Cython语言，该语言基于Greg Ewing开发的项目Pyrex，让你能够使用类似于Python的语法添加类型声明和定义C类型。因此，它的效率非常高，并且能够很好地与C扩展模块（包括Numpy）交互。

PyPy（http://pypy.org）
这是一个雄心勃勃而有远见的Python实现——使用的是Python。这种实现好像会慢如蜗牛，但通过极其复杂的代码分析和编译，其性能实际上超过了CPython。其官网指出：“有传言说PyPy的秘密目标是在速度上超过C语言，这是无稽之谈，不是吗？”PyPy的核心是RPython——一种受限的Python方言。RPython擅长自动类型推断等，可转换为静态语言、机器码和其他动态语言（如JavaScript）。

Weave（http://scipy.org）
SciPy发布版的一部分，也有单独的安装包。这个工具让你能够在Python代码中以字符串的方式直接包含C或C++代码，并无缝地编译和执行这些代码。例如，要快速计算一些数学表达式，就可使用这个工具。Weave还可提高使用数字数组的表达式的计算速度。

NumPy（http://numpy.org）
NumPy让你能够使用数字数组，这对分析各种形式的数值数据（从股票价值到天文图像）很有帮助。NumPy的优点之一是接口简单，无需显式地指定众多低级操作。然而，NumPy的主要优点是速度快。对数字数组中的每个元素执行很多常见操作时，速度都比使用列表和for循环执行同样的操作快得多，这是因为隐式循环是直接使用C语言实现的。数字数组能够很好地与Cython和Weave协同工作。

ctypes（https://docs.python.org/library/ctypes.html）
模块ctypes最初是Thomas Heller开发的一个项目，但现在包含在标准库中。它采用直截了当的方法——能够导入既有（共享）的C语言库。虽然存在一些限制，但这可能是访问C语言代码的最简单方式之一。不需要包装器，也不需要特殊API，只需将库导入就可使用。

subprocess（https://docs.python.org/3/library/subprocess.html）
模块subprocess包含在标准库中（标准库中还有一些较老的模块和函数提供了类似的功能）。它让你能够在Python中运行外部程序，并通过命令行参数以及标准输入、输出和错误流与它们通信。如果对速度要求极高的代码可使用几个批处理作业来完成大部分工作，启动外部程序并与之通信所需的时间将很短。在这种情况下，将C语言代码放在独立的程序中并将其作为子进程运行很可能是最整洁的解决方案。

PyCXX（http://cxx.sourceforge.net）
以前名为CXX或CXX/Objects，是一组帮助使用C++编写Python扩展的工具。例如，它提供了良好的引用计数支持，可减少犯错的机会。

SIP（http://www.riverbankcomputing.co.uk/software/sip）
SIP最初是一个开发GUI包PyQt的工具，包含一个代码生成器和一个Python模块。它像SWIG那样使用规范文件。

Boost.Python（http://www.boost.org/libs/python/doc）
Boost.Python让Python和C++能够无缝地互操作，可为你解决引用计数和在C++中操作Python对象提供极大的帮助。一种使用它的主要方式是，以类似于Python的方式编写C++代码（Boost.Python中的宏为此提供了支持），再使用你喜欢的C++编译器将这些代码编译成Python扩展。它虽然与SWIG有天壤之别，却能很好地替代SWIG，因此很值得你研究研究。

### SWIG

SWIG（http://www.swig.org）指的是简单包装器和接口生成器（simple wrapper and interfacegenerator），是一个适用于多种语言的工具。

一方面，它够使用C或C++编写扩展代码；

另一方面，它自动包装这些代码，能够在Tcl、Python、Perl、Ruby和Java等高级语言中使用它们。

**SWIG使用起来很简单，前提条件是有一些C语言代码**

1，用法

(1)，为代码编写一个接口文件。这很像C语言头文件（在比较简单的情况下，可直接使用现有的头文件）。

(2)，对接口文件运行SWIG，以自动生成一些额外的C语言代码（包装器代码）。

(3)，将原来的C语言代码和生成的包装器代码一起编译，以生成共享库。

2，回文

回文（palindrome；如I prefer pi）是忽略空格、标点等后正着读和反着读一样的句子。

**一个简单的检测回文的C语言函数（palindrome.c）**

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

**检测回文的Python函数**

```java
def is_palindrome(text):
	n = len(text)
	for i in range(len(text) // 2):
		if text[i] != text[n-i-1]:
			return False
	return True
```

3，接口文件

假设代码存储在文件palindrome.c中，现在应该在文件palindrome.i中添加接口描述。

如果定义一个头文件（这里为palindrome.h），SWIG可能能够从中获取所需的信息。

在接口文件中，只是声明要导出的函数（和变量），就像在头文件中一样。

在接口文件的开头，有一个由%{和%}界定的部分，可在其中指定要包含的头文件（这里为string.h），%module声明，用于指定模块名。

**回文检测库的接口（palindrome.i）**

```java
%module palindrome
%{
#include <string.h>
%}
extern int is_palindrome(char *text);
```

4，运行SWIG

运行SWIG时，需要将接口文件（也可以是头文件）作为参数

`$swig -python palindrome.i`

这将生成两个新文件，分别是**palindrome_wrap.c**和**palindrome.py**。

5，编译、链接和使用

在Linux中使用编译器gcc

```java
$ gcc -c palindrome.c 
$ gcc -I$PYTHON_HOME -I$PYTHON_HOME/Include -c palindrome_wrap.c 
$ gcc -shared palindrome.o palindrome_wrap.o -o _palindrome.so
```

将得到一个很有用的文件_palindrome.so。它就是共享库，可直接导入到Python中（条件是它位于PYTHONPATH包含的目录中，如当前目录中）

```java
import _palindrome
dir(_palindrome)#结果为：['__doc__', '__file__', '__name__', 'is_palindrome']
_palindrome.is_palindrome('ipreferpi')#结果为：1
_palindrome.is_palindrome('notlob')#结果为：0
```

6，穿越编译器“魔法森林”的捷径

通过使用Setuptools，直接支持SWIG，让你无需手工运行SWIG：只需编写代码和接口文件，再运行安装脚本。

### 手工编写扩展

SWIG在幕后做了很多工作，但并非每项工作都是绝对必要的。

如果你愿意，可自己编写包装代码，也可在C语言代码中直接使用Python C API。

[Python/C API参考手册](https://docs.python.org/3/c-api)

[标准库参考手册](https://docs.python.org/3/extending)

1，引用计数

在Python中，内存管理是自动完成的：你只管创建对象，当你不再使用时它们就会消失。

在C语言中，必须显式地释放不再使用的对象（更准确地说是内存块），否则程序占用的内存将越来越多，这称为内存泄漏（memory leak）。

可使用Python在幕后使用的内存管理工具，其中之一就是引用计数。

**一个对象只要被代码引用（在C语言中是有指向它的指针），就不应将其释放。**

为将对象的引用计数加1和减1，可使用两个宏，分别是Py_INCREF和Py_DECREF。

- 对象不归你所有，但指向它的引用归你所有。一个对象的引用计数是指向它的引用的数量。
- 对于归你所有的引用，你必须负责在不再需要它时调用Py_DECREF。
- 对于你暂时借用的引用，不应在借用完后调用Py_DECREF，因为这是引用所有者的职责。
- 可通过调用Py_INCREF将借来的引用变成自己的。这将创建一个新引用，而借来的引用依然归原来的所有者所有。
- 通过参数收到对象后，要转移所有权（如将其存储起来）还是仅仅借用完全由你决定，但应清楚地说明。如果函数将在Python中调用，完全可以只借用，因为对象在整个函数调用期间都存在。然而，如果函数将在C语言中调用，就无法保证对象在函数调用期间都存在，因此可能应该创建自己的引用，并在使用完毕后将其释放。

**再谈垃圾收集**

引用计数是一种垃圾收集方式，其中的术语“垃圾”指的是程序不再使用的对象。

循环垃圾，即两个对象相互引用对方（导致它们的引用计数不为0），但没有其他的对象引用它们。

2，扩展框架

必须先包含头文件Python.h，再包含其他标准头文件。

```java
#include <Python.h>
static PyObject *somename(PyObject *self, PyObject *args) {
	PyObject *result;
	Py_INCREF(result); /* 仅当需要时才这样做！*/
	return result;
}
int PyArg_ParseTuple(PyObject *args, char *format, ...);
```

3，回文

**另一个回文检查示例（palindrome2.c）**

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

## 小结

概念
描述

扩展理念
Python扩展的主要用途有两个——利用既有（遗留）代码和提高瓶颈部分的速度。从头开始编写代码时，请尝试使用Python建立原型，找出其中的瓶颈并在需要时使用扩展来替换它们。预先将潜在的瓶颈封装起来大有裨益。

Jython和IronPython
对这些Python实现进行扩展很容易，使用底层语言（对于Jython，为Java；对于IronPython，为C#和其他.NET语言）以库的方式实现扩展后，就可在Python中使用它们了。

扩展方法
有很多用于扩展代码或提高其速度的工具，有的让你更轻松地在Python程序中嵌入C语言代码，有的可提高数字数组操作等常见运算的速度，有的可提高Python本身的速度。这样的工具包括SWIG、Cython、Weave、NumPy、ctypes和subprocess。

SWIG
SWIG是一款自动为C语言库生成包装代码的工具。包装代码自动处理Python CAPI，使你不必自己去做这样的工作。使用SWIG是最简单、最流行的扩展Python的方式之一。

使用Python/C API
可手工编写可作为共享库直接导入到Python中的C语言代码。为此，必须遵循Python/C API：对于每个函数，你都需要负责完成引用计数、提取参数以及创建返回值等工作；另外，还需编写将C语言库转换为模块的代码，包括列出模块中的函数以及创建模块初始化函数。

### 本章介绍的新函数

函数
描述

Py_INCREF(obj)
将obj的引用计数加1

Py_DECREF(obj)
将obj的引用计数减1

PyArg_ParseTuple(args, fmt, …)
提取位置参数

PyArg_ParseTupleAndKeywords(args, kws, fmt, kwlist)
提取位置参数和关键字参数

PyBuildValue(fmt, value)
根据C语言值创建PyObject
