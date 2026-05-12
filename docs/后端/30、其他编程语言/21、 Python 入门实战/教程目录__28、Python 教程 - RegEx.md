# 28、Python 教程 - RegEx
- 来源：https://ddkk.com/zhuanlan/other/python/4/28.html
- 分类：Python 入门实战
- 分组：教程目录
## 1 概述

**RegEx 或正则表达式是形成搜索模式的字符序列。

RegEx 可用于检查字符串是否包含指定的搜索模式。**

## 2 RegEx 模块

Python 提供名为 `re` 的内置包，可用于处理`正则表达式`。

导入re 模块：

```java
import re
```

## 3 Python 中的 RegEx

导入`re` 模块后，就可以开始使用正则表达式了：

实例
检索字符串以查看它是否以 “China” 开头并以 “country” 结尾：

```java
import re
txt = "China is a great country"
x = re.search("^China.*country$", txt)  <re.Match object; span=(0, 24), match='China is a great country'>
```

## 4 RegEx 函数

re模块提供了一组函数，允许我们检索字符串以进行匹配：

函数
描述

findall
返回包含所有匹配项的列表

search
如果字符串中的任意位置存在匹配，则返回 Match 对象

split
返回在每次匹配时拆分字符串的列表

sub
用字符串替换一个或多个匹配项

## 5 元字符

元字符是具有特殊含义的字符：

字符
描述
示例

[]
一组字符
“[a-m]”

\
示意特殊序列（也可用于转义特殊字符）
“\d”

.
任何字符（换行符除外）
“he…o”

^
起始于
“^hello”

$
结束于
“world$”

*
零次或多次出现
“aix*”

+
一次或多次出现
“aix+”

{}
确切地指定的出现次数
“al{2}”

|
两者任一
"falls

()
捕获和分组

## 6 特殊序列

特殊序列指的是 `\` 后跟下表中的某个字符，拥有特殊含义：

字符
描述
示例

\A
如果指定的字符位于字符串的开头，则返回匹配项
“\AThe”

\b
返回指定字符位于单词的开头或末尾的匹配项
r"\bain" r"ain\b"

\B
返回指定字符存在的匹配项，但不在单词的开头（或结尾处）
r"\Bain" r"ain\B"

\d
返回字符串包含数字的匹配项（数字 0-9）
“\d”

\D
返回字符串不包含数字的匹配项
“\D”

\s
返回字符串包含空白字符的匹配项
“\s”

\S
返回字符串不包含空白字符的匹配项
“\S”

\w
返回一个匹配项，其中字符串包含任何单词字符（从 a 到 Z 的字符，从 0 到 9 的数字和下划线 _ 字符）
“\w”

\W
返回一个匹配项，其中字符串不包含任何单词字符
“\W”

\Z
如果指定的字符位于字符串的末尾，则返回匹配项
“Spain\Z”

## 7 集合（Set）

集合（`Set`）是一对方括号 [] 内的一组字符，具有特殊含义：

集合
描述

[arn]
返回一个匹配项，其中存在指定字符（a，r 或 n）之一

[a-n]
返回字母顺序 a 和 n 之间的任意小写字符匹配项

[^arn]
返回除 a、r 和 n 之外的任意字符的匹配项

[0123]
返回存在任何指定数字（0、1、2 或 3）的匹配项

[0-9]
返回 0 与 9 之间任意数字的匹配

[0-5][0-9]
返回介于 0 到 9 之间的任何数字的匹配项

[a-zA-Z]
返回字母顺序 a 和 z 之间的任何字符的匹配，小写或大写

[+]
在集合中，+、*、.、

## 8 findall() 函数

`findall()` 函数返回包含所有匹配项的列表。

实例
打印所有匹配的列表：

```java
import re
str = "China is a great country"
x = re.findall("a", str)
print(x)  ['a', 'a', 'a']
```

这个列表以被找到的顺序包含匹配项。

如果未找到匹配项，则返回空列表：

实例
如果未找到匹配，则返回空列表：

```java
import re
str = "China is a great country"
x = re.findall("USA", str)
print(x)
```

## 9 search() 函数

`search()` 函数搜索字符串中的匹配项，如果存在匹配则返回 `Match` 对象。

如果有多个匹配，则仅返回首个匹配项：

实例
在字符串中搜索第一个空白字符：

```java
import re
str = "China is a great country"
x = re.search("\s", str)
print("The first white-space character is located in position:", x.start())
# The first white-space character is located in position: 5
```

如果未找到匹配，则返回值 None：

实例
进行不返回匹配的检索：

```java
import re
str = "China is a great country"
x = re.search("USA", str)
print(x)  None
```

## 10 split() 函数

`split()` 函数返回一个列表，其中字符串在每次匹配时被拆分：

实例
在每个空白字符处进行拆分：

```java
import re
str = "China is a great country"
x = re.split("\s", str)
print(x)  ['China', 'is', 'a', 'great', 'country']
```

您可以通过指定 `maxsplit` 参数来控制出现次数：

实例
仅在首次出现时拆分字符串：

```java
import re
str = "China is a great country"
x = re.split("\s", str, 1)
print(x)  ['China', 'is a great country']
```

## 11 sub() 函数

`sub()` 函数把匹配替换为您选择的文本：

实例
用数字9 替换每个空白字符：

```java
import re
str = "China is a great country"
x = re.sub("\s", "9", str)
print(x)  China9is9a9great9country
```

您可以通过指定 `count` 参数来控制替换次数：

实例
替换前两次出现：

```java
import re
str = "China is a great country"
x = re.sub("\s", "9", str, 2)
print(x)  China9is9a great country
```

## 12 Match 对象

`Match` 对象是包含有关搜索和结果信息的对象。

注释：如果没有匹配，则返回值 None，而不是 Match 对象。

实例
执行会返回 Match 对象的搜索：

```java
import re
str = "China is a great country"
x = re.search("a", str)
print(x) 将打印一个对象：<re.Match object; span=(4, 5), match='a'>
```

Match 对象提供了用于取回有关搜索及结果信息的属性和方法：

- span() 返回的元组包含了匹配的开始和结束位置
- string 返回传入函数的字符串
- group() 返回匹配的字符串部分

实例
打印首个匹配出现的位置（开始和结束位置）。

正则表达式查找以大写 “C” 开头的任何单词：

```java
import re
str = "China is a great country"
x = re.search(r"\bC\w+", str)
print(x.span())  (0, 5)
```

实例
打印传入函数的字符串：

```java
import re
str = "China is a great country"
x = re.search(r"\bC\w+", str)
print(x.string)  China is a great country
```

实例
打印匹配的字符串部分。

正则表达式查找以大写 “C” 开头的任何单词：

```java
import re
str = "China is a great country"
x = re.search(r"\bC\w+", str)
print(x.group())  China
```

**注释：如果没有匹配项，则返回值 None，而不是 Match 对象。**
