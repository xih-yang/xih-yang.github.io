# 10、Python 教程 - Python中的列表
- 来源：https://ddkk.com/zhuanlan/other/python/3/10.html
- 分类：Python 进阶探索
- 分组：教程目录
## 一、列表的创建

列表是最常用的Python数据类型，它可以作为一个方括号内的逗号分隔值出现。

列表的数据项**不需要具有相同的类型**

创建一个列表，只要把逗号分隔的不同的数据项使用方括号括起来即可

创建列表：

```java
a = [1,1.2,True,'redhat']
```

列表里也可以嵌套列表：

```java
a1 = [1,2,3,4,[1,1.2,True,'redhat']]
```

## 二、列表的特性

**1正向索引**

使用下标索引来访问列表中的值，同样你也可以使用方括号的形式截取字符

示例：

```java
list1 = ['Google', 'Runoob', 1997, 2000] 
print ("list1[0]: ", list1[0])
```

输出结果为：

```java
list1[0]:  Google
```

**2反向索引**

示例：

```java
print("list1的最后一个值: ", list1[-1])
```

输出结果为：

```java
list1的最后一个值:  2000
```

**3切片**

示例：

```java
list2 = [1, 2, 3, 4, 5, 6, 7]
print(list2[1:5])
print(list2[::-1])		#列表顺序颠倒
print(list2[1:])
print(list2[:-1])
```

输出结果为：

```java
[2, 3, 4, 5]
[7, 6, 5, 4, 3, 2, 1]
[2, 3, 4, 5, 6, 7]
[1, 2, 3, 4, 5, 6]
```

**4重复**

示例：

```java
list1 = ['Google', 'Runoob', 1997, 2000]
print(list1 * 3)
```

输出结果为：

```java
['Google', 'Runoob', 1997, 2000, 'Google', 'Runoob', 1997, 2000, 'Google', 'Runoob', 1997, 2000]
```

**5成员操作符**

示例：

```java
list1 = ['Google', 'Runoob', 1997, 2000]
print('Google' in list1)
print(1997 not in list1)
```

输出结果为：

```java
True
False
```

**6for循环**

示例：

```java
list1 = ['Google', 'Runoob', 1997, 2000]
for i in list1:
    print(i)
```

输出结果为：

```java
Google
Runoob
1997
2000
```

## 三、列表实战：

题目：输入某年某月某日（yyyy-MM-dd），判断这一天是这一年的第几天？

解答：

```java
cal = input('输入日期 yyyy-mm-dd:')
date = cal.split('-')拆分日期
print(date)
year = int(date[0])
month = int(date[1])
day = int(date[2])
arr = [0,31,28,31,30,31,30,31,31,30,31,30,31]
num = 0
if ((year % 4 ==0) and (year % 100 !=0) or(year % 400 ==0)):
    arr[2] = 29
for i in range(1,len(arr)):
    if month > i:
        num += arr[i]
    else:
        num += day
        break
print('天数：',num)
```

## 四、 列表元素的添加与删除

### 列表元素的添加

service = [‘http’,‘ftp’,‘ssh’]

**1append():追加一个元素到列表**

```java
service.append('firewalld')
print(service)
```

输出结果为：

```java
['http', 'ftp', 'ssh', 'firewalld']
```

**2extend():拉伸 追加多个元素到列表**

```java
service.extend(['mysql','nfs'])
print(service)
```

输出结果为：

```java
['http', 'ftp', 'ssh', 'firewalld', 'mysql', 'nfs']
```

**3insert():在指定索引处插入元素**

```java
service.insert(1,'dns')
print(service)
```

输出结果为：

[‘http’, ‘dns’, ‘ftp’, ‘ssh’, ‘firewalld’, ‘mysql’, ‘nfs’]

### 列表元素的删除

**1remove删除**

```java
service = ['http','ftp','ssh']
service.remove('ftp')
print(service)
```

输出结果为：

```java
['http', 'ssh']
```

**2del删除**

```java
service = ['http','ftp','ssh']
del service[1]
print(service)
```

输出结果为：

```java
['http', 'ssh']
```

**3pop删除**

pop函数可以删除列表最后一个元素并返回

```java
>>> service = ['http','ftp','ssh']
>>> service.pop()		#删除列表最后一个元素并返回
'ssh'
>>> service
['http', 'ftp']
>>> service.pop()
'ftp'
>>> service
['http']
>>> a = service.pop()			#可以将删除的值返回
>>> service
[]
>>> a
'http'
>>> service
[]
>>> service.pop()
Traceback (most recent call last):
  File "<stdin>", line 1, in <module>
IndexError: pop from empty list
```

## 五、列表元素的查看

service = [‘http’,‘ftp’,‘ssh’,‘mysql’,‘ssh’,‘http’]

**1查看元素在列表中出现的次数**

使用count函数可以查看元素在列表中出现的次数

```java
print(service.count('ssh'))
```

输出结果为：`2`

**2查看指定元素的索引值(可以指定搜索范围)**

使用index函数可以查看指定元素的索引值

```java
print(service.index('ssh'))
print(service.index('ssh',4,7))		#在索引值为4到7之间查找元素并返回元素索引值
```

输出结果为：

```java
2
4
```

## 六、列表的排序

**1排序**

使用sort函数可以实现列表的排序：

```java
service = ['ftp','ssh','http','mysql','http','ssh']默认按照ascii码进行排序的
service.sort(reverse=True)
print(service)
```

输出结果为：

```java
['ssh', 'ssh', 'mysql', 'http', 'http', 'ftp']
```

**2打乱排序**

可以使用random.shuffle函数打乱已经排好序的列表：

```java
import random
li = list(range(0,5))
print(li)
random.shuffle(li)
print(li)
```

输出结果为：

```java
[0, 1, 2, 3, 4]
[4, 3, 0, 1, 2]
```

## 七、列表元素的修改

```java
service = ['https','ftp','ssh','mysql']
```

**1通过索引，重新赋值**

```java
service[0] = 'http'
print(service)
```

输出结果为：

```java
['http', 'ftp', 'ssh', 'mysql']
```

**2通过切片赋值多个元素**

```java
service[:2] = ['samba','dns','firewalld']
print(service)
```

输出结果为：

```java
['samba', 'dns', 'firewalld', 'ssh', 'mysql']
```

## 八、列表实战2

**问题描述：**按照下面的要求实现对列表的操作：

产生一个列表，其中有 40 个元素，每个元素是 50 到 100 的一个随机整数

如果这个列表中的数据代表着某个班级 40 人的分数，请计算成绩低于平均分的学生人数

对上面的列表元素从大到小排序并输出li.sort(reverse=True)

**解答：**

```java
import random
score = []
# 循环40次
for count  in range(40):
    num = random.randint(50,100)
    score.append(num)
print('40人的分数为：',score)
sum_score = sum(score)
print(sum_score)
ave_num = sum_score/40
# 将小于平均成绩的成绩找出来 组成新的列表 并求列表的长度
less_ave = []
for i in score:
    if i < ave_num:
        less_ave.append(i)
long = len(less_ave)
print(long)
print('平均分数为：%.1f' %(ave_num))
print('有%d个学生低于平均分数：'%(long))
score.sort(reverse=True)
print('排序结果：',score)
```
