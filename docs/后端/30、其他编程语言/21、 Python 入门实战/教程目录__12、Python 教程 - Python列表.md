# 12、Python 教程 - Python列表
- 来源：https://ddkk.com/zhuanlan/other/python/4/12.html
- 分类：Python 入门实战
- 分组：教程目录
## 1 Python 集合（数组）

Python 编程语言中有四种集合数据类型：

- 列表（List）是一种有序和可更改的集合。允许重复的成员。
- 元组（Tuple）是一种有序且不可更改的集合。允许重复的成员。
- 集合（Set）是一个无序和无索引的集合。没有重复的成员。
- 词典（Dictionary）是一个无序，可变和有索引的集合。没有重复的成员。

## 2 列表

列表是一个有序且可更改的集合。在 Python 中，列表用方括号编写。

创建列表：

```java
fruit_list = ["apple", "banana", "cherry"]
print(thislist)  ["apple", "banana", "cherry"]
```

## 3 访问元素

通过引用索引号来访问列表元素：

实例
打印列表的第二项：

```java
thislist = ["apple", "banana", "cherry"]
print(thislist[1])    "banana"
```

## 4 负的索引

负索引表示从末尾开始，-1 表示最后一个项目，-2 表示倒数第二个项目，依此类推。

实例
打印列表的最后一项：

```java
thislist = ["apple", "banana", "cherry"]
print(thislist[-1])  "cherry"
```

## 5 索引范围

可以通过指定范围的起点和终点来指定索引范围。指定范围后，返回值将是包含指定项目的新列表。

### 5.1 正索引范围

实例
返回第三、第四、第五项：

```java
thislist = ["apple", "banana", "cherry", "orange", "kiwi", "melon", "mango"]
print(thislist[2:5])    ["cherry", "orange", "kiwi"]
```

注释：搜索将从索引 2（包括）开始，到索引 5（不包括）结束。

请记住，第一项的索引为 0。

### 5.2 负索引的范围

如果要从列表末尾开始搜索，请指定负索引：

实例
此例将返回从索引 -4（包括）到索引 -1（排除）的项目：

```java
thislist = ["apple", "banana", "cherry", "orange", "kiwi", "melon", "mango"]
print(thislist[-4:-1])    ["orange", "kiwi", "melon"]
# 如要取到最后一个元素，可使用
print(thislist[-4:])
```

## 6 更改项目值

如需更改特定项目的值，请引用索引号：

实例
更改第二项：

```java
thislist = ["apple", "banana", "cherry"]
thislist[1] = "mango"
print(thislist)   ["apple", "mango", "cherry"]
```

## 7 遍历列表

使用for 循环遍历列表项：

实例
逐个打印列表中的所有项目：

```java
thislist = ["apple", "banana", "cherry"]
for x in thislist:
    print(x)
```

## 8 检查项目是否存在

如需确定列表中是否存在指定的项，请使用 `in` 关键字：

实例
检查列表中是否存在 “apple”：

```java
thislist = ["apple", "banana", "cherry"]
if "apple" in thislist:
    print("Yes, 'apple' is in the fruits list")    "Yes, 'apple' is in the fruits list"
```

## 9 列表长度

如需确定列表中有多少项，请使用 `len()` 方法：

实例
打印列表中的项目数：

```java
thislist = ["apple", "banana", "cherry"]
print(len(thislist))    3
```

## 10 添加元素

### 10.1 append()

如需将项目添加到列表的末尾，请使用 `append()` 方法：

实例
使用append() 方法追加项目：

```java
thislist = ["apple", "banana", "cherry"]
thislist.append("orange")
print(thislist)    ["apple", "banana", "cherry", "orange"]
```

### 10.2 insert()

要在指定的索引处添加项目，请使用 `insert()` 方法：

实例
插入项目作为第二个位置：

```java
thislist = ["apple", "banana", "cherry"]
thislist.insert(1, "orange")
print(thislist)    ['apple', 'orange', 'banana', 'cherry']
```

## 11 删除项目

有几种方法可以从列表中删除项目：

### 11.1 remove()

实例
`remove()` 方法删除指定的项目：

```java
thislist = ["apple", "banana", "cherry"]
thislist.remove("banana")
print(thislist)  ["apple", "cherry"]
```

### 11.2 pop()

`pop()` 方法删除指定的索引（如果未指定索引，则删除最后一项）：

```java
thislist = ["apple", "banana", "cherry"]
thislist.pop()   "cherry"
print(thislist)    ["apple", "banana"]
# pop()也可以指定索引删除
thislist.pop(0)    删除'apple'
```

### 11.3 del

`del` 关键字删除指定的索引：

```java
thislist = ["apple", "banana", "cherry"]
del thislist[0]
print(thislist)    ["banana", "cherry"]
```

del关键字也能完整地删除列表：

```java
thislist = [“apple”, “banana”, “cherry”]
del thislist
```

### 11.4 clear()

`clear()` 方法清空列表：

```java
thislist = ["apple", "banana", "cherry"]
thislist.clear()
print(thislist)    []
```

## 12 复制列表

只能通过键入 `list2 = list1` 来复制列表，因为：`list2` 将只是对 `list1` 的引用，`list1` 中所做的更改也将自动在 `list2` 中进行。

有一些方法可以进行复制，一种方法是使用内置的 `List` 方法 `copy()`。

### 12.1 copy()

使用`copy()` 方法来复制列表：

```java
thislist = ["apple", "banana", "cherry"]
mylist = thislist.copy()
print(mylist)    ['apple', 'banana', 'cherry']
```

### 12.2 list()

制作副本的另一种方法是使用内建的方法 `list()`。

实例
使用`list()` 方法复制列表：

```java
thislist = ["apple", "banana", "cherry"]
mylist = list(thislist)
print(mylist)    ['apple', 'banana', 'cherry']
```

## 13 列表合并

在Python中，有几种方法可以连接或串联两个或多个列表。

### 13.1 使用 + 运算符

```java
list1 = ["a", "b" , "c"]
list2 = [1, 2, 3]
list3 = list1 + list2
print(list3)    ['a', 'b', 'c', 1, 2, 3]
```

### 13.2 使用循环添加

连接两个列表的另一种方法是将 `list2` 中的所有项一个接一个地追加到 `list1` 中：

```java
list1 = ["a", "b" , "c"]
list2 = [1, 2, 3]
for x in list2:
    list1.append(x)
print(list1)    ['a', 'b', 'c', 1, 2, 3]
```

### 13.3 extend()

可以使用 `extend()` 方法，其目的是将一个列表中的元素添加到另一列表中：

实例
使用`extend()` 方法将 `list2` 添加到 `list1` 的末尾：

```java
list1 = ["a", "b" , "c"]
list2 = [1, 2, 3]
list1.extend(list2)
print(list1)    ['a', 'b', 'c', 1, 2, 3]
```

### 14 list() 构造函数

可以使用 `list()` 构造函数创建一个新列表。

实例
使用`list()` 构造函数创建列表：

```java
thislist = list(("apple", "banana", "cherry")) 请注意双括号
print(thislist)
```

## 15 列表方法

Python 有一组可以在列表上使用的内建方法。

方法
描述

append()
在列表的末尾添加一个元素

clear()
删除列表中的所有元素

copy()
返回列表的副本

count()
返回具有指定值的元素数量。

extend()
将列表元素（或任何可迭代的元素）添加到当前列表的末尾

index()
返回具有指定值的第一个元素的索引

insert()
在指定位置添加元素

pop()
删除指定位置的元素

remove()
删除具有指定值的项目

reverse()
颠倒列表的顺序

sort()
对列表进行排序
