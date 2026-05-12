# 29、Python 教程 - Python中的eval内置函数
- 来源：https://ddkk.com/zhuanlan/other/python/3/29.html
- 分类：Python 进阶探索
- 分组：教程目录
## 一、函数介绍

**1描述**

`eval()` 函数用来执行一个字符串表达式，并返回表达式的值。

**2语法**

以下是eval() 方法的语法:

```java
eval(expression[, globals[, locals]])
```

**3参数**

- expression – 表达式。
- globals – 变量作用域，全局命名空间，如果被提供，则必须是一个字典对象。
- locals – 变量作用域，局部命名空间，如果被提供，可以是任何映射对象。

## 二、函数常见用法

**1常见用法**

```java
>>>x = 7
>>> eval( '3 * x' )
21
>>> eval('pow(2,2)')
4
>>> eval('2 + 2')
4
>>> n=81
>>> eval("n + 4")
85
```

**2字符串转换成列表**

```java
a = "[[1,2],[3,4]]"
print(type(a))
b = eval(a)
c = list(a)
print(type(b))
print(type(c))
print(b)
print(c)
```

输出结果为：

```java
<class 'str'>
<class 'list'>
<class 'list'>
[[1, 2], [3, 4]]
['[', '[', '1', ',', '2', ']', ',', '[', '3', ',', '4', ']', ']']
```

**3字符串转换成字典**

```java
a = "{1:'a',2:'b'}"
print(type(a))
b = dict(eval(a))
print(type(b))
print(b)
```

输出结果为：

```java
<class 'str'>
<class 'dict'>
{
     1: 'a', 2: 'b'}
```

**4字符串转换称元组**

```java
a='([1,2],[3,4])'
print(type(a))
b = eval(a)
print(b)
```

输出结果为：

```java
<class 'str'>
([1, 2], [3, 4])
```
