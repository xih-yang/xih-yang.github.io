# 14、Python 教程 - Python集合
- 来源：https://ddkk.com/zhuanlan/other/python/4/14.html
- 分类：Python 入门实战
- 分组：教程目录
## 1 集合（Set）

集合是无序和无索引的集合。在 Python 中，集合用**花括号**编写。

实例
创建集合：

```java
thisset = {
     "apple", "banana", "cherry"}
print(thisset)    {'cherry', 'apple', 'banana'}
```

注释：**集合是无序的**，因此无法确定项目的显示顺序。

## 2 访问元素

无法通过引用索引来访问 set 中的元素，因为 set 是无序的，项目没有索引。

但是可以使用 `for` 循环遍历 `set` 元素，或者使用 `in` 关键字查询集合中是否存在指定值。

实例
遍历集合，并打印值：

```java
thisset = {
     "apple", "banana", "cherry"}
for x in thisset:
    print(x)
```

实例
检查`set` 中是否存在 “banana”：

```java
thisset = {
     "apple", "banana", "cherry"}
print("banana" in thisset)    True
```

## 3 更改元素

集合一旦创建，就无法更改元素，但是可以添加新元素。

## 4 添加元素

要将一个元素添加到集合，请使用 `add()` 方法。

要向集合中添加多个元素，请使用 `update()` 方法。

实例
使用`add()` 方法向 set 添加项目：

```java
thisset = {
     "apple", "banana", "cherry"}
thisset.add("orange")
print(thisset)    {'cherry', 'apple', 'orange', 'banana'}
```

实例
使用`update()` 方法将多个项添加到集合中：

```java
thisset = {
     "apple", "banana", "cherry"}
thisset.update(["orange", "mango", "grapes"])
print(thisset)   {'cherry', 'mango', 'grapes', 'apple', 'orange', 'banana'}
```

## 5 获取 Set 的长度

要确定集合中有多少项，请使用 `len()` 方法。

实例
获取集合中的项目数：

```java
thisset = {
     "apple", "banana", "cherry"}
print(len(thisset))    3
```

## 6 删除项目

要删除集合中的项目，请使用 `remove()` 或 `discard()` 方法。

实例
使用`remove()` 方法来删除 “banana”：

```java
thisset = {
     "apple", "banana", "cherry"}
thisset.remove("banana")
print(thisset)    {'cherry', 'apple'}
```

注释：如果要删除的元素不存在，则 `remove()` 将引发错误。

实例
使用`discard()` 方法来删除 “banana”：

```java
thisset = {
     "apple", "banana", "cherry"}
thisset.discard("banana")
print(thisset)    {'cherry', 'apple'}
```

注释：如果要删除的元素不存在，则 `discard()` 不会引发错误。

还可以使用 `pop()` 方法删除项目，但此方法将删除最后一项。请记住，`set` 是无序的，因此**不会知道被删除的是什么元素**。

`pop()` 方法的返回值是被删除的元素。

实例
使用`pop()` 方法删除最后一项：

```java
thisset = {
     "apple", "banana", "cherry"}
x = thisset.pop()
print(x)    'cherry'
print(thisset)    {'apple', 'banana'}
```

注释：集合是无序的，因此在使用 `pop()` 方法时，不知道删除的是哪个元素。

实例
`clear()` 方法清空集合：

```java
thisset = {
     "apple", "banana", "cherry"}
thisset.clear()
print(thisset)    set()
```

实例
`del` 彻底删除集合：

```java
thisset = {
     "apple", "banana", "cherry"}
del thisset
print(thisset)    报错 
```

## 7 合并两个集合

在Python 中，有几种方法可以连接两个或多个集合。

您可以使用 `union()` 方法返回包含两个集合中所有项目的新集合，也可以使用 `update()` 方法将一个集合中的所有项目插入另一个集合中：

实例
`union()` 方法返回一个新集合，其中包含两个集合中的所有项目：

```java
set1 = {
     "a", "b" , "c"}
set2 = {
     1, 2, 3}
set3 = set1.union(set2)
print(set3)     {1, 'c', 2, 3, 'a', 'b'}
```

实例
`update()` 方法将 set2 中的项目插入 set1 中：

```java
set1 = {
     "a", "b" , "c"}
set2 = {
     1, 2, 3}
set1.update(set2)
print(set1)    {1, 'c', 2, 3, 'a', 'b'}
```

注释：`union()` 和 `update()` 都将排除任何重复项。

还有其他方法将两个集合连接起来，并且仅保留重复项，或者永远不保留重复项，请查看此页面底部的集合方法完整列表。

## 8 set() 构造函数

也可以使用 `set()` 构造函数来创建集合。

实例
使用`set()` 构造函数来创建集合：

```java
thisset = set(("apple", "banana", "cherry")) 请留意这个双括号
print(thisset)  {'cherry', 'apple', 'banana'}
```

## 9 Set 方法

Python 拥有一套能够在集合（set）上使用的内建方法。

方法
描述

add()
向集合添加元素。

clear()
删除集合中的所有元素。

copy()
返回集合的副本。

difference()
返回包含两个或更多集合之间差异的集合。

difference_update()
删除此集合中也包含在另一个指定集合中的项目。

discard()
删除指定项目。

intersection()
返回为两个其他集合的交集的集合。

intersection_update()
删除此集合中不存在于其他指定集合中的项目。

isdisjoint()
返回两个集合是否有交集。

issubset()
返回另一个集合是否包含此集合。

issuperset()
返回此集合是否包含另一个集合。

pop()
从集合中删除一个元素。

remove()
删除指定元素。

symmetric_difference()
返回具有两组集合的对称差集的集合。

symmetric_difference_update()
插入此集合和另一个集合的对称差集。

union()
返回包含集合并集的集合。

update()
用此集合和其他集合的并集来更新集合。
