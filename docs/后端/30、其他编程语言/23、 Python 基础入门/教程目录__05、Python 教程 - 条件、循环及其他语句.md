# 05、Python 教程 - 条件、循环及其他语句
- 来源：https://ddkk.com/zhuanlan/other/python/6/5.html
- 分类：Python 基础入门
- 分组：教程目录
## 再谈print和import

print现在实际上是一个函数

### 1，打印多个参数

用`逗号`分隔，打印多个表达式

`sep`自定义**分隔符**，默认空格

`end`自定义**结束字符串**，默认换行

```java
print("beyond",'yanyu',23)#结果为：beyond yanyu 23
```

```java
a = "beyond，"
b = "yanyu"
c = 23
print(a, b, c)#结果为：beyond， yanyu 23
print(a, b + '，' ,c)#结果为：beyond， yanyu， 23
```

```java
print("I","love","the","beyond","band",sep="_")#结果为：I_love_the_beyond_band
print('Hello,', end='')结果为：Hello,   不会换行
```

### 2，导入时重命名as

导入整个模块并给它指定别名

```java
import math as beyond
beyond.sqrt(4)#结果为：2.0
```

导入特定函数并给它指定别名

```java
from math import sqrt as beyond
beyond(4)#结果为：2.0
```

## 赋值魔法

### 1，序列解包

序列解包（或可迭代对象解包）：将一个序列（或任何可迭代对象）解包，并将得到的值存储到一系列变量中

```java
#可同时（并行）给多个变量赋值
x, y, z = 1, 2, 3
print(x,y,z,sep="-")#结果为：1-2-3
#交换多个变量的值
x, y = y, x
print(x,y,z,sep=",")#结果为：2,1,3
```

```java
beyond = 1,2,3
beyond#结果为：(1, 2, 3)
x,y,z = beyond
x#结果为：1
y#结果为：2
z#结果为：3
```

假设要从字典中随便获取（或删除）一个键-值对，可使用方法popitem，随便获取一个键-值对并以元组的方式返回，接下来，可直接将返回的元组解包到两个变量中

```java
beyond ={
     "name":"huangjiaju","age":31}
key,value = beyond.popitem()
key#结果为：name
value#结果为：huangjiaju
```

左右两边列出的目标个数必须相同，否则会报异常

可使用星号运算符（*）来收集多余的值，这样无需确保值和变量的个数相同

带星号的变量最终包含的总是一个**列表**

```java
x, y, z = 1, 2#结果为：报错
x, y, z = 1, 2, 3, 4#结果为：报错
```

```java
a, b, *c= [1, 2, 3, 4]
c#结果为：[3, 4]
a, b, c#结果为：(1, 2, [3, 4])
name = "I like the beyond band"
x, *y, z = name.split()
x#结果为：'I'
y#结果为：['like', 'the', 'beyond']
z#结果为：'band'
```

### 2，链式赋值

将多个变量关联到同一个值

```java
x = y = beyond()
等价于
y = beyond() 
x = y
不等价！！！
x = beyond() 
y = beyond()
```

### 3，增强赋值

将右边表达式中的运算符移到赋值运算符的前面

```java
x = 2
x += 1
x#结果为：3
x *= 2
x#结果为：6
yy = "beyond"
yy += "huangjiaju"
yy#结果为：'beyondhuangjiaju'
yy *= 2
yy#结果为：'beyondhuangjiajubeyondhuangjiaju'
```

## 代码块：缩进的乐趣

代码块其实并不是一种语句，代码块是**一组语句**，代码块是通过**缩进代码**（即在前面加空格）来创建的

在Python中，使用冒号（:）指出接下来是一个代码块

## 条件和条件语句

### 1，布尔值

假（0）：`False None 0 "" () [] {}`，其他则为真（1）

虽然`[]`和`""`都为假，但它们并不相等（即`[] != ""`）

布尔值True和False属于类型bool

于任何值都可用作布尔值

```java
True + False + 42#结果为：43   1+0+42=43
bool(42)#结果为：True
bool('')#结果为：False
bool(0)#结果为：False
```

### 2，有条件的执行和if语句

如果条件（if和冒号之间的表达式）为前面定义的真，就执行后续代码块（这里是一条print语句）；如果条件为假，就不执行

```java
name = input('What is your name? ') 
if name.endswith('beyond'):以beyond结尾的名字为真
	print('Hello, Mr. beyond')
```

```java
name = input('What is your name?') 
if name.endswith('yanyu'):以yanyu结尾的名字为真
	print('Hello, Mr. yanyu') 
else: 
	print('Hello, stranger')
```

### 3，else子句

**条件表达式**——C语言中三目运算符的Python版本

`"语句1" if 条件 else "语句2"`如果条件为真，则执行语句1，否则执行语句2

```java
name = input('What is your name?') 
status = "friend" if name.endswith("beyond") else "stranger"
```

### 4，elif 子句

要检查多个条件，可使用elif，elif是else if的缩写

```java
num = int(input('Enter a number: ')) 
if num > 0: 
	print('The number is positive') 
elif num < 0: 
	print('The number is negative') 
else: 
	print('The number is zero')
```

### 5，代码块嵌套

```java
name = input('What is your name? ') 
if name.endswith('Gumby'):以Gumby结尾都为真
	if name.startswith('Mr.'):以Mr.开始都为真
		print('Hello, Mr. Gumby') 
	elif name.startswith('Mrs.'): 
		print('Hello, Mrs. Gumby') 
	else: 
		print('Hello, Gumby') 
else: 
	print('Hello, stranger')
```

### 6，更复杂的条件

#### 1，比较运算符

在条件表达式中，最基本的运算符可能是比较运算符，它们用于执行比较

表达式
描述

x == y
x等于y

x  y
x大于y

x >= y
x大于或等于y

x <= y
x小于或等于y

x != y
x不等于y

x is y
x和y是同一个对象

x is not y
x和y是不同的对象

x in y
x是容器（如序列）y的成员

x not in y
x不是容器（如序列）y的成员

#### 1，相等运算符#

比较运算符，用两个等号（==）表示

一个等号是赋值运算符，用于修改值

```java
"foo" == "foo"#结果为：True
"foo" == "bar"#结果为：False
"foo" = "foo"#报错
```

#### 2，is：相同运算符#

```java
'''
变量x和y指向同一个列表
而z指向另一个列表（其中包含的值以及这些值的排列顺序都与前一个列表相同）
'''
x = y = [1, 2, 3] 
z = [1, 2, 3] 
x == y结果为：True 
x == z结果为：True 
x is y结果为：True 
x is z结果为：False
```

`==`用来检查两个对象是否`相等`

`is`用来检查两个对象是否`相同`（是同一个对象）

#### 3，in：成员资格运算符#

```java
name = input('What is your name?') 
if 's' in name:
	print('Your name contains the letter "s".')
else: 
	print('Your name does not contain the letter "s".')
```

#### 4，字符串和序列的比较#

根据字符的字母排列顺序进行比较的

```java
"alpha" < "beta"#结果为：True
```

要获悉字母的顺序值，可使用函数**ord**

这个函数的作用与函数**chr**相反

```java
ord("🐕")#结果为：128021
chr(128021)#结果为：🐕
```

可使用字符串方法lower对设计大写字母的字符串进行比较

```java
"a".lower() < "B".lower()#结果为：True
'FnOrD'.lower() == 'Fnord'.lower()#结果为：True
[1, 2] < [2, 1]#结果为：True
[2, [1, 4]] < [2, [1, 5]]#结果为：True
```

#### 2，布尔运算符

读取一个数，并检查这个数是否位于1～10（含）

```java
number = int(input('Enter a number between 1 and 10: ')) 
if number <= 10 and number >= 1: 
	print('Great!') 
else: 
	print('Wrong!')
```

运算符and是一个布尔运算符，还有另外两个布尔运算符：or和not

布尔运算符有个有趣的特征：**只做必要的计算**

### 7，断言

使用关键字assert，要求某些条件得到满足

assert语句充当检查点

```java
age = 10 
assert 0 < age < 100 
age = -1 
assert 0 < age < 100#结果为：报错！！！
还可在条件后面添加一个字符串，对断言做出说明
age = -1
assert 0 < age < 100, 'The age must be realistic'#结果为：AssertionError: The age must be realistic
```

## 循环

### 1，while 循环

打印1-100

```java
x = 1 
while x <= 100: 
	print(x)  
	x += 1
```

```java
name = '' 
while not name: 
	name = input('Please enter your name: ') 
print('Hello, {}!'.format(name))
```

### 2，for 循环

可迭代对象是可使用for循环进行遍历的对象

```java
words = ['this', 'is', 'an', 'ex', 'parrot'] 
for word in words: 
	print(word)
```

```java
numbers = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] 
for number in numbers: 
	print(number)
```

鉴于迭代（也就是遍历）特定范围内的数是一种常见的任务

函数range可实现迭代，左闭右开

如果只提供了一个位置，将把这个位置视为结束位置，并假定起始位置为0

```java
range(0, 10)#结果为：range(0, 10)
list(range(0, 10))#结果为：[0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
range(10)#结果为：range(0, 10)
```

```java
for number in range(1,101): 
	print(number)
```

### 3，迭代字典

通过key来遍历字典d

只对值感兴趣，可使用d.values

d.items以元组的方式返回键值对

for循环的优点之一是，可在其中使用序列解包

```java
d = {
     'x': 1, 'y': 2, 'z': 3} 
for key in d: 
    print(key, 'corresponds to', d[key])
for key, value in d.items(): 
    print(key, 'corresponds to', value)
'''
结果为：
x corresponds to 1
y corresponds to 2
z corresponds to 3
x corresponds to 1
y corresponds to 2
z corresponds to 3
'''
```

### 4，一些迭代工具

**并行迭代**

```java
names = ['anne', 'beth', 'george', 'damon'] 
ages = [12, 45, 32, 102]
for i in range(len(names)): 
	print(names[i], 'is', ages[i], 'years old')
'''
anne is 12 years old
beth is 45 years old
george is 32 years old
damon is 102 years old
'''	
```

#### 1，并行迭代

**内置函数zip，它将两个序列“缝合”起来，并返回一个由元组组成的序列**

可使用list将其转换为列表

```java
names = ['anne', 'beth', 'george', 'damon'] 
ages = [12, 45, 32, 102]
list(zip(names,ages))#结果为：[('anne', 12), ('beth', 45), ('george', 32), ('damon', 102)]
for name, age in zip(names, ages): 
    print(name, 'is', age, 'years old')
'''
结果为：
anne is 12 years old
beth is 45 years old
george is 32 years old
damon is 102 years old
'''
```

当序列的长度不同时，函数zip将在最短的序列用完后停止“缝合”

```java
list(zip(range(5), range(1000)))#结果为：[(0, 0), (1, 1), (2, 2), (3, 3), (4, 4)]
```

#### 2，迭代时获取索引

替换一个字符串列表中所有包含子串’xxx’的字符串

使用内置函数**enumerate**

```java
for index, string in enumerate(strings): 
	if 'xxx' in string: 
		strings[index] = '[censored]'
```

#### 3，反向迭代和排序后再迭代

函数：reversed和sorted，类似于列表方法reverse和sort

**不修改对象，而是返回反转和排序后的版本**

sorted返回一个列表，而reversed像zip那样返回一个更神秘的可迭代对象

```java
sorted([4, 3, 6, 8, 3])#结果为：[3, 3, 4, 6, 8]
sorted('Hello, beyond!')#结果为：[' ', '!', ',', 'H', 'b', 'd', 'e', 'e', 'l', 'l', 'n', 'o', 'o', 'y']
list(reversed('Hello, beyond!'))#结果为：['!', 'd', 'n', 'o', 'y', 'e', 'b', ' ', ',', 'o', 'l', 'l', 'e', 'H']
'Y'.join(reversed('Hello, beyond!'))#结果为：'!YdYnYoYyYeYbY Y,YoYlYlYeYH'
''.join(reversed('Hello, beyond!'))#结果为：'!dnoyeb ,olleH'
```

要按字母表排序，可先转换为小写

```java
sorted("aBc", key=str.lower)#结果为：['a', 'B', 'c']
```

### 5，跳出循环

#### 1，break

找出小于100的最大平方值

```java
from math import sqrt 
for n in range(99, 0, -1): 
    root = sqrt(n) 
    if root == int(root): 
        print(n) 
        break
#结果为：81
```

#### 2，continue

结束当前迭代，并跳到下一次迭代开头，即跳过循环体中余下的语句，但不结束循环

```java
伪代码
for x in seq: 
	if condition1: continue
	if condition2: continue
	do_something() 
	do_something_else() 
	do_another_thing() 
	etc()
```

#### 3，while True/break成例

在用户根据提示输入单词时执行某种操作，并在用户没有提供单词时结束循环

```java
while True: 
	word = input('Please enter a word: ') 
	if not word: break 
	print('The word was ', word)
```

### 6，循环中的 else 子句

```java
from math import sqrt 
for n in range(99, 81, -1): 
	root = sqrt(n) 
	if root == int(root): 
		print(n) 
		break 
	else: 
		print("Didn't find it!")
```

## 简单推导

列表推导是一种从其他列表创建列表的方式，工作原理类似于for循环

```java
[x * x for x in range(10)]#结果为：[0, 1, 4, 9, 16, 25, 36, 49, 64, 81]
[x*x for x in range(10) if x % 3 == 0]#结果为：[0, 9, 36, 81]
```

```java
[(x, y) for x in range(3) for y in range(3)]#结果为：[(0, 0), (0, 1), (0, 2), (1, 0), (1, 1), (1, 2), (2, 0), (2, 1), (2, 2)]
#与下列for循环效果等价
result = [] 
for x in range(3):
    for y in range(3):
        result.append((x, y))
#结果为：[(0, 0), (0, 1), (0, 2), (1, 0), (1, 1), (1, 2), (2, 0), (2, 1), (2, 2)]
```

b在boys列表中，g在girls列表中，若俩名字首字母相等则配对

```java
girls = ['alice', 'bernice', 'clarice'] 
boys = ['chris', 'arnold', 'bob'] 
[b+'+'+g for b in boys for g in girls if b[0] == g[0]]#结果为：['chris+clarice', 'arnold+alice', 'bob+bernice']
```

使用圆括号代替方括号并不能实现元组推导，而是将创建生成器

可使用花括号来执行字典推导

```java
squares = {
     i:"{} squared is {}".format(i, i**2) for i in range(10)}
squares[8]#结果为：'8 squared is 64'
```

在列表推导中，for前面只有一个表达式

在字典推导中，for前面有两个用冒号分隔的表达式，分别为键及其对应的值

## 三人行

**pass、del和exec**

### 1，pass：什么都不做

```java
name = input('your name input,please:')
if name == 'beyond': 
    print('Welcome!') 
elif name == 'huangjiaju': 
    pass
elif name == 'yanyu': 
    print('Game Over')
else:
    print("Goodbuy")
```

### 2，使用del删除

robin和scoundrel指向同一个字典，因此将None赋给scoundrel后，依然可以通过robin

来访问这个字典

但将robin也设置为None之后，Python解释器直接将其删除，这被称为垃圾收集

```java
scoundrel = {
     'age': 42, 'first name': 'Robin', 'last name': 'of Locksley'} 
robin = scoundrel 
print(scoundrel){'age': 42, 'first name': 'Robin', 'last name': 'of Locksley'} 
print(robin){'age': 42, 'first name': 'Robin', 'last name': 'of Locksley'} 
scoundrel = None 
print(robin){'age': 42, 'first name': 'Robin', 'last name': 'of Locksley'} 
robin = None
print(robin)#结果为：None
```

```java
x= 1
del x
x#结果为：报错  del不仅会删除到对象的引用，还会删除名称本身
```

x和y指向同一个列表，但删除x对y没有任何影响

只删除名称x，而没有删除列表本身（值）

在Python中，根本就没有办法删除值

对于你不再使用的值，Python解释器会立即将其删除

```java
x = ['beyond',"yanyu"]
y = x
y[1] = 'huangjiaju'
print(x)#结果为：['beyond', 'huangjiaju']
del x
print(y)#结果为：['beyond', 'huangjiaju']
```

### 3，使用exec和eval执行字符串及计算其结果

#### 1，exec

函数exec将字符串作为代码执行，执行一系列python语句，exec本身是条语句，什么都不返回

```java
exec("print('Hello, world!')")#结果为：Hello, world!
```

函数exec主要用于动态地创建代码字符串

调用函数exec时只给它提供一个参数绝非好事。

在大多数情况下，还应向它传递一个命名空间——用于放置变量的地方(命名空间视为放置变量的地方，类似于一个看不见的字典)

否则代码将污染你的命名空间，即修改你的变量

将scope打印出来，发现其中包含所有内置函数和值的字典__builtins__。

```java
from math import sqrt
exec("sqrt = 1")
sqrt(4)#结果为：报错，改变了该变量
```

```java
from math import sqrt
scope = {
     }
exec("sqrt = 1",scope)
sqrt(4)#结果为：2.0
scope['sqrt']#结果为：1
len(scope)#结果为：2
scope.keys()#结果为：['sqrt', '__builtins__']
```

#### 2，eval

eval计算用字符串表示的Python表达式的值，并返回结果

也可向eval提供一个命名空间

类似Python计算器

```java
eval(input("please input some number: "))
#please input some number:1+2+3
#结果为：6
```

向exec或eval提供命名空间时，可在使用这个命名空间前在其中添加一些值

```java
scope = {
     }
scope['x'] = 2
scope['y'] = 3
eval('x * y', scope)#结果为：6
```

同一个命名空间可用于多次调用exec或eval

```java
scope = {
     }
exec('x = 2', scope) 
eval('x * x', scope)#结果为：4
```

## 本章节介绍的新函数

函数
描述

chr(n)
返回一个字符串，其中只包含一个字符，这个字符对应于传入的顺序值n（0 ≤ n < 256）

eval(source[,globals[,locals]])
计算并返回字符串表示的表达式的结果

exec(source[, globals[, locals]])
将字符串作为语句执行

enumerate(seq)
生成可迭代的索引值对

ord©
接受一个只包含一个字符的字符串，并返回这个字符的顺序值（一个整数）

range([start,] stop[, step])
创建一个由整数组成的列表

reversed(seq)
按相反的顺序返回seq中的值，以便用于迭代

sorted(seq[,cmp][,key][,reverse])
返回一个列表，其中包含seq中的所有值且这些值是经过排序的

xrange([start,] stop[, step])
创建一个用于迭代的xrange对象

zip(seq1, seq2,…)
创建一个适合用于并行迭代的新序列
