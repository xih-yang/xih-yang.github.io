# 21、Python 教程 - 类和对象
- 来源：https://ddkk.com/zhuanlan/other/python/4/21.html
- 分类：Python 入门实战
- 分组：教程目录
## 1 Python 类和对象

Python 是一种面向对象的编程语言。

Python 中的几乎所有东西都是对象，拥有属性和方法。

类（`Class`）类似对象构造函数，或者是用于创建对象的“蓝图”。

## 2 创建类

如需创建类，请使用 `class` 关键字：

实例
使用名为 x 的属性，创建一个名为 MyClass 的类：

```java
class MyClass:
    x = 5
```

## 3 创建对象

现在我们可以使用名为 myClass 的类来创建对象：

实例
创建一个名为 p1 的对象，并打印 x 的值：

```java
p1 = MyClass()
print(p1.x)  5 
```

## 4 init() 函数

上面的例子是最简单形式的类和对象，在实际应用程序中并不真正有用。

要理解类的含义，我们必须先了解内置的 `__init__()` 函数。

所有类都有一个名为 `__init__()` 的函数，它始终在启动类时执行。

使用`__init__()` 函数将值赋给对象属性，或者在创建对象时需要执行的其他操作：

实例
创建名为 Person 的类，使用 `__init__()` 函数为 name 和 age 赋值：

```java
class Person:
    def __init__(self, name, age):
        self.name = name
        self.age = age
p1 = Person("Bill", 63)
print(p1.name)    Bill
print(p1.age)    63
```

注释：每次使用类创建新对象时，都会自动调用 `__init__()` 函数。

## 5 对象方法

对象也可以包含方法。对象中的方法是属于该对象的函数。

让我们在 Person 类中创建方法：

实例
插入一个打印问候语的函数，并在 p1 对象上执行它：

```java
class Person:
    def __init__(self, name, age):
        self.name = name
        self.age = age
    def myfunc(self):
        print("Hello my name is " + self.name)
p1 = Person("Bill", 63)
p1.myfunc()    Hello my name is Bill
```

提示：`self` 参数是对类的当前实例的引用，用于访问属于该类的变量。

## 6 self 参数

self 参数是对类的当前实例的引用，用于访问属于该类的变量。

**它不必被命名为 self，您可以随意调用它，但它必须是类中任意函数的首个参数**：

实例
使用单词 mysillyobject 和 abc 代替 self：

```java
class Person:
    def __init__(mysillyobject, name, age):
        mysillyobject.name = name
        mysillyobject.age = age
    def myfunc(abc):
        print("Hello my name is " + abc.name)
p1 = Person("Bill", 63)
p1.myfunc()    Hello my name is Bill
```

## 7 修改对象属性

可以这样修改对象的属性：

实例
把p1 的年龄设置为 40：

```java
p1.age = 40
```

## 8 删除对象属性

使用`del` 关键字删除对象的属性：

实例
删除p1 对象的 age 属性：

```java
del p1.age
```

## 9 删除对象

使用`del` 关键字删除对象：

实例
删除p1 对象：

```java
del p1
```

## 10 pass 语句

类定义不能为空，但是如果出于某种原因写了无内容的类定义语句，请使用 pass 语句来避免错误。

实例

```java
class Person:
    pass
```
