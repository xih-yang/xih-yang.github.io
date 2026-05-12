# 05、Swift 3 变量
- 来源：https://ddkk.com/zhuanlan/other/swift3/5.html
- 分类：Swift 3 教程
- 分组：教程目录
变量是一种使用方便的占位符，用于引用计算机内存地址。

Swift 每个变量都指定了特定的类型，该类型决定了变量占用内存的大小，不同的数据类型也决定可存储值的范围。

## 变量声明

变量声明是告诉编译器在内存中的哪个位置上为变量创建多大的存储空间。

使用 **var** 关键字来声明变量

```swift
var <variableName> = <initial value>
```

下面的代码为变量声明的简单实例：

```swift
import Cocoa
var age = 27
print(age)
var pi:Float
pi = 3.14159
print(pi)
```

以上程序执行结果为：

```swift
27
3.14159
```

## 变量命名

变量名可以由字母，数字和下划线组成。

变量名需要以字母或下划线开始。

Swift 是一个区分大小写的语言，所以字母大写与小写是不一样的。

变量名也可以使用简单的 Unicode 字符，如下实例：

```swift
import Cocoa
var _var = "Hello, Swift!"
print(_var)
var 你好 = "你好世界"
var DDKK.COM 弟弟快看，程序员编程资料站 = "www.ddkk.com"
print(你好)
print(DDKK.COM 弟弟快看，程序员编程资料站)
```

以上程序执行结果为：

```swift
Hello, Swift!
你好世界
www.ddkk.com
```

## 变量输出

变量和常量可以使用 **print** 函数来输出到屏幕或者 shell

在字符串中可以使用括号与反斜线来插入变量，如下实例：

```swift
import Cocoa
var name = "DDKK.COM 弟弟快看，程序员编程资料站"
var site = "http://www.ddkk.com"
print("\(name)的官网地址为：\(site)")
```

以上程序执行结果为：

```swift
DDKK.COM 弟弟快看，程序员编程资料站的官网地址为：http://www.ddkk.com
```
