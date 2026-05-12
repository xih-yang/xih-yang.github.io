# 03、Python 教程 - Python中的输入输出
- 来源：https://ddkk.com/zhuanlan/other/python/3/3.html
- 分类：Python 进阶探索
- 分组：教程目录
## python的输入

### 一、python3.x输入

`input()`:接收任意数据类型

```java
>>> input('Num:')
Num:2
'2'
>>> input('Num:')
Num:redhat
'redhat'
>>> input('Num:')
Num:1.2
'1.2'
>>> input('Num:')
Num:False
'False'
>>> import getpass
>>> num = getpass.getpass('请输入密码：')
请输入密码：
>>> num	
'123'
```

`input` 函数接受的输入会转换为`str`类型，若要求输入返回的为整型则加`int(input())`

### 二、python2.x输入

**-input():只支持接收正确的数据类型 **

-raw_input():接收任意数据类型 —str，相当于python3中的input**

```java
>>> input('Num:')
Num:2
2
>>> input('Num:')
Num:redhat
Traceback (most recent call last):
  File "<stdin>", line 1, in <module>
  File "<string>", line 1, in <module>
NameError: name 'redhat' is not defined
>>> input('Num:')
Num:'redhat'
'redhat'
>>> input('Num:')
Num:True
True
>>> input('Num:')
Num:1.2
1.2
>>> raw_input('Num:')
Num:2
'2'
>>> raw_input('Num:')
Num:redhat
'redhat'
>>> raw_input('Num:')
Num:3.0
'3.0'
>>> raw_input('Num:')
Num:False
'False'
```

### 三、 如果接收到的数值要进行比较的时候，一定要转换成同一种类型

```java
>>> age = input('age:')
age:19
>>> age
'19'
>>> age > 18
Traceback (most recent call last):
  File "<stdin>", line 1, in <module>
TypeError: '>' not supported between instances of 'str' and 'int'
>>> age = int(input('age:'))
age:19
>>> age
19
>>> age > 18
True
```

## Python的格式化输出

### 一、字符串与整型的格式化输出

**%s:代表字符串的占位 %d:整型的占位**

```java
>>> name = 'redhat'
>>> name
'redhat'
>>> age = 11
>>> print('%s的年龄是%d' %(name,age))
redhat的年龄是11
>>> name = 'tom'
>>> age = 18
>>> print('%s的年龄是%d' %(name,age))
tom的年龄是18
```

### 二、浮点型的格式化输出

**%f浮点型

%.xf(x:1,2,…num) 保留小数点后多少位**

```java
>>> money = 234251.4124
>>> name = 'tom'
>>> print('%s的工资为%f' %(name,money))
tom的工资为234251.412400
>>> money = 60000
>>> print('%s的工资为%f' %(name,money))
tom的工资为60000.000000
>>> print('%s的工资为%.2f' %(name,money))
tom的工资为60000.00
>>> print('%s的工资为%.3f' %(name,money))
tom的工资为60000.000
>>> print('%s的工资为%.7f' %(name,money))
tom的工资为60000.0000000
```

### 三、整数的占位：不够的位数 前面补0

```java
>>> sid = 1
>>> name = 'lily'
>>> print('%s的学号为%d' %(name,sid))
lily的学号为1
>>> print('%s的学号为103%d' %(name,sid))
lily的学号为1031
>>> print('%s的学号为000%d' %(name,sid))
lily的学号为0001
>>> print('%s的学号为%.5d' %(name,sid))
lily的学号为00001
>>> print('%s的学号为%.6d' %(name,sid))
lily的学号为000001
>>> sid = 10
>>> print('%s的学号为%.4d' %(name,sid))
lily的学号为0010
```

## 四、输出中百分数的实现

```java
>>> scale = 0.1
>>> print ('数据的比例是:%.2f' %(scale))
数据的比例是:0.10
>>> print ('数据的比例是:%.2f' %(scale * 100))
数据的比例是:10.00
>>> print ('数据的比例是:%.2f%%' %(scale * 100))
数据的比例是:10.00%
```
