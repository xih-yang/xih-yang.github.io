# 06、Python 教程 - 抽象
- 来源：https://ddkk.com/zhuanlan/other/python/6/6.html
- 分类：Python 基础入门
- 分组：教程目录
## 自定义函数

要判断某个对象是否可调用，可使用内置函数callable

```java
import math
x = 1
y = math.sqrt
callable(x)#结果为：False
callable(y)#结果为：True
```

使用def（表示定义函数）语句，来定义函数

```java
def sq(name):
    return name + ',say:Hello,beyond!'
print(sq("yanyu"))#结果为：yanyu,say:Hello,beyond!
print(sq("sq"))#结果为：sq,say:Hello,beyond!
```

编写一个函数，返回一个由斐波那契数组成的列表

return语句用于从函数返回值，很重要！！！

```java
def fibs(num): 
    result = [0, 1] 
    for i in range(num-2): 
        result.append(result[-2] + result[-1]) 
    return result
print(fibs(10))#结果为：[0, 1, 1, 2, 3, 5, 8, 13, 21, 34]
print(fibs(15))#结果为：[0, 1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377]
```

### 1，给函数写文档

给函数编写文档，以确保其他人能够理解

可添加注释（以#打头的内容）

也可以添加独立的字符串

放在函数开头的字符串称为文档字符串（docstring），将作为函数的一部分存储起来

__doc__是函数的一个属性，属性名中的双下划线表示这是一个特殊的属性

```java
def beyond(x):
	'I like beyond band!!!'
	return x*x
beyond.__doc__#结果为：'I like beyond band!!!'
help(beyond)
'''
#结果为：
Help on function beyond in module __main__:
beyond(x)
    I like beyond band!!!
'''
beyond(8)#结果为：64
```

### 2，其实并不是函数的函数

在Python中，函数就是函数，即使它严格来说并非函数(例如什么都不返回)

```java
def beyond():
	print("I like beyond band!!!")
	return这里的return就是为了结束函数
	print("beyondyanyu")
x = beyond()#结果为：I like beyond band!!!
x#结果为：什么也没有
print(x)#结果为：None
```

## 参数魔法

### 修改参数

```java
def beyond(n):
	n = 'beyondyanyu'
yy = 'yanyu'
beyond(yy)
yy#结果为：'yanyu'
```

与下面代码段等价

```java
yy = 'yanyu'
n = yy
n = 'beyondyanyu'
yy#结果为：‘yanyu’
```

明显可见，n变了，但是yy没发生改变

在函数内部给参数赋值对外部没有任何影响

参数存储在**局部作用域**内

字符串（以及数和元组）是不可变的（immutable），不能修改，只能替换

为新值

```java
def change(n):
	n[0] = 'beyond'
names = ['yanyu','huangjiaju','huangjiaqiang']
change(names)
names#结果为：['beyond', 'huangjiaju','huangjiaqiang']
```

于下面代码段等价

```java
names = ['yanyu','huangjiaju','huangjiaqiang']
n = names
n[0] = 'beyond'
names#结果为：['beyond', 'huangjiaju','huangjiaqiang']
```

将同一个列表赋给两个变量时，这两个变量将同时指向这个列表

也就是说对列表操作的函数，已经对列表本身动手了！！！

要避免这样的结果，必须`创建列表的副本`

对序列执行`切片`操作时，返回的切片都是副本

如果你创建覆盖整个列表的切片，得到的将是列表的副本

```java
names = ['yanyu','huangjiaju','huangjiaqiang']
n = names[:]
n is names#结果为：False
n == names#结果为：True
n[0] ='gotohere'
n#结果为：['gotohere','huangjiaju','huangjiaqiang']
names#结果为：['yanyu','huangjiaju','huangjiaqiang']
#n是names这个列表的切片，此时的n和那么是两个不同的列表，尽管列表元素一样
```

下面开始和函数进行结合

```java
def change(n):
	n[0] = 'beyond'
names = ['yanyu','huangjiaju','huangjiaqiang']
change(names[:])
names#结果为：['beyond', 'huangjiaju', 'huangjiaqiang']
```

#### 1，为何要修改参数（位置参数）

使用函数来修改数据结构（如列表或字典）是一种不错的方式

编写程序：存储姓名，并让用户能够根据姓名、中间姓或姓找人

```java
def init(data): 
    data['first'] = {
     } 
    data['middle'] = {
     } 
    data['last'] = {
     }
def lookup(data, label, name): 
    return data[label].get(name)
def store(data, full_name): 
    names = full_name.split() 
    if len(names) == 2: names.insert(1, '') 
    labels = 'first', 'middle', 'last' 
    for label, name in zip(labels, names): 
        people = lookup(data, label, name) 
        if people: 
            people.append(full_name) 
        else: 
            data[label][name] = [full_name]
MyNames = {
     }
init(MyNames)
store(MyNames, 'Magnus Lie Hetland') 
print(lookup(MyNames, 'middle', 'Lie'))#结果为：['Magnus Lie Hetland']
#查找middle是Lie的
store(MyNames, 'Robin Hood')
store(MyNames, 'Robin Locksley') 
print(lookup(MyNames, 'first', 'Robin'))#结果为：['Robin Hood', 'Robin Locksley']
#查找first是Robin的
store(MyNames, 'Mr. Gumby') 
print(lookup(MyNames, 'middle', ''))#结果为：['Robin Hood', 'Robin Locksley', 'Mr. Gumby']
#查找middle是空的
```

#### 2，如果参数（位置参数）是不可变的

```java
def inc(x):
	return x+1
foo = 10
inc(foo)
foo#结果为：11
```

```java
def inc(x):
	x[0] = x[0] + 1
foo = [10]
inc(foo)
foo#结果为：[11]
```

### 关键字参数和默认值

```java
def hello_1(name,hobby):
    print('{},{}!'.format(name,hobby))
def hello_2(hobby,name):
    print('{},{}!'.format(hobby,name))
hello_1('yanyu','eat')#结果为：yanyu,eat!
hello_2('wangsiqi','sleep')#结果为：wangsiqi,sleep!
'''
yanyu--name       eat---hobby
wangsiqi--hobby   sleep---name
'''
hello_1(name='huangjiaju',hobby='sing')#结果为：huangjiaju,sing!
hello_1(hobby='sing',name='huangjiaju')#结果为：huangjiaju,sing!
hello_2(name='huangjiaju',hobby='sing')#结果为：sing,huangjiaju!
```

```java
def hello_3(name='beyond',hobby='song'):
	print('{},{}!'.format(name,hobby))
hello_3()#结果为：beyond,song!
hello_3('huangjiaju')#结果为：huangjiaju,song!
hello_3('huangjiaqiang','guitar')#结果为：huangjiaqiang,guitar!
hello_3(hobby='game')#结果为：beyond,game!
```

函数hello_4可能要求必须指定name，而hobby和punctuation是可选的

```java
def hello_4(name,hobby='guitar',punctuation='!'):
    print('{},{}{}'.format(hobby,name,punctuation))
hello_4('beyond')#结果为：guitar,beyond!
hello_4('beyond','song')#结果为：song,beyond!
hello_4('beyond','song','$$$')#结果为：song,beyond$$$
hello_4('beyond',punctuation='...')#结果为：guitar,beyond...
hello_4('yanyu',hobby='play football')#结果为：play football,yanyu!
hello_4()#结果为：TypeError: hello_4() missing 1 required positional argument: 'name'
```

### 收集参数

参数前面的星号将提供的所有值都放在一个元组中，也就是将这些值收集起来

```java
def print_params(*params): 
    print(params)
print_params('beyondyanyu')#结果为：('beyondyanyu',)
print_params(1014, 522, 319)#结果为：(1014, 522, 319)
```

与下面的代码段等价

星号意味着收集余下的位置参数，如果没有可供收集的参数，params将是一个空元组。

```java
def print_params_2(title, *params): 
    print(title) 
    print(params)
print_params_2('Params:', 1, 2, 3)
#结果为：
#Params:
#(1, 2, 3)
print_params_2('Nothing:')
#结果为：
#Nothing:
#()
```

与赋值时一样，带星号的参数也可放在**其他位置**（而**不是最后**）

在这种情况下你需要做些额外的工作：**使用名称来指定后续参数**。

```java
def in_the_middle(x, *y, z): 
    print(x, y, z)
in_the_middle(1, 2, 3, 4, 5, z=7)#结果为：1 (2, 3, 4, 5) 7
in_the_middle(1, 2, 3, 4, 5, 7)#结果为：TypeError: in_the_middle() missing 1 required keyword-only argument: 'z'
```

星号不会收集关键字参数

```java
def print_params_2(band, *params): 
    print(band) 
    print(params)
print_params_2('beyond', age=22)#结果为：TypeError: print_params_2() got an unexpected keyword argument 'age'
```

要收集关键字参数，可使用两个星号；这样得到的是一个**字典**而不是元组

```java
def print_params_3(band, **params): 
    print(band) 
    print(params)
print_params_3('beyond', x=1, y=2, z=3)
'''
结果为：
beyond
{'x': 1, 'y': 2, 'z': 3}
'''
```

可结合使用这些技术

```java
def print_params_4(x, y, z=3, *pospar, **keypar): 
    print(x, y, z) 
    print(pospar) 
    print(keypar)
print_params_4(1, 2, 3, 5, 6, 7, foo=1, bar=2)
'''
结果为：
1 2 3
(5, 6, 7)
{'foo': 1, 'bar': 2}
'''
print_params_4(1, 2)
'''
结果为：
1 2 3
()
{}
'''
```

### 分配参数

分配参数,通过在调用函数（而不是定义函数）时使用运算符*实现的

```java
def add(x, y): 
    return x + y
beyond = (10, 14)
add(*beyond)#结果为：24
```

使用运算符**，可将字典中的值分配给关键字参数

```java
def hello_3(name='beyond',hobby='song'):
    print('{},{}!'.format(name,hobby))
params = {
     'name': 'huangjiaju', 'hobby': 'haikuotiankong'}
hello_3(**params)#结果为：huangjiaju,haikuotiankong!
```

如果在定义和调用函数时都使用*或**，将只传递元组或字典。

对于函数with_stars，我在定义和调用它时都使用了星号，而对于函数without_ stars，我在定义和调用它时都没有使用，但这两种做法的效果相同。

只有在定义函数（允许可变数量的参数）或调用函数时（拆分字典或序列）使用，星号才能发挥作用

```java
def with_stars(**kwds): 
    print(kwds['name'], 'is', kwds['age'], 'years old') 
def without_stars(kwds): 
    print(kwds['name'], 'is', kwds['age'], 'years old')
args = {
     'name': 'huangjiaju', 'age': 31}
with_stars(**args)#结果为：huangjiaju is 31 years old
without_stars(args)#结果为：huangjiaju is 31 years old
```

### 练习使用参数

```java
def story(**kwds): 
    return 'Once upon a time, there was a {job} called {name}.'.format_map(kwds) 
def power(x, y, *others): 
    if others: 
        print('Received redundant parameters:', others) 
    return pow(x, y) 
def interval(start, stop=None, step=1): 
    'Imitates range() for step > 0' 
    if stop is None: 如果没有给参数stop指定值，
        start, stop = 0, start 就调整参数start和stop的值
    result = [] 
    i = start 从start开始往上数
    while i < stop: 数到stop位置
        result.append(i) 将当前数的数附加到result末尾
        i += step 增加到当前数和step（> 0）之和
    return result
print(story(job='band', name='beyond'))#结果为：Once upon a time, there was a band called beyond.
print(story(name='huangjiaju', job='singer'))#结果为：Once upon a time, there was a singer called huangjiaju.
params = {
     'job': 'language', 'name': 'Python'}
print(story(**params))#结果为：Once upon a time, there was a language called Python.
del params['job']
print(story(job='great code', **params))#结果为：Once upon a time, there was a great code called Python.
power(2, 3)#结果为：8
power(3, 2)#结果为：9
power(y=3, x=2)#结果为：8
params = (5,) * 2
power(*params)#结果为：3125
power(3, 3, 'Hello, beyond')
'''
结果为：
Received redundant parameters: ('Hello, beyond',)
27
'''
interval(10)#结果为：[0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
interval(1, 5)#结果为：[1, 2, 3, 4]
interval(3, 12, 4)#结果为：[3, 7, 11]
power(*interval(3, 7))
'''
结果为：
Received redundant parameters: (5, 6)
81
'''
```

## 作用域

可将**变量**视为**指向值的名称**

执行赋值语句x = 1后，名称x指向值1;

这几乎与使用字典时一样（字典中的键指向值），只是你使用的是“看不见”的字典

有一个名为**vars**的内置函数，它返回这个不可见的字典

一般而言，不应修改vars返回的字典，因为根据Python官方文档的说法，这样做的结果是不确定的。换而言之，可能得不到你想要的结果。

```java
x = 1
scope = vars()
scope['x']#结果为：1
scope['x'] += 1
x#结果为：2
```

这种“看不见的字典”称为**命名空间**或**作用域**。

除全局作用域外，每个函数调用都将创建一个。

**在这里，函数foo修改（重新关联）了变量x，但当你最终查看时，它根本没变。

这是因为调用foo时创建了一个新的命名空间，供foo中的代码块使用。

赋值语句x = 42是在这个内部作用域（局部命名空间）中执行的，不影响外部（全局）作用域内的x。

在函数内使用的变量称为局部变量（与之相对的是全局变量）。

参数类似于局部变量，因此参数与全局变量同名不会有任何问题。**

```java
def foo(): x = 42
x = 1
foo()
x#结果为：1
```

```java
def output(x): print(x)
x = 1
y = 2
output(y)#结果为：2
```

像下面代码这样访问全局变量是众多bug的根源。务必慎用全局变量。

```java
def combine(name): print(name + band)
band = 'beyond'
combine('huangjiaju')#结果为：huangjiajubeyond
```

读取全局变量的值通常不会有问题，但还是存在出现问题的可能性。

如果有一个局部变量或参数与你要访问的全局变量同名，就无法直接访问全局变量，因为它被局部变量遮住了。

如果需要，可使用函数globals来访问全局变量。这个函数类似于vars，返回一个包含全局变量的字典。（locals返回一个包含局部变量的字典。）

例如，在前面的示例中，如果有一个名为name的全局变量，就无法在函数combine中访问它，因为有一个与之同名的参数。

然而，必要时可使用globals()[‘name’]来访问它。

```java
def combine(name):
    print(name + globals()['name'])
name = 'huangjiaju'
combine('beyond')#结果为：beyondhuangjiaju
```

在函数内部给变量赋值时，该变量默认为局部变量

可通过**global**明确地告诉Python它是全局变量

```java
x = 1
def change_global():
    global x
    x = x + 1
change_global()
x#结果为：2
```

### 作用域嵌套

Python函数可以嵌套，即可将一个函数放在另一个函数内

```java
def foo(): 
    def bar(): 
        print("Hello, world!") 
    bar()
```

嵌套通常用处不大，即：**使用一个函数来创建另一个函数**

一个函数位于另一个函数中，且外面的函数返回里面的函数。也就是**返回一个函数，而不是调用它**。

重要的是，返回的函数能够访问其定义所在的作用域。换而言之，它携带着自己所在的环境（和相关的局部变量）！

每当外部函数被调用时，都将重新定义内部的函数，而变量factor的值也可能不同。

由于Python的嵌套作用域，可在内部函数中访问这个来自外部局部作用域（multiplier）的变量。

像multiplyByFactor这样存储其所在作用域的函数称为**闭包**。

通常，不能给外部作用域内的变量赋值，但如果一定要这样做，可使用关键字**nonlocal**。这个关键字的用法与global很像，让你能够给外部作用域（非全局作用域）内的变量赋值。

```java
def multiplier(factor): 
    def multiplyByFactor(number): 
        return number * factor 
    return multiplyByFactor
double = multiplier(2)
double(5)#结果为：10
triple = multiplier(3)
triple(3)#结果为：9
multiplier(5)(4)#结果为：20
```

## 递归

递归意味着引用（这里是调用）自身

递归函数通常包含下面两部分：

**基线条件**（针对最小的问题）：满足这种条件时函数将直接返回一个值。

**递归条件**：包含一个或多个调用，这些调用旨在解决问题的一部分。

函数调用自身时，是两个不同的函数［更准确地说，是不同版本（即命名空间不同）的同一个函数］在交流。

### 阶乘和幂

**阶乘**

n的阶乘为n × (n-1) × (n-2) × … × 1

可以使用循环：首先将result设置为n，再将其依次乘以1到n-1的每个数字，最后返回result

```java
def factorial(n): 
    result = n 
    for i in range(1, n): 
        result *= i 
    return result
factorial(5)#结果为：120
```

阶乘的数学定义：

1的阶乘为1

对于大于1的数字n，其阶乘为n-1的阶乘再乘以n

其中，函数调用factorial(n)和factorial(n – 1)是不同的实体

```java
def factorial(n): 
    if n == 1: 
        return 1 
    else: 
        return n * factorial(n - 1)
factorial(5)#结果为：120
```

**幂**

计算幂，可使用内置函数pow和运算符**

**power(x, n)**（x的n次幂）是将数字x自乘n - 1次的结果,即将n个x相乘的结果。

换而言之，power(2, 3)是2自乘两次的结果，即2 × 2 × 2 = 8。

```java
def power(x, n): 
    result = 1 
    for i in range(n): 
        result *= x 
    return result
power(2, 3)#结果为：8
```

幂的数学定义：

对于任何数字x，power(x, 0)都为1

n>0时，power(x, n)为power(x, n-1)与x的乘积

```java
def power(x, n): 
    if n == 0: 
        return 1 
    else: 
        return x * power(x, n - 1)
power(2, 3)#结果为：8
```

使用递归的**可读性**高

### 二分查找

玩个游戏：对方心里想着一个1～100的数字，你必须猜出是哪个。当然，猜

100次肯定猜对，但最少需要猜多少次呢？

思路：
如果上限和下限相同，就说明它们都指向数字所在的位置，因此将这个数字返回

否则，找出区间的中间位置（上限和下限的平均值），再确定数字在左半部分还是右半部分。然后在继续在数字所在的那部分中查找

**关键在于元素是经过排序的**

```java
def search(sequence, number, lower=0, upper=None): 
    if upper is None: upper = len(sequence) - 1
    if lower == upper: 
        assert number == sequence[upper] 
        return upper 
    else: 
        middle = (lower + upper) // 2 
        if number > sequence[middle]: 
            return search(sequence, number, middle + 1, upper) 
        else: 
            return search(sequence, number, lower, middle)
seq = [34, 67, 8, 123, 4, 100, 95]
seq.sort()
seq#结果为：[4, 8, 34, 67, 95, 100, 123]
search(seq, 34)#结果为：2
search(seq, 100)#结果为：5
```

Python提供了一些有助于进行这种函数式编程的函数：map、filter和reduce

```java
# 与[str(i) for i in range(10)]等价
list(map(str, range(10)))结果为：['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']
```

可使用filter根据布尔函数的返回值来对元素进行过滤

```java
def func(x): 
    return x.isalnum()
seq = ["foo", "x41", "?!", "***"]
list(filter(func, seq))#结果为：['foo', 'x41']
```

如果转而使用列表推导，就无需创建前述自定义函数

```java
seq = ["foo", "x41", "?!", "***"]
[x for x in seq if x.isalnum()]#结果为：['foo', 'x41']
filter(lambda x: x.isalnum(), seq)
```

Python提供了一种名为lambda表达式的功能，让你能够创建内嵌的简单函数（主要供map、filter和reduce使用）

如果你要将序列中的所有数相加，可结合使用reduce和lambda x, y: x+y。

等价于内置函数sum，当然，下面这个案例确实还不如sum函数方便。

```java
from functools import reduce
numbers = [72, 101, 108, 108, 111, 44, 32, 119, 111, 114, 108, 100, 33]
reduce(lambda x, y: x + y, numbers)#结果为：1161
```

## 本章节介绍的新函数

函数
描述

map(func, seq[, seq, …])
对序列中的所有元素执行函数

filter(func, seq)
返回一个列表，其中包含对其执行函数时结果为真的所有元素

reduce(func, seq[, initial])
等价于 func(func(func(seq[0], seq[1]), seq[2]), …)

sum(seq)
返回 seq 中所有元素的和

apply(func[, args[, kwargs]])
调用函数（还提供要传递给函数的参数）
