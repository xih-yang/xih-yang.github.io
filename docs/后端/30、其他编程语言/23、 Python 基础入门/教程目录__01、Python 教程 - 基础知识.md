# 01、Python 教程 - 基础知识
- 来源：https://ddkk.com/zhuanlan/other/python/6/1.html
- 分类：Python 基础入门
- 分组：教程目录
`这篇博文是本人在学习《Python基础教程 （第3版）》的时候所记录下来的关键要点，书中的核心知识点也都在本篇博客中所涉及，需要耐心每天坚持点点滴滴学习进步`

## 数和表达式

### 1，执行整除运算//

**4//3 —>1**，整除的重点在于**向下圆整**，**-10 // 3** 向下圆整得到 **-4**，而不是-3

### 2，求余（求模）运算符%

**x% y** 等价于 **x - ((x // y) * y)**

### 3，乘方（求幂）运算符**

注意：乘方运算符要比求负（单目运算符）的优先级高，**-3 ** 2 等价于 -（3 ** 2）**

### 4，十六进制0x开头，八进制0开头，二进制0b开头

0xAF
010
0b1011010010

175
8
722

### 5，变量variable，表示特定值的名称；使用python变量前必须对其赋值，python变量没有默认值！！！

### 6，python命名只能由字母、数字和下划线组成，且不能以数字开头

### 7，获取用户输入input，input("please input your name:")

```java
x = input("x:")
y = input("y")
print(int(x) * int(y))
```

```java
time = input("please input miin")
if int(time) % 60 == 0:print('hours!')
```

### 8，函数

#### 内置函数pow 等价于 乘方运算符（ ** ）

2 ** 3
pow(2,3)

8
8

#### 计算绝对值abs

将浮点数圆整为与之最接近的整数**round**，若在相邻整数之间一样近的时候，圆整到偶数

abs(-10)
2 // 3
round(2 / 3)

10
0
1.0

## 模块

可将模块视为扩展，通过将其导入可以拓展Python的功能

使用**import**进行导入模块，再以module.function的方式使用模块的函数

```java
import math
math.floor(32.9)##floor向下圆整，结果为32
math.ceil(32.3)##ceil返回大于或等于给定数的最小整数，结果为33
math.ceil(32)##结果为32
```

```java
对于圆整的概念，我是将数从上到下依次递减理解的
 5
 4
 3
 2
     1.9
 1
 0
    -0.4
-1
-2
1.9向下圆整就是，向下走，1.9介于2和1之间，向下走，当然就是1了
同样的道理，-0.4向上圆整就是向上走，-0.4介于0和-1之间，向下走当然就是0了
```

当然也可以直接从库里面调用某个函数

```java
from math import sqrt
sqrt(9)##平方根函数，结果为3.0
```

也可以使用变量来引用函数

```java
from math import sqrt
yanyu = sqrt
yanyu(4)##结果为2.0
```

### 专门处理复数的模块cmath

sqrt只能计算非负数的平方根，若使用其计算负数，则会报错

负数的平方根为虚数，而由实部和虚部组成的数为复数，1j是个虚数，虚数都是以j（或J）结尾。-1的平方根是1j

```java
import cmath
cmath.sqrt(-1)##结果为1j
(1+3j) * (9+4j)##结果为(-3 + 31j)
```

有趣的海龟绘图法

```java
from turtle import *
##最终的效果是绘制一个三角形
forward(100)
left(120)
forward(100)
left(120)
forward(100)
```

## 字符串

注释就不多说了吧， **#** 即可

### 1，转义

python中的单引号和双引号实则都是对字符串的输出

主要区别就在于

```java
let's go to school 
此时就不能再使用单引号了，需要使用双引号
当然也可以\来对单引号进行转移操作，让python明白引号之间的是字符串的一部分，而不是字符串的结束标志
let\'s go to school'结果为：let's go to school
\"hello beyond\"结果为："hello beyond"
```

### 2，拼接字符串

```java
"hello, " + "beyond!" 结果为：hello,beyond
x = "hello,"
y = 'beyond'
x + y结果为：hello,beyond
```

### 3，字符串表示str和repr

```java
"Hello, world!"结果为：'Hello, world!' 
print("Hello, world!")结果为：Hello, world!
"Hello,\nworld!"结果为：'Hello,\nworld!' 
print("Hello,\nworld!") 
"""
结果为：
Hello, 
world!
"""
#使用str能以合理的方式将值转换为用户能够看懂的字符串
#使用repr时，通常会获得值的合法Python表达式表示
print(repr("Hello,\nworld!"))结果为：'Hello,\nworld!' 
print(str("Hello,\nworld!")) 
"""
结果为：
Hello, 
world!
"""
```

### 4，长字符串、原始字符串和字节

#### 1，长字符串

要表示很长的字符串（跨行）时，使用三个单引号或三个双引号来表示

```java
print("""there is a very 
long
word
""")
输出结果：
there is avery
long
word
#常规字符串也可横跨多行。只要在行尾加上反斜杠，反斜杠和换行符将被转义，即被忽略
1+2+3+\
4+5
#结果：15
```

#### 2，原始字符串

原始字符串用前缀**r**表示，即原样输出即使带有转义字符\也没啥卵用

**原始字符串不能以单个反斜杠结尾**

```java
print(r'Let\'s go!')结果为：Let\'s go!
print(r'C:\beyond\zhendeaini\haikuotiankong\xihuanni')结果为：C:\beyond\zhendeaini\haikuotiankong\xihuanni
print(r"This is illegal\")#结果为：编译器会报错，原因为原始字符串不能以单个反斜杠结尾
print(r“This is illegal” '\\')#结果为：This is illegal\
```

#### 3，字节

源代码也将被编码，且默认使用的也是UTF-8编码。

如果你想使用其他编码（例如，如果你使用的文本编辑器使用其他编码来存储源代码），可使用特殊的注释来指定。# -*- coding: encoding name -*-

请将其中的**encoding name**替换为你要使用的编码（大小写都行），如utf-8或latin-1

Python还提供了bytearray，它是bytes的可变版。从某种意义上说，它就像是可修改

的字符串——常规字符串是不能修改的

要替换其中的字符，必须将其指定为0～255的值。要插入字符，必须使用ord获取其序数值（ordinal value）

```java
x = bytearray(b"Hello!")b代表二进制，H为第0位，e为第1位
x[1] = ord(b"u")将u代替e
x输出
结果：bytearray(b'Hullo!')
```

## 本章节介绍的新函数

函 数（方括号内的参数是可选的）
描 述

abs(number)
返回指定数的绝对值

bytes(string, encoding[, errors])
对指定的字符串进行编码，并以指定的方式处理错误

cmath.sqrt(number)
返回平方根；可用于负数

float(object)
将字符串或数字转换为浮点数

help([object])
提供交互式帮助

input(prompt)
以字符串的方式获取用户输入

int(object)
将字符串或数转换为整数

math.ceil(number)
以浮点数的方式返回向上圆整的结果

math.floor(number)
以浮点数的方式返回向下圆整的结果

math.sqrt(number)
返回平方根；不能用于负数

pow(x, y[, z])
返回x的y次方对z求模的结果

print(object, …)
将提供的实参打印出来，并用空格分隔

repr(object)
返回指定值的字符串表示

round(number[, ndigits])
四舍五入为指定的精度，正好为5时舍入到偶数

str(object)
将指定的值转换为字符串。用于转换bytes时，可指定编码和错误处理方式
