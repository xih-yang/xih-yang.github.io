# 03、Swift 3 基本语法
- 来源：https://ddkk.com/zhuanlan/other/swift3/3.html
- 分类：Swift 3 教程
- 分组：教程目录
创建一个 **OS X playground** 项目，然后引入 **Cocoa** ：

```swift
import Cocoa
var str1 = "Hello, World!"
print( str1 )
```

如果我们创建的是 iOS Playground，则需要引入 UIKit :

```swift
import UIKit
var str1 = "Hello, World!"
print(str1)
```

编译运行以上 Swift 范例，输出结果为

```swift
$ swift main.swift
Hello, World!
```

上面的代码是一个 Swift 最基本的程序结构

## Swift 引入类库或者框架

Swift 提供了 **import** 语句来引入任何的 Objective-C 框架（或 C 库）到 Swift 程序中

例如 **import Cocoa** 语句导入了 Cocoa 库

## Swift 标记

Swift 程序由多种标记组成，标记可以是单词，标识符，常量，字符串或符号

下面的Swift 代码由三种标记组成

```swift
print("test!")
```

以上语句由 3 个符号组成：单词( **print** )、符号( **()** )、字符串( **"test"** )

```swift
print
(
   "test!"
)
```

## 注释

Swift 的注释分为单行注释和多行注释

### 1. 单行注释以两个反斜线开头

单行注释以两个反斜线 (//) 开头，可以嵌套

```swift
//这是一行注释
//这也是当行注释 // 可以嵌套
print("Hello")  //单行注释
```

**1、** 多行注释以/*开始，以*/结束；

```swift
/* 这也是一条注释，
但跨越多行 */
```

Swift 的多行注释可以嵌套在其它多行注释内部

写法是在一个多行注释块内插入另一个多行注释

第二个注释块封闭时，后面仍然接着第一个注释块

```swift
/* 这是第一个多行注释的开头
/* 这是嵌套的第二个多行注释 */
这是第一个多行注释的结尾 */
```

多行注释嵌套可以让我们更快捷方便的注释代码块，即使代码块中已经有了注释

## 分号

Swift 不要求在每行语句的结尾使用分号(;)

```swift
import Cocoa
/* 我的第一个 Swift 程序 */
var myString = "Hello, World!"
print(myString)
```

但当在同一行书写多条语句时，必须用分号隔开

```swift
import Cocoa
/* 我的第一个 Swift 程序 */
var myString = "Hello, World!"; print(myString)
```

## 标识符

标识符就是给变量、常量、方法、函数、枚举、结构体、类、协议等指定的名字

构成标识符的字母均有一定的规范

#### Swift 语言中标识符的命名规则如下

- 区分大小写，Myname 与myname 是两个不同的标识符
- 标识符首字符可以以下划线（_）或者字母开始，但不能是数字
- 标识符中其他字符可以是下划线（_）、字母或数字

例如：userName、User_Name、_sys_val、身高等为合法的标识符

而 2mail、room# 和 class 为非法的标识符

Swift 中的字母采用的是 Unicode 编码

Unicode 叫做统一编码制，它包含了亚洲文字编码，如中文、日文、韩文等字符，甚至是我们在聊天工具中使用的表情符号

如果一定要使用关键字作为标识符，可以在关键字前后添加重音符号（\）

```swift
import Cocoa
var for = "Hello, World!"; 
print(for)
```

运行以上 Swift 范例，输出结果如下

```swift
$ swift main.swift
Hello, World!
```

## 关键字

关键字是类似于标识符的保留字符序列，除非用重音符号（\）将其括起来，否则不能用作标识符

关键字是对编译器具有特殊意义的预定义保留标识符

Swift 常见的关键字有以下 4 种

### 1. 与声明有关的关键字

class
deinit
enum
extension

func
import
init
internal

let
operator
private
protocol

public
static
struct
subscript

typealias
var

### 2. 与语句有关的关键字

break
case
continue
default

do
else
fallthrough
for

if
in
return
switch

where
while

### 3. 表达式和类型关键字

as
dynamicType
false
is

nil
self
Self
super

true
_COLUMN_
_FILE_
_FUNCTION_

_LINE_

### 4. 在特定上下文中使用的关键字

associativity
convenience
dynamic
didSet

final
get
infix
inout

lazy
left
mutating
none

nonmutating
optional
override
postfix

precedence
prefix
Protocol
required

right
set
Type
unowned

weak
willSet

## Swift 空格

在 **Swift** 中，运算符不能直接跟在变量或常量的后面

下面的代码会报错

```swift
import Cocoa
let a= 1 + 2
```

错误信息是

```swift
error: prefix/postfix '=' is reserved
```

意思大概是等号直接跟在前面或后面这种用法是保留的

下面的代码还是会报错（继续注意空格）：

```swift
let a = 1+ 2
```

错误信息是：

```swift
error: consecutive statements on a line must be separated by ';'
```

这是因为Swift认为到 1+ 这个语句就结束了，2 就是下一个语句了

只有这样写才不会报错

```swift
let a = 1 + 2;  // 编码规范推荐使用这种写法
let b = 3+4 // 这样也是OK的
```

## Swift 字面量

所谓字面量，就是指像特定的数字，字符串或者是布尔值这样，能够直接了当地指出自己的类型并为变量进行赋值的值

```swift
42                 // 整型字面量
3.14159            // 浮点型字面量
"Hello, world!"    // 字符串型字面量
true               // 布尔型字面量
```

## 打印输出

Swift 使用 print 函数打印输出

```swift
print("DDKK.COM 弟弟快看，程序员编程资料站") // 输出 DDKK.COM 弟弟快看，程序员编程资料站
```

print 函数是一个全局函数,完整的函数签名为

```swift
public func print(items: Any..., separator: String = default, terminator: String = default)
```

如果想让其不换行输出,只需要将最后一个参数赋值为空字符串即可

```swift
for x in 0...10
{
    print("\(x) ", terminator: "")
}
```

输出结果为

```swift
0 1 2 3 4 5 6 7 8 9 10
```

如果需要接收用户的输入可以使用 readLine():

```swift
let theInput = readLine()
```
