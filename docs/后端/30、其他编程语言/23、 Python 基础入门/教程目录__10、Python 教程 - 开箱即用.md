# 10、Python 教程 - 开箱即用
- 来源：https://ddkk.com/zhuanlan/other/python/6/10.html
- 分类：Python 基础入门
- 分组：教程目录
“开箱即用”（batteries included）最初是由Frank Stajano提出的，指的是`Python丰富的标准库`。

## 模块

使用import将函数从外部模块导入到程序中。

```java
import math
math.sin(0)#结果为：0.0
```

### 模块就是程序

在文件夹中创建一个`test.py`，内容如下：

```java
#text.py
print("hello beyond band!")
```

位置如下：

`sys.path包含一个目录（表示为字符串）列表，解释器将在这些目录中查找模块。`

```java
import sys
sys.path.append('E:\Jupyter_workspace\study\python\book')
import text#结果为：hello beyond band!
```

程序运行完之后会生成一个`__pycache__`文件夹，这个目录包含处理后的文件，Python能够更高效地处理它们。

以后再导入这个模块时，如果.py文件未发生变化，Python将导入处理后的文件，否则将重新生成处理后的文件。

**导入这个模块时，执行了其中的代码。但如果再次导入它，什么事情都不会发生。**

模块并不是用来执行操作（如打印文本）的，而是用于`定义变量、函数、类`等。

### 模块是用来下定义的

`模块在首次被导入程序时执行。`

**在模块中定义的类和函数以及对其进行赋值的变量都将成为模块的属性。**

**1，在模块中定义函数**

创建`hellp.py`

内容如下：

```java
#hello.py
def hello():
    print("Hello beyond!!!")
```

在另一个py文件中导入该模块

```java
import sys
sys.path.append('E:\Jupyter_workspace\study\python\book')
import hello
hello.hello()#结果为：Hello beyond!!!
```

在模块的全局作用域内定义的名称都可像上面这样访问。

**为何不在主程序中定义一切呢？**

主要是为了`重用代码`。**通过将代码放在模块中，就可在多个程序中使用它们。**

**2，在模块中添加测试代码**

**检查模块是作为程序运行还是被导入另一个程序。为此，需要使用变量__name__。**

在上面的基础上进行测试：

```java
import sys
sys.path.append('E:\Jupyter_workspace\study\python\book')
import hello
hello.hello()#结果为：Hello beyond!!!
__name__#结果为：'__main__'
hello.__name__#结果为：'hello'
```

在主程序中（包括解释器的交互式提示符），变量__name__的值是’`__main__`’，

而在导入的模块中，这个变量被设置为`该模块的名称`。

**一个包含有条件地执行的测试代码的模块**

创建`beyond.py`

内容如下：

```java
#beyond.py
def hello():
    print("beyond!")
def test():
    hello()
if __name__ == '__main__':test()
```

如果将这个模块作为程序运行，将执行函数hello；

如果导入它，其行为将像普通模块一样。

在另一个py文件中导入该模块

```java
import sys
sys.path.append('E:\Jupyter_workspace\study\python\book')
import beyond
beyond.hello()#结果为：beyond!
beyond.test()#结果为：beyond!
```

将测试代码放在了函数test中。原本可以将这些代码直接放在if语句中，但通过将其放在一个独立的测试函数中，可在程序中导入模块并对其进行测试。

### 让模块可用

**1，将模块放在正确的位置**

**将模块放在正确的位置很容易，只需找出Python解释器到哪里去查找模块，再将文件放在这个地方即可。**

模块sys的变量path中找到目录列表（即搜索路径）。

如果要打印的数据结构太大，一行容纳不下，可使用`模块pprint中的函数pprint`（而不是普通print语句）。`pprint是个卓越的打印函数`，能够`更妥善地打印输出`。

```java
import sys,pprint
pprint.pprint(sys.path)#结果为：
'''
['',
 'D:\\Anaconda3\\python36.zip',
 'D:\\Anaconda3\\DLLs',
 'D:\\Anaconda3\\lib',
 'D:\\Anaconda3',
 'D:\\Anaconda3\\lib\\site-packages',
 'D:\\Anaconda3\\lib\\site-packages\\Babel-2.5.0-py3.6.egg',
 'D:\\Anaconda3\\lib\\site-packages\\win32',
 'D:\\Anaconda3\\lib\\site-packages\\win32\\lib',
 'D:\\Anaconda3\\lib\\site-packages\\Pythonwin',
 'D:\\Anaconda3\\lib\\site-packages\\IPython\\extensions',
 'C:\\Users\\yanyu\\.ipython',
 'E:\\Jupyter_workspace\\study\\python\x08ook',
 'E:\\Jupyter_workspace\\study\\python\x08ook',
 'E:\\Jupyter_workspace\\study\\python\x08ook',
 'E:\\Jupyter_workspace\\study\\python\x08ook',
 'E:\\Jupyter_workspace\\study\\python\x08ook',
 'E:\\Jupyter_workspace\\study\\python\x08ook',
 'E:\\Jupyter_workspace\\study\\python\x08ook',
 'E:\\Jupyter_workspace\\study\\python\x08ook',
 'E:\\Jupyter_workspace\\study\\python\x08ook']
'''
```

每个字符串都表示一个位置，如果要让解释器能够找到模块，可将其放在其中任何一个位置中。目录`site-packages`是最佳的选择，因为`它就是用来放置模块的`。

**只要模块位于类似于site-packages这样的地方，所有的程序就都能够导入它。**

将上述的`beyond.py`文件放入到`site-packages`文件夹下。

故在其他程序中可以`直接导入`即可：

```java
import beyond
beyond.hello()#结果为：beyond!
```

**2，告诉解析器到哪里去查找**

将模块放在正确的位置可能不是合适的解决方案，其中的原因很多

1，不希望Python解释器的目录中充斥着你编写的模块。

2，没有必要的权限，无法将文件保存到Python解释器的目录中。

3，想将模块放在其他地方。

4，如果将模块放在其他地方，就必须告诉解释器到哪里去查找。

标准做法
解释

1，将模块所在的目录包含在环境变量PYTHONPATH中
环境变量PYTHONPATH的内容随操作系统而异，但它基本上类似于sys.path，也是一个目录列表。

2，使用路径配置文件
这些文件的扩展名为.pth，位于一些特殊目录中，包含要添加到sys.path中的目录。

### 包

为组织模块，可将其编组为包（package）。

包其实就是另一种模块(`可包含其他模块的模块`)。

**模块**存储在扩展名为`.py`的文件中，而**包**则是一个`目录`。

要被Python视为包，目录必须包含文件`__init__.py`。

要将模块加入包中，只需`将模块文件放在包目录中即可`。还可以在包中`嵌套其他包`。

**按照下面的五个文件夹路径创建对应的文件和文件夹**

文件/目录
描述

~/python/
PYTHONPATH中的目录

~/python/drawing/
包目录（包drawing）

~/python/drawing/__init__.py
包代码（模块drawing）

~/python/drawing/colors.py
模块colors

~/python/drawing/shapes.py
模块shapes

```java
import drawing#导入drawing包
import drawing.colors#导入drawing包中的模块colors
from drawing import shapes#导入模块shapes
'''
执行第1条语句后，便可使用目录drawing中文件__init__.py的内容，但不能使用模块shapes和colors的内容。
执行第2条语句后，便可使用模块colors，但只能通过全限定名drawing.colors来使用。
执行第3条语句后，便可使用简化名（即shapes）来使用模块shapes。
'''
```

## 探索模块

### 模块包含什么

接下来以一个名为copy的标准模块来进行解释：

```java
import copy
```

没有引发异常，说明确实有这样的模块。

**1，使用dir**

函数dir，它列出对象的所有属性（对于模块，它列出所有的函数、类、变量等）

在这些名称中，有几个以下划线打头。根据约定，这意味着它们并非供外部使用。

使用一个简单的列表推导将这些名称过滤掉。

`[nfor n in dir(copy) if not n.startswith('_')]` 结果包含dir(copy)返回的`不以下划线打头`的名称，

```java
import copy
dir(copy)#结果为：
"""
['Error',
 '__all__',
 '__builtins__',
 '__cached__',
 '__doc__',
 '__file__',
 '__loader__',
 '__name__',
 '__package__',
 '__spec__',
 '_copy_dispatch',
 '_copy_immutable',
 '_deepcopy_atomic',
 '_deepcopy_dict',
 '_deepcopy_dispatch',
 '_deepcopy_list',
 '_deepcopy_method',
 '_deepcopy_tuple',
 '_keep_alive',
 '_reconstruct',
 'copy',
 'deepcopy',
 'dispatch_table',
 'error']
"""
[n for n in dir(copy) if not n.startswith('_')]#结果为：['Error', 'copy', 'deepcopy', 'dispatch_table', 'error']
```

**2，变量__all__**

由上述的代码段可知，在dir(copy)返回的完整清单中，包含名称__all__。

`__all__`这个变量包含一个`列表`，它与前面使用列表推导创建的列表类似，但是在`模块内部`设置的。

```java
import copy
copy.__all__#结果为：['Error', 'copy', 'deepcopy']
```

### 使用help获取帮助

**使用help获取有关函数copy的信息**

```java
help(copy.copy)#结果为：
'''
Help on function copy in module copy:
copy(x)
    Shallow copy operation on arbitrary Python objects.
    See the module's __doc__ string for more info.
'''
```

上述帮助信息指出，`函数copy只接受一个参数x，且执行的是浅复制`。

帮助信息是从函数copy的文档字符串中提取的

```java
print(copy.copy.__doc__)#结果为：
'''
Shallow copy operation on arbitrary Python objects.
    See the module's __doc__ string for more info.
'''
```

相比于直接查看文档字符串，**使用help的优点是**`可获取更多的信息，如函数的特征标（即它接受的参数）`。

**对模块copy本身调用help**

```java
help(copy)#结果为：
'''
Help on module copy:
NAME
    copy - Generic (shallow and deep) copying operations.
DESCRIPTION
    Interface summary:
            import copy
            x = copy.copy(y)        make a shallow copy of y
            x = copy.deepcopy(y)    make a deep copy of y
    For module specific errors, copy.Error is raised.
    The difference between shallow and deep copying is only relevant for
    compound objects (objects that contain other objects, like lists or
    class instances).
    - A shallow copy constructs a new compound object and then (to the
      extent possible) inserts *the same objects* into it that the
      original contains.
    - A deep copy constructs a new compound object and then, recursively,
      inserts *copies* into it of the objects found in the original.
    Two problems often exist with deep copy operations that don't exist
    with shallow copy operations:
     a) recursive objects (compound objects that, directly or indirectly,
        contain a reference to themselves) may cause a recursive loop
     b) because deep copy copies *everything* it may copy too much, e.g.
        administrative data structures that should be shared even between
        copies
    Python's deep copy operation avoids these problems by:
     a) keeping a table of objects already copied during the current
        copying pass
     b) letting user-defined classes override the copying operation or the
        set of components copied
    This version does not copy types like module, class, function, method,
    nor stack trace, stack frame, nor file, socket, window, nor array, nor
    any similar types.
    Classes can use the same interfaces to control copying that they use
    to control pickling: they can define methods called __getinitargs__(),
    __getstate__() and __setstate__().  See the documentation for module
    "pickle" for information on these methods.
CLASSES
    builtins.Exception(builtins.BaseException)
        Error
    class Error(builtins.Exception)
     |  Common base class for all non-exit exceptions.
     |  
     |  Method resolution order:
     |      Error
     |      builtins.Exception
     |      builtins.BaseException
     |      builtins.object
     |  
     |  Data descriptors defined here:
     |  
     |  __weakref__
     |      list of weak references to the object (if defined)
     |  
     |  ----------------------------------------------------------------------
     |  Methods inherited from builtins.Exception:
     |  
     |  __init__(self, /, *args, **kwargs)
     |      Initialize self.  See help(type(self)) for accurate signature.
     |  
     |  __new__(*args, **kwargs) from builtins.type
     |      Create and return a new object.  See help(type) for accurate signature.
     |  
     |  ----------------------------------------------------------------------
     |  Methods inherited from builtins.BaseException:
     |  
     |  __delattr__(self, name, /)
     |      Implement delattr(self, name).
     |  
     |  __getattribute__(self, name, /)
     |      Return getattr(self, name).
     |  
     |  __reduce__(...)
     |      helper for pickle
     |  
     |  __repr__(self, /)
     |      Return repr(self).
     |  
     |  __setattr__(self, name, value, /)
     |      Implement setattr(self, name, value).
     |  
     |  __setstate__(...)
     |  
     |  __str__(self, /)
     |      Return str(self).
     |  
     |  with_traceback(...)
     |      Exception.with_traceback(tb) --
     |      set self.__traceback__ to tb and return self.
     |  
     |  ----------------------------------------------------------------------
     |  Data descriptors inherited from builtins.BaseException:
     |  
     |  __cause__
     |      exception cause
     |  
     |  __context__
     |      exception context
     |  
     |  __dict__
     |  
     |  __suppress_context__
     |  
     |  __traceback__
     |  
     |  args
FUNCTIONS
    copy(x)
        Shallow copy operation on arbitrary Python objects.
        See the module's __doc__ string for more info.
    deepcopy(x, memo=None, _nil=[])
        Deep copy operation on arbitrary Python objects.
        See the module's __doc__ string for more info.
DATA
    __all__ = ['Error', 'copy', 'deepcopy']
FILE
    d:\anaconda3\lib\copy.py
'''
```

### 文档

`文档是有关模块信息的自然来源`

例如，你可能想知道range的参数是什么？

在这种情况下，与其在Python图书或标准Python文档中查找对range的描述，不如直接检查这个函数。

```java
print(range.__doc__)#结果为：
'''
range(stop) -> range object
range(start, stop[, step]) -> range object
Return an object that produces a sequence of integers from start (inclusive)
to stop (exclusive) by step.  range(i, j) produces i, i+1, i+2, ..., j-1.
start defaults to 0, and stop is omitted!  range(4) produces 0, 1, 2, 3.
These are exactly the valid indices for a list of 4 elements.
When step is given, it specifies the increment (or decrement).
'''
```

“**Python库参考手册**”（https://docs.python.org/library）

### 使用源代码

要学习Python，阅读源代码是除动手编写代码外的最佳方式。

假设你要阅读标准模块copy的代码，可以在什么地方找到呢？

```java
print(copy.__file__)#结果为：D:\Anaconda3\lib\copy.py
```

你可在代码编辑器（如IDLE）中打开文件copy.py，并开始研究其工作原理。

## 标准库：一些深受欢迎的模块

### sys

模块sys让你能够访问与Python解释器紧密相关的变量和函数。

函数/变量
描述

argv
命令行参数，包括脚本名

exit([arg])
退出当前程序，可通过可选参数指定返回值或错误消息

modules
一个字典，将模块名映射到加载的模块

path
一个列表，包含要在其中查找模块的目录的名称

platform
一个平台标识符，如sunos5或win32

stdin
标准输入流——一个类似于文件的对象

stdout
标准输出流——一个类似于文件的对象

stderr
标准错误流——一个类似于文件的对象

**反转并打印命令行参数**

创建了一个sys.argv的副本，也可修改sys.argv。

```java
import sys
args = sys.argv[1:]
args.reverse()
print(' '.join(args))#结果为：C:\Users\yanyu\AppData\Roaming\jupyter\runtime\kernel-17c0e23a-ea6e-40f9-98dc-68588128f0cc.json -f
print(' '.join(reversed(sys.argv[1:])))#结果为：C:\Users\yanyu\AppData\Roaming\jupyter\runtime\kernel-17c0e23a-ea6e-40f9-98dc-68588128f0cc.json -f
```

### os

模块os让你能够访问多个操作系统服务。

os及其子模块os.path还包含多个查看、创建和删除目录及文件的函数，以及一些操作路径的函数（例如，os.path.split和os.path.join让你在大多数情况下都可忽略os.pathsep）。

函数/变量
描述

environ
包含环境变量的映射

system(command)
在子shell中执行操作系统命令

sep
路径中使用的分隔符

pathsep
分隔不同路径的分隔符

linesep
行分隔符（’\n’、’\r’或’\r\n’）

urandom(n)
返回n个字节的强加密随机数据

要访问环境变量PYTHONPATH，可使用表达式`os.environ['PYTHONPATH']`。

变量os.sep是用于路径名中的分隔符。

在Windows中，标准分隔符为`\\`（这种Python语法表示单个反斜杠）

在UNIX（以及macOS的命令行Python版本）中，标准分隔符为`/`。

变量os.linesep是用于文本文件中的行分隔符：

在UNIX/OS X中为单个换行符（`\n`）

在Windows中为回车和换行符（`\r\n`）

**启动图形用户界面程序，如Web浏览器**

在UNIX中:假设目录为/usr/bin/firefox

```java
import os
os.system('/usr/bin/firefox')
```

在Windows中:假设目录为C:\Program Files\Mozilla Firefox

这里用引号将Program Files和Mozilla Firefox括起来了。

如果不这样做，底层shell将受阻于空白处（对于PYTHONPATH中的路径，也必须这样做）。

另外，这里必须使用反斜杆，因为 Windows shell 无法识别斜杠。

```java
import os
os.system(r'C:\"Program Files"\"Mozilla Firefox"\firefox.exe')
```

Windows特有的函数os.startfile，也可以完成该操作

```java
import os
os.startfile(r'C:\Program Files\Mozilla Firefox\firefox.exe')
```

就启动Web浏览器这项任务而言，使用模块webbrowser，这个模块包含一个名为open的函数，让你能够启动默认Web浏览器并打开指定的URL。

```java
import webbrowser
webbrowser.open('https://beyondyanyu.blog.csdn.net/')
```

### fileinput

模块fileinput让你能够轻松地迭代一系列文本文件中的所有行。

函数
描述

input([files[, inplace[, backup]]])
帮助迭代多个输入流中的行

filename()
返回当前文件的名称

lineno()
返回（累计的）当前行号

filelineno()
返回在当前文件中的行号

isfirstline()
检查当前行是否是文件中的第一行

isstdin()
检查最后一行是否来自sys.stdin

nextfile()
关闭当前文件并移到下一个文件

close()
关闭序列

`fileinput.input`是其中最重要的函数，它返回一个可在for循环中进行迭代的对象。

**在Python脚本中添加行号**

`rstrip`是一个字符串方法，它将删除指定字符串两端的空白，并返回结果

```java
import fileinput
for line in fileinput.input(inplace=True):
    line = line.rstrip()
    num = fileinput.lineno()
    print('{:<50} {:2d}'.format(line,num))
```

### 集合、堆和双端队列

**1，集合**

集合是由内置类set实现的，这意味着你可直接创建集合，而无需导入模块sets。

```java
set(range(1,30,2))#结果为：{1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27, 29}
```

**仅使用花括号这将创建一个空字典**

```java
type({
     })#结果为：dict
```

集合主要用于`成员资格检查`，因此将`忽略重复的元素`

```java
{
     0, 1, 2, 3, 0, 1, 2, 3, 4, 5}#结果为：{0, 1, 2, 3, 4, 5}
```

集合中元素的排列顺序是`不确定的`

```java
{
     'hjj', 'sq', 'hjq', 'hjj', 'hjq'}#结果为：{'hjj', 'hjq', 'sq'}
```

**计算两个集合的并集，可对其中一个集合调用方法union也可使用按位或运算符|**

```java
a = {
     1,2,3}
b = {
     2,3,4}
a.union(b)#结果为：{1, 2, 3, 4}
a | b#结果为：{1, 2, 3, 4}
```

还有其他一些方法和对应的运算符

```java
a = {
     1,2,3}
b = {
     2,3,4}
c = a & b
c.issubset(a)#结果为：True
c <= a#结果为：True
c.issuperset(a)#结果为：False
c >= a#结果为：False
a.intersection(b)#结果为：{2, 3}
a & b#结果为：{2, 3}
a.difference(b)#结果为：{1}
a - b#结果为：{1}
a.symmetric_difference(b)#结果为：{1, 4}
a ^ b#结果为：{1, 4}
a.copy()#结果为：{1, 2, 3}
a.copy() is a#结果为：False
```

**集合是可变的，因此不能用作字典中的键。**

**集合只能包含不可变（可散列）的值，因此不能包含其他集合。**

**frozenset类型，它表示不可变（可散列）的集合。**

构造函数frozenset创建给定集合的副本。

在需要将集合作为另一个集合的成员或字典中的键时，frozenset很有用。

```java
a = set()
b = set()
a.add(b)#报错！！！
'''
TypeError  Traceback (most recent call last)
<ipython-input-48-07ed0deb5758> in <module>()
      1 a = set()
      2 b = set()
----> 3 a.add(b)
TypeError: unhashable type: 'set'
'''
a.add(frozenset(b))
print(a.add(frozenset(b)))#结果为：None
print(a)#结果为：{frozenset()}
print(b)#结果为：set()
```

**2，堆**

堆（heap），它是一种优先队列。

优先队列让能够以任意顺序添加对象，并随时（可能是在两次添加对象之间）找出（并删除）最小的元素。

Python没有独立的堆类型，而只有一个包含一些堆操作函数的模块。这个模块名为`heapq`（其中的q表示队列），它包含6个函数。

函数
描述

heappush(heap, x)
将x压入堆中

heappop(heap)
从堆中弹出最小的元素

heapify(heap)
让列表具备堆特征

heapreplace(heap, x)
弹出最小的元素，并将x压入堆中

nlargest(n, iter)
返回iter中n个最大的元素

nsmallest(n, iter)
返回iter中n个最小的元素

函数heappush用于在`堆`中添加一个元素。

```java
from heapq import *
from random import shuffle
data = list(range(10))
shuffle(data)
heap = []
for n in data:
    heappush(heap,n)
heap#结果为：[0, 1, 5, 2, 4, 7, 9, 8, 3, 6]
#位置i处的元素总是大于位置i // 2处的元素（反过来说就是小于位置2 * i和2 * i + 1处的元素）。这是底层堆算法的基础，称为堆特征（heap property）。
heappush(heap,0.5)
heap#结果为：[0, 0.5, 5, 2, 1, 7, 9, 8, 3, 6, 4]
heappop(heap)#结果为：0
heappop(heap)#结果为：0.5
heappop(heap)#结果为：1
heap#结果为：[2, 3, 5, 6, 4, 7, 9, 8]
#函数heapify通过执行尽可能少的移位操作将列表变成合法的堆（即具备堆特征）。
heap = [5,8,0,3,6,7,9,1,4,2]
heapify(heap)
heap#结果为：[0, 1, 5, 3, 2, 7, 9, 8, 4, 6]
#函数heapreplace从堆中弹出最小的元素，再压入一个新元素。
heapreplace(heap,0.5)#结果为：0
heap#结果为：[0.5, 1, 5, 3, 2, 7, 9, 8, 4, 6]
heapreplace(heap,10)#结果为：0.5
heap#结果为：[1, 2, 5, 3, 6, 7, 9, 8, 4, 10]
```

**3，双端队列**

在需要`按添加元素的顺序进行删除`时，双端队列很有用。

在模块`collections`中，包含类型deque以及其他几个集合（collection）类型。

```java
from collections import deque
q = deque(range(5))
q.append(5)
q.appendleft(6)
q#结果为：deque([6, 0, 1, 2, 3, 4, 5])
q.pop()#结果为：5
q.popleft()#结果为：6
q.rotate(3)
q#结果为：deque([2, 3, 4, 0, 1])
q.rotate(-1)
q#结果为：deque([3, 4, 0, 1, 2])
```

**双端队列支持在队首（左端）高效地附加和弹出元素，还可高效地旋转元素（将元素向右或向左移，并在到达一端时环绕到另一端）。**

双端队列对象还包含方法**extend**和**extendleft**，其中extend类似于相应的列表方法，而extendleft类似于appendleft。

用于extendleft的可迭代对象中的元素将按相反的顺序出现在双端队列中。

### time

模块time包含用于`获取当前时间、操作时间和日期、从字符串中读取日期、将日期格式化为字符串`的函数。

元组(2008, 1, 21, 12, 2, 56, 0, 21, 0)表示2008年1月21日12时2分56秒。这一天是星期一，2008年的第21天。

索引
字段
值

0
年
如2000、2001等

1
月
范围1~1

2
日
范围1~31

3
时
范围0~23

4
分
范围0~59

5
秒
范围0~61，这考虑到了闰一秒和闰两秒的情况。

6
星期
范围0~6，其中0表示星期一

7
儒略日
范围1~366

8
夏令时
0、1或-1，夏令时数字是一个布尔值（True或False），但如果你使用-1，那么mktime［将时间元组转换为时间戳（从新纪元开始后的秒数）的函数］可能得到正确的值。

函数
描述

asctime([tuple])
将时间元组转换为字符串

localtime([secs])
将秒数转换为表示当地时间的日期元组

mktime(tuple)
将时间元组转换为当地时间

sleep(secs)
休眠（什么都不做）secs秒

strptime(string[, format])
将字符串转换为时间元组

time()
当前时间（从新纪元开始后的秒数，以UTC为准）

函数time.asctime将当前时间转换为字符串

```java
import time
time.asctime()#结果为：'Sun Jan 16 10:41:41 2022'
```

两个较新的与时间相关的模块：datetime和timeit。

前者提供了日期和时间算术支持，而后者可帮助你计算代码段的执行时间。

### random

**模块random包含生成伪随机数的函数，有助于编写模拟程序或生成随机输出的程序。**

虽然这些函数生成的数字好像是完全随机的，但它们背后的系统是可预测的。

真正的随机（如用于加密或实现与安全相关的功能），应考虑使用`模块os中的函数urandom`。

函数
描述

random()
返回一个0~1（含）的随机实数

getrandbits(n)
以长整数方式返回n个随机的二进制位

uniform(a, b)
返回一个a~b（含）的随机实数

randrange([start], stop, [step])
从range(start, stop, step)中随机地选择一个数

choice(seq)
从序列seq中随机地选择一个元素

shuffle(seq[, random])
就地打乱序列seq

sample(seq, n)
从序列seq中随机地选择n个值不同的元素

函数random.random是最基本的随机函数之一，它返回一个0~1（含）的伪随机数。

首先，获取表示时间段（1998年）上限和下限的实数。为此，可使用时间元组来表示日期（将星期、儒略日和夏令时都设置为1，让Python去计算它们的正确值），并对这些元组调用mktime

接下来，以均匀的方式生成一个位于该范围内（不包括上限）的随机数

然后，将这个数转换为易于理解的日期。

```java
from random import *
from time import *
date1 = (1998,12,2,0,0,0,-1,-1,-1)
time1 = mktime(date1)
date2 = (1999,7,5,0,0,0,-1,-1,-1)
time2 = mktime(date2)
random_time = uniform(time1, time2)
print(asctime(localtime(random_time)))#结果为：Fri Feb  5 20:55:09 1999
```

询问用户要掷多少个骰子、每个骰子有多少面。掷骰子的机制是使用randrange和for循环实现。

```java
from random import randrange
num = int(input('How many dice?'))
sides = int(input('How many sides per die?'))
sum = 0
for i in range(num):
    sum += randrange(sides) + 1
print("The result is",sum)#结果为：
'''
How many dice?3
How many sides per die?6
The result is 17
'''
```

### shelve和json

**1，一个潜在的陷阱**

```java
import shelve
s = shelve.open('database.dat')
s['x'] = ['a','b','c']
s['x'].append('d')
s['x']#结果为：['a', 'b', 'c']
```

**‘d’消失了**

列表[‘a’, ‘b’, ‘c’]被存储到s的’x’键下。

获取存储的表示，并使用它创建一个新列表，再将’d’附加到这个新列表末尾，但这个修改后的版本未被存储！

最后，再次获取原来的版本——其中没有’d’。

**解决方法：**

```java
import shelve
s = shelve.open('database.dat')
temp = s['x']
temp.append('d')
s['x'] = temp
s['x']
```

**2，一个简单的数据库示例**

```java
import sys,shelve
def store_person(db):
    pid  = input("Enter unique ID number:")
    person = {
     }
    person['name'] = input("Enter name:")
    person['age'] = input("Enter age:")
    person['phone'] = input('Enter phone number:')
    db[pid] = person
def lookup_person(db):
    pid = input("Enter ID number:")
    fileld = input("What would you like to know?(name,age,phone)")
    fileld = field.strip.lower()
    print(fileld.capitablize() + ':', db[pid][field])
def print_help():
    print("The available commands are:")
    print("store: Stores information about a person")
    print("lookup: Looks up a person from ID number")
    print("quit: Save changes and exit")
    print("?: Prints this message")
def enter_command():
    cmd = input("Enter command(? for help):")
    cmd = cmd.strip().lower()
def main():
    database = shelve.open("E:\\Jupyter_workspace\\study\\python\\book\\database.dat")
    try:
        while True:
            cmd = enter_command()
            if cmd == 'store':
                store_person(database)
            elif cmd == 'lookup':
                lookup_person(database)
            elif cmd == '?':
                print_help()
            elif cmd == 'quit':
                return
    finally:
        database.close()
if name == '__main__':main()
```

### re

模块re提供了对`正则表达式`的支持。

**1，正则表达式是什么？**

正则表达式是可`匹配文本片段`的模式。

> 通配符

`句点`与除换行符外的任何字符都匹配，被称为通配符（wildcard）。

正则表达式’`.ython`‘与字符串’**python**’和’**jython**’都匹配，但不与’**cpython**’、'**ython**’等字符串匹配，**因为句点只与一个字符匹配，而不与零或两个字符匹配**。

> 对特殊字符进行转义

普通字符只与自己匹配，但特殊字符的情况完全不同。

要让特殊字符的行为与普通字符一样，可对其进行转义。

使用模式’`python\\.org`’，它只与’`python.org`'匹配。

为表示模块re要求的单个反斜杠，需要在字符串中书写两个反斜杠，让解释器对其进行转义。

这里包含两层转义：解释器执行的转义和模块re执行的转义。

也可使用原始字符串，如`r'python\.org'`。

> 字符集

用方括号将一个子串括起，创建一个所谓的字符集。**字符集只能匹配一个字符。**

'`[pj]ython`‘与’`python`‘和’`jython`'都匹配，但不与其他字符串匹配。

'`[a-z]`'与`a~z`的任何字母都匹配。

'`[a-zA-Z0-9]`'与`大写字母、小写字母和数字`都匹配。

'`[^abc]`'与`除`a、b和c外的其他任何字符都匹配。

> 二选一和子模式

‘`python|perl`’，只匹配字符串’`python`‘和’`perl`’，也可重写为’`p(ython|erl)`’。

单个字符也可称为**子模式**。

> 可选模式和重复模式

通过在子模式后面加上`问号`，可将其指定为可选的，即可包含可不包含。

`r'(http://)?(www\.)?python\.org`

只与下面这些字符串匹配：

‘**http://www.python.org**’

‘**http://python.org**’

‘**www.python.org**’

‘**python.org**’

问号表示可选的子模式可出现一次，也可不出现。

**(pattern)*：pattern可重复0、1或多次。

(pattern)+：pattern可重复1或多次。

(pattern){m,n}：模式可从父m~n次。**

`r'w*\.python\.org'`与’`www.python.org`‘匹配，也与’`.python.org`’、’`ww.python.org`‘和’`wwwwwww.python.org`‘匹配。同样，`r'w+\.python\.org'`与’`w.python.org`‘匹配，但与’`.python. org`‘不匹配，而`r'w{3,4}\.python\.org'`只与’`www.python.org`‘和’`wwww.python.org`'匹配。

字符串的开头和末尾

**查找与模式匹配的子串**

字符串’`www.python.org`‘中的子串’`www`‘与模式’`w+`‘匹配

确定字符串的开头是否与模式’ht+p’匹配，为此可使用脱字符（’`^`’）来指出这一点。

'`^ht+p`‘与’`http://python.org`‘和’`htttttp://python.org`‘匹配，但与’`www.http.org`'不匹配。

同样，要指定字符串末尾，可使用美元符号（`$`）。

**2，模块re的内容**

模块re包含多个使用正则表达式的函数

函数
描述

compile(pattern[, flags])
根据包含正则表达式的字符串创建模式对象

search(pattern, string[, flags])
在字符串中查找模式

match(pattern, string[, flags])
在字符串开头匹配模式

split(pattern, string[, maxsplit=0])
根据模式来分割字符串

findall(pattern, string)
返回一个列表，其中包含字符串中所有与模式匹配的子串

sub(pat, repl, string[, count=0])
将字符串中与模式pat匹配的子串都替换为repl

escape(string)
对字符串中所有的正则表达式特殊字符都进行转义

函数**re.compile**将用字符串表示的正则表达式转换为模式对象，以提高匹配效率。

函数re.search在给定字符串中查找第一个与指定正则表达式匹配的子串。如果找到这样的子串，将返回MatchObject（结果为真），否则返回None（结果为假）。鉴于返回值的这种特征，可在条件语句中使用这个函数

```java
import re
pat = "beyond"
string = "I like the beyond band"
if re.search(pat, string):
    print('Found it!')
#结果为：Found it!
```

函数re.split根据与模式匹配的子串来分割字符串。

使用re.split时，可以空格和逗号为分隔符来分割字符串。

```java
import re
some_text = 'alpha, beta,,,,gamma delta'
re.split('[, ]+', some_text)#结果为：['alpha', 'beta', 'gamma', 'delta']
#如果模式包含圆括号，将在分割得到的子串之间插入括号中的内容。
re.split('o(o)','foobar')#结果为：['f', 'o', 'bar']
#参数maxsplit指定最多分割多少次。
re.split('[, ]+', some_text, maxsplit=2)#结果为：['alpha', 'beta', 'gamma delta']
re.split('[, ]+', some_text, maxsplit=1)#结果为：['alpha', 'beta,,,,gamma delta']
#函数re.findall返回一个列表，其中包含所有与给定模式匹配的子串。
#要找出字符串包含的所有单词
pat = '[a-zA-Z]+'
text = '"Hm... Err -- are you sure?" he said, sounding insecure.'
re.findall(pat, text)#结果为：['Hm', 'Err', 'are', 'you', 'sure', 'he', 'said', 'sounding', 'insecure']
#查找所有的标点符号
pat = r'[.?\-",]+'
re.findall(pat, text)#结果为：['"', '...', '--', '?"', ',', '.']
#函数re.sub从左往右将与模式匹配的子串替换为指定内容。
pat = '{name}'
text = 'Dear {name}...'
re.sub(pat, 'Mr. Gumby', text)#结果为：'Dear Mr. Gumby...'
#re.escape是一个工具函数
re.escape('www.python.org')#结果为：'www\\.python\\.org'
re.escape('But where is the ambiguity?')#结果为：'But\\ where\\ is\\ the\\ ambiguity\\?'
```

**3，匹配对象和编组**

在模块re中，查找与模式匹配的子串的函数都在找到时返回MatchObject对象。

这种对象包含与模式匹配的子串的信息，还包含模式的哪部分与子串的哪部分匹配的信息。这些子串部分称为**编组（group）** 。

编组就是放在圆括号内的子模式，它们是根据左边的括号数编号的，其中编组0指的是整个模式。

**’There (was a (wee) (cooper)) who (lived in Fyfe)’

包含如下编组：

0There was a wee cooper who lived in Fyfe

1was a wee cooper

2wee

3cooper

4lived in Fyfe**

**r’www.(.+).com$’

编组0包含整个字符串，而编组1包含’www.‘和’.com’之间的内容。**

方法
描述

group([group1, …])
获取与给定子模式（编组）匹配的子串

start([group])
返回与给定编组匹配的子串的起始位置

end([group])
返回与给定编组匹配的子串的终止位置（与切片一样，不包含终止位置）

span([group])
返回与给定编组匹配的子串的起始和终止位置

方法group返回与模式中给定编组匹配的子串。如果没有指定编组号，则默认为0。

如果只指定了一个编组号（或使用默认值0），将只返回一个字符串；否则返回一个元组，其中包含与给定编组匹配的子串。

方法start返回与给定编组（默认为0，即整个模式）匹配的子串的起始索引。

方法end类似于start，但返回终止索引加1

方法span返回一个元组，其中包含与给定编组（默认为0，即整个模式）匹配的子串的起始索引和终止索引。

```java
import re
m = re.match(r'www\.(.*)\..{3}', 'www.beyondyanyu.net')
m.group(1)#结果为：4
m.end(1)#结果为：15
m.span(1)#结果为：(4,15)
```

**4，替换中的组号和函数**

将’*something*‘替换为’``something``’

```java
import re
#首先开始创建模板：
emphasis_pattern = r'\*([^\*]+)\*'
'''
上下这两条正则表达式等价，很显然下面的加有注解很人性化。
'''
emphasis_pattern = re.compile(r'''
\*     起始突出标志---一个星号
(      与要突出的内容匹配的编组的起始位置
[^\*]+ 与除星号外的其他字符都匹配
)      编组到此结束
\*     结束突出标志
''',re.VERBOSE)
re.sub(emphasis_pattern, r'<em>\1</em>', 'Hello, *world*!')#结果为：'Hello, <em>world</em>!'
```

重复运算符默认是**贪婪**的，这意味着它们将匹配尽可能多的内容。

```java
import re
emphasis_pattern = r'\*(.+)\*'
re.sub(emphasis_pattern, r'<em>\1</em>', '*This* is *it*!')#结果为：'<em>This* is *it</em>!'
```

这个模式匹配了从第一个星号到最后一个星号的全部内容，其中包含另外两个星号！这就是贪婪的意思：能匹配多少就匹配多少。

在后面加上`问号`来将其指定为**非贪婪**

```java
import re
emphasis_pattern = r'\*\*(.+?)\*\*'
re.sub(emphasis_pattern, r'<em>\1</em>', '**This** is **it**!')#结果为：'<em>This</em> is <em>it</em>!'
```

**5，其他有趣的标准模块**

模块名称
描述

argparse
在UNIX中，运行命令行程序时常常需要指定各种选项（开关），Python解释器就是这样的典范。这些选项都包含在sys.argv中，但要正确地处理它们绝非容易。模块argparse使得提供功能齐备的命令行界面易如反掌。

cmd
这个模块让你能够编写类似于Python交互式解释器的命令行解释器。你可定义命令，让用户能够在提示符下执行它们。或许可使用这个模块为你编写的程序提供用户界面？

csv
CSV指的是逗号分隔的值（comma-seperated values），很多应用程序（如很多电子表格程序和数据库程序）都使用这种简单格式来存储表格数据。这种格式主要用于在不同的程序之间交换数据。模块csv让你能够轻松地读写CSV文件，它还以非常透明的方式处理CSV格式的一些棘手部分。

datetime
如果模块time不能满足你的时间跟踪需求，模块datetime很可能能够满足。datetime支持特殊的日期和时间对象，并让你能够以各种方式创建和合并这些对象。相比于模块time，模块datetime的接口在很多方面都更加直观。

difflib
这个库让你能够确定两个序列的相似程度，还让你能够从很多序列中找出与指定序列最为相似的序列。例如，可使用difflib来创建简单的搜索程序。

enum
枚举类型是一种只有少数几个可能取值的类型。很多语言都内置了这样的类型，如果你在使用Python时需要这样的类型，模块enum可提供极大的帮助。

functools
这个模块提供的功能是，让你能够在调用函数时只提供部分参数（部分求值，partial evaluation），以后再填充其他的参数。在Python 3.0中，这个模块包含filter和reduce。

hashlib
使用这个模块可计算字符串的小型“签名”（数）。计算两个不同字符串的签名时，几乎可以肯定得到的两个签名是不同的。你可使用它来计算大型文本文件的签名，这个模块在加密和安全领域有很多用途。

itertools
包含大量用于创建和合并迭代器（或其他可迭代对象）的工具，其中包括可以串接可迭代对象、创建返回无限连续整数的迭代器（类似于range，但没有上限）、反复遍历可迭代对象以及具有其他作用的函数。

logging
使用print语句来确定程序中发生的情况很有用。要避免跟踪时出现大量调试输出，可将这些信息写入日志文件中。这个模块提供了一系列标准工具，可用于管理一个或多个中央日志，它还支持多种优先级不同的日志消息。

statistics
计算一组数的平均值并不那么难，但是要正确地获得中位数，以确定总体标准偏差和样本标准偏差之间的差别，即便对于偶数个元素来说，也需要费点心思。在这种情况下，不要手工计算，而应使用模块statistics！

timeit
模块timeit（和配套的命令行脚本）是一个测量代码段执行时间的工具。这个模块暗藏玄机，度量性能时你可能应该使用它而不是模块time。

profile
模块profile（和配套模块pstats）可用于对代码段的效率进行更全面的分析。

trace
模块trace可帮助你进行覆盖率分析（即代码的哪些部分执行了，哪些部分没有执行），这在编写测试代码时很有用。

## 小结

概念
解释

模块
模块基本上是一个子程序，主要作用是定义函数、类和变量等。模块包含测试代码时，应将这些代码放在一条检查name == 'main’的if语句中。如果模块位于环境变量PYTHONPATH包含的目录中，就可直接导入它；要导入存储在文件foo.py中的模块，可使用语句import foo。

包
包不过是包含其他模块的模块。包是使用包含文件__init__.py的目录实现的。

探索模块
在交互式解释器中导入模块后，就可以众多不同的方式对其进行探索，其中包括使用dir、查看变量__all__以及使用函数help。文档和源代码也是获取信息和洞见的极佳来源。

标准库
Python自带多个模块，统称为标准库。

标准库名称
介绍

sys
这个模块让你能够访问多个与Python解释器关系紧密的变量和函数。

os
这个模块让你能够访问多个与操作系统关系紧密的变量和函数。

fileinput
这个模块让你能够轻松地迭代多个文件或流的内容行。

sets、heapq和deque
这三个模块提供了三种很有用的数据结构。内置类型set也实现了集合。

time
这个模块让你能够获取当前时间、操作时间和日期以及设置它们的格式。

random
这个模块包含用于生成随机数，从序列中随机地选择元素，以及打乱列表中元素的函数。

shelve
这个模块用于创建永久性映射，其内容存储在使用给定文件名的数据库中。

re
支持正则表达式的模块。

### 本章节介绍的新函数

函数
描述

dir(obj)
返回一个按字母顺序排列的属性名列表

help([obj])
提供交互式帮助或有关特定对象的帮助信息

imp.reload(module)
返回已导入的模块的重载版本
