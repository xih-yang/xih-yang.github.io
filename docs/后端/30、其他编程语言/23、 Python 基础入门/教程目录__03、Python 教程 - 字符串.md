# 03、Python 教程 - 字符串
- 来源：https://ddkk.com/zhuanlan/other/python/6/3.html
- 分类：Python 基础入门
- 分组：教程目录
字符串是不可变的，所有的元素赋值和切片赋值都是非法的

Python提供了多种字符串格式设置方法

```java
yanyu = "hello, %s I like %s age is %s"
beyond = ("beyond","band",23)
yanyu % beyond#结果为：'hello, beyond I like band age is 23'
a = "age is %.3f and name is %.2f"
b = (23,14)
a % b#结果为：'age is 23.000 and name is 14.00'
'''
很显然，最后的%s对应的是数，但最后也会转换成字符
如果指定的值不是字符串，将使用str将其转换为字符串
beyond为值，需要插入到yanyu里面，yanyu % beyond位置不可以改变！！！
%.3f将值的格式设置为包含3位小数的浮点数
'''
```

```java
from string import Template 
tmpl = Template("Hello, $who! $what enough for ya?") 
tmpl.substitute(who="yanyu", what="beyond")结果为：'Hello, yanyu! beyond enough for ya?'
```

编写新代码时，应选择使用字符串方法**format**，使用这种方法时，每个替换字段都用花括号括起

```java
"{},{},and {}".format("apple","water","milk")#结果为：'apple,water,and milk'
"{0},{1},and {2}".format("aaa","bbb","ccc")#结果为：'aaa,bbb,and ccc'
"{0} {3} {1} {2}".format("a","b","c","d")#结果为：'a d b c'
```

格式说明符 **.2f**，并使用冒号`:`将其与字段名隔开，意味着要使用包含2位小数的浮点数格式；若没有指定，则输出多位

```java
from math import pi
"{name} is  {value}.".format(value=pi, name="π")#结果为：'π is  3.141592653589793.'
"{name} is  {value:.2f}.".format(value=pi, name="π")#结果为：'π is  3.14.'
```

```java
from math import e 
f"Euler's constant is roughly {
       e}." 
"Euler's constant is roughly {e}.".format(e=e)
'''
上述俩结果均一样：
"Euler's constant is roughly 2.718281828459045."
'''
```

要在最终结果中包含花括号，可在格式字符串中使用两个花括号（即{ {或}}）来指定

```java
"{
     {ceci n'est pas une replacement field}}".format()#结果为："{ceci n'est pas une replacement field}"
```

每个值都被插入字符串中，以替换用花括号括起的替换字段

替换字段由**字段名**、**转换标志**、**格式说明符**组成其中每个部分都是可选的

## 替换字段名

```java
"{foo} {} {bar} {}".format(1, 2, bar=4, foo=3)#结果为：'3 1 4 2'
"{foo} {1} {bar} {0}".format(1, 2, bar=4, foo=3)#结果为：'3 2 4 1'
```

```java
name = ["huangjiaju","yanyu","yeshirong"]
"{band[1]} like the {band[0]} and {band[2]}".format(band=name)#结果为：'yanyu like the huangjiaju and yeshirong'
```

```java
import math
temp1 = "The {mod.__name__} value is {mod.pi:.2f} for Π"
temp1.format(mod=math)#结果为：'The math value is 3.141592653589793 for Π'
#变量__name__包含指定模块的名称
temp2 = "The {mod.__name__} value is {mod.pi:.2f} for Π"
temp2.format(mod=math)#结果为：'The math value is 3.14 for Π'
```

### 1，基本转换

三个标志（s、r和a）指定分别使用str、repr和ascii进行转换

函数str通常创建外观普通的字符串版本（这里没有对输入字符串做任何处理）

函数repr尝试创建给定值的Python表示（这里是一个字符串字面量）

函数ascii创建只包含ASCII字符的表示，类似于Python 2中的repr

```java
print("{pi!s} {pi!r} {pi!a}".format(pi="π"))
#结果为：π 'π' '\u03c0'
```

这里的f和b之类的表示类型说明符，具体的参考下表所述

```java
"The number is {num}".format(num=42)结果为：'The number is 42' 
"The number is {num:f}".format(num=42)结果为：'The number is 42.000000'
"The number is {num:.2f}".format(num=42)结果为：'The number is 42.00'
"The number is {num:b}".format(num=42)结果为：'The number is 101010'
```

类型
含 义

b
将整数表示为二进制数

c
将整数解读为Unicode码点

d
将整数视为十进制数进行处理，这是整数默认使用的说明符

e
使用科学表示法来表示小数（用e来表示指数）

E
与e相同，但使用E来表示指数

f
将小数表示为定点数

F
与f相同，但对于特殊值（nan和inf），使用大写表示

g
自动在定点表示法和科学表示法之间做出选择。这是默认用于小数的说明符，但在默认情况下至少有1位小数

G
与g相同，但使用大写来表示指数和特殊值

n
与g相同，但插入随区域而异的数字分隔符

o
将整数表示为八进制数

s
保持字符串的格式不变，这是默认用于字符串的说明符

x
将整数表示为十六进制数并使用小写字母

X
与x相同，但使用大写字母

%
将数表示为百分比值（乘以100，按说明符f设置格式，再在后面加上%）

### 2，宽度、精度和千位分隔符

设置浮点数（或其他更具体的小数类型）的格式时，默认在**小数点后面显示6位小数**，并根据需要设置字段的宽度，而不进行任何形式的填充

字符串和数的默认对齐方式不同

数是默认右对齐；而字符串是默认左对齐

```java
"{beyond:10}".format(beyond=2) 结果为：'         2'
"{name:10}".format(name="yanyu")#结果为：'yanyu     '
'{:010.2f}'.format(pi)#结果为：'0000003.14'
# 010表示整体包括小数点共占十位且不足的话用0补齐，.2f表示小数点后2为小数，f为浮点数
"PI day is {P:.2f}".format(P=pi)#结果为：'PI day is 3.14'
"{PI:10.2f}".format(PI=pi)     结果为：'      3.14'
"{:.5}".format("a ha haha")    结果为：'a ha '
"10 de yibaicifang is {:,}".format(10 ** 100)#结果为：'10 de yibaicifang is 10,000,000,000,000,000,000,000,000,000,000,000,000,000,000,000,000,000,000,000,000,000,000,000,000,000,000,000,000,000,000,000,000,000'  千位分隔符
```

### 3，符号、对齐和用 0 填充

要指定左对齐、右对齐和居中，可分别使用``和`^`

```java
print("{0:<10.2f}\n {0:^10.2f}\n {0:>10.2f}\n".format(pi))
'''
3.14
    3.14
       3.14
'''
```

填充字符来扩充对齐说明符，这样将使用指定的字符而不是默认的空格来填充

```java
"{:$^25}".format(" beyond yanyu ")#结果为：'$$$$$ beyond yanyu $$$$$$'
```

具体的说明符 **=** ，它指定将填充字符放在符号和数字之间

```java
print('{0:10.2f}\n{1:10.2f}'.format(pi, -pi))
'''
      3.14
     -3.14
'''
print('{0:10.2f}\n{1:=10.2f}'.format(pi, -pi))
'''
      3.14
-     3.14
'''
print('{0:+.2}\n{1:+.2}'.format(pi, -pi))
’‘’
+3.1
-3.1
‘’‘
print('{0:-.2}\n{1:-.2}'.format(pi, -pi))默认设置
 '''
 3.1
-3.1
#若{0}为pi是正数的话，{0:-.2}无法在pi前面添负号，最后的结果取决于format里面数的正负值
 '''
print('{0: .2}\n{1: .2}'.format(pi, -pi))
'''
 3.1
-3.1
'''
```

井号（**#**）选项，你可将其放在符号说明符和宽度之间

这个选项将触发另一种转换方式，转换细节随类型而异

对于二进制、八进制和十六进制转换，将加上一个前缀

```java
"{:b}".format(42)#结果为：'101010'
"{:#b}".format(42)#结果为：'0b101010'
"{:g}".format(42)#结果为：'42'
"{:#g}".format(42)#结果为：'42.0000'
```

## 字符串方法

虽然**字符串方法**完全盖住了**模块string**的风头，下面是**模块string**中几个很有用的常量

常量名称
作用

string.digits
包含数字0～9的字符串

string.ascii_letters
包含所有ASCII字母（大写和小写）的字符串

string.ascii_lowercase
包含所有小写ASCII字母的字符串

string.printable
包含所有可打印的ASCII字符的字符串

string.punctuation
包含所有ASCII标点字符的字符串

string.ascii_uppercase
包含所有大写ASCII字母的字符串

**虽然说的是ASCII字符，但值实际上是未解码的Unicode字符串**

### 1，center，通过在两边添加填充字符（默认为空格）让字符串居中

"字符串".center(num,"占位符")#表示：将字符串一共占num个位置，然后在这num个位置居中，占位符填充，若无占位符默认空格填充

```java
"beyond yanyu huangjiaju".center(25)#结果为：' beyond yanyu huangjiaju '
"beyond yanyu huangjiaju".center(25,"$")#结果为：'$beyond yanyu huangjiaju$'
```

### 2，find，在字符串中查找子串。如果找到，就返回子串的第一个字符的索引，否则返回-1

字符串方法find返回的并非布尔值

如果find像这样返回0，就意味着它在索引0处找到了指定的子串

```java
'With a moo-moo here, and a moo-moo there'.find('moo')#结果为：7
title = "Monty Python's Flying Circus"
title.find('Monty')#结果为：0
title.find('Python')#结果为：6
title.find('Flying')#结果为：15
title.find('Zirquss')#结果为：-1
subject = '$$$ Get rich now!!! $$$'
subject.find('$$$')#结果为：0
```

指定搜索的起点和终点（它们都是可选的），左闭右开

```java
subject = '$$$ Get rich now!!! $$$'
subject.find('$$$')#结果为：0
#只指定了起点
subject.find('$$$', 1)#结果为：20
subject.find('!!!')#结果为：16
#同时指定了起点和终点
subject.find('!!!', 0, 16)#结果为：-1
```

### 3，join，其作用与split相反，用于合并序列的元素

所合并序列的元素必须都是字符串`连接符.join(字符串列表)`将字符串列表通过连接符相连，连接符可为空

```java
beyond = [1,9,9,3]
yy = ”+“
YY = ”“
yy.join(beyond)#结果为：报错，原因是合并序列只能是字符串
sq = ['1','9','9','9']
yy.join(sq)#结果为：'1+9+9+9'
YY.join(sq)#结果为：'1999'
dirs = '', 'usr', 'bin', 'env'
'/'.join(dirs)#结果为：'/usr/bin/env'
print('C:' + '\\'.join(dirs))#结果为：C:\usr\bin\env
```

### 4，lower，返回字符串的小写版本

将所有的用户名都转换为小写，并于搜索指定姓名用户

```java
name = "beyond"
names = ["yanyu","huangjiaju","yeshirong","beyond","huangguanzhoang","huangjiaqiang"]
if name.lower() in names:print("I found it!")
#结果为：I found it!
```

一个与lower相关的方法是**title**，它将字符串转换为词首大写，即所有单词的**首字母都大写**，**其他字母都小写**

与title功能一样的是使用模块string中的函数**capwords**

```java
"i like beyond band".title()#结果为：'I Like Beyond Band'
import string 
string.capwords("i like beyond band")#结果为：'I Like Beyond Band'
```

### 5，replace，将指定子串都替换为另一个字符串，并返回替换后的结果

```java
 'This is a test'.replace('is', 'eez')#结果为：'Theez eez a test'
```

### 6，split，一个非常重要的字符串方法，其作用与join相反，用于将字符串拆分为序列

如果没有指定分隔符，将默认在单个或多个连续的空白字符（空格、制表符、换行符

等）处进行拆分

```java
'1+2+3+4+5'.split('+')结果为”['1', '2', '3', '4', '5'] 
'/usr/bin/env'.split('/')结果为：['', 'usr', 'bin', 'env'] 
'Using the default'.split()结果为：['Using', 'the', 'default']
```

### 7，strip，将字符串开头和末尾的空白（但不包括中间的空白）删除，并返回删除后的结果

```java
' I very like beyond band '.strip()#结果为：'I very like beyond band'
```

假定用户输入用户名时不小心在末尾加上了一个空格，搜索的时候就可以发挥这个方法的作用了

```java
names = ['gumby', 'smith', 'jones']
name = 'gumby '
if name in names: print('Found it!')#结果为：按下enter 没反应 因为用户名称多了个空格
if name.strip() in names: print('Found it!')#结果为：按下enter Found it!
```

还可在一个字符串参数中指定要删除哪些字符

```java
'*!*!##!!!!* SPAM * for * everyone!!! *@*$$$*'.strip('*!@$')#结果为：'SPAM * for * everyone'
```

### 8，translate，与replace一样替换字符串的特定部分，但不同的是它只能进行单字符替换

优势在于能够同时替换多个字符，因此效率比replace高

假设你要将一段英语文本转换为带有德国口音的版本，为此必须将字符c和s分别替换为k和z，使用translate前必须创建一个转换表`table = str.maketrans('cs', 'kz')`

创建转换表后，就可将其用作方法translate的参数

还可提供可选的第三个参数，指定要将哪些字母删除

```java
table1 = str.maketrans('cs', 'kz')
'this is an incredible test'.translate(table1)#结果为：thiz iz an inkredible tezt'
table2 = str.maketrans('cs', 'kz', ' ')
'this is an incredible test'.translate(table2)#结果为：'thizizaninkredibletezt'
```

### 9，判断字符串是否满足特定的条件

**isspace**、**isdigit**和**isupper**，它们判断字符串是否具有特定的性质

（如包含的字符`全为`**空白**、**数字**或**大写**）

如果字符串具备特定的性质，这些方法就返回True，否则返回False

```java
YY = “BEYOND”
yy = "123456qwe"
q = "   "
YY.isupper()#结果为：True
yy.isdigit()#结果为：False
q.isspace()#结果为：True
```

## 本章节介绍的新函数

函 数
描 述

string.capwords(s[, sep])
使用split根据sep拆分s，将每项的首字母大写，再以空格为分隔符将它们合并起来

ascii(obj)
创建指定对象的ASCII表示
