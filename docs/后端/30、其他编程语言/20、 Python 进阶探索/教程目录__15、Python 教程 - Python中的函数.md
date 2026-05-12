# 15、Python 教程 - Python中的函数
- 来源：https://ddkk.com/zhuanlan/other/python/3/15.html
- 分类：Python 进阶探索
- 分组：教程目录
## 一、Python中的函数

**函数**是组织好的，可重复使用的，用来实现单一，或相关联功能的代码段

**定义函数**的一些规则：

- 函数代码块以 def 关键词开头，后接函数标识符名称和圆括号()。
- 任何传入参数和自变量必须放在圆括号中间。圆括号之间可以用于定义参数。
- 函数的第一行语句可以选择性地使用文档字符串—用于存放函数说明。
- 函数内容以冒号起始，并且缩进。
- return [表达式] 结束函数，选择性地返回一个值给调用方。不带表达式的return相当于返回 None。

如：

```java
def hello():
    print('hello')
    print('python')
```

通过函数名来调用函数：`hello()`

输出结果为：

```java
hello
python
```

## 二、函数中的形参与实参

函数中的参数可以分为形参和实参

**1形参**

**定义函数的时候**的变量 叫形参(名字任意)

如：

```java
def welcome(a):
    print('welcome',a)
```

其中a即为形参

**2实参**

真实的数据信息 被**调用函数的时候**传递的值叫实参

```java
welcome('tom')
welcome('lily')
```

其中的`tom`和`lily`为实参

## 三、形参

函数中的形参可以分为：**位置参数 默认参数 可变参数 关键字参数**

**1位置参数**

**位置参数:形参和实参必须保持一致**

如：

```java
def getinfo(name,age):
    print('姓名:',name,'年龄:',age)
getinfo('westos',12)
getinfo(12,'westos')
getinfo(age=12,name='westos')
```

输出结果：

```java
姓名: westos 年龄: 12
姓名: 12 年龄: westos
姓名: westos 年龄: 12
```

**2默认参数**

定义函数时制定默认参数，调用函数时若没有指定该参数的值，则使用默认参数，若指定了该参数的值，则使用指定的值

如：

```java
def mypow(x,y=2):
    print(x ** y)
mypow(2,3)		#指定了采数的值
mypow(2)		#没有指定参数，故使用默认参数
```

输出结果为：

```java
8
4
```

**3可变参数**

定义可变参数时，在参数前面加上 * 号，表示一个不定长的可变参数；

调用函数时，由于是可变参数，参数个数可随意指定，比如 fun(1,2,3,4,5)，甚至可以为空；

调用函数时，也可使用一个列表或者元组，如果 a 是一个列表或者元组，调用方式为：fun(*a)；

如：

```java
def mysum(*args):
    print(*args)
    print(args)
    sum  = 0
    for item in args:
        sum += item
    print(sum)
mysum(1,2,3,4,5,6,7,8)
```

输出结果为：

```java
1 2 3 4 5 6 7 8			#*args的值
(1, 2, 3, 4, 5, 6, 7, 8)		#args的值
36		#函数输出结果
```

**4参数的解包**

在参数名前加`*`可以实现对参数的解包

如：

```java
nums1 = [1,2,3]
nums2 = (1,2,3)
nums3 = {
     1,2,3}
mysum(*nums1)			# mysum函数为上一个例子的函数
mysum(*nums2)
mysum(*nums3)
```

输出结果为：

```java
1 2 3
(1, 2, 3)
6
1 2 3
(1, 2, 3)
6
1 2 3
(1, 2, 3)
6
```

字典的解包

```java
d = dict(a=1,b=2)
print(d)
print(*d)
```

输出结果为：

```java
{
     'a': 1, 'b': 2}		#字典
a b						#对字典解包后输出的是字典的key值
```

**5关键字参数**

可以实现输入字典的功能：

```java
def getinfo(name,age,**b):
    print(name)
    print(age)
    print(b)
getinfo('westos',12,**d)			#d为上一个例子中定义的字典
getinfo('tom',19,hobbies=['code','running'],gender='female')
```

输出结果为：

```java
westos
12
{
     'a': 1, 'b': 2}
tom
19
{
     'hobbies': ['code', 'running'], 'gender': 'female'}
```

## 四、函数的返回值

**返回值：**

- 函数运算的结果 还需要进一步操作，给函数一个返回值
- return用来返回函数执行的结果 如果函数没有返回值 默认返回None
- 函数一旦遇到return 函数执行结束 后面的代码不会执行
- 多个返回值的时候 python会帮我们封装成一个**元组类型**

如：

```java
def mypow(x,y=2):
    return x**y,x+y
    print('!!!!!')			# return后的内容不会被执行
a = mypow(4)
print(a)
```

输出结果为：

```java
(16, 6)
```

## 五、作用域、局部变量与全局变量

**局部变量：** 在某个函数内部定义，作用在函数内部。生命周期：从变量被创建开始到函数结束死亡。

**全局变量：** 定义在.py模块内部，作用在整个.py模块。生命周期：从变量被创造开始到.py模块结束死亡。

示例：

```java
a = 1
print('outside:',id(a))
def fun():
    global a 		#声明a为全局变量
    a = 5
    print('inside:',id(a))
fun()
print(a)
print(id(a))
```

输出结果：

```java
outside: 140729668857600
inside: 140729668857728
5
140729668857728
```

若不在函数`fun()`中加`global a` ，则输出结果为：

```java
outside: 140729672331008
inside: 140729672331136
1
140729672331008
```

## 七、函数的练习

### 练习一：

> 编写函数, 接收一个列表(包含30个整形数)和一个整形数k, 返回一个新列表.
>
> 函数需求:
>
> - 将列表下标k之前对应(不包含k)的元素逆序;
>
> - 将下标k及之后的元素逆序;
>
> 如：输入[1,2,3,4,5] 2 输出： [2,1,5,4,3]

解答：

```java
def fun(alist,k):
    if k < 0 or k > len(alist):
        return 'error key'
    return alist[:k][::-1] + alist[k:][::-1]
print(fun([1,2,3,4,5],2))
```

输出结果： `[2,1,5,4,3]`

### 练习二：

> 用函数实现求100-200里面所有的素数。
>
> 提示:素数的特征是除了1和其本身能被整除,其它数都不能被整除的数

解答：

```java
# 判断一个数是不是素数
def test(num):
    list = []定义一个列表 用于存储计算的数
    i = num -1 去除本身
    while i > 1: 去除1
        if num %i == 0 :判断是否有余数
            list.append(i) 将所有的能整除i的数加入列表
        i -= 1
    if len(list) == 0:# 如果列表为空 就是表示除了1和它本身能整除
        print(num,end=' ')
def test2(start_num,end_num):
    j = start_num
    while j < end_num:
        test(j)
        j += 1
test2(100,200)
print('')
```

输出结果为：

```java
101 103 107 109 113 127 131 137 139 149 151 157 163 167 173 179 181 191 193 197 199
```
