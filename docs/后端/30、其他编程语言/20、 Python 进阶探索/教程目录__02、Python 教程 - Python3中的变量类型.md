# 02、Python 教程 - Python3中的变量类型
- 来源：https://ddkk.com/zhuanlan/other/python/3/2.html
- 分类：Python 进阶探索
- 分组：教程目录
## 一、 Python中需要注意的点

1没有分号（编码规范PEP8）

2严格按照缩进的语言

## 二、Python中的变量类型

**1变量类型**

变量存储在内存中的值。这就意味着在创建变量时会在内存中开辟一个空间。

基于变量的数据类型，解释器会分配指定内存，并决定什么数据可以被存储在内存中。

因此，变量可以指定不同的数据类型，这些变量可以存储整数，小数或字符。

**Python 中的变量赋值不需要类型声明**

Python有五个标准的数据类型：

- Numbers（数字）
- String（字符串）
- List（列表）
- Tuple（元组）
- Dictionary（字典）

**2Python数字**

Python支持四种不同的数字类型：

- int（有符号整型）
- long（长整型[也可以代表八进制和十六进制]）
- float（浮点型）
- complex（复数）

**3Python字符串**

字符串或串(String)是由数字、字母、下划线组成的一串字符。

**4Python bool型**

```java
 >>> bool(a)
 True
 >>> bool(0)
 False
 >>> bool(' ')		#有空格，所以为真
 True
 >>> bool('')		#表示空，非0即真
 False
```

**4查看变量的类型**

```java
 type(a)		#查看变量a的类型
```

## 三、Python数据类型转换

有时候，我们需要对数据内置的类型进行转换，数据类型的转换，你只需要将数据类型作为函数名即可。

以下几个内置的函数可以执行数据类型之间的转换。这些函数返回一个新的对象，表示转换的值。

函数
描述

int(x [,base])
将x转换为一个整数

long(x [,base] )
将x转换为一个长整数

float(x)
将x转换到一个浮点数

complex(real [,imag])
创建一个复数

str(x)
将对象 x 转换为字符串

repr(x)
将对象 x 转换为表达式字符串

eval(str)
用来计算在字符串中的有效Python表达式,并返回一个对象

tuple(s)
将序列 s 转换为一个元组

list(s)
将序列 s 转换为一个列表

set(s)
转换为可变集合

dict(d)
创建一个字典。d 必须是一个序列 (key,value)元组。

frozenset(s)
转换为不可变集合

chr(x)
将一个整数转换为一个字符

unichr(x)
将一个整数转换为Unicode字符

ord(x)
将一个字符转换为它的整数值

hex(x)
将一个整数转换为一个十六进制字符串

oct(x)
将一个整数转换为一个八进制字符串
