# 12、Swift 3 字符串
- 来源：https://ddkk.com/zhuanlan/other/swift3/12.html
- 分类：Swift 3 教程
- 分组：教程目录
Swift 字符串是一系列字符的集合。例如 "Hello, World!" 这样的有序的字符类型的值的集合，它的数据类型为 **String**

## 创建字符串

通过使用字符串字面量或 String 类的实例可以创建一个字符串

```swift
import Cocoa
// 使用字符串字面量
var stringA = "Hello, World!"
print( stringA )
// String 实例化
var stringB = String("Hello, World!")
print( stringB )
```

编译运行以上 Swift 范例，输出结果为

```swift
Hello, World!
Hello, World!
```

## 空字符串

可以将空的字符串字面量赋值给变量或初始化一个 String 类的实例来初始值一个空的字符串

可以使用字符串属性 isEmpty 来判断字符串是否为空

```swift
import Cocoa
// 使用字符串字面量创建空字符串
var stringA = ""
if stringA.isEmpty {
   print( "stringA 是空的" )
} else {
   print( "stringA 不是空的" )
}
// 实例化 String 类来创建空字符串
let stringB = String()
if stringB.isEmpty {
   print( "stringB 是空的" )
} else {
   print( "stringB 不是空的" )
}
```

编译运行以上 Swift 范例，输出结果为

```swift
stringA 是空的
stringB 是空的
```

## 字符串常量

可以将一个字符串赋值给一个变量或常量，变量是可修改的，常量是不可修改的

```swift
import Cocoa
// stringA 可被修改
var stringA = "DDKK.COM 弟弟快看，程序员编程资料站："
stringA += "http://www.ddkk.com"
print( stringA )
// stringB 不能修改
let stringB = String("DDKK.COM 弟弟快看，程序员编程资料站：")
stringB += "http://www.ddkk.com"
print( stringB )
```

以上程序执行输出结果会报错，以为 stringB 为常量是不能被修改的：

```swift
error: left side of mutating operator isn't mutable: 'stringB' is a 'let' constant
stringB += "http://www.ddkk.com"
```

## 字符串中插入值

字符串插值是一种构建新字符串的方式

可以在其中包含常量、变量、字面量和表达式

插入的字符串字面量的每一项都在以反斜线为前缀的圆括号中

```swift
import Cocoa
var varA   = 20
let constA = 100
var varC:Float = 20.0
var stringA = "\(varA) 乘于 \(constA) 等于 \(varC * 100)"
print( stringA )
```

编译运行以上 Swift 范例，输出结果为

```swift
20 乘于 100 等于 2000.0
```

## 字符串连接

可以使用 **+** 号将两个字符串拼接成一个字符串

```swift
import Cocoa
let constA = "DDKK.COM 弟弟快看，程序员编程资料站："
let constB = "http://www.ddkk.com"
var stringA = constA + constB
print( stringA )
```

编译运行以上 Swift 范例，输出结果为

```swift
DDKK.COM 弟弟快看，程序员编程资料站：http://www.ddkk.com
```

## 字符串长度

只读属性 **String.characters.count** 可以计算字符串长度使用

```swift
import Cocoa
var varA   = "www.ddkk.com"
print( "\(varA), 长度为 \(varA.characters.count)" )
```

编译运行以上 Swift 范例，输出结果为

```swift
www.ddkk.com, 长度为 11
```

## 字符串比较

可以使用 == 来比较两个字符串是否相等

```swift
import Cocoa
var varA   = "Hello, Swift!"
var varB   = "Hello, World!"
if varA == varB {
   print( "\(varA) 与 \(varB) 是相等的" )
} else {
   print( "\(varA) 与 \(varB) 是不相等的" )
}
```

编译运行以上 Swift 范例，输出结果为

```swift
Hello, Swift! 与 Hello, World! 是不相等的
```

## Unicode 字符串

Unicode 是一个国际标准，用于文本的编码

Swift 的 String 类型是基于 Unicode 建立的

可以使用 **for-in** 循环迭代出字符串中 UTF-8 与 UTF-16 的编码

```swift
import Cocoa
var unicodeString   = "DDKK.COM 弟弟快看，程序员编程资料站"
print("UTF-8 编码: ")
for code in unicodeString.utf8 {
   print("\(code) ")
}
print("\n")
print("UTF-16 编码: ")
for code in unicodeString.utf16 {
   print("\(code) ")
}
```

编译运行以上 Swift 范例，输出结果为

```swift
UTF-8 编码: 
232 
143 
156 
233 
184 
159 
230 
149 
153 
231 
168 
139 
UTF-16 编码: 
33756 
40479 
25945 
31243
```

## 字符串函数及运算符

Swift 支持以下几种字符串函数

函数
描述

isEmpty
判断字符串是否为空，返回布尔值

hasPrefix(prefix: String)
检查字符串是否拥有特定前缀

hasSuffix(suffix: String)
检查字符串是否拥有特定后缀。

Int(String)
转换字符串数字为整型。
实例:let myString: String = "256"
let myInt: Int? = Int(myString)

String.characters.count
计算字符串的长度

utf8
通过遍历 String 的 utf8 属性来访问它的 UTF-8 编码

utf16
通过遍历 String 的 utf8 属性来访问它的 UTF-16 编码

unicodeScalars
通过遍历String值的unicodeScalars属性来访问它的 Unicode 标量编码.

## 字符串运算符

Swift 支持以下几种字符串运算符

运算符
描述

+
连接两个字符串，并返回一个新的字符串

+=
连接操作符两边的字符串并将新字符串赋值给左边的操作符变量

==
判断两个字符串是否相等

<
比较两个字符串，对两个字符串的字母逐一比较

!=
比较两个字符串是否不相等
