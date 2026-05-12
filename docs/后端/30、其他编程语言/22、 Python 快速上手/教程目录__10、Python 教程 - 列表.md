# 10、Python 教程 - 列表
- 来源：https://ddkk.com/zhuanlan/other/python/5/10.html
- 分类：Python 快速上手
- 分组：教程目录
### 列表

序列是Python 中最基本的数据结构。

序列中的每个值都有对应的位置值，称之为索引，第一个索引是 0，第二个索引是 1，依此类推。

Python 有 6 个序列的内置类型，但最常见的是列表和元组。

列表都可以进行的操作包括索引，切片，加，乘，检查成员。

此外，Python 已经内置确定序列的长度以及确定最大和最小的元素的方法。

列表是最常用的 Python 数据类型，它可以作为一个方括号内的逗号分隔值出现。

列表的数据项不需要具有相同的类型

创建一个列表，只要把逗号分隔的不同的数据项使用方括号括起来即可。如下所示：

```java
list1 = ['Google', 'Baidu', 1997, 2000]
list2 = [1, 2, 3, 4, 5 ]
list3 = ["a", "b", "c", "d"]
list4 = ['red', 'green', 'blue', 'yellow', 'white', 'black']
```

### 访问列表中的值

与字符串的索引一样，列表索引从 0 开始，第二个索引是 1，依此类推。

通过索引列表可以进行截取、组合等操作。

```java
#!/usr/bin/python3
list = ['red', 'green', 'blue', 'yellow', 'white', 'black']
print( list[0] )
print( list[1] )
print( list[2] )
```

以上实例输出结果：

> red
>
> green
>
> blue

索引也可以从尾部开始，最后一个元素的索引为 -1，往前一位为 -2，以此类推。

```java
#!/usr/bin/python3
list = ['red', 'green', 'blue', 'yellow', 'white', 'black']
print( list[-1] )
print( list[-2] )
print( list[-3] )
```

以上实例输出结果：

> black
>
> white
>
> yellow

使用下标索引来访问列表中的值，同样你也可以使用方括号 [] 的形式截取字符，如下所示：

```java
#!/usr/bin/python3
nums = [10, 20, 30, 40, 50, 60, 70, 80, 90]
print(nums[0:4])
```

以上实例输出结果：

> [10, 20, 30, 40]

使用负数索引值截取：

```java
#!/usr/bin/python3
list = ['Google', 'Baidu', "Zhihu", "Taobao", "Wiki"]
# 读取第二位
print ("list[1]: ", list[1])
# 从第二位开始（包含）截取到倒数第二位（不包含）
print ("list[1:-2]: ", list[1:-2])
```

以上实例输出结果：

> list[1]: Baidu
>
> list[1:-2]: [‘Baidu’, ‘Zhihu’]

### 更新列表

你可以对列表的数据项进行修改或更新，你也可以使用 append() 方法来添加列表项，如下所示：

```java
#!/usr/bin/python3
list = ['Google', 'DYF', 1997, 2000]
print ("第三个元素为 : ", list[2])
list[2] = 2001
print ("更新后的第三个元素为 : ", list[2])
list1 = ['Google', 'DYF', 'Taobao']
list1.append('Baidu')
print ("更新后的列表 : ", list1)
```

以上实例输出结果：

> 第三个元素为 : 1997
>
> 更新后的第三个元素为 : 2001
>
> 更新后的列表 : [‘Google’, ‘DYF’, ‘Taobao’, ‘Baidu’]

### 删除列表元素

可以使用 del 语句来删除列表的的元素，如下实例：

```java
#!/usr/bin/python3
list = ['Google', 'Baidu', 1997, 2000]
print ("原始列表 : ", list)
del list[2]
print ("删除第三个元素 : ", list)
```

以上实例输出结果：

> 原始列表 : [‘Google’, ‘Baidu’, 1997, 2000]
>
> 删除第三个元素 : [‘Google’, ‘Baidu’, 2000]

### Python列表脚本操作符

列表对+ 和 * 的操作符与字符串相似。+ 号用于组合列表，* 号用于重复列表。

如下所示：

表达式
结果
描述

len([1, 2, 3])
3
长度

[1, 2, 3] + [4, 5, 6]
[1, 2, 3, 4, 5, 6]
组合

[‘Hi!’] * 4
[‘Hi!’, ‘Hi!’, ‘Hi!’, ‘Hi!’]
重复

3 in [1, 2, 3]
True
元素是否存在于列表中

for x in [1, 2, 3]: print(x, end=" ")
1 2 3
迭代

### Python列表截取与拼接

Python的列表截取与字符串操作类型，如下所示：

> L=[‘Google’, ‘Caiyua’, ‘Taobao’]

操作：

表达式
描述
结果

L[2]
‘Taobao’
读取第三个元素

L[-2]
‘Caiyua’
从右侧开始读取倒数第二个元素: count from the right

L[1:]
[‘Caiyua’, ‘Taobao’]
输出从第二个元素开始后的所有元素

```java
>>>L=['Google', 'Caiyua', 'Taobao']
>>> L[2]
'Taobao'
>>> L[-2]
'Caiyua'
>>> L[1:]
['Caiyua', 'Taobao']
>>>
```

列表还支持拼接操作：

```java
>>>squares = [1, 4, 9, 16, 25]
>>> squares += [36, 49, 64, 81, 100]
>>> squares
[1, 4, 9, 16, 25, 36, 49, 64, 81, 100]
>>>
```

### 嵌套列表

使用嵌套列表即在列表里创建其它列表，例如：

```java
>>>a = ['a', 'b', 'c']
>>> n = [1, 2, 3]
>>> x = [a, n]
>>> x
[['a', 'b', 'c'], [1, 2, 3]]
>>> x[0]
['a', 'b', 'c']
>>> x[0][1]
'b'
```

### 列表比较

列表比较需要引入 operator 模块的 eq 方法

```java
# 导入 operator 模块
import operator
a = [1, 2]
b = [2, 3]
c = [2, 3]
print("operator.eq(a,b): ", operator.eq(a,b))
print("operator.eq(c,b): ", operator.eq(c,b))
```

以上代码输出结果为：

> operator.eq(a,b): False
>
> operator.eq(c,b): True
