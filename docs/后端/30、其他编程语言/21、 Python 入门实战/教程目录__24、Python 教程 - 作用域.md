# 24、Python 教程 - 作用域
- 来源：https://ddkk.com/zhuanlan/other/python/4/24.html
- 分类：Python 入门实战
- 分组：教程目录
## 1 作用域

变量仅在创建区域内可用。这称为`作用域`。

## 2 局部作用域

在函数内部创建的变量属于该函数的局部作用域，并且只能在该函数内部使用。

实例
在函数内部创建的变量在该函数内部可用：

```java
def myfunc():
    x = 100
    print(x)
myfunc()  100
```

## 3 函数内部的函数

如上例中所示，变量 x 在函数外部不可用，但对于函数内部的任何函数均可用：

实例
能够从函数内的一个函数访问局部变量：

```java
def myfunc():
    x = 100
    def myinnerfunc():
        print(x)
    myinnerfunc()
myfunc() 100
```

## 4 全局作用域

在Python 代码主体中创建的变量是全局变量，属于全局作用域。

全局变量在任何范围（全局和局部）中可用。

实例
在函数外部创建的变量是全局变量，任何人都可以使用：

```java
x = 100
def myfunc():
    print(x)
myfunc()  100
print(x)  100
```

## 5 命名变量

如果在函数内部和外部操作同名变量，Python 会将它们视为两个单独的变量，一个在全局范围内可用（在函数外部），而一个在局部范围内可用（在函数内部）：

实例
该函数将打印局部变量 x，然后代码还会打印全局变量 x：

```java
x = 100
def myfunc():
    x = 200
    print(x)
myfunc()  200
print(x)  100
```

## 6 Global 关键字

如果需要创建一个全局变量，但被卡在本地作用域内，则可以使用 `global` 关键字。

`global` 关键字使变量成为全局变量。

实例
如果使用 `global` 关键字，则该变量属于全局范围：

```java
def myfunc():
    global x
    x = 100
myfunc()  
print(x)  100
```

另外，如果要在函数内部更改全局变量，也请使用 global 关键字。

实例
要在函数内部更改全局变量的值，请使用 global 关键字引用该变量：

```java
x = 100
def myfunc():
    global x
    x = 200
myfunc()
print(x)  200
```
