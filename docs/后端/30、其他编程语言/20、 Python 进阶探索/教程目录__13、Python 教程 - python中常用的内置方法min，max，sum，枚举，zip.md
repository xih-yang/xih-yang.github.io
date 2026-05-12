# 13、Python 教程 - python中常用的内置方法min，max，sum，枚举，zip
- 来源：https://ddkk.com/zhuanlan/other/python/3/13.html
- 分类：Python 进阶探索
- 分组：教程目录
## 一、min，max，sum

**1求最小：**

```java
 >>> min(3,4)
 3
```

**2求最大：**

```java
 >>> max(4,5)
 5
```

**3累加**

```java
 >>> sum(range(1,101))			#累加
 5050
 >>> sum(range(1,101,2))		#奇数和
 2500
 >>> sum(range(2,101,2))		#偶数和
 2550
```

## 二、枚举

枚举：返回索引值和对应的value值

```java
for i,v in enumerate('hello'):
    print(i,v)
    print(str(i) + '---->' + v)
```

输出结果为：

```java
0 h
0---->h
1 e
1---->e
2 l
2---->l
3 l
3---->l
4 o
4---->o
```

## 三、zip

zip() 函数用于将可迭代的对象作为参数，将对象中对应的元素打包成一个个元组，然后返回由这些元组组成的列表。

如果各个迭代器的元素个数不一致，则返回列表长度与最短的对象相同，利用 * 号操作符，可以将元组解压为列表。

```java
s1 = '123'
s2 = 'ABC'
for i in zip(s1,s2):
    print(i)
for i in zip(s1,s2):
    print(''.join(i))
for i in zip(s1,s2):
    print('/'.join(i))
```

输出结果为：

```java
('1', 'A')
('2', 'B')
('3', 'C')
1A
2B
3C
1/A
2/B
3/C
```
