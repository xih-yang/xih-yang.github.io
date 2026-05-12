# 12、Python 教程 - 字典
- 来源：https://ddkk.com/zhuanlan/other/python/5/12.html
- 分类：Python 快速上手
- 分组：教程目录
### 字典

字典是另一种可变容器模型，且可存储任意类型对象。

字典的每个键值 key=>value 对用冒号 : 分割，每个对之间用逗号(,)分割，整个字典包括在花括号 {} 中 ,格式如下所示：

> d= {key1 : value1, key2 : value2, key3 : value3 }

**注意**：dict 作为 Python 的关键字和内置函数，变量名不建议命名为 dict。

键必须是唯一的，但值则不必。

值可以取任何数据类型，但键必须是不可变的，如字符串，数字。

一个简单的字典实例：

> tinydict = {‘names’: ‘dyf’, ‘likes’: 12345, ‘url’: ‘www.dyf.com’}

也可如此创建字典：

> tinydict1 = { ‘abc’: 456 }
>
> tinydict2 = { ‘abc’: 123, 98.6: 37 }

### 创建空字典

使用大括号 { } 创建空字典：

```java
# 使用大括号 {} 来创建空字典
emptyDict = {
     }
# 打印字典
print(emptyDict)
# 查看字典的数量
print("Length:", len(emptyDict))
# 查看类型
print(type(emptyDict))
```

以上实例输出结果：

> {}
>
> Length: 0
>
>

使用内建函数 dict() 创建字典：

```java
emptyDict = dict()
# 打印字典
print(emptyDict)
# 查看字典的数量
print("Length:",len(emptyDict))
# 查看类型
print(type(emptyDict))
```

以上实例输出结果：

> {}
>
> Length: 0
>
>

### 访问字典里的值

把相应的键放入到方括号中，如下实例:

```java
#!/usr/bin/python3
tinydict = {
     'Name': 'Caiyuan', 'Age': 7, 'Class': 'First'}
print ("tinydict['Name']: ", tinydict['Name'])
print ("tinydict['Age']: ", tinydict['Age'])
```

以上实例输出结果：

> tinydict[‘Name’]: Caiyuan
>
> tinydict[‘Age’]: 7

如果用字典里没有的键访问数据，会输出错误如下：

```java
#!/usr/bin/python3
tinydict = {
     'Name': 'Caiyuan', 'Age': 4, 'Class': 'First'}
print ("tinydict['Alice']: ", tinydict['Alice'])
```

以上实例输出结果：

> Traceback (most recent call last):
>
> File “test.py”, line 5, in
>
> print ("tinydict[‘Alice’]: ", tinydict[‘Alice’])
>
> KeyError: ‘Alice’

### 修改字典

向字典添加新内容的方法是增加新的键/值对，修改或删除已有键/值对如下实例:

```java
#!/usr/bin/python3
tinydict = {
     'Name': 'Caiyuan', 'Age': 4, 'Class': 'First'}
tinydict['Age'] = 5               更新 Age
tinydict['School'] = "菜猿"  添加信息
print ("tinydict['Age']: ", tinydict['Age'])
print ("tinydict['School']: ", tinydict['School'])
```

以上实例输出结果：

> tinydict[‘Age’]: 5
>
> tinydict[‘School’]: 菜猿

### 删除字典元素

能删单一的元素也能清空字典，清空只需一项操作。

显式删除一个字典用del命令，如下实例：

```java
#!/usr/bin/python3
tinydict = {
     'Name': 'Caiyuan', 'Age': 4, 'Class': 'First'}
del tinydict['Name'] 删除键 'Name'
tinydict.clear()     清空字典
del tinydict         删除字典
print ("tinydict['Age']: ", tinydict['Age'])
print ("tinydict['School']: ", tinydict['School'])
```

但这会引发一个异常，因为用执行 del 操作后字典不再存在：

> Traceback (most recent call last):
>
> File “/dyf-test/test.py”, line 9, in
>
> print ("tinydict[‘Age’]: ", tinydict[‘Age’])
>
> NameError: name ‘tinydict’ is not defined

### 字典键的特性

字典值可以是任何的 python 对象，既可以是标准的对象，也可以是用户定义的，但键不行。

两个重要的点需要记住：

1）不允许同一个键出现两次。创建时如果同一个键被赋值两次，后一个值会被记住，如下实例：

```java
#!/usr/bin/python3
tinydict = {
     'Name': 'Caiyuan', 'Age': 7, 'Name': '小菜猿'}
print ("tinydict['Name']: ", tinydict['Name'])
```

以上实例输出结果：

> tinydict[‘Name’]: 小菜猿

2）键必须不可变，所以可以用数字，字符串或元组充当，而用列表就不行，如下实例：

```java
#!/usr/bin/python3
tinydict = {
     ['Name']: 'Caiyuan', 'Age': 7}
print ("tinydict['Name']: ", tinydict['Name'])
```

以上实例输出结果：

> Traceback (most recent call last):
>
> File “test.py”, line 3, in
>
> tinydict = {[‘Name’]: ‘Caiyuan’, ‘Age’: 7}
>
> TypeError: unhashable type: ‘list’

### 字典内置函数&方法

Python字典包含了以下内置函数：

序号
函数及描述
实例

1
len(dict)
计算字典元素个数，即键的总数。
>>> tinydict = {‘Name’: ‘Caiyuan’, ‘Age’: 4, ‘Class’: ‘First’}
>>> len(tinydict)
3

2
str(dict)
输出字典，可以打印的字符串表示。
>>> tinydict = {‘Name’: ‘Caiyuan’, ‘Age’:4, ‘Class’: ‘First’}
>>> str(tinydict)
“{‘Name’: ‘Caiyuan’, ‘Class’: ‘First’, ‘Age’: 4}”

3
type(variable)
返回输入的变量类型，如果变量是字典就返回字典类型。
>>> tinydict = {‘Name’: ‘Caiyuan’, ‘Age’: 4, ‘Class’: ‘First’}
>>> type(tinydict)
