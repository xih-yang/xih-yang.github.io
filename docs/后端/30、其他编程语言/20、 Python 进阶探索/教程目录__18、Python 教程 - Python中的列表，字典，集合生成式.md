# 18、Python 教程 - Python中的列表，字典，集合生成式
- 来源：https://ddkk.com/zhuanlan/other/python/3/18.html
- 分类：Python 进阶探索
- 分组：教程目录
## 一、列表生成式

列表生成式即List Comprehensions，是Python内置的非常简单却强大的可以用来创建list的生成式。

**实例1：**

要求生成一个列表，列表元素分别为`[1**1,2**2....9**9]`

若使用循环写：

```java
li = []
for i in range(1, 10):
    li.append(i ** i)
print(li)
```

使用列表生成式可以达到同样的效果且代码更加简单：

```java
print([i ** i for i in range(1, 10)])
```

**实例2：**

要求找出1～10之间的所有偶数

使用列表生成式：

```java
print([i for i in range(1, 11) if i % 2 == 0])
```

输出结果为：

```java
[2, 4, 6, 8, 10]
```

**实例3：**

使用列表生成式实现字符串的拼接：

```java
s1 = 'ABC'
s2 = '123'
print([i + j for i in s1 for j in s2])
```

输出结果为：

```java
['A1', 'A2', 'A3', 'B1', 'B2', 'B3', 'C1', 'C2', 'C3']
```

**实例4：**

使用列表生成式找出1～10之间的所有偶数 并且返回一个列表(包含以这个偶数为半径的园的面积)：

```java
import math
print([math.pi * r * r for r in range(2, 11, 2)])
```

输出结果为：

```java
[12.566370614359172, 50.26548245743669, 113.09733552923255, 201.06192982974676, 314.1592653589793]
```

**实例5：**

使用列表生成式 列表的字符串的大写改成小写，不是字符串的去掉：

```java
li = ['hello','World',24,24,41,7,8,False,'Apple']
print([s.lower() for s in li if isinstance(s,str)])			#函数isinstance判断s是否为str类型
```

输出结果为：

```java
['hello', 'world', 'apple']
```

## 二、字典生成式

Python内置的一种极其强大的生成字典的表达式。返回结果必须是字典

**实例1：**

使用字典生成式 实现:

假设有20个学生，学生的分数在60～100之间，筛选出成绩在90 分以上的学生

生成学生分数信息：

```java
import random
stuInfo = {
     }
for i in range(20):
    name = 'redhat' + str(i)
    score = random.randint(60, 100)
    stuInfo[name] = score
```

若使用循环实现筛选：

```java
for name, score in stuInfo.items():
    if score > 90:
        highscore[name] = score
print(highscore)
```

若使用字典生成式实现筛选：

```java
print({
     name: score for name, score in stuInfo.items() if score > 90})
```

输出结果为：

```java
{
     'redhat3': 92, 'redhat4': 93, 'redhat6': 96, 'redhat7': 96, 'redhat8': 91, 'redhat9': 92, 'redhat19': 91}
```

**实例2：**

使用字典生成式 实现:

将一个字典中所有的key值都变成大写

若使用循环实现筛选：

```java
d = dict(a=1, b=2)
new_d = {
     }
for i in d:
    new_d[i.upper()] = d[i]
print(new_d)
```

若使用字典生成式实现筛选：

```java
print({
     k.upper(): v for k, v in d.items()})
```

输出结果为：

```java
{
     'A': 1, 'B': 2}
```

**实例2：**

使用字典生成式 实现:

将一个字典中的大小写的key值合并，统一以小写输出

若使用循环实现筛选：

```java
d = dict(a=1, b=2, c=3, B=8, A=11)
# a:12 b:10  c:3
new_d = {
     }
for k, v in d.items():
    low_k = k.lower()
    if low_k not in new_d:
        new_d[low_k] = v
    else:
        new_d[low_k] += v
print(new_d)
```

若使用字典生成式实现筛选：

```java
print({
     k.lower(): d.get(k.upper(), 0) + d.get(k.lower(), 0) for k in d})
```

输出结果为：

```java
{
     'a': 12, 'b': 10, 'c': 3}
```

## 三、集合生成式

示例：

```java
print({
     i ** 2 for i in {
     1, 2, 3}})
print({
     i ** 2 for i in {
     1, 2, 3, 9, 12} if i % 3 == 0})
```

输出结果为：

```java
{
     1,4,9}
{
     81, 9, 144}
```
