# 27、Python 教程 - JSON
- 来源：https://ddkk.com/zhuanlan/other/python/4/27.html
- 分类：Python 入门实战
- 分组：教程目录
## 1 JSON简介

JSON 是用于存储和交换数据的语法。

JSON 是用 `JavaScript` 对象表示法（JavaScript object notation）编写的文本。

在Python中有一个名为 json 的内置包，可用于处理 JSON 数据。

实例
导入json 模块：

```java
import json
```

## 2 解析 JSON - 把 JSON 转换为 Python

若有JSON 字符串，则可以使用 `json.loads()` 方法对其进行解析。

**结果将是 Python 字典。**

实例
把JSON 转换为 Python：

```java
import json
# 一些 JSON:
x =  '{ "name":"Bill", "age":63, "city":"Seatle"}'    注意单引号
# 解析 x:
y = json.loads(x)
# 结果是 Python 字典：
print(y["age"])    63
```

## 3 把 Python 转换为 JSON

若有Python 对象，则可以使用 `json.dumps()` 方法将其转换为 JSON 字符串。

实例
把Python 转换为 JSON：

```java
import json
# Python 对象（字典）：
x = {
    "name": "Bill",
    "age": 63,
    "city": "Seatle"
}
# 转换为 JSON：
y = json.dumps(x)
# 结果是 JSON 字符串：
print(y)    '{"name": "Bill", "age": 63, "city": "Seatle"}'
```

您可以把以下类型的 Python 对象转换为 JSON 字符串：

- dict
- list
- tuple
- string
- int
- float
- True
- False
- None

实例
将Python 对象转换为 JSON 字符串，并打印值：

```java
import json
print(json.dumps({
     "name": "Bill", "age": 63}))  ’{"name": "Bill", "age": 63}‘
print(json.dumps(["apple", "bananas"]))  '["apple", "bananas"]'
print(json.dumps(("apple", "bananas")))  '["apple", "bananas"]'
print(json.dumps("hello"))  '"hello"'
print(json.dumps(42))  '42'
print(json.dumps(31.76)) '31.76'
print(json.dumps(True))  'true'
print(json.dumps(False))  'false'
print(json.dumps(None))  'null'
```

当Python 转换为 JSON 时，Python 对象会被转换为 JSON（JavaScript）等效项：

Python
JSON

dict
Object

list
Array

tuple
Array

str
String

int
Number

float
Number

True
true

False
false

None
null

实例
转换包含所有合法数据类型的 Python 对象：

```java
import json
x = {
    "name": "Bill",
    "age": 63,
    "married": True,
    "divorced": False,
    "children": ("Jennifer","Rory","Phoebe"),
    "pets": None,
    "cars": [
        {
     "model": "Porsche", "mpg": 38.2},
        {
     "model": "BMW M5", "mpg": 26.9}
    ]
}
print(json.dumps(x))  {"name": "Bill", "age": 63, "married": true, "divorced": false, "children": ["Jennifer", "Rory", "Phoebe"], "pets": null, "cars": [{"model": "Porsche", "mpg": 38.2}, {"model": "BMW M5", "mpg": 26.9}]}
```

## 4 格式化结果

上面的实例打印一个 JSON 字符串，但它不是很容易阅读，没有缩进和换行。

`json.dumps()` 方法提供了令结果更易读的参数：

实例
使用`indent` 参数定义缩进数：

```java
json.dumps(x, indent=4)  '{\n    "name": "Bill",\n    "age": 63,\n    "married": true,\n    "divorced": false,\n    "children": [\n        "Jennifer",\n        "Rory",\n        "Phoebe"\n    ],\n    "pets": null,\n    "cars": [\n        {\n            "model": "Porsche",\n            "mpg": 38.2\n        },\n        {\n            "model": "BMW M5",\n            "mpg": 26.9\n        }\n    ]\n}'
```

还可以定义分隔符，默认值为（", ", ": "），这意味着使用逗号和空格分隔每个对象，使用冒号和空格将键与值分开：

实例
使用`separators` 参数来更改默认分隔符：

```java
json.dumps(x, indent=4, separators=(". ", " = "))  '{\n    "name" = "Bill". \n    "age" = 63. \n    "married" = true. \n    "divorced" = false. \n    "children" = [\n        "Jennifer". \n        "Rory". \n        "Phoebe"\n    ]. \n    "pets" = null. \n    "cars" = [\n        {\n            "model" = "Porsche". \n            "mpg" = 38.2\n        }. \n        {\n            "model" = "BMW M5". \n            "mpg" = 26.9\n        }\n    ]\n}'
```

## 5 对结果排序

`json.dumps()` 方法提供了对结果中的键进行排序的参数：

实例
使用`sort_keys` 参数来指定是否应对结果进行排序：

```java
json.dumps(x, indent=4, sort_keys=True)  '{\n    "age": 63,\n    "cars": [\n        {\n            "model": "Porsche",\n            "mpg": 38.2\n        },\n        {\n            "model": "BMW M5",\n            "mpg": 26.9\n        }\n    ],\n    "children": [\n        "Jennifer",\n        "Rory",\n        "Phoebe"\n    ],\n    "divorced": false,\n    "married": true,\n    "name": "Bill",\n    "pets": null\n}'
```
