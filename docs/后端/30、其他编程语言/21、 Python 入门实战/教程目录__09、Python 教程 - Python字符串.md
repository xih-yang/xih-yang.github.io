# 09、Python 教程 - Python字符串
- 来源：https://ddkk.com/zhuanlan/other/python/4/9.html
- 分类：Python 入门实战
- 分组：教程目录
## 1 字符串字面量

`python` 中的字符串字面量由单引号或双引号括起。

`'hello'` 等同于 `"hello"`。

## 2 用字符串向变量赋值

通过使用变量名称后跟等号和字符串，可以把字符串赋值给变量：

实例

```java
a = "Hello"
print(a)
```

## 3 多行字符串

可以使用三个引号将多行字符串赋值给变量：

实例，使用三个双引号：

```java
a = """Python is a widely used general-purpose, high level programming language. 
It was initially designed by Guido van Rossum in 1991 
and developed by Python Software Foundation. 
It was mainly developed for emphasis on code readability, 
and its syntax allows programmers to express concepts in fewer lines of code."""
print(a)
```

或三个单引号：

实例

```java
a = '''Python is a widely used general-purpose, high level programming language. 
It was initially designed by Guido van Rossum in 1991 
and developed by Python Software Foundation. 
It was mainly developed for emphasis on code readability, 
and its syntax allows programmers to express concepts in fewer lines of code.'''
print(a)
```

注释：在结果中，换行符插入与代码中相同的位置。

## 4 字符串是数组

像许多其他流行的编程语言一样，Python 中的字符串是表示 `unicode` 字符的字节数组。

但是，Python 没有字符数据类型，单个字符就是长度为 1 的字符串。

方括号可用于访问字符串的元素。

实例
获取位置 1 处的字符（请记住第一个字符的位置为 0）：

```java
a = "Hello, World!"
print(a[1])
```

### 4.1 裁切

使用裁切语法返回一定范围的字符，指定开始索引和结束索引，以冒号分隔，以返回字符串的一部分。

实例
获取从位置 2 到位置 5（不包括）的字符：

```java
b = "Hello, World!"
print(b[2:5])
```

### 4.2 负的索引

使用负索引从字符串末尾开始切片：

实例
获取从位置 5 到位置 1 的字符，从字符串末尾开始计数：

```java
b = "Hello, World!"
print(b[-5:-2])
```

### 4.3 字符串长度

如需获取字符串的长度，请使用 len() 函数。

实例
`len()` 函数返回字符串的长度：

```java
a = "Hello, World!"
print(len(a))
```

## 5 字符串方法

Python 有一组可用于字符串的内置方法。

实例
`strip()` 方法删除开头和结尾的空白字符：

```java
a = " Hello, World! "
print(a.strip()) returns "Hello, World!"
```

实例
`lower()` 返回小写的字符串：

```java
a = "Hello, World!"
print(a.lower())
```

实例
`upper()` 方法返回大写的字符串：

```java
a = "Hello, World!"
print(a.upper())
```

实例
`replace()` 用另一段字符串来替换字符串：

```java
a = "Hello, World!"
print(a.replace("World", "Kitty"))
```

实例
`split()` 方法在找到分隔符的实例时将字符串拆分为子字符串：

```java
a = "Hello, World!"
print(a.split(",")) returns ['Hello', ' World!']
```

## 6 检查字符串

如需检查字符串中是否存在特定短语或字符，我们可以使用 `in` 或 `not in` 关键字。

实例
检查以下文本中是否存在短语 “ina”：

```java
txt = "China is a great country"
x = "ina" in txt
print(x)
```

实例
检查以下文本中是否没有短语 “ina”：

```java
txt = "China is a great country"
x = "ain" not in txt
print(x) 
```

## 7 字符串级联（串联）

如需串联或组合两个字符串，您可以使用 + 运算符。

实例
将变量a 与变量 b 合并到变量 c 中：

```java
a = "Hello"
b = "World"
c = a + b
print(c)
```

实例
在它们之间添加一个空格：

```java
a = "Hello"
b = "World"
c = a + " " + b
print(c)
```

## 8 字符串格式

正如在Python 变量一章中所学到的，我们不能像这样组合字符串和数字：

实例

```java
age = 63
txt = "My name is Bill, I am " + age
print(txt)
```

但是我们可以使用 `format()` 方法组合字符串和数字！

`format()` 方法接受传递的参数，格式化它们，并将它们放在占位符 {} 所在的字符串中：

实例
使用`format()` 方法将数字插入字符串：

```java
age = 63 
txt = "My name is Bill, and I am {}"
print(txt.format(age))
```

`format()` 方法接受不限数量的参数，并放在各自的占位符中：

实例

```java
quantity = 3
itemno = 567
price = 49.95
myorder = "I want {} pieces of item {} for {} dollars."
print(myorder.format(quantity, itemno, price))
```

您可以使用索引号 {0} 来确保参数被放在正确的占位符中：

实例

```java
quantity = 3
itemno = 567
price = 49.95
myorder = "I want to pay {2} dollars for {0} pieces of item {1}."
print(myorder.format(quantity, itemno, price))
```

## 9 字符串方法

Python 有一组可以在字符串上使用的内建方法。

注释：所有字符串方法都返回新值。它们不会更改原始字符串。

方法描述

`capitalize()` 把首字符转换为大写。

`casefold()` 把字符串转换为小写。

`center()` 返回居中的字符串。

`count()` 返回指定值在字符串中出现的次数。

`encode()` 返回字符串的编码版本。

`endswith()` 如果字符串以指定值结尾，则返回 true。

`expandtabs()` 设置字符串的 tab 尺寸。

`find()` 在字符串中搜索指定的值并返回它被找到的位置。

`format()` 格式化字符串中的指定值。

`format_map()` 格式化字符串中的指定值。

`index()` 在字符串中搜索指定的值并返回它被找到的位置。

`isalnum()` 如果字符串中的所有字符都是字母数字，则返回 True。

`isalpha()` 如果字符串中的所有字符都在字母表中，则返回 True。

`isdecimal()` 如果字符串中的所有字符都是小数，则返回 True。

`isdigit()` 如果字符串中的所有字符都是数字，则返回 True。

`isidentifier()` 如果字符串是标识符，则返回 True。

`islower()` 如果字符串中的所有字符都是小写，则返回 True。

`isnumeric()` 如果字符串中的所有字符都是数，则返回 True。

`isprintable()` 如果字符串中的所有字符都是可打印的，则返回 True。

`isspace()` 如果字符串中的所有字符都是空白字符，则返回 True。

`istitle()` 如果字符串遵循标题规则，则返回 True。

`isupper()` 如果字符串中的所有字符都是大写，则返回 True。

`join()` 把可迭代对象的元素连接到字符串的末尾。

`ljust()` 返回字符串的左对齐版本。

`lower()` 把字符串转换为小写。

`lstrip()` 返回字符串的左修剪版本。

`maketrans()` 返回在转换中使用的转换表。

`partition()` 返回元组，其中的字符串被分为三部分。

`replace()` 返回字符串，其中指定的值被替换为指定的值。

`rfind()` 在字符串中搜索指定的值，并返回它被找到的最后位置。

`rindex()` 在字符串中搜索指定的值，并返回它被找到的最后位置。

`rjust()` 返回字符串的右对齐版本。

`rpartition()` 返回元组，其中字符串分为三部分。

`rsplit()` 在指定的分隔符处拆分字符串，并返回列表。

`rstrip()` 返回字符串的右边修剪版本。

`split()` 在指定的分隔符处拆分字符串，并返回列表。

`splitlines()` 在换行符处拆分字符串并返回列表。

`startswith()` 如果以指定值开头的字符串，则返回 true。

`strip()` 返回字符串的剪裁版本。

`swapcase()` 切换大小写，小写成为大写，反之亦然。

`title()` 把每个单词的首字符转换为大写。

`translate()` 返回被转换的字符串。

`upper()` 把字符串转换为大写。

`zfill()` 在字符串的开头填充指定数量的 0 值。

注释：所有字符串方法都返回新值。它们不会更改原始字符串。
