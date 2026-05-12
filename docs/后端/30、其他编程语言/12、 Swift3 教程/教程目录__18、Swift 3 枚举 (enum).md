# 18、Swift 3 枚举 (enum)
- 来源：https://ddkk.com/zhuanlan/other/swift3/18.html
- 分类：Swift 3 教程
- 分组：教程目录
枚举(enum) 是用户自定义的数据类型,是一组有共同特性的数据的集合

Swift 的枚举类似于 Objective C 和 C 的结构

### 枚举的特征

- 它声明在类中，可以通过实例化类来访问它的值
- 枚举也可以定义构造函数（initializers）来提供一个初始成员值
- 枚举可以在原始的实现基础上扩展它们的功能
- 可以通过扩展协议（protocols）来提供标准的功能

### 语法

Swift 中使用 **enum** 关键词来创建枚举

```swift
enum enumname {
   // 枚举定义放在这里
}
```

比如下面的代码定义了一个表示星期的枚举

```swift
import Cocoa
enum DaysofaWeek
{
    case Sunday
    case Monday
    case TUESDAY
    case WEDNESDAY
    case THURSDAY
    case FRIDAY
    case Saturday
}
var weekDay = DaysofaWeek.THURSDAY
weekDay = .FRIDAY
switch weekDay
{
case .Sunday:
    print("星期天")
case .Monday:
    print("星期一")
case .TUESDAY:
    print("星期二")
case .WEDNESDAY:
    print("星期三")
case .THURSDAY:
    print("星期四")
case .FRIDAY:
    print("星期五")
case .Saturday:
    print("星期六")
}
```

编译运行以上 Swift 脚本，输出结果如下

```swift
$ swift main.swift
星期五
```

枚举中定义的值（如Sunday，Monday，……和Saturday）是这个枚举的 **成员值** （或 **成员** ）

case 关键词表示一行新的成员值将被定义

> Swift 的枚举成员在被创建时不会被赋予一个默认的整型值
>
> 在上面的 DaysofaWeek 例子中，Sunday，Monday，…… 和 Saturday 不会隐式地赋值为0，1，……和6
>
> 相反，这些枚举成员本身就有完备的值，这些值是已经明确定义好的 DaysofaWeek 类型

```swift
var weekDay = DaysofaWeek.THURSDAY
```

weekDay的类型可以在它被DaysofaWeek的一个可能值初始化时推断出来。一旦weekDay被声明为一个DaysofaWeek，你可以使用一个缩写语法（.）将其设置为另一个DaysofaWeek的值：

```swift
var weekDay = .THURSDAY
```

当weekDay的类型已知时，再次为其赋值可以省略枚举名。使用显式类型的枚举值可以让代码具有更好的可读性。

> 枚举可分为相关值与原始值

### 相关值与原始值的区别

相关值
原始值

不同数据类型
相同数据类型

实例: enum
实例: enum

值的创建基于常量或变量
预先填充的值

相关值是在创建一个基于枚举成员的新常量或变量时才会被设置，并且每次这么做得时候，它的值可以是不同的
原始值始终是相同的

### 相关值范例

下面范例中我们定义一个名为 Student 的枚举类型，它可以是 Name 的一个字符串（String），或者是 Mark 的一个相关值（Int，Int，Int）

```swift
import Cocoa
enum Student {
    case Name(String)
    case Mark(Int,Int,Int)
}
let studDetails = Student.Name("DDKK.COM 弟弟快看，程序员编程资料站")
let studMarks = Student.Mark(99,98,97)
func print_s(student:Student) {
    switch student {
    case .Name(let studName):
        print("学生的名字是: \(studName)。")
    case .Mark(let Mark1, let Mark2, let Mark3):
        print("学生的成绩是: \(Mark1),\(Mark2),\(Mark3)")
    }
}
print_s(student: studDetails )
print_s(student: studMarks )
```

编译运行以上 Swift 范例，输出结果如下

```swift
$ swift main.swift
学生的名字是: DDKK.COM 弟弟快看，程序员编程资料站。
学生的成绩是: 99,98,97
```

## 枚举( enum )的原始值

枚举( enum ) 的原始值可以是字符串，字符，可以是任何整型值或浮点型值。

在枚举声明中，每个原始值必须是唯一的

使用整数作为原始值时，不需要显式的为每一个成员赋值，Swift 会自动赋值

使用整数作为原始值时，隐式赋值的值依次递增 1

如果第一个值没有被赋初值，将会被自动置为 0

```swift
import Cocoa
enum Month: Int
{
    case January = 1, February, March, April, May, June, July, August, September, October, November, December
}
let month = Month.August.rawValue
print("数字月份为: \(month)")
```

编译运行以上 Swift 范例，输出结果如下

```swift
$ swift main.swift
数字月份为: 8
```
