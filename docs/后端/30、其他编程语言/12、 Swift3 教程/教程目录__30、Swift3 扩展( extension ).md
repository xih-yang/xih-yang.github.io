# 30、Swift3 扩展( extension )
- 来源：https://ddkk.com/zhuanlan/other/swift3/30.html
- 分类：Swift 3 教程
- 分组：教程目录
Swift 提供了 **extension** 关键字为一个已有的类、结构体或枚举类型添加扩展，添加新功能

**扩展可以对一个类型添加新的功能，但是不能重写已有的功能**

Swift 中的扩展可以：

- 添加计算型属性和计算型静态属性
- 定义实例方法和类型方法
- 提供新的构造器
- 定义下标
- 定义和使用新的嵌套类型
- 使一个已有类型符合某个协议

### 语法

Swift 使用 **extension** 关键字声明扩展的语法格式如下

```swift
extension SomeType
{
    //加到 SomeType 的新功能写到这里
}
```

一个扩展可以扩展一个已有类型，使其能够适配一个或多个协议，语法格式如下：

```swift
extension SomeType: SomeProtocol, AnotherProctocol
{
    // 协议实现写到这里
}
```

## 计算型属性

扩展(**extension**) 可以向已有类型添加**计算型实例属性**和**计算型类型属性**

下面的代码向 Int 类型添加了 5 个计算型实例属性并扩展其功能

```swift
import Cocoa
extension Int
{
   var add: Int { return self + 10 }
   var sub: Int { return self - 10 }
   var mul: Int { return self * 10 }
   var div: Int { return self / 10 }
}
let addition = 5.add
print("加法运算后的值：\(addition)")
let subtraction = 100.sub
print("减法运算后的值：\(subtraction)")
let multiplication = 49.mul
print("乘法运算后的值：\(multiplication)")
let division = 60.div
print("除法运算后的值: \(division)")
let mix = 40.add + 45.sub
print("混合运算结果：\(mix)")
```

编译运行以上 Swift 范例，输出结果为

```swift
$ swift main.swift
加法运算后的值：15
减法运算后的值：90
乘法运算后的值：490
除法运算后的值: 6
混合运算结果：85
```

## 使用 extension 添加构造器

扩展可以向已有类型添加新的构造器

新的构造器可以让我们扩展其它类型，将你自己的定制类型作为构造器参数，或者提供该类型的原始实现中没有包含的额外初始化选项

扩展可以向类中添加新的便利构造器 init()，但是它们不能向类中添加新的指定构造器或析构函数 deinit()

```swift
import Cocoa
struct sum
{
    var first  = 100
    var second = 200
}
struct diff
{
    var first_num = 200
    var second_num = 100
}
struct mult
{
    var aa = sum()
    var bb = diff()
}
extension mult
{
    init(x: sum, y: diff)
    {
        _ = x.first + x.second
        _ = y.first_num + y.second_num
    }
}
let sum_n  = sum(first: 200, second: 500)
let diff_n = diff(first_num: 100, second_num: 500)
let mult_r = mult(x: sum_n, y: diff_n)
print("Mult sum\(mult_r.aa.first, mult_r.aa.second)")
print("Mult diff\(mult_r.bb.first_num, mult_r.bb.second_num)")
```

编译运行以上 Swift 范例，输出结果为

```swift
$ swift main.swift
Mult sum(100, 200)
Mult diff(200, 100)
```

## 使用 extension 添加方法

扩展可以向已有类型添加新的实例方法和类型方法

下面的代码向 Int 类型添加一个名为 topics 的新实例方法

```swift
import Cocoa
extension Int
{
    func title (_ summation: () -> ())
    {
        for _ in 0..<self {
            summation()
        }
    }
}
2.title({print("扩展模块内")})
3.title({print("内型转换模块内")})
```

title 方法使用了一个没有参数也没有返回值得 () ->` () 类型的单参数

给 **Int** 定义该扩展之后，我们就可以对任意整数调用 title方法,实现的功能则是多次执行某任务：

编译运行以上 Swift 范例，输出结果为

```swift
$ swift main.swift
扩展模块内
扩展模块内
内型转换模块内
内型转换模块内
内型转换模块内
```

## 使用 extension 添加可改变实例属性方法

可以通过扩展添加的实例方法也可以修改该实例本身

结构体和枚举类型中修改 **self** 或 **属性** 的方法必须将该实例方法标注为 **mutating**

下面的代码向 Swift 的 Int 类型添加了一个新的名为 square 的修改方法，来实现原始值的平方计算

```swift
import Cocoa
extension Int
{
    mutating func square()
    {
        self = self * self
    }
}
var num1 = 9
num1.square()
print("9 的平方为: \(num1)")
var num2 = 7
num2.square()
print("5 的平方为: \(num2)")
var num3 = 180
num3.square()
print("180 的平方为: \(num3)")
```

编译运行以上 Swift 范例，输出结果为

```swift
$ swift main.swift
9 的平方为: 81
5 的平方为: 49
180 的平方为: 32400
```

## 使用 extension 添加索引下标

使用extension 扩展可以向一个已有类型添加新下标，使得我们的类实例可以像访问数组元素一样用下标来索引值

> 索引下标从 0 开始

下面的代码向类型 Int 添加了一个整型下标索引下标 [n] 返回对应位数的数字

```swift
import Cocoa
extension Int
{
    subscript(multtable: Int) -> Int
    {
        var step = 1
        var bit = multtable
        while bit > 0 {
            step *= 10
            bit = bit-1
        }
        return (self / step ) % 10
    }
}
print(120[0])
print(985[1])
print(2048576[3])
```

编译运行以上 Swift 范例，输出结果为

```swift
$ swift main.swift
0
8
8
```

## 使用 extension 添加嵌套类型

扩展可以向已有的类、结构体和枚举添加新的嵌套类型

```swift
import Cocoa
extension Int
{
    enum calc
    {
        case add
        case sub
        case mult
        case div
        case anything
    }
    var print: calc 
    {
        switch self
        {
        case 0:
            return .add
        case 1:
            return .sub
        case 2:
            return .mult
        case 3:
            return .div
        default:
            return .anything
        }
    }
}
func result(_ numb: [Int])
{
    for i in numb {
        switch i.print {
        case .add:
            print("add ")
        case .sub:
            print("sub ")
        case .mult:
            print("mult ")
        case .div:
            print("div ")
        default:
            print("no design ")
        }
    }
}
result([0, 1, 2, 3, 4, 7])
```

编译运行以上 Swift 范例，输出结果为

```swift
$ swift main.swift
add 
sub 
mult 
div 
no design 
no design  
```
