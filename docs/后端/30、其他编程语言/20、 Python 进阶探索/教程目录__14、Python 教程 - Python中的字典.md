# 14、Python 教程 - Python中的字典
- 来源：https://ddkk.com/zhuanlan/other/python/3/14.html
- 分类：Python 进阶探索
- 分组：教程目录
## 一、字典

字典是另一种可变容器模型，且可存储任意类型对象。

字典的每个键值 key=>value 对用冒号 : 分割，每个键值对之间用逗号 , 分割，整个字典包括在花括号 {} 中

**1定义一个字典**

```java
s = {
     }
print(s,type(s))
```

输出结果为：

```java
{
     } <class 'dict'>
```

**2字典：k v 键值对的形式存在的**

```java
s = {
    'linux':[100,99,89],
    'python':[90,99,100]
}
print(s,type(s))
```

输出结果为：

```java
{
     'linux': [100, 99, 89], 'python': [90, 99, 100]} <class 'dict'>
```

**3工厂函数**

```java
d = dict()
print(d,type(d))
d = dict(a=1,b=2)
print(d,type(d))
```

输出结果为：

```java
{
     } <class 'dict'>
{
     'a': 1, 'b': 2} <class 'dict'>
```

**4字典的嵌套**

```java
student = {
    123:{
        'name':'tom',
        'age':18,
        'score':99
    },
    456:{
        'name':'lily',
        'age':18,
        'score':89
    }
}
print(student)
print(student[123]['score'])
```

输出结果为：

```java
{
     123: {
     'name': 'tom', 'age': 18, 'score': 99}, 456: {
     'name': 'lily', 'age': 18, 'score': 89}}
99
```

## 二、字典的特性

```java
d = {
    '1':'a',
    '2':'b'
}
```

**1字典的索引**

```java
print(d['1'])
```

输出结果为：

```java
a
```

**2字典不支持切片**

**3成员操作符 针对的是key**

```java
print('1' in d)
print('a' in d)
```

输出结果为：

```java
True
False
```

**3for循环 针对的是key**

```java
for key in d:
    print(key)
```

输出结果为：

```java
1
2
```

**4遍历字典**

```java
for key in d:
    print(key,d[key])
```

输出结果为：

```java
1 a
2 b
```

## 三、字典元素的添加

**1增加一个元素**

- 如果key值存在 则更新对应的value
- 如果key不存在 则添加对应的value

示例：

```java
service = {
    'http':80,
    'ftp':23,
    'ssh':22
}
```

“”"

```java
service['https'] = 443
print(service)
service['ftp'] = 21
print(service)
```

输出结果为：

```java
{
     'http': 80, 'ftp': 23, 'ssh': 22, 'https': 443}
{
     'http': 80, 'ftp': 21, 'ssh': 22, 'https': 443}
```

**2添加多个元素**

使用update函数添加多个元素：

```java
service_backup = {
   'tomcat':8080,
    'mysql':3306
}
service.update(service_backup)
print(service)
service.update(dns=53)
print(service)
```

输出结果为：

```java
{
     'http': 80, 'ftp': 21, 'ssh': 22, 'https': 443, 'tomcat': 8080, 'mysql': 3306}
{
     'http': 80, 'ftp': 21, 'ssh': 22, 'https': 443, 'tomcat': 8080, 'mysql': 3306, 'dns': 53}
```

**3setdefault函数添加**

如果key值存在 则**不做修改**

如果key值不存在 则添加对应的值

```java
service.setdefault('http',9090)
print(service)
service.setdefault('oracle',44575)
print(service)
```

输出结果为：

```java
{
     'http': 80, 'ftp': 21, 'ssh': 22, 'https': 443, 'tomcat': 8080, 'mysql': 3306, 'dns': 53}
{
     'http': 80, 'ftp': 21, 'ssh': 22, 'https': 443, 'tomcat': 8080, 'mysql': 3306, 'dns': 53, 'oracle': 44575}
```

## 四、字典元素的删除

```java
service = {
    'http':80,
    'ftp':23,
    'ssh':22
}
```

**1pop删除指定的key对应的value值**

```java
 item = service.pop('http')
 print(item)
 print(service)
```

输出结果为：

```java
80
{
     'ftp': 23, 'ssh': 22}
```

**2删除最后一个k-v (k,v)**

```java
a = service.popitem()
print(a)
print(service)
```

输出结果为：

```java
('ssh', 22)
{
     'ftp': 23}
```

**3清空字典内容**

```java
service.clear()
print(service)
```

输出结果为：

```java
{
     }
```

## 五、字典元素的查看

```java
service = {
    'http':80,
    'ftp':23,
    'ssh':22
}
```

**1查看字典中所有的key值**

```java
print(service.keys())
```

输出结果为：

```java
dict_keys(['http', 'ftp', 'ssh'])
```

**2查看字典中所有的value值**

```java
print(service.values())
```

输出结果为：

```java
dict_values([80, 23, 22])
```

**3查看字典中的k-v**

```java
print(service.items())
```

输出结果为：

```java
dict_items([('http', 80), ('ftp', 23), ('ssh', 22)])
```

**4get函数查看**

Python 字典 get() 函数返回指定键的值，如果值不在字典中返回默认值

```java
print(service.get('https'))
print(service.get('https',443))
```

输出结果为：

```java
None
443
```

## 六、字典实例

**问题1：** 数字重复统计:

1).随机生成1000个整数;

2).数字的范围[20, 100],

3).升序输出所有不同的数字及其每个数字重复的次数;

```java
import random
all_num = []
for item in range(1000):
    all_num.append(random.randint(20,100))
# 对生成好的1000个数进行排序，然后添加到字典中
sorted_num = sorted(all_num)
num_dict ={
     }
for num in sorted_num:
    if num in num_dict:
        num_dict[num] += 1
    else:
        num_dict[num] = 1
print(num_dict)
```

**问题2**：重复的单词: 此处认为单词之间以空格为分隔符， 并且不包含，和.；

# 1. 用户输入一句英文句子；

# 2. 打印出每个单词及其重复的次数;

“”"

```java
s = input('s:')
# 1.把每个单词分割处理
s_li = s.split()
word_dict ={
     }
for item in s_li:
    if item not in word_dict:
        word_dict[item] = 1
    else:
        word_dict[item] += 1
print(word_dict)
```

## 七、字典的补充 .fromkeys()函数

**1fromkeys()函数**

Python 字典 `fromkeys()` 函数用于创建一个新字典，以序列 seq 中元素做字典的键，value 为字典所有键对应的初始值。

语法：

```java
dict.fromkeys(seq[, value])
```

示例：

```java
print({
     }.fromkeys({
     '1','2'},'10000'))
```

输出结果：

```java
{
     '1': '10000', '2': '10000'}
```

**2实例**

问题描述：

> 随机生成100个卡号；
>
> 卡号以6102009开头， 后面3位依次是 （001， 002， 003， 100），
> 生成关于银行卡号的字典， 默认每个卡号的初始密码为"redhat";
> 输出卡号和密码信息， 格式如下:
>
> 卡号 密码
>
> 6102009001 000000

解答：

```java
card_ids = []
# 生成100个卡号
for i in range(100):
    %.3d:代表整数的占位
    s = '6102009%.3d' %(i+1)
    card_ids.append(s)
card_ids_dict = {
     }.fromkeys(card_ids,'redhat')
#print(card_ids_dict)
print('卡号\t\t\t\t\t密码')
for key in card_ids_dict:
    print('%s\t\t\t%s' %(key,card_ids_dict[key]))
```

部分输出结果：

```java
卡号					密码
6102009001			redhat
6102009002			redhat
6102009003			redhat
6102009004			redhat
6102009005			redhat
6102009006			redhat
6102009007			redhat
6102009008			redhat
6102009009			redhat
...					...
```
