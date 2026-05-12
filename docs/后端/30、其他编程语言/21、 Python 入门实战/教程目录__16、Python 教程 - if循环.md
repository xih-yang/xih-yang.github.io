# 16、Python 教程 - if循环
- 来源：https://ddkk.com/zhuanlan/other/python/4/16.html
- 分类：Python 入门实战
- 分组：教程目录
## 1 Python 条件和 If 语句

Python 支持来自数学的常用逻辑条件：

等于：`a == b`

不等于：`a != b`

小于：`a  b`

大于等于：`a >= b`

这些条件能够以多种方式使用，最常见的是“if 语句”和循环。

if语句使用 `if` 关键词来写。

实例
If语句：

```java
a = 66
b = 200
if b > a:
    print("b is greater than a")  b is greater than a
```

在这个例子中，我们使用了两个变量，a 和 b，作为 if 语句的一部分，它们用于测试 b 是否大于 a。因为 a 是 66，而 b 是 200，我们知道 200 大于 66，所以我们将“b大于a”打印到屏幕。

## 2 缩进

Python 依赖缩进，使用空格来定义代码中的范围。其他编程语言通常使用花括号来实现此目的。

实例
没有缩进的 If 语句（会引发错误）：

```java
a = 66
b = 200
if b > a:
print("b is greater than a") 会报错
```

## 3 elif

`elif` 关键字是 python 对“如果之前的条件不正确，那么试试这个条件”的表达方式。

实例

```java
a = 66
b = 66
if b > a:
    print("b is greater than a")
elif a == b:
    print("a and b are equal")
```

在这个例子中，a 等于 b，所以第一个条件不成立，但 elif 条件为 true，所以我们打印屏幕“a 和 b 相等”。

## 4 else

`else` 关键字捕获未被之前的条件捕获的任何内容。

实例

```java
a = 200
b = 66
if b > a:
    print("b is greater than a")
elif a == b:
    print("a and b are equal")
else:
    print("a is greater than b")
```

在这个例子中，a 大于 b，所以第一个条件不成立，elif 条件也不成立，所以我们转到 else 条件并打印到屏幕“a 大于 b”。

也可以使用没有 elif 的 else：

实例

```java
a = 200
b = 66
if b > a:
    print("b is greater than a")
else:
    print("b is not greater than a")
```

## 5 简写 If

如果只有一条语句要执行，则可以将其与 if 语句放在同一行。

实例
单行if 语句：

```java
a = 200
b = 66
if a > b: print("a is greater than b")
```

## 6 简写 If … else

如果只有两条语句要执行，一条用于 if，另一条用于 else，则可以将它们全部放在同一行：

实例
单行if else 语句：

```java
a = 200
b = 66
print("A") if a > b else print("B")
```

还可以在同一行上使用多个 else 语句：

实例
单行if else 语句，有三个条件：

```java
a = 200
b = 66
print("A") if a > b else print("=") if a == b else print("B")  A
```

## 7 and

`and` 关键字是一个逻辑运算符，用于组合条件语句：

实例
测试a 是否大于 b，且 c 是否大于 a：

```java
a = 200
b = 66
c = 500
if a > b and c > a:
    print("Both conditions are True")
```

## 8 or

`or` 关键字也是逻辑运算符，用于组合条件语句：

实例
测试a 是否大于 b，或者 a 是否大于 c：

```java
a = 200
b = 66
c = 500
if a > b or a > c:
    print("At least one of the conditions is True")
```

## 9 嵌套 If

可以在if 语句中包含 if 语句，这称为`嵌套 if 语句`。

实例

```java
x = 52
if x > 10:
    print("Above ten,")    Above ten,
    if x > 20:
        print("and also above 20!")  and also above 20!
    else:
        print("but not above 20.")    
```

## 10 pass 语句

if语句不能为空，但是如果出于某种原因写了无内容的 if 语句，请使用 `pass` 语句来避免错误，仅用来使代码语法正确，无实际意义。

实例

```java
a = 66
b = 200
if b > a:
    pass
```
