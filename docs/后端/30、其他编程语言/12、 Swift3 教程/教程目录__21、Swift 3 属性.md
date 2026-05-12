# 21、Swift 3 属性
- 来源：https://ddkk.com/zhuanlan/other/swift3/21.html
- 分类：Swift 3 教程
- 分组：教程目录
Swift 属性将值跟特定的类、结构或枚举关联

属性可分为存储属性和计算属性:

存储属性
计算属性

存储常量或变量作为实例的一部分
计算（而不是存储）一个值

用于类和结构体
用于类、结构体和枚举

**存储属性** 和 **计算属性** 通常用于特定类型的实例

属性也可以直接用于类型本身，这种属性称为类型属性

另外，还可以定义属性观察器来监控属性值的变化，以此来触发一个自定义的操作

属性观察器可以添加到自己写的存储属性上，也可以添加到从父类继承的属性上

## 存储属性

**存储属性**就是存储在特定类或结构体的实例里的一个常量或变量

存储属性可以是变量存储属性（用关键字 var 定义），也可以是常量存储属性（用关键字 let 定义）:

- 可以在定义存储属性的时候指定默认值
- 也可以在构造过程中设置或修改存储属性的值，甚至修改常量存储属性的值

### 存储属性范例 1

```swift
import Cocoa
struct Circle
{
    var radius: Double
    let PI = 3.1415926
}
var n = Circle(radius: 12345)
n.radius = 5
print("\(n.radius)")
print("\(n.PI)")
```

编译运行以上 Swift 范例，输出结果为

```swift
5.0
3.1415926
```

考虑以下代码：

```swift
let PI = 3.1415926
```

代码中PI 在定义存储属性的时候指定默认值（ PI = 3.1415926），所以不管我们什么时候实例化结构体，它都不会改变

如果定义的是一个常量存储属性，如果尝试修改它就会报错

### 定义常量存储属性出错范例 2

```swift
import Cocoa
struct Circle
{
    var radius: Double
    let PI = 3.1415926
}
var n = Circle(radius: 12345)
n.radius = 5
print("\(n.radius)")
print("\(n.PI)")
n.PI = 6.2830
```

以上程序，执行会报错，错误如下所示：

```swift
error: cannot assign to property: 'PI' is a 'let' constant
n.PI = 6.2830
```

错误的大意是: 'PI' 是一个常量，你不能修改它

## 延迟绑定存储属性

延迟绑定存储属性是指当第一次被调用的时候才会计算其初始值的属性

在属性声明前使用 **lazy** 来标示一个延迟存储属性

> 必须将延迟存储属性声明成变量（使用 var 关键字），因为属性的值在实例构造完成之前可能无法得到 而常量属性在构造过程完成之前必须要有初始值，因此无法声明成延迟属性

延迟存储属性一般用于：

- 延迟对象的创建
- 当属性的值依赖于其他未知类

#### 延迟绑定存储属性范例

```swift
import Cocoa
struct Point {
    var x: Double
    var y: Double
}
class Rectangle {
    lazy var pos: Point = Point(x: 0.0, y: 0.0)
    var width  = 3.0
    var height = 4.0
}
let pos   = Point(x:8.0,y:8.0)
let rect  = Rectangle()
rect.pos  = pos
print("the rectangle start at x \(rect.pos.x) ")
```

编译运行以上 Swift 范例，输出结果为

```swift
the rectangle start at x 8.0 
```

## 实例化变量

如果您有过 Objective-C 经验，应该知道Objective-C 为类实例存储值和引用提供两种方法

对于属性来说，也可以使用实例变量作为属性值的后端存储

Swift 编程语言中把这些理论统一用属性来实现

Swift 中的属性没有对应的实例变量，属性的后端存储也无法直接访问

这就避免了不同场景下访问方式的困扰，同时也将属性的定义简化成一个语句

一个类型中属性的全部信息——包括命名、类型和内存管理特征——都在唯一一个地方（类型定义中）定义

## 计算属性

除存储属性外，类、结构体和枚举可以定义 **计算属性**

计算属性不直接存储值，而是提供一个 getter 来获取值，一个可选的 setter 来间接设置其他属性或变量的值

### 计算属性实例

类Rectangle 的 area 属性就是一个 **计算属性**

```swift
import Cocoa
struct Point {
    var x: Double
    var y: Double
}
class Rectangle {
    lazy var pos: Point = Point(x: 0.0, y: 0.0)
    var width  = 3.0
    var height = 4.0
    var area:Double {
        get {
            return width * height
        }
    }
}
let pos   = Point(x:8.0,y:8.0)
let rect  = Rectangle()
print("the area of  rectangle is \(rect.area) ")
```

编译运行以上 Swift 范例，输出结果为

```swift
the area of  rectangle is 12.0 
```

> 如果计算属性的 setter 没有定义表示新值的参数名，则可以使用默认名称 newValue

## 只读计算属性

只有getter 没有 setter 的计算属性就是只读计算属性。

只读计算属性总是返回一个值，可以通过点(.)运算符访问，但不能设置新的值。

```swift
import Cocoa
struct Point {
    var x: Double
    var y: Double
}
class Rectangle {
    lazy var pos: Point = Point(x: 0.0, y: 0.0)
    var width  = 3.0
    var height = 4.0
    var area:Double {
        get {
            return width * height
        }
    }
}
let rect  = Rectangle()
rect.area = 88
```

编译运行以上 Swift 范例，输出结果为

```swift
error: cannot assign to property: 'area' is a get-only property
rect.area = 88
```

> 必须使用var关键字定义计算属性，包括只读计算属性，因为它们的值不是固定的 let关键字只用来声明常量属性，表示初始化后再也无法修改的值

## 属性观察器

属性观察器监控和响应属性值的变化，每次属性被设置值的时候都会调用属性观察器，甚至新的值和现在的值相同的时候也不例外

可以为除了延迟存储属性之外的其他存储属性添加属性观察器，也可以通过重载属性的方式为继承的属性（包括存储属性和计算属性）添加属性观察器。

> 不需要为无法重载的计算属性添加属性观察器，因为可以通过 setter 直接监控和响应值的变化

可以为属性添加如下的一个或全部观察器：

- willSet 在设置新的值之前调用
- didSet 在新的值被设置之后立即调用
- willSet和didSet观察器在属性初始化过程中不会被调用

```swift
import Cocoa
class Counter {
    var counter: Int = 0 {
        willSet(newTotal){
            print("计数器: \(newTotal)")
        }
        didSet{
            if counter > oldValue {
                print("新增数 \(counter - oldValue)")
            }
        }
    }
}
let cnt = Counter()
cnt.counter = 200
cnt.counter = 1000
```

编译运行以上 Swift 范例，输出结果为

```swift
计数器: 200
新增数 200
计数器: 1000
新增数 800
```

## 全局变量和局部变量

计算属性和属性观察器所描述的模式也可以用于全局变量和局部变量。

局部变量
全局变量

在函数、方法或闭包内部定义的变量
函数、方法、闭包或任何类型之外定义的变量

用于存储和检索值
用于存储和检索值

存储属性用于获取和设置值
存储属性用于获取和设置值

也用于计算属性
也用于计算属性

## 类型属性

类型属性是作为类型定义的一部分写在类型最外层的花括号（{}）内

使用关键字 static 来定义值类型的类型属性，关键字 static 来为类定义类型属性

### struct 中使用 static 范例

```swift
import Cocoa
struct MyStruct {
    static var storedTypeProperty:String = "Hello"
    static var storedTypeProperty_sitename:String = "DDKK.COM 弟弟快看，程序员编程资料站"
    static var computedTypeProperty: String {
        get{
            return storedTypeProperty + " " + storedTypeProperty_sitename
        }
        set {
            storedTypeProperty_sitename = newValue
        }
    }
}
print(MyStruct.computedTypeProperty)
MyStruct.computedTypeProperty = "www.ddkk.com"
print(MyStruct.computedTypeProperty)
```

运行以上程序，输出结果为:

```swift
Hello DDKK.COM 弟弟快看，程序员编程资料站
Hello www.ddkk.com
```

### enum 中使用 static 范例

```swift
import Cocoa
struct MyEnum {
    static var storedTypeProperty:String = "DDKK.COM 弟弟快看，程序员编程资料站"
    static var computedTypeProperty: String {
        get{
            return "Hello " + storedTypeProperty
        }
        set {
            storedTypeProperty = newValue
        }
    }
}
print(MyEnum.computedTypeProperty)
MyEnum.computedTypeProperty = "www.ddkk.com"
print(MyEnum.computedTypeProperty)
```

运行以上程序，输出结果为:

```swift
Hello DDKK.COM 弟弟快看，程序员编程资料站
Hello www.ddkk.com
```

### class 中使用 static 定义类类型属性范例

```swift
import Cocoa
struct MyClass {
    static var storedTypeProperty:String = "DDKK.COM 弟弟快看，程序员编程资料站"
    static var computedTypeProperty: String {
        get{
            return "Hello " + storedTypeProperty
        }
        set {
            storedTypeProperty = newValue
        }
    }
}
print(MyClass.computedTypeProperty)
MyClass.computedTypeProperty = "www.ddkk.com"
print(MyClass.computedTypeProperty)
```

运行以上程序，输出结果为:

```swift
Hello DDKK.COM 弟弟快看，程序员编程资料站
Hello www.ddkk.com
```

## 获取和设置类型属性的值

类似于实例的属性，类型属性的访问也是通过点运算符(.)来进行

但是，类型属性是通过类型本身来获取和设置，而不是通过实例

```swift
import Cocoa
struct StudMarks {
    static let markCount = 97
    static var totalCount = 0
    var InternalMarks: Int = 0 {
        didSet {
            if InternalMarks > StudMarks.markCount {
                InternalMarks = StudMarks.markCount
            }
            if InternalMarks > StudMarks.totalCount {
                StudMarks.totalCount = InternalMarks
            }
        }
    }
}
var stud1Mark1 = StudMarks()
var stud1Mark2 = StudMarks()
stud1Mark1.InternalMarks = 88
print(stud1Mark1.InternalMarks)
stud1Mark2.InternalMarks = 78
print(stud1Mark2.InternalMarks)
```

编译运行以上 Swift 范例，输出结果为

```swift
88
78
```
