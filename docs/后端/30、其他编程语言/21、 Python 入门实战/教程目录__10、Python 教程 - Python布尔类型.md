# 10、Python 教程 - Python布尔类型
- 来源：https://ddkk.com/zhuanlan/other/python/4/10.html
- 分类：Python 入门实战
- 分组：教程目录
**布尔表示两值之一：True 或 False。**

## 1 布尔值

在编程中，通常需要知道表达式是 `True` 还是 `False`。

可以计算 Python 中的任何表达式，并获得两个答案之一，即 `True` 或 `False`。

比较两个值时，将对表达式求值，Python 返回布尔值答案：

实例

```java
print(8 > 7)   True
print(8 == 7)   False
print(8 < 7)    False
```

当在if 语句中运行条件时，Python 返回 `True` 或 `False`：

实例
根据条件是对还是错，打印一条消息：

```java
a = 200
b = 33
if b > a:
  print("b is greater than a")
else:
  print("b is not greater than a")
```

## 2 评估值和变量

`bool()` 函数可让您评估任何值，并为您返回 `True` 或 `False`。

实例
评估字符串和数字：

```java
print(bool("Hello"))  True
print(bool(10))  True
```

实例
评估两个变量：

```java
x = "Hello"
y = 10
print(bool(x))
print(bool(y))
```

## 3 大多数值都为 True

如果有某种内容，则几乎所有值都将评估为 `True`。

除空字符串外，任何字符串均为 `True`。

除0外，任何数字均为 `True`。

除空列表外，任何列表、元组、集合和字典均为 `True`。

实例
下例将返回 True：

```java
bool("abc")
bool(123)
bool(["apple", "cherry", "banana"])
```

## 4 某些值为 False

实际上，除空值（例如 ()、[]、{}、“”、数字 0 和值 None）外，没有多少值会被评估为 False。当然，值 False 的计算结果为 False。

实例
下例会返回 False：

```java
bool(False)
bool(None)
bool(0)
bool("")
bool(())
bool([])
bool({
     })
```

在这种情况下，一个值或对象的计算结果为 False，即如果对象由带有 `__len__` 函数的类生成的，且该函数返回 0 或 False：

实例

```java
class myclass():
    def __len__(self):
        return 0
myobj = myclass()
print(bool(myobj))
```

## 5 函数可返回布尔

Python 还有很多返回布尔值的内置函数，例如 `isinstance()` 函数，该函数可用于确定对象是否具有某种数据类型：

实例
检查对象是否是整数：

```java
x = 200
print(isinstance(x, int))   True
```
