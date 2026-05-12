# 16、Python 教程 - 测试基础
- 来源：https://ddkk.com/zhuanlan/other/python/6/16.html
- 分类：Python 基础入门
- 分组：教程目录
在编译型语言中，需要不断重复编辑、编译、运行的循环。

在Python中，**不存在编译阶段**，**只有编辑和运行阶段**。测试就是**运行程序**。

## 先测试再编码

极限编程先锋引入了“测试一点点，再编写一点点代码”的理念。

换而言之，`测试在先，编码在后`。这也称为测试驱动的编程。

### 准确的需求说明

要阐明程序的目标，可编写需求说明，也就是描述程序必须满足何种需求的文档（或便条）。

测试程序就是需求说明，可帮助确保程序开发过程紧扣这些需求。

**假设你要编写一个模块，其中只包含一个根据矩形的宽度和高度计算面积的函数。动手编写代码前，编写一个单元测试，其中包含一些你知道答案的例子。**

**文件area.py**内容如下：

```java
def rect_area(height,width):
    return height*height很显然不对
```

同目录下的**test.py**内容如下：

```java
from area import rect_area
height = 3
width = 4
correct_answer = 12
answer = rect_area(height,width)
if answer == correct_answer:
    print('Test passed')
else:
    print('Test failed')
'''
很显然，输出结果为：Test failed
接下来，你可能检查代码，看看问题出在什么地方，并将返回的表达式替换为height * width。
'''
```

### 做好应对变化的准备

自动化测试不仅可在你编写程序时提供极大的帮助，还有助于在你修改代码时避免累积错误，这在程序规模很大时尤其重要。

**代码覆盖率**

覆盖率（coverage）是一个重要的测试概念。运行测试时，很可能达不到运行所有代码的理想状态。（实际上，最理想的情况是，使用各种可能的输入检查每种可能的程序状态，但这根本不可能做到。）优秀测试套件的目标之一是确保较高的覆盖率，为此可使用覆盖率工具，它们测量测试期间实际运行的代码所占的比例。

Python自带的程序trace.py。

要确保较高的测试覆盖率，方法之一是`秉承测试驱动开发`的理念。只要能确保先编写测试再编写函数，就能肯定每个函数都是经过测试的。

### 测试四部曲

1，确定需要实现的新功能。可将其记录下来，再为之编写一个测试。

2，编写实现功能的框架代码，让程序能够运行（不存在语法错误之类的问题），但测试依然无法通过。

3，编写让测试刚好能够通过的代码。

4，改进（重构）代码以全面而准确地实现所需的功能，同时确保测试依然能够成功。

## 测试工具

### doctest

**文件my_math.py**

```java
def square(x):
    return x * x
if name == '__main__':
    import doctest, my_math
    doctest.testmod(my_math)
```

对模块doctest中的函数testmod进行测试

`python my_math.py`

先显然，并没有什么显示输出

函数doctest.testmod读取模块中的所有文档字符串，查找看起来像是从交互式解释器中摘取的示例，再检查这些示例是否反映了实际情况。

为获得更多的输出，可在运行脚本时指定开关-v（verbose，意为详尽）。

`python my_math.py -v`

输入如下：

```java
Running my_math.__doc__ 
0 of 0 examples failed in my_math.__doc__ 
Running my_math.square.__doc__ 
Trying: square(2) 
Expecting: 4 
Ok 
Trying: square(3) 
Expecting: 9 
ok 
0 of 2 examples failed in my_math.square.__doc__ 
1 items had no tests: 
 test 
1 items passed all tests: 
2 tests in my_math.square 
2 tests in 2 items. 
2 passed and 0 failed. 
Test passed.
```

假设要使用Python幂运算符而不是乘法运算符，**将x * x替换为x ** 2**，再运行脚本对代码进行测试。

输出如下：

```java
***************************************************************** 
Failure in example: square(3) 
from line5 of my_math.square 
Expected: 9 
Got: 27 
*****************************************************************
1 items had failures: 
	1 of 2 in my_math.square 
***Test Failed*** 
1 failures.
```

### unittest

doctest使用起来很容易，但unittest（基于流行的Java测试框架JUnit）更灵活、更强大。

**一个使用框架unittest的简单测试**

```java
import unittest, my_math
class ProductTestCase(unittest.TestCase):
    def test_integers(self):
        for x in range(-10, 10):
            for y in range(-10, 10):
                p = my_math.product(x, y)
                self.assertEqual(p, x * y, 'Integer multiplication failed')
    def test_floats(self):
        for x in range(-10, 10):
            for y in range(-10, 10):
                x = x / 10
                y = y / 10
                p = my_math.product(x, y)
                self.assertEqual(p, x * y, 'Float multiplication failed')
if __name__ == '__main__': unittest.main()
```

运行这个测试脚本将引发异常，指出模块my_math不存在。

模块unittest区分错误和失败。错误指的是引发了异常，而失败是调用failUnless等方法的结果。

**文件my_math.py**

```java
def product(x,y):
    pass#框架代码，没什么意思。
```

运行前面的测试，将出现两条FAIL消息，输出如下：

```java
FF 
====================================================================== 
FAIL: test_floats (__main__.ProductTestCase) 
---------------------------------------------------------------------- 
Traceback (most recent call last): 
  File "test_my_math.py", line 17, in testFloats 
    self.assertEqual(p, x * y, 'Float multiplication failed') 
AssertionError: Float multiplication failed 
====================================================================== 
FAIL: test_integers (__main__.ProductTestCase) 
---------------------------------------------------------------------- 
Traceback (most recent call last): 
 File "test_my_math.py", line 9, in testIntegers 
    self.assertEqual(p, x * y, 'Integer multiplication failed') 
AssertionError: Integer multiplication failed 
---------------------------------------------------------------------- 
Ran 2 tests in 0.001s 
FAILED (failures=2)
```

`开头两个字符，两个F，表示两次失败。`

接下来需要让代码管用。修改**文件my_math.py**

```java
def product(x,y):
    return x * y
```

再次运行前面的测试，输出如下：

```java
.. 
---------------------------------------------------------------------- 
Ran 2 tests in 0.015s 
OK
```

`开头的两个句点表示测试。`

再次修改函数product，即修改**文件my_math.py**

```java
def product(x, y):
    if x == 7 and y == 9:
        return 'An insidious bug has surfaced!'
    else:
        return x * y
```

再次运行前面的测试脚本，将有一个测试失败。输出如下：

```java
.F 
====================================================================== 
FAIL: test_integers (__main__.ProductTestCase) 
---------------------------------------------------------------------- 
Traceback (most recent call last): 
 File "test_my_math.py", line 9, in testIntegers 
    self.assertEqual(p, x * y, 'Integer multiplication failed') 
AssertionError: Integer multiplication failed 
---------------------------------------------------------------------- 
Ran 2 tests in 0.005s 
FAILED (failures=1)
```

## 超越单元测试

两个工具：源代码检查和性能分析。

源代码检查是一种发现代码中常见错误或问题的方式（有点像静态类型语言中编译器的作用，但做的事情要多得多）。

性能分析指的是搞清楚程序的运行速度到底有多快。

### 使用PyChecker 和 PyLint 检查源代码

PyChecker（pychecker.sf.net）用于检查Python源代码的唯一工具，能够找出诸如给函数提供的参数不对等错误。

标准库中还有tabnanny，但没那么强大，只检查缩进是否正确。

之后出现了PyLint（pylint.org），它支持PyChecker提供的大部分功能，还有很多其他的功能，如变量名是否符合指定的命名约定、是否遵守了自己的编码标准等。

使用Distutils来安装，可使用如下标准命令。

`python setup.py install`

PyLint，也可使用pip来安装。

使用PyChecker来检查文件，可运行这个脚本并将文件名作为参数

`pychecker file1.py file2.py ...`

使用PyLint检查文件时，需要将`模块（或包）名`作为参数：`pylint module`

PyChecker和PyLint都可作为模块（分别是pychecker.checker和pylint.lint）导入

导入pychecker.checker时，它会检查后续代码（包括导入的模块），并将警告打印到标准输出。

模块pylint.lint包含一个文档中没有介绍的函数Run，这个函数是供脚本pylint本身使用的。它也将警告打印出来，而不是以某种方式将其返回。

**使用模块subprocess调用外部检查器**

```java
import unittest, my_math 
from subprocess import Popen, PIPE
class ProductTestCase(unittest.TestCase):
    def test_with_PyChecker(self):
        cmd = 'pychecker', '-Q', my_math.__file__.rstrip('c')
        pychecker = Popen(cmd, stdout=PIPE, stderr=PIPE)
        self.assertEqual(pychecker.stdout.read(), '')
    def test_with_PyLint(self):
        cmd = 'pylint', '-rn', 'my_math'
        pylint = Popen(cmd, stdout=PIPE, stderr=PIPE)
        self.assertEqual(pylint.stdout.read(), '')
if __name__ == '__main__': unittest.main()
```

对于pychecker，开关-Q（quiet，意为静默）；

对于pylint，开关-rn（其中n表示no）以关闭报告，这意味着将只显示警告和错误。

命令pylint直接将模块名作为参数

让pychecker正确地运行，需要获取文件名。使用了`模块my_math`的属性__file__，并使用rstrip将文件名末尾可能包含的c删掉（因为模块可能存储在.pyc文件中）

模块my_math，**文件my_math.py**

```java
__revision__ = '0.1'
def product(factor1, factor2):
    'The product of two numbers'
    return factor1 * factor2
```

### 性能分析

`在编程中，不成熟的优化是万恶之源。`

如果程序的速度达不到你的要求，必须优化，就必须首先对其进行性能分析。

标准库包含一个卓越的性能分析模块profile，还有一个速度更快C语言版本，名为cProfile。

这个性能分析模块使用起来很简单，只需调用其方法run并提供一个字符串参数。

这里照样使用了以前的文件my_math.py

```java
import cProfile
from my_math import product
cProfile.run('product(1, 2)')
```

这将输出如下信息：各个函数和方法被调用多少次以及执行它们花费了多长时间。如果通过第二个参数向run提供一个文件名（如’my_math.profile’），分析结果将保存到这个文件中。然后，就可使用模块pstats来研究分析结果了。

```java
import pstats
p = pstats.Stats('my_math.profile')
```

## 小结

概念
描述

测试驱动编程
大致而言，测试驱动编程意味着先测试再编码。有了测试，就能信心满满地修改代码，这让开发和维护工作更加灵活。

模块doctest和unittest
需要在Python中进行单元测试时，这些工具必不可少。模块doctest设计用于检查文档字符串中的示例，但也可轻松地使用它来设计测试套件。为让测试套件更灵活、结构化程度更高，框架unittest很有帮助。

PyChecker和PyLint
这两个工具查看源代码并指出潜在（和实际）的问题。它们检查代码的方方面面——从变量名太短到永远不会执行的代码段。只需编写少量的代码，就可将它们加入测试套件，从而确保所有修改和重构都遵循了你采用的编码标准。

性能分析
如果很在乎速度，并想对程序进行优化（仅当绝对必要时才这样做），应首先进行性能分析：使用模块profile或cProfile来找出代码中的瓶颈。

### 本章介绍的新函数

函数
描述

doctest.testmod(module)
检查文档字符串中的示例（还接受很多其他的参数）

unittest.main()
运行当前模块中的单元测试

profile.run(stmt[,filename])
执行语句并对其进行性能分析；可将分析结果保存到参数filename指定的文件中
