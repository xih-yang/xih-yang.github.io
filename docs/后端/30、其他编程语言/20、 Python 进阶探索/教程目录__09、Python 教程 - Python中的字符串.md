# 09、Python 教程 - Python中的字符串
- 来源：https://ddkk.com/zhuanlan/other/python/3/9.html
- 分类：Python 进阶探索
- 分组：教程目录
## 一、字符串

**字符串的定义**

示例：

```java
a = 'redhat'
b = "redhat's"			#当字符串中有单引号时，使用双引号阔起来
c = 'what\'s'
```

## 二、字符串的特性

s=‘hello’

**1索引：0 1 2 3 4 索引从0开始**

```java
print(s[0])
print(s[4])
print(s[-1]) 拿出最后一个字符
```

**2切片 s[start:stop:step] 从start开始到stop-1结束 step:步长**

```java
print(s[0:3])
print(s[0:4:2])
print(s[:])显示全部的字符
print(s[:3])# 显示前3个字符
print(s[::-1]) 字符串的反转
print(s[2:])除了前2个字符之外的其他字符
```

**3重复**

```java
print(s * 10)
```

**4连接**

```java
print('hello ' + 'python')
```

**5成员操作符**

返回True或False

```java
print('he' in s)		
print('aa' in s)
print('he' not in s)
```

**6for循环遍历**

```java
for i in s:
    print(i,end='')
```

**7.strip()函数，.lstrip()函数，.rstrip()函数**

`.strip()`函数不加参数时表示取出左右两边的空格 空格为广义的空格 包括：`\t``\n`

```java
 >>> s = '     hello     '
>>> s
'     hello     '
>>> s.strip()
'hello'
```

`.lstrip()`函数不加参数时表示取出左边的空格 空格为广义的空格 包括：`\t``\n`

```java
>>> s.lstrip()
'hello     '
```

`.rstrip()`函数不加参数时表示取出右边的空格 空格为广义的空格 包括：`\t``\n`

```java
>>> s.rstrip()
'     hello'
```

这三个函数也可以加变量：

```java
>>> s = 'helloh'
>>> s.strip('h')
'ello'
>>> s.lstrip('h')
'elloh'
>>> s.rstrip('h')
'hello'
>>> s.rstrip('he')
'hello'
>>> s.strip('he')
'llo'
```

## 三、字符串的常用方法

判断是否标题：

```java
>>> 'Hello'.istitle()
True
>>> 'hello'.istitle()
False
```

判断是否都是大小写字母：

```java
>>> 'hello'.isupper()
False
>>> 'hello'.islower()
True
>>> 'HHHello'.islower()
False
>>> 'HHHello'.isupper()
False
```

将字符串转换为大小写，标题：

```java
>>> 'HELLO'.lower()
'hello'
>>> a = 'HELLO'.lower()
>>> a
'hello'
>>> 'Herwr'.upper()
'HERWR'
>>> 'HELLO'.title()
'Hello'
```

判断字符串结尾：

```java
filename = 'hello.loggggg'
if filename.endswith('.log'):
    print(filename)
else:
    print('error.file')
```

输出结果为`error.file`

判断字符串开头：

```java
url = 'https://172.25.254.250/index.html'
if url.startswith('http://'):
    print('爬取网页')
else:
    print('不能爬取')
```

输出结果为`不能爬取`

## 四、字符串的判断

只要有一个元素不满足条件 就返回False：

判断是否全是数字：

```java
print('3121asdas'.isdigit())
```

返回False

判断是否全是字母：

```java
print('dsaddada'.isalpha())
```

返回True

判断是否全是字母或数字：

```java
print('dasdaad442134'.isalnum())
```

返回True

## 五、字符串的对齐

**1在固定长度中居中：**

```java
print('学生管理系统'.center(30))	#30个字符长度中居中
```

输出结果：

```java
print('学生管理系统'.center(30,'*'))
```

输出结果：`************学生管理系统************`

**2在固定长度中居左：**

```java
print('学生管理系统'.ljust(30,'*'))
```

输出结果：`学生管理系统************************`

**3在固定长度中居右：**

```java
print('学生管理系统'.rjust(30,'*'))
```

输出结果：`************************学生管理系统`

## 六、字符串的搜索和替换

```java
s = 'hello world hello'
```

**1find找到子字符串，并返回最小的索引**

```java
print(s.find('hello'))
```

输出结果为：`0`

```java
print(s.find('world'))
```

输出结果为：`6`

```java
print(s.rfind('hello'))
```

输出结果为：`12`

**2替换字符串中的hello为redhat**

```java
print(s.replace('hello','redhat'))
```

输出结果为：`redhat world redhat`

## 七、字符串的统计

**1统计字符串中字母的个数**

```java
print('hello'.count('l'))
```

输出结果为：`2`

```java
print('hello'.count('ll'))
```

输出结果为：`1`

**2统计字符串长度**

```java
print(len('westossssss'))
```

输出结果为：`11`

## 八、字符串的分离和连接

**1字符串的分离**

`.split()`函数分离字符串后会返回一个列表

```java
date = '2019-12-08'
date1 = date.split('-')
print(date1)
```

输出结果为：`['2019', '12', '08']`

**2字符串的连接**

`.join()`可以实现字符串连接

```java
print(''.join(date1))
print('/'.join(date1))
print('~~~'.join('hello'))
```

输出结果为

```java
20191208
2019/12/08
h~~~e~~~l~~~l~~~o
```
