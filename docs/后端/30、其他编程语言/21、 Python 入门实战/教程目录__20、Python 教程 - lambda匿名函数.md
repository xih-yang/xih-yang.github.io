# 20、Python 教程 - lambda匿名函数
- 来源：https://ddkk.com/zhuanlan/other/python/4/20.html
- 分类：Python 入门实战
- 分组：教程目录
## 1 lambda

- lambda 函数是一种小的匿名函数。一般函数使用def定义函数名及参数，lambda定义函数则没有显式函数名称，因此称为匿名函数。
- lambda 函数可接受任意数量的参数，但只能有一个表达式。

## 2 语法

```java
lambda arguments : expression
```

实例
一个lambda 函数，它把作为参数传入的数字加 10，然后打印结果：

```java
x = lambda a : a + 10
print(x(5))   15
```

**lambda 函数可接受任意数量的参数**：

实例
一个lambda 函数，它把参数 a 与参数 b 相乘并打印结果：

```java
x = lambda a, b : a * b
print(x(5, 6))    30
```

实例
一个lambda 函数，它把参数 a、b 和 c 相加并打印结果：

```java
x = lambda a, b, c : a + b + c
print(x(5, 6, 2))    13
```

## 3 为何使用 Lambda 函数？

将lambda 用作另一个函数内的匿名函数时，会更好地展现 lambda 的强大能力。

假设有一个带一个参数的函数定义，并且该参数将乘以未知数字：

```java
def myfunc(n):
    return lambda a : a * n
```

使用该函数定义来创建一个总是使所发送数字加倍的函数：

实例

```java
def myfunc(n):
    return lambda a : a * n
mydoubler = myfunc(2)
print(mydoubler(11))    22
```

或者，使用相同的函数定义来创建一个总是使发送的数字增加三倍的函数：

实例

```java
def myfunc(n):
    return lambda a : a * n
mytripler = myfunc(3)
print(mytripler(11))  33
```

或者，在同一程序中使用相同的函数定义来生成两个函数：

实例

```java
def myfunc(n):
    return lambda a : a * n
mydoubler = myfunc(2)
mytripler = myfunc(3)
print(mydoubler(11))    22
print(mytripler(11))    33
```

如果在短时间内需要匿名函数，请使用 `lambda` 函数。
