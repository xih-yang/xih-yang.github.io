# 19、Python 教程 - Python中的高阶函数
- 来源：https://ddkk.com/zhuanlan/other/python/3/19.html
- 分类：Python 进阶探索
- 分组：教程目录
## 一、高阶函数

- 实参是一个函数
- 函数的返回值也是一个函数

函数本身也是可以赋值给变量的 变量可以指向函数

示例：

```java
def fun(x,y,f):
    return f(x),f(y)
print(fun(-10,34,abs))				#函数abs的作用是求变量的绝对值
```

输出结果为：

```java
(10, 34)
```

## 二、内置高阶函数map

**map()**:接收两个参数 一个是函数 一个是序列

map将传入的函数依次作用到序列的每个元素 并且把结果作为新的序列返回

示例：

1对一个序列[-1,3,-4,-5]的每一个元素求绝对值

```java
print(list(map(abs,[-1,3,-4,-5])))
```

输出结果：

```java
[1, 3, 4, 5]
```

2序列的每个元素求阶乘

```java
def f(x):
    """对x求阶乘"""
    res = 1
    for i in range(1,x+1):
        res = res * i
    return res
li = [random.randint(2,7) for i in range(10)]
print(li)
print(list(map(f,li)))
```

输出结果：

```java
[5, 5, 6, 3, 4, 5, 6, 4, 4, 3]
[120, 120, 720, 6, 24, 120, 720, 24, 24, 6]
```

## 三、内置高阶函数reduce

**reduce()**:把一个函数作用在一个序列上，这个函数必须接收两个参数

reduce把结果继续和序列的下一个元素做累积计算

作用方式：

reduce(f,[1,2,3,4]) = f(f(f(1,2),3),4)

python2中reduce是内置函数

python3.x中需要`from functools import reduce`

示例：

```java
from functools import reduce
def multi(x,y):
    return x*y
print(reduce(multi,range(1,10)))
def add(x,y):
    return x+y
print(reduce(add,range(1,101)))
```

输出结果：

```java
362880
5050
```

## 四、高阶函数练习

> 将一个字符串转换成整型
>
> ‘12345’—12345
>
> ‘0’:0
>
> ‘1’:1
>
> ‘2’:2
>
> …
> ‘9’:9

解答：

```java
from functools import reduce
def str2int(s):
    def char2int(ch):
        c = {
     str(x): x for x in range(10)}
       print(c)
        return c[ch]
    def fun(n1, n2):
        return n1 * 10 + n2
    return reduce(fun, map(char2int, s))
num = str2int('24312412')
print(type(num), num)
```

输出结果为：

```java
<class 'int'> 24312412
```

## 五、内置高阶函数filter

**filter过滤函数**和map()类似，也接收一个函数和一个序列

但是和map()不同的是 filter()把传入的函数依次作用于序列的每个元素 然后根据返回值是True或者False决定保留还是丢弃该元素，True保留，False丢弃

示例：

```java
def isodd(num):
    if num % 2 == 0:
        return True
    else:
        return False
print(list(filter(isodd,range(10))))
```

输出结果：

```java
[0, 2, 4, 6, 8]
```

## 六、匿名函数

匿名函数的关键字 `lambda`

冒号前面是 形参， 冒号后面是返回值

示例：

```java
from functools import reduce
print(reduce(lambda x,y:x+y,range(10)))
print(list(map(lambda x:x**2,range(5))))
def isood(num):
    return num%2 ==0
print(list(filter(lambda x:x%2==0,range(10))))
```

输出结果：

```java
45
[0, 1, 4, 9, 16]
[0, 2, 4, 6, 8]
```

## 七、内置函数sort

**1sorted()函数**

对所有可迭代的对象进行排序操作

**sort与 sorted区别：**

sort是应用在list上的方法, sorted可以对所有可选代的对象进行排序操作

list的sort方法返回的是对已经存在的列表进行操作,而内建函数sorted方法返回的是一个新的list,而不是在原

来的基础上进行的操作

**2sorted语法**

sorted(iterable, key=None, reverse=False)

参数说明

**iterable**-可迭代对象.

**key**-主要是用来进行比较的元素,只有一个参数,具体的函数的参数就是取自于可迭代对象中,指定可选代对象中的一个元素来进行排序.

**reverse**-排序规则, reverse=True降序, reverse= False升序(默认）

示例：

```java
li = [4, 5, 6, 7, 2, 1, 3, 8, 9, 10]
# 不想改变原来的列表内容
li1 = li[:]
li1.sort()
print(li1)
print(li)
li2 = sorted(li)
print(li2)
print(li)
```

输出结果：

```java
[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]			#使用sort在原列表上排序，li1发生了变化
[4, 5, 6, 7, 2, 1, 3, 8, 9, 10]			#li没有发生变化	
[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]			#使用sorted函数创建一个新列表，在新列表上排序
[4, 5, 6, 7, 2, 1, 3, 8, 9, 10]			#li没有发生变化	
```

示例：

```java
li3 = [4, -5, -6, 7, 2, -1, 3, -8, 9, -10]
li4 = sorted(li3, key=abs)
print(li4)
```

输出结果：

```java
[-1, 2, 3, 4, -5, -6, 7, -8, 9, -10]			#按绝对值排序
```

示例：

```java
s = ['daas', 'dasas', 'FEDFerw', 'fsadER']
print(sorted(s))
print(sorted(s, key=str.lower))
print(sorted(s, key=str.upper))
```

输出结果：

```java
['FEDFerw', 'daas', 'dasas', 'fsadER']
['daas', 'dasas', 'FEDFerw', 'fsadER']
['daas', 'dasas', 'FEDFerw', 'fsadER']
```

示例：

```java
info = [
    商品名称 商品数量 商品价格
    ('apple1', 200, 100),
    ('apple2', 40, 32),
    ('apple3', 20, 10),
    ('apple4', 20, 15),
]
# 按照商品数量进行排序
def sorted_by_count(x):
    return x[1]
# 按照商品价格进行排序
def sorted_by_price(x):
    return x[2]
# 先按照商品数量进行排序 如果商品数量一致
# 则按照商品价格进行排序
def sorted_by_count_price(x):
    return x[1], x[2]
print(sorted(info, key=sorted_by_count))
print(sorted(info, key=sorted_by_count_price))
```

输出结果：

```java
[('apple3', 20, 10), ('apple4', 20, 15), ('apple2', 40, 32), ('apple1', 200, 100)]
[('apple3', 20, 10), ('apple4', 20, 15), ('apple2', 40, 32), ('apple1', 200, 100)]
```
