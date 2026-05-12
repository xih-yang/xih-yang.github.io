# 25、Python 教程 - 模块
- 来源：https://ddkk.com/zhuanlan/other/python/4/25.html
- 分类：Python 入门实战
- 分组：教程目录
## 1 模块

模块是包含一组函数的文件，希望在应用程序中引用。

## 2 创建模块

如需创建模块，只需将所需代码保存在文件扩展名为 .py 的文件中：

实例
在名为mymodule.py 的文件中保存代码：

```java
def greeting(name):
    print("Hello, " + name)
```

## 3 使用模块

现在，我们就可以用 `import` 语句来使用我们刚刚创建的模块：

实例
导入名为 mymodule 的模块，并调用 greeting 函数：

```java
import mymodule
mymodule.greeting("Bill")    Hello, Bill
```

注释：如果使用模块中的函数时，请使用以下语法：

```java
module_name.function_name
```

## 4 模块中的变量

模块可以包含已经描述的函数，但也可以包含各种类型的变量（数组、字典、对象等）：

实例
在文件mymodule.py 中保存代码：

```java
person1 = {
    "name": "Bill",
    "age": 63,
    "country": "USA"
}
```

实例
导入名为 mymodule 的模块，并访问 person1 字典：

```java
import mymodule
a = mymodule.person1["age"]
print(a)    63
```

## 5 为模块命名

可以随意对模块文件命名，但是文件扩展名必须是 `.py`。

## 6 重命名模块

在导入模块时使用 `as` 关键字创建别名：

实例
为mymodule 创建别名 mx：

```java
import mymodule as mx
a = mx.person1["age"]
print(a)    63
```

## 7 内建模块

Python 中有几个内建模块，可以随时导入。

实例
导入并使用 platform 模块：

```java
import platform
x = platform.system()
print(x)    Windows （或其他的操作系统）
```

## 8 使用 dir() 函数

有一个内置函数可以列出模块中的所有函数名（或变量名）。dir() 函数：

实例
列出属于 platform 模块的所有已定义名称：

```java
import platform
x = dir(platform)
print(x)    ['DEV_NULL', '_UNIXCONFDIR', '_WIN32_CLIENT_RELEASES', '_WIN32_SERVER_RELEASES', '__builtins__', '__cached__',...]
```

注释：`dir()` 函数可用于所有模块，也可用于自己创建的模块。

## 9 从模块导入

使用`from` 关键字选择仅从模块导入部件。

实例
名为mymodule 的模块拥有一个函数和一个字典：

```java
def greeting(name):
    print("Hello, " + name)
person1 = {
    "name": "Bill",
    "age": 63,
    "country": "USA"
}
```

实例
仅从模块导入 person1 字典：

```java
from mymodule import person1
print (person1["age"])    63
```

提示：在使用 `from` 关键字导入时，请勿在引用模块中的元素时使用模块名称。示例：`person1["age"]`，而不是 `mymodule.person1["age"]`。
