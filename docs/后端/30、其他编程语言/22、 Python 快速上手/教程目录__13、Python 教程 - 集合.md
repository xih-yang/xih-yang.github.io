# 13、Python 教程 - 集合
- 来源：https://ddkk.com/zhuanlan/other/python/5/13.html
- 分类：Python 快速上手
- 分组：教程目录
### 集合

集合（set）是一个无序的不重复元素序列。

可以使用大括号 { } 或者 set() 函数创建集合，注意：创建一个空集合必须用 set() 而不是 { }，因为 { } 是用来创建一个空字典。

创建格式：

> parame = {value01,value02,…}
>
> 或者
>
> set(value)

```java
>>> basket = {
     'apple', 'orange', 'apple', 'pear', 'orange', 'banana'}
>>> print(basket)                      这里演示的是去重功能
{
     'orange', 'banana', 'pear', 'apple'}
>>> 'orange' in basket                 快速判断元素是否在集合内
True
>>> 'crabgrass' in basket
False
>>> 下面展示两个集合间的运算.
...
>>> a = set('abracadabra')
>>> b = set('alacazam')
>>> a                                  
{
     'a', 'r', 'b', 'c', 'd'}
>>> a - b                              集合a中包含而集合b中不包含的元素
{
     'r', 'd', 'b'}
>>> a | b                              集合a或b中包含的所有元素
{
     'a', 'c', 'r', 'd', 'b', 'm', 'z', 'l'}
>>> a & b                              集合a和b中都包含了的元素
{
     'a', 'c'}
>>> a ^ b                              不同时包含于a和b的元素
{
     'r', 'd', 'b', 'm', 'z', 'l'}
```

类似列表推导式，同样集合支持集合推导式(Set comprehension):

```java
>>> a = {
     x for x in 'abracadabra' if x not in 'abc'}
>>> a
{
     'r', 'd'}
```

### 集合的基本操作

**1、添加元素**

语法格式如下：

> s.add( x )

将元素x 添加到集合 s 中，如果元素已存在，则不进行任何操作。

```java
>>> thisset = set(("Google", "Baidu", "Taobao"))
>>> thisset.add("Facebook")
>>> print(thisset)
{
     'Taobao', 'Facebook', 'Google', 'Baidu'}
```

还有一个方法，也可以添加元素，且参数可以是列表，元组，字典等，语法格式如下：

> s.update( x )

x可以有多个，用逗号分开。

```java
>>> thisset = set(("Google", "Baidu", "Taobao"))
>>> thisset.update({
     1,3})
>>> print(thisset)
{
     1, 3, 'Google', 'Taobao', 'Baidu'}
>>> thisset.update([1,4],[5,6])  
>>> print(thisset)
{
     1, 3, 4, 5, 6, 'Google', 'Taobao', 'Baidu'}
>>>
```

**2、移除元素**

语法格式如下：

> s.remove( x )

```java
>>> thisset = set(("Google", "Baidu", "Taobao"))
>>> thisset.remove("Taobao")
>>> print(thisset)
{
     'Google', 'Baidu'}
>>> thisset.remove("Facebook")   不存在会发生错误
Traceback (most recent call last):
  File "<stdin>", line 1, in <module>
KeyError: 'Facebook'
>>>
```

此外还有一个方法也是移除集合中的元素，且如果元素不存在，不会发生错误。格式如下所示：

> s.discard( x )

```java
>>> thisset = set(("Google", "Baidu", "Taobao"))
>>> thisset.discard("Facebook")  不存在不会发生错误
>>> print(thisset)
{
     'Taobao', 'Google', 'Baidu'}
```

我们也可以设置随机删除集合中的一个元素，语法格式如下：

> s.pop()

```java
thisset = set(("Google", "Baidu", "Taobao", "Facebook"))
x = thisset.pop()
print(x)
```

> $python3 test.py
>
> Baidu

多次执行测试结果都不一样。

set集合的 pop 方法会对集合进行无序的排列，然后将这个无序排列集合的左面第一个元素进行删除。

**3、计算集合元素个数**

语法格式如下：

> len(s)

计算集合 s 元素个数。

```java
>>> thisset = set(("Google", "Baidu", "Taobao"))
>>> len(thisset)
3
```

**4、清空集合**

语法格式如下：

> s.clear()

清空集合 s。

```java
>>> thisset = set(("Google", "Baidu", "Taobao"))
>>> thisset.clear()
>>> print(thisset)
set()
```

**5、判断元素是否在集合中存在**

语法格式如下：

> xin s

判断元素 x 是否在集合 s 中，存在返回 True，不存在返回 False。

```java
>>> thisset = set(("Google", "Baidu", "Taobao"))
>>> "Baidu" in thisset
True
>>> "Facebook" in thisset
False
>>>
```
