# 11、Python 教程 - 文件
- 来源：https://ddkk.com/zhuanlan/other/python/6/11.html
- 分类：Python 基础入门
- 分组：教程目录
## 打开文件

当前目录中有一个名为**beyond.txt**的文本文件，打开该文件

调用open时，原本可以不指定模式，因为其默认值就是’`r`’。

```java
import io
f = open('beyond.txt')
```

**文件模式**

值
描述

‘r’
读取模式（默认值）

‘w’
写入模式

‘x’
独占写入模式

‘a’
附加模式

‘b’
二进制模式（与其他模式结合使用）

‘t’
文本模式（默认值，与其他模式结合使用）

‘+’
读写模式（与其他模式结合使用）

## 文件的基本方法

### 读取和写入

在当前路径下创建一个**beyond.txt**文本文件，在该文本文件中写入内容，并读取出来。

```java
import io
f = open('beyond.txt','w')
f.write("I like beyond band")#结果为：18
f.write("I like wsq")#结果为：10
f.close()
```

运行结果如下：

```java
import io
f = open('beyond.txt','r')
f.read(4)#结果为：'I li'
f.read()#结果为：'ke beyond bandI like wsq'
```

首先，指定了要读取多少（4）个字符。接下来，读取了文件中余下的全部内容（不指定要读取多少个字符）。

### 使用管道重定向输出

在bash等shell中，可依次输入多个命令，并使用管道将它们链接起来

**$cat beyond.txt | python somescript.py | sort**

catbeyond.txt：将文件beyond.txt的内容写入到标准输出（sys.stdout）。

python somescript.py：执行Python脚本somescript。这个脚本从其标准输入中读取，并将结果写入到标准输出。

sort：读取标准输入（sys.stdin）中的所有文本，将各行按字母顺序排序，并将结果写入到标准输出。

somescript.py从其sys.stdin中读取数据（这些数据是beyond.txt写入的），并将结果写入到其sys.stdout（sort将从这里获取数据）。

**计算sys.stdin中包含多少个单词的简单脚本**

somescript.py代码如下：

```java
# somescript.py
import sys
text = sys.stdin.read()
words = text.split()
wordcount = len(words)
print('Wordcount:',wordcount)
```

beyond.txt内容如下：

```java
Yellow Skies, I can see the Yellow Skies.
See you again, I see you again
In my dreams, in my dreams, in my dreams, in my dreams.
Morning light, I remember morning light.
Outside my doors, I ll see you no more.
In my dreams, in my dreams, in my dreams, in my dreams
Forever, Forever Ill be forever holding you.
Forever, Forever Ill be forever holding you.
Responsible, Responsible, Responsible, Responsible.
So black and white,
Its become so black and white.
```

`cat beyond.txt | python somescript.py`

**随机存取**

所有的文件都可以当成流来进行处理，可以在文件中进行移动，这称为随机存取。

可使用文件对象的两个方法：seek 和 tell。

方法`seek(offset[, whence])`将当前位置（执行读取或写入的位置）移到 offset 和whence 指定的地方。

参数offset 指定了字节（字符）数

参数whence 默认为 io.SEEK_SET（0），这意味着偏移量是相对于文件开头的（偏移量不能为负数）。

```java
import io
f = open(r'E:\Jupyter_workspace\study\python\book\beyond.txt','w')
f.write('beyondhelloword')#结果为：15
f.seek(5)#结果为：5
f.write('hello beyond')#结果为：12
f.read()#结果为：'beyonhello beyond'
#seek(5)此时的指向了d，再次进行write操作，则会覆盖之后的所有
```

```java
import io
f = open(r'E:\Jupyter_workspace\study\python\book\beyond.txt')
f.read(3)#结果为：'bey'
f.read(2)#结果为：'on'
f.tell()#结果为：5
#这里的tell方法返回的是此时指向的位置
```

### 读取和写入行

读取一行（从当前位置到下一个分行符的文本），可使用方法**readline**。

可不提供任何参数（在这种情况下，将读取一行并返回它）

也可提供一个非负整数，指定readline最多可读取多少个字符。

方法**writelines**：接受一个字符串列表（实际上，可以是任何序列或可迭代对象），并将这些字符串都写入到文件（或流）中。

写入时`不会添加换行符`，因此你必须自行添加。另外，`没有方法writeline`，因为可以使用write。

## 关闭文件

方法**close**将文件关闭

在python中运行的而结果会存入到缓冲区中，有可能没有将结果给你进行立即返回，通常程序退出时将自动关闭文件对象，并将缓冲器的内容给返回。当然如果不想关闭文件，又想将缓冲器的内容及时得到，可以使用**flush**方法。

当然也可以使用try/finally语句，并在finally子句中调用close。

```java
import io
f = open(r'E:\Jupyter_workspace\study\python\book\beyond.txt','w')
try:
    f.write('like wsq')
finally:
    f.close()
```

**有一条专门为此设计的语句，那就是with语句，这样是用的最多的方法**

```java
import io
with open(r'E:\Jupyter_workspace\study\python\book\beyond.txt','w') as f:
    f.write('like qibao')   
```

**上下文管理器**

with语句实际上是一个非常通用的结构，允许你使用所谓的**上下文管理器**。

上下文管理器是支持两个方法的对象：`__enter__`和`__exit__`。

方法__enter__不接受任何参数，在进入with语句时被调用，其返回值被赋给关键字as后面的变量。

方法__exit__接受三个参数：异常类型、异常对象和异常跟踪。它在离开方法时被调用（通过前述参数将引发的异常提供给它）。如果__exit__返回False，将抑制所有的异常.

### 使用文件的基本方法

beyond.txt内容如下：

```java
Yellow Skies, I can see the Yellow Skies.
See you again, I see you again
In my dreams, in my dreams, in my dreams, in my dreams.
Morning light, I remember morning light.
Outside my doors, I ll see you no more.
In my dreams, in my dreams, in my dreams, in my dreams
Forever, Forever Ill be forever holding you.
Forever, Forever Ill be forever holding you.
Responsible, Responsible, Responsible, Responsible.
So black and white,
Its become so black and white.
```

`read(n)`

```java
import io
f = open(r'E:\Jupyter_workspace\study\python\book\beyond.txt')
f.read(7)#结果为：'Yellow '
f.read(4)#结果为：'Skie'
f.close()
```

`read()`

```java
import io
f = open(r'E:\Jupyter_workspace\study\python\book\beyond.txt')
print(f.read())#结果为：
'''
Yellow Skies, I can see the Yellow Skies.
See you again, I see you again
In my dreams, in my dreams, in my dreams, in my dreams.
Morning light, I remember morning light.
Outside my doors, I ll see you no more.
In my dreams, in my dreams, in my dreams, in my dreams
Forever, Forever Ill be forever holding you.
Forever, Forever Ill be forever holding you.
Responsible, Responsible, Responsible, Responsible.
So black and white,
Its become so black and white.
'''
f.close()
```

`readline()`

```java
import io
f = open(r'E:\Jupyter_workspace\study\python\book\beyond.txt')
for i in range(3):
    print(str(i)+':'+f.readline(),end='')#结果为：
'''
0:Yellow Skies, I can see the Yellow Skies.
1:See you again, I see you again
2:In my dreams, in my dreams, in my dreams, in my dreams.
'''
f.close()
```

`readlines()`

```java
import io
import pprint
pprint.pprint(open(r'E:\Jupyter_workspace\study\python\book\beyond.txt').readlines())#结果为：
'''
['Yellow Skies, I can see the Yellow Skies.\n',
 'See you again, I see you again\n',
 'In my dreams, in my dreams, in my dreams, in my dreams.\n',
 'Morning light, I remember morning light.\n',
 'Outside my doors, I ll see you no more.\n',
 'In my dreams, in my dreams, in my dreams, in my dreams\n',
 'Forever, Forever Ill be forever holding you.\n',
 'Forever, Forever Ill be forever holding you.\n',
 'Responsible, Responsible, Responsible, Responsible.\n',
 'So black and white,\n',
 'Its become so black and white.']
'''
#这里利用了文件对象将被自动关闭这一事实。
```

`write(string)`

```java
import io
f = open(r'E:\Jupyter_workspace\study\python\book\beyond.txt','w')
f.write('I\nlike\nwsq\n')#结果为：11
f.close()
```

`writelines(list)`

```java
import io
f = open(r'E:\Jupyter_workspace\study\python\book\beyond.txt')
lines = f.readlines()
f.close()
lines[1] = "am\n"
f = open(r'E:\Jupyter_workspace\study\python\book\beyond.txt', 'w')
f.writelines(lines)
f.close()
```

## 迭代文件内容

**使用read遍历字符**

```java
import io
def beyond(string):
    print("words is:",string)
with open(r'E:\Jupyter_workspace\study\python\book\beyond.txt') as f:
    char = f.read(1)
    while char:
        beyond(char)
        char = f.read(1)
'''
words is: I
words is: 
words is: a
words is: m
words is: 
words is: w
words is: s
words is: q
words is: 
'''
'''
这个程序之所以可行，是因为到达文件末尾时，方法read将返回一个空字符串，
但在此之前，返回的字符串都只包含一个字符（对应于布尔值True）。
只要char为True，你就知道还没结束。
'''
```

**以不同的方式编写循环**

```java
import io
def beyond(string):
    print("words is:",string)
with open(r'E:\Jupyter_workspace\study\python\book\beyond.txt') as f:
    while True:
        char = f.read(1)
        if not char:
            break
        beyond(char)
'''
words is: I
words is: 
words is: a
words is: m
words is: 
words is: w
words is: s
words is: q
words is: 
'''
```

**每次一行**

处理文本文件时，通常想做的是迭代其中的**行**，而不是每个字符。

方法`readline`，可像迭代字符一样轻松地迭代行。

**在while循环中使用readline**

```java
import io
def beyond(string):
    print("words is:",string)
with open(r'E:\Jupyter_workspace\study\python\book\beyond.txt') as f:
    while True:
        line = f.readline()
        if not line:
            break
        beyond(line)
'''
words is: I
words is: am
words is: wsq
'''
```

### 读取所有内容

**使用read迭代字符**

```java
import io
def beyond(string):
    print("words is:",string)
with open(r'E:\Jupyter_workspace\study\python\book\beyond.txt') as f:
    for char in f.read():
        beyond(char)
'''
words is: I
words is: 
words is: a
words is: m
words is: 
words is: w
words is: s
words is: q
words is: 
'''
```

**使用readlines迭代行**

```java
import io
def beyond(string):
    print("words is:",string)
with open(r'E:\Jupyter_workspace\study\python\book\beyond.txt') as f:
    for line in f.readlines():
        beyond(line)
'''
words is: I
words is: am
words is: wsq
'''
```

### 使用fileinput实现延迟行迭代

有时候需要迭代大型文件中的行，此时使用readlines将占用太多内存。

在Python中，在可能的情况下，应首选for循环。

可使用一种名为**延迟行迭代**的方法——说它延迟是因为它只读取实际需要的文本部分。

**使用fileinput迭代行**

```java
import fileinput
import io
def beyond(string):
    print("words is:",string)
for line in fileinput.input(r'E:\Jupyter_workspace\study\python\book\beyond.txt'):
    beyond(line)
'''
words is: I
words is: am
words is: wsq
'''
```

### 文件迭代器

**迭代文件**

```java
import io
def beyond(string):
    print("words is:",string)
with open(r'E:\Jupyter_workspace\study\python\book\beyond.txt') as f:
    for line in f:
        beyond(line)
'''
words is: I
words is: am
words is: wsq
'''
```

**在不将文件对象赋给变量的情况下迭代文件**

```java
import io
def beyond(string):
    print("words is:",string)
for line in open(r'E:\Jupyter_workspace\study\python\book\beyond.txt'):
    beyond(line)
'''
words is: I
words is: am
words is: wsq
'''
```

**与其他文件一样，sys.stdin也是可迭代的**

```java
import sys
import io
def beyond(string):
    print("words is:",string)
for line in sys.stdin:
    beyond(line)
```

**对迭代器做的事情基本上都可对文件做**

```java
f = open(r'E:\Jupyter_workspace\study\python\book\beyond.txt', 'w') 
print('First', 'line', file=f)
print('Second', 'line', file=f)
print('Third', 'and final', 'line', file=f)
f.close()
lines = list(open(r'E:\Jupyter_workspace\study\python\book\beyond.txt'))
lines#结果为：['First line\n', 'Second line\n', 'Third and final line\n']
first, second, third = open(r'E:\Jupyter_workspace\study\python\book\beyond.txt')
first#结果为：'First line\n'
second#结果为：'Second line\n'
third#结果为：'Third and final line\n'
```

**注意：**

1，使用了print来写入文件，这将自动在提供的字符串后面添加换行符。

2，对打开的文件进行序列解包，从而将每行存储到不同的变量中。

3，写入文件后将其关闭，以确保数据得以写入磁盘。

## 小结

概念
描述

类似于文件的对象
类似于文件的对象是支持read和readline（可能还有write和writelines）等方法的对象。

打开和关闭文件
要打开文件，可使用函数open，并向它提供一个文件名。如果要确保即便发生错误时文件也将被关闭，可使用with语句。

模式和文件类型
打开文件时，还可指定模式，如’r’（读取模式）或’w’（写入模式）通过在模式后面加上’b’，可将文件作为二进制文件打开，并关闭Unicode编码和换行符替换。

标准流
三个标准流（模块sys中的stdin、stdout和stderr）都是类似于文件的对象，它们实现了UNIX标准I/O机制（Windows也提供了这种机制）。

读取和写入
要从文件或类似于文件的对象中读取，可使用方法read；要执行写入操作，可使用方法write。

读取和写入行
要从文件中读取行，可使用readline和readlines；要写入行，可使用writelines。

迭代文件内容
迭代文件内容的方法很多，其中最常见的是迭代文本文件中的行，这可通过简单地对文件本身进行迭代来做到。还有其他与较旧Python版本兼容的方法，如使用readlines。

### 本章介绍的新函数

函数
描述

open(name, …)
打开文件并返回一个文件对象
