# 04、Python 教程 - 字典
- 来源：https://ddkk.com/zhuanlan/other/python/6/4.html
- 分类：Python 基础入门
- 分组：教程目录
字典{'键':'值','名字':'电话号码'}

映射：通过**名称**来访问其各个值的数据结构

列表：将一系列值组合成数据结构并通过**编号**来访问各个值

字典是Python中唯一的内置映射类型，其中的值不按顺序排列，而是存储在键下

键可能是数、字符串或元组

字典由**键（必须唯一，可以是任意数据类型但是唯一即可）及其相应的值**组成，这种键-值对称为**项**

键为名字，值为电话号码

每个键与其值之间都用冒号（:）分隔，项之间用逗号分隔，整个字典放在花括号内

空字典（没有任何项）用两个花括号表示{}。

```java
phones = {
     'yanyu':'159368','huangjiaju':'787084','huangjiaiqnag':'784512369','yeshirong':'963214587'}
```

## 创建和使用字典

### 函数dict，从其他映射（如其他字典）或键-值对序列创建字典

```java
message = [('name','yanyu'),('age',22)]
yanyu = dict(message)
yanyu#结果为：{'name': 'yanyu', 'age': 22}
beyond = dict(name="huangjiaju",age=31)
beyond#结果为：{'name': 'huangjiaju', 'age': 31}
```

成员资格`in`

在字典中查找的`键`，而不是值

在列表中查找的是`值`，而不是索引

```java
'''
将字符串"beyond"赋给一个空列表中索引为15的元素
这显然不可能，因为没有这样的元素
除非首先初始化列表
'''
x = []
x[15] = "beyond"#报错
#改正：初始化列表y
y = [None] * 16
y[15] = "beyond"
y#结果为：[None, None, None, None, None, None, None, None, None, None, None, None, None, None, None, 'beyond']
'''
将字符串"beyond"赋给一个空字典的键15
'''
z = {
     }
z[15] = "beyond"
z#结果为：{15: 'beyond'}
```

### 将字符串格式设置功能用于字典

format_map，通过一个映射来提供所需的信息

```java
phone = {
     "yanyu":"1512369","jiaju":'147852','jiaqiang':"789654"}
"jiaju's phone number is {jiaju}.".format_map(phone)#结果为："jiaju's phone number is 147852."
```

可指定任意数量的转换说明符，条件是所有的字段名都是包含在字典中的键

```java
template = '''<html>
<head><title>{title}</title></head> 
<body> 
<h1>{title}</h1> 
<p>{text}</p>
</body>''' 
data = {
     'title': 'My Home Page', 'text': 'Welcome to my home page!'} 
print(template.format_map(data)) 
#结果为：
<html> 
<head><title>My Home Page</title></head> 
<body> 
<h1>My Home Page</h1> 
<p>Welcome to my home page!</p> 
</body>
```

### 字典方法

#### 1，clear，删除所有的字典项，什么都不返回（或者说返回None）

```java
d = {
     }
d['name'] = "beyond"
d['age'] = 31
d#结果为：{'name': 'beyond', 'age': 31}
Y = d.clear()
d#结果为：{}
print(Y)#结果为：None
```

x和y最初都指向同一个字典，将一个空字典赋给x来“清空”它，这对y没有任何影响，它依然指向原来的字典

要删除原来字典的所有元素，必须使用clear，这样做，y也将是空的

```java
x = {
     }
y = x
x['key'] = 'value'
y#结果为：{'key': 'value'}
x = {
     }
x#结果为：{}
y#结果为：{'key': 'value'}
```

```java
x = {
     }
y = x
x['key'] = 'value'
y#结果为：{'key': 'value'}
x.clear()
x#结果为：{}
y#结果为：{}
```

#### 2，copy，返回一个新字典，其包含的键-值对与原来的字典相同

（这个方法执行的是浅复制，因为值本身是原件，而非副本）

原件x，副本y，**替换**副本中的值，原件**不受影响**；**修改**副本中的值，原件**会发生变化**，因为原件指向的也是被修改的值

```java
x={
     'name':'yanyu','habby':['eat','drink','sing']}
y = x.copy()
y['name'] = "huangjiaju"#替换
y['habby'].remove('eat')#修改
y#结果为：{'name': 'huangjiaju', 'habby': ['drink', 'sing']}
x#结果为：{'name': 'yanyu', 'habby': ['drink', 'sing']}
```

为避免这种问题，一种办法是执行**深复制**，即**同时复制值及其包含的所有值**

可使用模块copy中的函数deepcopy

d为原件，c为浅复制，C为深复制

浅复制：替换原件不受影响，修改（append向后追加为修改的一种）原件会受影响

深复制：与原件相互独立，与对原件操作无任何影响

```java
from copy import deepcopy 
d = {
     } 
d['names'] = ['yanyu', 'beyond'] 
c = d.copy() 
C = deepcopy(d) 
d['names'].append('Huangjiaju') 
c#结果为： {'names': ['yanyu', 'beyond', 'Huangjiaju']}
C#结果为：{'names': ['yanyu', 'beyond']}
d#结果为：{'names': ['yanyu', 'beyond', 'Huangjiaju']}
```

#### 3，fromkeys，创建一个新字典，其中包含指定的键，且每个键对应的值都是None

```java
{
     }.fromkeys(['name', 'age'])#结果为：{'name': None, 'age': None}
```

也可以直接对dict调用方法fromkeys

```java
dict.fromkeys(['name', 'age'])#结果为：{'name': None, 'age': None}
```

也可提供特定的值

```java
dict.fromkeys(['name', 'age'], '(unknown)')#结果为：{'name': '(unknown)', 'age': '(unknown)'}
```

#### 4，get，为访问字典项提供了宽松的环境

如果你试图访问字典中没有的项，将引发错误；而使用get不会这样

```java
d = {
     }
d['names'] = "beyond"
print(d['name'])#结果为：报错 访问不存在的键
print(d.get('name'))#结果为：None  没有引发异常，而是返回None
d.get('name',"errorover")#结果为：errorover  没有引发异常，而是返回指定的错误信息
d.get("names")#结果为：'beyond'
```

#### 5，items，返回一个包含所有字典项的列表（字典视图），其中每个元素都为(key, value)的形式，字典项在列表中的排列顺序不确定

```java
d = {
     'Question': 'Do you like beyond？', 'Answer': 'Yes', 'Sure?': 666} 
d.items()#结果为：dict_items([('Question', 'Do you like beyond？'), ('Answer', 'Yes'), ('Sure?', 666)])
```

返回值属于一种名为字典视图的特殊类型dict_items

确定其长度以及对其执行成员资格检查

```java
d = {
     'Question': 'Do you like beyond？', 'Answer': 'Yes', 'Sure?': 666} 
it = d.items()
len(it)#结果为：3
('Sure?', 666) in it#结果为：True
```

视图的一个优点是不复制，它们始终是底层字典的反映，本源和视图是一致的，操作视图，本源也会跟着操作

```java
d = {
     'Question': 'Do you like beyond？', 'Answer': 'Yes', 'Sure?': 666} 
it = d.items()
d['Sure?'] = 0
('Sure?',666) in it#结果为：False
d['Sure?'] = 1
('Sure?',1) in it#结果为：True
```

将字典项复制到列表中

```java
d = {
     'Question': 'Do you like beyond？', 'Answer': 'Yes', 'Sure?': 666} 
list(d.items())#结果为：[('Question', 'Do you like beyond？'), ('Answer', 'Yes'), ('Sure?', 666)]
```

#### 6，keys，返回一个字典视图，其中包含指定字典中的键

```java
d = {
     'Question': 'Do you like beyond？', 'Answer': 'Yes', 'Sure?': 666}
d.keys()#结果为：dict_keys(['Question', 'Answer', 'Sure?'])
```

#### 7，pop，可用于获取与指定键相关联的值，并将该键-值对从字典中删除

```java
d = {
     'x': 1, 'y': 2} 
d.pop('x')结果为：1 
d：结果为：{'y': 2}
```

#### 8，popitem，随机地弹出一个字典项

方法popitem类似于list.pop，但list.pop弹出列表中的最后一个元素，而popitem随机地弹出一个字典项，因为字典项的顺序是不确定的，没有“最后一个元素”的概念

```java
d = {
     'Question': 'Do you like beyond？', 'Answer': 'Yes', 'Sure?': 666}
d.popitem()#结果为：('Sure?', 666)
d#结果为：{'Question': 'Do you like beyond？', 'Answer': 'Yes'}
```

字典没有与在列表末尾添加一个元素(append)对应的方法

这是因为字典是无序的，类似的方法毫无意义

#### 9，setdefault，通过键获取相关联的值，若不包含指定的键，则自动添加指定的键值对

指定的键不存在时，setdefault返回指定的值并相应地更新字典

指定的键存在，就返回其值，并保持字典不变

与get一样，值是可选的，如下的no find和NO；如果没有指定，默认为None

```java
d = {
     } 
d.setdefault('name', 'no find')结果为：'no find' 
d：结果为：{'name': 'no find'}
d['name'] = 'beyond' 
d.setdefault('name', 'NO')结果为：'beyond' 
d：结果为：{'name': 'beyond'}
print(d.setdefault('age'))#结果为：None
d#结果为：{'name': 'beyond', 'age': None}   不存在即添加
```

#### 10，update，使用一个字典中的项来更新另一个字典

对于通过参数提供的字典，将其项添加到当前字典中

如果当前字典包含键相同的项，就替换它

```java
 d = {
'title': 'Python Web Site', 
'url': 'http://www.python.org', 
'changed': 'Mar 14 22:09:15 MET 2021' 
}
x = {
     'title': 'Python Language Website'} 
d.update(x) 
d#结果为：{'title': 'Python Language Website', 'url': 'http://www.python.org', 'changed': 'Mar 14 22:09:15 MET 2021'}
```

#### 11，values，返回一个由字典中的值组成的字典视图

不同于方法keys，方法values返回的视图可能包含重复的值

```java
d = {
     } 
d[1] = 1 
d[2] = 2 
d[3] = 3 
d[4] = 1 
d.values()结果为：dict_values([1, 2, 3, 1])
```

要对字典执行字符串格式设置操作，不能使用format和命名参数，而必须使用**format_map**

## 本章节介绍的新函数

函数
描述

dict(seq)
从键-值对、映射或关键字参数创建字典
