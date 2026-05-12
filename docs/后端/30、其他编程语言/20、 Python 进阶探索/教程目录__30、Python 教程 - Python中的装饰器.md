# 30、Python 教程 - Python中的装饰器
- 来源：https://ddkk.com/zhuanlan/other/python/3/30.html
- 分类：Python 进阶探索
- 分组：教程目录
## 一、装饰器

**1装饰器：**

把一个函数当作参数传递给另一个函数 返回一个替代版的函数

本质上就是一个返回函数的函数

**2作用：**

在不改变原函数的基础上 给函数增加功能

**3装饰器的原理**

函数可以作为参数被传递

例如：

```java
def say_hello(name):
    return f"Hello {name}"
def be_some(name):
    return f"Your {name}"
def greet_bob(func):
    return func("Bob")
print(greet_bob(say_hello))
print(greet_bob(be_some))
```

输出结果为：

```java
Hello Bob
Your Bob
```

## 二、装饰器的编写

**1基本结构**

示例1：

```java
def fun(f):
    def inner():
        print('*********')
        f()
        print('############')
    return inner
@fun语法糖
def hello():
    print('!!!!!!!!!!!!!!hello')
hello()
```

输出结果为：

```java
*********
!!!!!!!!!!!!!!hello
############
```

示例2：

```java
def outer(f):
    def inner(age):
        if age <=0:
            age = 0
        f(age)
    return inner
@outer
def say(age):
    print('year old:',age)
say(-1)
say(1)
```

输出结果为：

```java
year old: 0
year old: 1
```

**2装饰器实现一个函数计时器**

需要考虑两个问题：

> 1.被装饰的函数有返回值怎么办
>
> 2.如何保留被装饰函数的函数名和帮助信息文档

```java
import time
import random
import string
import functools
li = [random.choice(string.ascii_letters) for i in range(100)]
def timeit(func):
    @functools.wraps(func)			#用以保留被装饰函数的函数名和帮助信息文档
    def wrapper(*args, **kwargs):  接收可变参数 和关键字参数
        """这是一个装饰器timeit"""
        在函数运行之前
        start_time = time.time()
        执行函数
        res = func(*args, **kwargs)				#当函数有返回值时，使用值接受
        在函数运行之后
        end_time = time.time()
        print('运行时间为:%.6f' % (end_time - start_time))
        return res								#返回函数的返回值
    return wrapper
@timeit
def con_add():
    s = ''
    for i in li:
        s += (i + ',')
    print(s)
@timeit
def join_add():
    print(','.join(li))
def fun_list(n):
    """这是fun_list函数"""
    return [2 * i for i in range(n)]
@timeit
def fun_map(n):
    """这是fun_map函数"""
    return list(map(lambda x:x*2,range(n)))
fun_list(100000)			#没有被装饰，故没有输出结果
fun_map(100000)
print(fun_map.__doc__)
print(fun_list.__doc__)
print(fun_map.__name__)		#没有被装饰时，输出函数名称
print(fun_list.__name__)	#当被装饰时，输出装饰器内部函数（在这里是wrapper），当在装饰器中加了@functools.wraps(func)时输出函数本身的内容
```

输出结果为：

```java
运行时间为:0.008976
这是fun_map函数
这是fun_list函数
fun_map
fun_list
```

## 三、装饰器的练习

创建装饰器， 要求如下：

> 创建add_log装饰器， 被装饰的函数打印日志信息；
>
> 日志格式为: [字符串时间] 函数名: xxx， 运行时间：xxx, 运行返回值结果:xxx

解答：

```java
import time
import functools
def add_log(func):
    @functools.wraps(func)
    def wrapper(*args,**kwargs):
        start_time = time.time()
        res = func(*args,**kwargs)
        end_time = time.time()
        print('[%s] 函数名:%s,运行时间:%.6f,运行返回值的结果'
              ':%d' %(time.ctime(),func.__name__,
                      end_time-start_time,res))
        return res
    return wrapper
@add_log
def add(x,y):
    time.sleep(1)
    return x+y
add(1,10)
```

输出结果为：

```java
[Thu Jan  2 16:30:48 2020] 函数名:add,运行时间:1.017278,运行返回值的结果:11
```

## 四、多个装饰器的装饰顺序

当多个装饰器装饰同一个函数时，python中装饰器的执行顺序

**装饰顺序:** 就近原则

被装饰的函数组装装饰器时,是从下往上装饰

**执行顺序:** 就远原则

装饰器调用是从上往下调用

**1可以从下面的例子中看出结果：**

```java
def wrapper_out1(func):
    print('--out11---')
    def inner1(*args,**kwargs):
        print('----in11----')
        res = func(*args,**kwargs)
        print('----in12-----')
        return res
    print('---out---12')
    return inner1
def wrapper_out2(func):
    print('--out21---')
    def inner2(*args,**kwargs):
        print('----in21----')
        res = func(*args,**kwargs)
        print('----in22-----')
        return res
    print('---out---22')
    return inner2
@wrapper_out2
@wrapper_out1
def test():相当于：wrapper_out2(wrapper_out1(test)) === wrapper_out2(inner1)
    print('---test---')
    return 1 * 2
test()
print(test)
```

输出结果为：

```java
--out11---
---out---12
--out21---
---out---22
----in21----
----in11----
---test---
----in12-----
----in22-----
```

在上例中，wrapper_out2和wrapper_out1两个装饰器装饰test()相当于：

**wrapper_out2(wrapper_out1(test)) === wrapper_out2(inner1)**

**wrapper_out1 中的 func() 为 test()，wrapper_out2 中的 func() 为 inner1()**

**2多个装饰器的应用**

> 判断用户是否在系统中注册过，如果注册过判断是否是超级用户
>
> 用户的集合为：[‘root’,‘admin’,‘redhat’]，其中 root 为超级用户
>
> 程序应该首先判断用户是否在用户集合中，之后再判断是否是超级用户

```java
import functools
import inspect
login_session = ['root','admin','redhat']
def is_login(fun):
    @functools.wraps(fun)
    def warapper(*args,**kwargs):#('root',)
        if args[0] in login_session:
            temp = fun(*args,**kwargs)
            return temp
        else:
            print('Error:%s 没有登陆成功' %(args[0]))
    return warapper
def is_admin(fun):
    @functools.wraps(fun)
    """
     inspect.getcallargs会返回一个字典
     key:形参
     value:对应的实参
    """
    def wrapper(*args,**kwargs):
        inspect_res = inspect.getcallargs(fun,*args,**kwargs)
        print('inspect的返回值是:%s' %(inspect_res))
        if inspect_res.get('name') == 'root':
            temp = fun(*args,**kwargs)
            return temp
        else:
            print('not root user,no permisson add user')
    return wrapper
@is_login
@is_admin
def add_user(name): is_login((is_admin(adduser)) is_login(wrapper())
    print('add_user')
add_user('python')
add_user('root')
add_user('redhat')
```

输出结果：

```java
Error:python 没有登陆成功
inspect的返回值是:{
     'name': 'root'}
add_user
inspect的返回值是:{
     'name': 'redhat'}
not root user,no permisson add user
```

## 五、装饰器的练习

**1练习1：**

> 编写装饰器required_ints, 条件如下:
>
> 1). 确保函数接收到的每一个参数都是整数;
>
> 2). 如果参数不是整形数， 打印 TypeError:参数必须为整形

```java
import functools
def required_ints(func):
    @functools.wraps(func)
    def wrapper(*args,**kwargs): (1,2,....)
        for i in args:
            if isinstance(i,int):
                pass
            else:
                print('函数所有的参数并非全是int型')
            if not  isinstance(i,int):
                print('函数所有的参数并非都是int型')
                break
        else:
            res = func(*args,**kwargs)
            return res
    return wrapper
@required_ints
def add(a,b):
    return a+b
print(add(1,2.0))
print(add(1,2))
```

输出结果为：

```java
函数所有的参数并非都是int型
None
3
```

## 六、带参数的装饰器

示例：

```java
import time
import functools
def log(kind):			#装饰器带了参数kind
    def add_log(func):
        @functools.wraps(func)
        def wrapper(*args,**kwargs):
            start_time = time.time()
            res = func(*args,**kwargs)
            end_time = time.time()
            print('<%s> [%s] 函数名:%s,运行时间:%.6f,运行返回值的结果'
              ':%d' %(kind,time.ctime(),func.__name__,
                      end_time-start_time,res))
            return res
        return wrapper
    return add_log
@log('debug')			#传递参数'debug'
def add(x,y):
    time.sleep(1)
    return x+y
add(1,10)
```

输出结果为：

```java
<debug> [Thu Jan  2 17:15:04 2020] 函数名:add,运行时间:1.000325,运行返回值的结果:11
```

## 七、带参数的装饰器的应用

> #编写装饰器required_types, 条件如下:
>
> #1). 当装饰器为@required_types(int,float)确保函数接收到的每一个参数都是 int或者float类型;
>
> #2). 当装饰器为@required_types(list)确保函数接收到的每一个参数都是list类型;
>
> #3). 当装饰器为@required_types(str,int)确保函数接收到的每一个参数都是str或者int类型;
>
> #4). 如果参数不满足条件， 打印 TypeError:参数必须为xxxx类型

解答：

```java
import functools
def required_type(*kind):
    def require(fun):
        @functools.wraps(fun)
        def wrapper(*args,**kwargs):
            for i in args:
                if not isinstance(i,kind):
                    print('函数所有的参数并非',kind)
                    break
            else:
                res = fun(*args,**kwargs)
                return res
        return wrapper
    return require
# a = 1.0
# print(isinstance(a,(int,float)))
@required_type(int,float)
def add(a,b):
    return a+b
print(add(1,1.2))
print(add(1,'s'))
```

输出结果为：

```java
2.2
函数所有的参数并非 (<class 'int'>, <class 'float'>)
None
```
