# 15、Python 教程 - Python字典
- 来源：https://ddkk.com/zhuanlan/other/python/4/15.html
- 分类：Python 入门实战
- 分组：教程目录
## 1 前言

字典（Dictionary）是一个无序、可变和有索引的集合。在 Python 中，字典用花括号编写，拥有键和值。

实例
创建并打印字典：

```java
thisdict =	{
  "brand": "Porsche",
  "model": "911",
  "year": 1963
}
print(thisdict)    {'brand': 'Porsche', 'model': '911', 'year': 1963}
```

## 2 访问元素

通过在方括号内引用其键名来访问字典的元素：

实例
获取“model” 键的值：

```java
thisdict =	{
  "brand": "Porsche",
  "model": "911",
  "year": 1963
}
x = thisdict["model"]  '911'
```

还有一个名为 `get()` 的方法会得到相同的结果：

实例
获取“model” 键的值：

```java
x = thisdict.get("model")
```

## 3 更改值

可以通过引用其键名来更改特定项的值：

实例
把“year” 改为 2019：

```java
thisdict =	{
  "brand": "Porsche",
  "model": "911",
  "year": 1963
}
thisdict["year"] = 2019
```

## 4 遍历字典

可以使用 `for` 循环遍历字典。

循环遍历字典时，返回值是字典的键，但也有返回值的方法。

实例
逐个打印字典中的所有键名：

```java
for x in thisdict:
    print(x)
```

实例
逐个打印字典中的所有值：

```java
for x in thisdict:
    print(thisdict[x])
```

实例
还可以使用 `values()` 函数返回字典的值：

```java
for x in thisdict.values():
    print(x)
```

实例
通过使用 `items()` 函数遍历键和值：

```java
for x, y in thisdict.items():
    print(x, y)
```

## 5 检查键是否存在

要确定字典中是否存在指定的键，请使用 `in` 关键字：

实例
检查字典中是否存在 “model”：

```java
thisdict =	{
    "brand": "Porsche",
    "model": "911",
    "year": 1963
}
if "model" in thisdict:
    print("Yes, 'model' is one of the keys in the thisdict dictionary")
```

## 6 字典长度

要确定字典有多少元素（键值对），请使用 `len()` 方法。

实例
打印字典中的项目数：

```java
print(len(thisdict))
```

## 7 添加元素

通过使用新的索引键并为其赋值，可以将项目添加到字典中：

实例

```java
thisdict =	{
  "brand": "Porsche",
  "model": "911",
  "year": 1963
}
thisdict["color"] = "red"
print(thisdict)    {'brand': 'Porsche', 'model': '911', 'year': 1963, 'color': 'red'}
```

## 8 删除元素

有几种方法可以从字典中删除项目：

实例
`pop()` 方法删除具有指定键名的项：

```java
thisdict =	{
    "brand": "Porsche",
    "model": "911",
    "year": 1963
}
thisdict.pop("model")
print(thisdict)    {'brand': 'Porsche', 'year': 1963}
```

实例
`popitem()` 方法删除最后插入的项目（**在 3.7 之前的版本中，删除随机项目**）：

```java
thisdict =	{
  "brand": "Porsche",
  "model": "911",
  "year": 1963
}
thisdict.popitem()
print(thisdict)    {'brand': 'Porsche', 'model': '911'}
```

实例
`del` 关键字删除具有指定键名的项目：

```java
thisdict =	{
    "brand": "Porsche",
    "model": "911",
    "year": 1963
}
del thisdict["model"]
print(thisdict)    {'brand': 'Porsche', 'year': 1963}
```

实例
`del` 关键字也可以完全删除字典：

```java
thisdict =	{
    "brand": "Porsche",
    "model": "911",
    "year": 1963
}
del thisdict
print(thisdict) this 会导致错误，因为 "thisdict" 不再存在。
```

实例
`clear()` 关键字清空字典：

```java
thisdict =	{
  "brand": "Porsche",
  "model": "911",
  "year": 1963
}
thisdict.clear()
print(thisdict)    {}
```

## 9 复制字典

不能通过键入 `dict2 = dict1` 来复制字典，因为：dict2 只是对 dict1 的引用，而 dict1 中的更改也将自动在 dict2 中进行。

有一些方法可以进行复制，一种方法是使用内建的字典方法 `copy()`。

实例
使用`copy()` 方法来复制字典：

```java
thisdict =	{
    "brand": "Porsche",
    "model": "911",
    "year": 1963
}
mydict = thisdict.copy()
print(mydict)  {'brand': 'Porsche', 'model': '911', 'year': 1963}
```

制作副本的另一种方法是使用内建方法 `dict()`。

实例
使用`dict()` 方法创建字典的副本：

```java
thisdict =	{
  "brand": "Porsche",
  "model": "911",
  "year": 1963
}
mydict = dict(thisdict)
print(mydict)    {'brand': 'Porsche', 'model': '911', 'year': 1963}
```

## 10 嵌套字典

词典也可以包含许多词典，这被称为嵌套词典。

实例
创建包含三个字典的字典：

```java
myfamily = {
  "child1" : {
    "name" : "Phoebe Adele",
    "year" : 2002
  },
  "child2" : {
    "name" : "Jennifer Katharine",
    "year" : 1996
  },
  "child3" : {
    "name" : "Rory John",
    "year" : 1999
  }
}
```

或者，如果想嵌套三个已经作为字典存在的字典：

实例
创建三个字典，然后创建一个包含其他三个字典的字典：

```java
child1 = {
  "name" : "Phoebe Adele",
  "year" : 2002
}
child2 = {
  "name" : "Jennifer Katharine",
  "year" : 1996
}
child3 = {
  "name" : "Rory John",
  "year" : 1999
}
myfamily = {
  "child1" : child1,
  "child2" : child2,
  "child3" : child3
}
```

## 11 dict() 构造函数

也可以使用 `dict()` 构造函数创建新的字典：

实例

```java
thisdict = dict(brand="Porsche", model="911", year=1963)
# 请注意，关键字不是字符串字面量
# 请注意，使用了等号而不是冒号来赋值
print(thisdict)  {'brand': 'Porsche', 'model': '911', 'year': 1963}
```

## 12 字典方法

Python 提供一组可以在字典上使用的内建方法。

方法
描述

clear()
删除字典中的所有元素

copy()
返回字典的副本

fromkeys()
返回拥有指定键和值的字典

get()
返回指定键的值

items()
返回包含每个键值对的元组的列表

keys()
返回包含字典键的列表

pop()
删除拥有指定键的元素

popitem()
删除最后插入的键值对

setdefault()
返回指定键的值。如果该键不存在，则插入具有指定值的键。

update()
使用指定的键值对字典进行更新

values()
返回字典中所有值的列表
