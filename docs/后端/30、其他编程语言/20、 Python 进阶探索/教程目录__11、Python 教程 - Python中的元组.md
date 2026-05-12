# 11、Python 教程 - Python中的元组
- 来源：https://ddkk.com/zhuanlan/other/python/3/11.html
- 分类：Python 进阶探索
- 分组：教程目录
## 一、元组

**列表：** 打了激素的数组

**元组：** 带了紧箍咒的列表 不可变的数据类型 没有增删改 可以存储任意数据类型

**1定义一个元组**

```java
t = (1,1.2,True,'westos')
print(t,type(t))
```

输出结果为：

```java
(1, 1.2, True, 'westos') <class 'tuple'>
```

**2如果元组里面包含可变的数据类型 可以间接的去修改元组的内容**

```java
t1 = ([1,2,3],7,8,9)
print(t1,type(t1))
t1[0].append(4)
print(t1)
```

输出结果为：

```java
([1, 2, 3], 7, 8, 9) <class 'tuple'>
([1, 2, 3, 4], 7, 8, 9)
```

**3元组只有一个元素的时候，元素后面一定要加逗号 否则数据类型不确定**

```java
t3 =(1)
t4 = ('westos',)
print(t3,type(t3))
print(t4,type(t4))
```

输出结果为：

```java
1 <class 'int'>
('westos',) <class 'tuple'>
```

**4元组和列表的相互转换**

```java
li = []
print(li,type(li))
t2 = tuple(li)
print(t2,type(t2))
li2 = list(t2)
print(li2,type(li2))
```

输出结果为：

```java
[] <class 'list'>
() <class 'tuple'>
[] <class 'list'>
```

## 二、元组的常用方法

**1使用index函数查看索引值**

```java
t = (1, 1.2, True, 'westos')
print(t.index('westos'))
```

输出结果为：`3`

**2使用xount函数查看元素在元组中出现的次数**

```java
t = (1, 1.2, True, 'redhat')
print(t.count('redhat'))
```

输出结果为：`1`

## 三、元组的特性

```java
t = (1, 1.2, True, 'redhat')
```

**1索引**

```java
print(t[0])
print(t[-1])
```

输出结果为：

```java
1
redhat
```

**2切片**

```java
print(t[::-1])
print(t[:-1])
```

输出结果为：

```java
('redhat', True, 1.2, 1)
(1, 1.2, True)
```

**3连接**

不同的数据类型之间 不能连接

```java
 print(t + (1,2,3))
```

输出结果为：

```java
(1, 1.2, True, 'redhat', 1, 2, 3)
```

**4重复**

```java
print(t * 3)
```

输出结果为：

```java
(1, 1.2, True, 'redhat', 1, 1.2, True, 'redhat', 1, 1.2, True, 'redhat')
```

**5for循环**

```java
for i in t:
    print(i)
```

```java
输出结果为：
```

```java
1
1.2
True
redhat
```

**6成员操作符**

```java
print(1 in t)
print(1 not in t)
```

输出结果为：

```java
True
False
```

## 四、元组的应用场景

**1交换变量值**

```java
a = 1
b = 2
a,b = b,a a,b=(1,2) b=(1,2)[0] a =(1,2)[1]
print(a)
print(b)
```

输出结果为：

```java
2
1
```

**2打印变量**

```java
name = 'westos'
age = 12
t = (name,age)
print('name:%s,age:%d' %(name,age))
print('name:%s,age:%d' %t)
```

输出结果为：

```java
name:westos,age:12
name:westos,age:12
```

另外一种方式：

```java
t = ('westos',12,'100')
name,age,nums = t
print(name)
print(age)
print(nums)
```

输出结果为：

```java
westos
12
100
```
