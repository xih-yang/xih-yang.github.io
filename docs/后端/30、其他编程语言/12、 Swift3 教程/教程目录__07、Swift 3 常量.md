# 07、Swift 3 常量
- 来源：https://ddkk.com/zhuanlan/other/swift3/7.html
- 分类：Swift 3 教程
- 分组：教程目录
**Swift** 中的常量类似于变量，区别在于常量的值一旦设定就不能改变，而变量的值可以随意更改

常量可以是任何的数据类型：整型常量、浮点型常量、字符常量、字符串常量或枚举类型的常量

## Swift 常量声明语法

常量使用关键字 **let** 来声明

```swift
let <ConstantName> = <initial_value>
```

> 常量定义时必须初始化

下面实例声明了一个整形常量和浮点型常量

```swift
import Cocoa
let SALARY = 4000.21
let AGE    = 27
print(SALARY)
print(AGE)
```

在Xcode >` Playground 中编译运行以上 Swift 范例，输出结果为

```swift
4000.21
27
```

## 类型标注（type annotation）语法

声明常量或者变量的时候可以加上类型标注（type annotation），说明常量或者变量中要存储的值的类型

添加类型标注的语法就是: 在常量或者变量名后面加上一个冒号和空格，然后加上类型名称

> 基础数据类型，不推荐使用类型标注，系统可人类都可以自动识别初始化值得类型。

```swift
var <constantName>:<data_type> = <optional_initial_value>
```

> 常量定义时必须初始值

下面实例演示了 Swift3 中常量使用类型标注：

```swift
import Cocoa
let SALARY:Float = 4000.21
let AGE:Int    = 27
print(SALARY)
print(AGE)
```

以上程序执行结果为：

```swift
4000.21
27
```

## Swift3 常量命名规则

常量名称必须以字母或者下划线开始，可以由字母，数字、下划线、或者 **Unicode**字符组成

Swift 是一个区分大小写的语言，所以字母大写与小写是不一样的。

> 推荐你在实际使用中以字母开头，且全部字母都大写
>
> 常量名也可以使用简单的 Unicode 字符

```swift
import Cocoa
let HELLO = "Hello, Swift!,你好,DDKK.COM 弟弟快看，程序员编程资料站!"
print(HELLO)
let 站点名称 = "DDKK.COM 弟弟快看，程序员编程资料站"
print(站点名称)
```

以上程序执行结果为：

```swift
Hello, Swift!,你好,DDKK.COM 弟弟快看，程序员编程资料站!
DDKK.COM 弟弟快看，程序员编程资料站
```

## Swift3 字符串格式化中使用常量

在字符串中可以使用括号与反斜线来插入常量

```swift
import Cocoa
let SITE_NAME = "DDKK.COM 弟弟快看，程序员编程资料站"
let SITE_URL = "https://www.ddkk.com"
var desc =  "\(SITE_NAME)的官网地址为：\(SITE_URL)"
print(desc)
```

> 可以使用 print() 函数来打印常量或者变量到屏幕

以上程序执行结果为：

```swift
DDKK.COM 弟弟快看，程序员编程资料站的官网地址为：https://www.ddkk.com\n
```
