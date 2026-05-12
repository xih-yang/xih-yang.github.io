# 31、Python 教程 - JSON 数据解析
- 来源：https://ddkk.com/zhuanlan/other/python/5/31.html
- 分类：Python 快速上手
- 分组：教程目录
### JSON 数据解析

JSON (JavaScript Object Notation) 是一种轻量级的数据交换格式。

Python3 中可以使用 json 模块来对 JSON 数据进行编解码，它包含了两个函数：

json.dumps(): 对数据进行编码。

json.loads(): 对数据进行解码。

在json 的编解码过程中，Python 的原始类型与 json 类型会相互转换，具体的转化对照如下：

#### Python 编码为 JSON 类型转换对应表：

Python
Json

dict
object

list, tuple
array

str
string

int, float, int- & float-derived Enums
number

True
true

False
false

None
null

#### JSON 解码为 Python 类型转换对应表：

Json
Python

object
dict

array
list

string
str

number (int)
int

number (real)
float

true
True

false
False

null
None

#### json.dumps 与 json.loads 实例

以下实例演示了 Python 数据结构转换为JSON：

```java
#!/usr/bin/python3
import json
# Python 字典类型转换为 JSON 对象
data = {
    'no' : 1,
    'name' : 'dyf',
    'url' : 'http://www.dyf.com'
}
json_str = json.dumps(data)
print ("Python 原始数据：", repr(data))
print ("JSON 对象：", json_str)
```

执行以上代码输出结果为：

> Python 原始数据： {‘url’: ‘http://www.dyf.com’, ‘no’: 1, ‘name’: ‘dyf’}
>
> JSON 对象： {“url”: “http://www.dyf.com”, “no”: 1, “name”: “dyf”}

通过输出的结果可以看出，简单类型通过编码后跟其原始的repr()输出结果非常相似。

接着以上实例，我们可以将一个JSON编码的字符串转换回一个Python数据结构：

```java
#!/usr/bin/python3
import json
# Python 字典类型转换为 JSON 对象
data1 = {
    'no' : 1,
    'name' : 'dyf',
    'url' : 'http://www.dyf.com'
}
json_str = json.dumps(data1)
print ("Python 原始数据：", repr(data1))
print ("JSON 对象：", json_str)
# 将 JSON 对象转换为 Python 字典
data2 = json.loads(json_str)
print ("data2['name']: ", data2['name'])
print ("data2['url']: ", data2['url'])
```

执行以上代码输出结果为：

> Python 原始数据： {‘name’: ‘dyf’, ‘no’: 1, ‘url’: ‘http://www.dyf.com’}
>
> JSON 对象： {“name”: “dyf”, “no”: 1, “url”: “http://www.dyf.com”}
>
> data2[‘name’]: dyf
>
> data2[‘url’]: http://www.dyf.com

如果你要处理的是文件而不是字符串，你可以使用 json.dump() 和 json.load() 来编码和解码JSON数据。例如：

```java
# 写入 JSON 数据
with open('data.json', 'w') as f:
    json.dump(data, f)
# 读取数据
with open('data.json', 'r') as f:
    data = json.load(f)
```
