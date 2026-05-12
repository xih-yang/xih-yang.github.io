# 12、Python 教程 - Python中的集合
- 来源：https://ddkk.com/zhuanlan/other/python/3/12.html
- 分类：Python 进阶探索
- 分组：教程目录
## 一、集合

**1集合里面的元素不可重复**

```java
s = {
     1, 1, 1, 1, 1, 3, 5, 67, 89}
print(s,type(s))
```

输出结果为：

```java
{
     1, 67, 3, 5, 89} <class 'set'>
```

**2定义一个空集合**

```java
s1 = {
     }
print(type(s1)) 默认情况下是dict
s2 = set([])
print(s2,type(s2))
```

输出结果为：

```java
<class 'dict'>
set() <class 'set'>
```

**3列表的快速去重**

```java
li = [1,23,4,5,6,6,6,7,8,9]
print(list(set(li)))
```

输出结果为：

```java
[1, 4, 5, 6, 7, 8, 9, 23]
```

## 二、集合中的常用方法

集合是一个可变的数据类型

**1添加顺序和存储顺序是不一样的**

```java
s = {
     4,5,6,7,8,9,2}
print(s)
```

输出结果为：

```java
{
     2, 4, 5, 6, 7, 8, 9}
```

**2添加**

```java
s.add(10)
print(s)
```

输出结果为：

```java
{
     2, 4, 5, 6, 7, 8, 9, 10}
```

**3添加多个元素**

```java
s.update({
     3,6,7,8})
print(s)
```

输出结果为：

```java
{
     2, 3, 4, 5, 6, 7, 8, 9, 10}
```

**4删除**

```java
a = s.pop()
print(s)
print(a)
```

输出结果为：

```java
{
     3, 4, 5, 6, 7, 8, 9, 10}
2
```

**5删除指定的元素**

```java
s.remove(9)
print(s)
```

输出结果为：

```java
{
     3, 4, 5, 6, 7, 8, 10}
```

**6排序**

```java
s1 = {
     2,3,1}
sorted(s1)
print(s1)
```

输出结果为：

```java
{
     1, 2, 3}
```

**7并集**

并集有两种方式：

```java
s1 = {
     2,3,1}
s2 = {
     2,3,4}
print('并集:',s1.union(s2))
print('并集:',s1 | s2)
```

输出结果为：

```java
并集: {
     1, 2, 3, 4}
并集: {
     1, 2, 3, 4}
```

**8交集**

交集有两种方式：

```java
print('交集:',s1.intersection(s2))
print('交集:',s1 & s2)
```

输出结果为：

```java
交集: {
     2, 3}
交集: {
     2, 3}
```

**9差集**

s1和s2的差集： s1中有哪些s2中没有的元素

```java
print('差集:',s1.difference(s2))
print('差集:',s1 -s2)
```

输出结果为：

```java
差集: {
     1}
差集: {
     1}
```

**10 对等差分:并集- 交集**

```java
print('对等差分:',s1.symmetric_difference(s2))
print('对等差分:',s1 ^ s2)
```

输出结果为：

```java
对等差分: {
     1, 4}
对等差分: {
     1, 4}
```

**11 是否子集**

s3是否是s4的子集：

```java
s3 = {
     'west','redhat','python'}
s4 = {
     'redhat','west','linux'}
print(s3.issubset(s4))
```

输出结果为：

```java
False
```

**12 两个集合是不是不相交**

```java
print(s3.isdisjoint(s4))
```

输出结果为：

```java
False
```

## 三、集合的特性

**1成员操作符**

```java
s = {
     1,2,3}
print(1 in s)
print(1 not in s)
```

输出结果为：

```java
True
False
```

**2for循环**

```java
for i in s:
    print(i,end='')
print()		#表示不换行
```

输出结果为：

```java
123
```
