# 17、Swift 3 闭包
- 来源：https://ddkk.com/zhuanlan/other/swift3/17.html
- 分类：Swift 3 教程
- 分组：教程目录
**闭包(Closures)** 是自包含的功能代码块，可以在代码中使用或者用来作为参数传值

从某些方面说，闭包有点类似匿名函数

全局函数和嵌套函数其实就是特殊的闭包

### 闭包的形式

全局函数
嵌套函数
闭包表达式

有名字但不能捕获任何值
有名字，也能捕获封闭函数内的值
无名闭包，使用轻量级语法，可以根据上下文环境捕获值

### Swift 中的闭包

Swift 中的闭包有很多优化的地方

**1、** 可根据上下文推断参数和返回值类型；

**2、** 从单行表达式闭包中隐式返回（也就是闭包体只有一行代码，可以省略return）；

**3、** 可以使用简化参数名，如 `$` 0, `$` 1(从0开始，表示第i个参数...)；

**4、** 提供了尾随闭包语法(Trailingclosuresyntax)；

### 语法

下面代码定义了一个接收参数并返回指定类型的闭包语法：

```swift
{
  (parameters) -> return type in
   statements
}
```

#### 范例

```swift
import Cocoa
let techer_name = { print("DDKK.COM 弟弟快看，程序员编程资料站，DDKK.COM 弟弟快看，程序员编程资料站") }
techer_name()
```

编译运行以上 Swift 范例，输出结果为

```swift
$ swift main.swift
DDKK.COM 弟弟快看，程序员编程资料站，DDKK.COM 弟弟快看，程序员编程资料站
```

下面的闭包形式接收两个参数并返回布尔值

```swift
{(Int, Int) -> Bool in
   Statement1
   Statement2
    ---
   Statementn
}
```

#### 范例 2

```swift
import Cocoa
let mul  = { (val1: Int, val2: Int) -> Int in 
   return val1 * val2 
}
let result = mul(200, 20)
print (result)
```

编译运行以上 Swift 范例，输出结果为

```swift
$ swift main.swift
4000
```

## 闭包表达式

闭包表达式是一种利用简洁语法构建内联闭包的方式

闭包表达式提供了一些语法优化，让开发者定义闭包变得简单明了

### sorted 方法

Swift 标准库提供了名为 **sorted(by:)** 的方法，会根据提供的用于排序的闭包函数将已知类型数组中的值进行排序

排序完成后，sorted(by:) 方法会返回一个与原数组大小相同，包含同类型元素且元素已正确排序的新数组

原数组不会被 sorted(by:) 方法修改

sorted(by:)方法需要传入两个参数：

**1、** 已知类型的数组；

**2、** 闭包函数，该闭包函数需要传入与数组元素类型相同的两个值，并返回一个布尔类型值来表明当排序结束后传入的第一个参数排在第二个参数前面还是后面；

如果第一个参数值出现在第二个参数值前面，排序闭包函数需要返回 **true** ，反之返回 **false**

### sorted 方法使用范例

```swift
import Cocoa
let cops = ["BE", "BA", "C", "T", "BE"]
func sort_backwards(s1: String, s2: String) -> Bool {
    return s1 > s2
}
var reversed = cops.sorted(by: sort_backwards)
print(reversed)
```

编译运行以上 Swift 范例，输出结果为

```swift
$ swift main.swift
["T", "C", "BE", "BE", "BA"]
```

如果第一个字符串 (s1) 大于第二个字符串 (s2)，backwards 函数返回 true， 表示在新的数组中 s1 应该出现在 s2 前 对于字符串中的字符来说，"大于" 表示 "按照字母顺序较晚出现" 这意味着字母 "B" 大于字母 "A"，字符串 "S" 大于字符串 "D"

其将进行字母逆序排序，"AT"将会排在"AE"之前

## 参数名称简写

Swift 自动为内联函数提供了参数名称简写功能

我们可以直接通过 `$` 0, `$` 1, `$` 2 来顺序调用闭包的参数

### Swift 闭包名称简写使用范例

```swift
import Cocoa
let cops = ["BE", "BA", "C", "T", "BE"]
var reversed = cops.sorted(by: { $0 > $1 })
print(reversed)
```

`$` 0 和 `$` 1 表示闭包中第一个和第二个 String 类型的参数

编译运行以上 Swift 范例，输出结果为

```swift
$ swift main.swift
["T", "C", "BE", "BE", "BA"]
```

> 如果在闭包表达式中使用参数名称缩写, 可以在闭包参数列表中省略对其定义, 并且对应参数名称缩写的类型会通过函数类型进行推断
>
> in 关键字同样也可以被省略

## Swift 闭包中的运算符函数

实际上还有一种更简短的方式来撰写上面例子中的闭包表达式，就是使用 **运算符重载**

Swift 的 String 类型定义了关于大于号 ( >` ) 的字符串实现，其作为一个函数接受两个 String 类型的参数并返回 Bool 类型的值

而这正好与 sort(_:) 方法的第二个参数需要的函数类型相符合

所以我们可以简单地传递一个大于号，Swift可以自动推断出您想使用大于号的字符串函数实现：

```swift
import Cocoa
let cops = ["BE", "BA", "C", "T", "BE"]
var reversed = cops.sorted(by: > )
print(reversed)
```

编译运行以上 Swift 范例，输出结果为

```swift
$ swift main.swift
["T", "C", "BE", "BE", "BA"]
```

## Swift 尾随闭包

**尾随闭包** 是一个书写在函数括号之后的闭包表达式，函数支持将其作为最后一个参数调用

```swift
func someFunctionThatTakesAClosure(closure: () -> Void) {
    // 函数体部分
}
// 以下是不使用尾随闭包进行函数调用
someFunctionThatTakesAClosure({
    // 闭包主体部分
})
// 以下是使用尾随闭包进行函数调用
someFunctionThatTakesAClosure() {
  // 闭包主体部分
}
```

### Swift 尾随闭包使用范例

```swift
import Cocoa
let cops = ["BE", "BA", "C", "T", "BE"]
var reversed = cops.sorted(){ $0 > $1 }
print(reversed)
```

sort() 后的 { `$` 0 >``$` 1} 为尾随闭包

编译运行以上 Swift 范例，输出结果为

```swift
$ swift main.swift
["T", "C", "BE", "BE", "BA"]
```

> 如果函数只需要闭包表达式一个参数，当您使用尾随闭包时，您甚至可以把()省略掉。

### Swift 尾随闭包省略括号()使用范例

```swift
import Cocoa
let cops = ["BE", "BA", "C", "T", "BE"]
var reversed = cops.sorted{ $0 > $1 }
print(reversed)
```

编译运行以上 Swift 范例，输出结果为

```swift
$ swift main.swift
["T", "C", "BE", "BE", "BA"]
```

## Swift 闭包捕获值

闭包可以在其定义的上下文中捕获常量或变量

即使定义这些常量和变量的原域已经不存在，闭包仍然可以在闭包函数体内引用和修改这些值

**Swift** 最简单的闭包形式是嵌套函数，也就是定义在其他函数的函数体内的函数 嵌套函数可以捕获其外部函数所有的参数以及定义的常量和变量

### Swift 闭包捕获值范例

```swift
import Cocoa
func makeIncrementor(forIncrement amount: Int) -> () -> Int {
    var runningTotal = 0
    func incrementor() -> Int {
        runningTotal += amount
        return runningTotal
    }
    return incrementor
}
let incr = makeIncrementor(forIncrement:5)
print(incr())
print(incr())
print(incr())
```

一个函数 makeIncrementor ，它有一个 Int 型的参数 amout, 并且它有一个外部参数名字 forIncremet，意味着你调用的时候，必须使用这个外部名字 返回值是一个()->` Int的函数

函数体内，声明了变量 runningTotal 和一个函数 incrementor

incrementor 函数并没有获取任何参数，但是在函数体内访问了 runningTotal 和amount变量。这是因为其通过捕获在包含它的函数体内已经存在的runningTotal和amount变量而实现。

由于没有修改amount变量，incrementor实际上捕获并存储了该变量的一个副本，而该副本随着incrementor一同被存储

编译编译运行以上 Swift 范例，输出结果为

```swift
$ swift main.swift
5
10
15
```

## Swift中的闭包是引用类型

在上面的实例中 incrementByTen 是常量，但是这些常量指向的闭包仍然可以增加其捕获的变量值

这是因为函数和闭包都是引用类型

无论您将函数/闭包赋值给一个常量还是变量，您实际上都是将常量/变量的值设置为对应函数/闭包的引用。 上面的例子中，incrementByTen指向闭包的引用是一个常量，而并非闭包内容本身

这意味着如果您将闭包赋值给了两个不同的常量/变量，两个值都会指向同一个闭包：

```swift
import Cocoa
func makeIncrementor(forIncrement amount: Int) -> () -> Int {
    var runningTotal = 0
    func incrementor() -> Int {
        runningTotal += amount
        return runningTotal
    }
    return incrementor
}
let incr = makeIncrementor(forIncrement:5)
let incr2 = incr
print(incr())
print(incr2())
print(incr())
print(incr2())
print(incr())
```

编译运行以上 Swift 范例，输出结果为

```swift
$ swift main.swift
5
10
15
20
25
```
