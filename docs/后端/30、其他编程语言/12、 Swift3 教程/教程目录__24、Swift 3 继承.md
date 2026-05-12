# 24、Swift 3 继承
- 来源：https://ddkk.com/zhuanlan/other/swift3/24.html
- 分类：Swift 3 教程
- 分组：教程目录
继承可以理解为一个类获取了另外一个类的方法和属性

当一个类继承其它类时，继承类叫子类，被继承类叫超类（或父类)

在 **Swift** 中，类可以调用和访问超类的方法，属性和下标脚本，并且可以重写它们

## 基类

没有继承其它类的类，称之为**基类**（ Base Class ）

下面实例中我们定义了基类 **Student**，描述了学生（name）及其各科成绩的分数(mark1、mark2、mark3)：

## 基类实例

```swift
import Cocoa
class Student {
    var name: String
    var mark1: Int
    var mark2: Int
    var mark3: Int
    init(name: String, mark1: Int, mark2: Int, mark3: Int) {
        self.name  = name
        self.mark1 = mark1
        self.mark2 = mark2
        self.mark3 = mark3
    }
}
let name = "Jan"
let mark1 = 98
let mark2 = 99
let mark3 = 97
let sds = Student(name:name, mark1:mark1, mark2:mark2, mark3:mark3);
print(sds.name)
print("--------各科成绩-----------")
print(sds.mark1)
print(sds.mark2)
print(sds.mark3)
```

编译运行以上 Swift 范例，输出结果为

```swift
$ swift main.swift
Jan
--------各科成绩-----------
98
99
97
```

## 子类

子类指的是在一个已有类的基础上创建一个新的类

为了指明某个类的超类，将超类名写在子类名的后面，用 **冒号(:)** 分隔

语法格式如下

```swift
class ChildClass: Superclass
{
    // 类的定义
}
```

### 子类实例

下面实例中我们定义了超类 Student，然后再定义一个子类 Tom 继承它：

```swift
import Cocoa
class Student
{
    var name: String
    var mark1: Int
    var mark2: Int
    init(name:String,stm1:Int, results stm2:Int)
    {
        self.name = name
        self.mark1 = stm1
        self.mark2 = stm2
    }
    func show()
    {
        print("\(self.name) 's Mark:\n------------\nMark1:\(self.mark1)\nMark2:\(self.mark2)")
    }
}
class Tom : Student
{
    init()
    {
        super.init(name:"Tom",stm1: 98, results: 97)
    }
}
let tom = Tom()
tom.show()
```

编译运行以上 Swift 范例，输出结果为

```swift
$ swift main.swift
Tom 's Mark:
------------
Mark1:98
Mark2:97
```

## 重写（Overriding）

子类可以通过继承来的实例方法，类方法，实例属性，或下标脚本来实现自己的定制功能，我们把这种行为叫 **重写（overriding）**

可以使用 **override** 关键字来实现重写

### 访问超类的方法、属性及下标脚本

你可以通过使用 **super** 前缀来访问超类的方法，属性或下标脚本

重写
访问方法，属性，下标脚本

方法
super.somemethod()

属性
super.someProperty()

下标脚本
super[someIndex]

## 重写方法和属性

### 重写方法

子类中可以使用 **override** 关键字来重写超类的方法

下面实例中我们重写了 Student 的 show() 方法

```swift
import Cocoa
class Student
{
    var name: String
    var mark1: Int
    var mark2: Int
    init(name:String,stm1:Int, results stm2:Int)
    {
        self.name = name
        self.mark1 = stm1
        self.mark2 = stm2
    }
    func show()
    {
        print("\(self.name) 's Mark:\n------------\nMark1:\(self.mark1)\nMark2:\(self.mark2)")
    }
}
class Tom : Student
{
    init()
    {
        super.init(name:"Tom",stm1: 98, results: 97)
    }
    override func show() {
       print("I'am \(self.name)")
       print("My mark is:")
       print("------------\nMark1:\(self.mark1)\nMark2:\(self.mark2)")
    }
}
let tom = Tom()
tom.show()
```

编译运行以上 Swift 范例，输出结果为

```swift
$ swift main.swift
I'am Tom
My mark is:
------------
Mark1:98
Mark2:97
```

### 重写属性

可以通过定制的 getter（或 setter）来重写任意继承来的属性，无论继承来的属性是存储型的还是计算型的属性

子类并不知道继承来的属性是存储型的还是计算型的，它只知道继承来的属性会有一个名字和类型。所以我们在重写一个属性时，必需将它的名字和类型都写出来

但有几点需要注意：

- 如果在重写属性中提供了 setter，那么也一定要提供 getter
- 如果不想再重写版本中的 getter 里修改继承来的属性值，可以直接通过 **super.someProperty** 来返回继承来的值，其中 **someProperty** 是要重写的属性的名字

下面实例中定义了超类 Circle 及子类 Rectangle, 然后在 Rectangle 类中重写 **area** 属性：

```swift
import Cocoa
class Rectangle {
    var width:Double = 3.0
    var height:Double = 4.0
    var area: Double {
        return self.height * self.width
    }
}
class Circle:Rectangle {
    var radius: Double = 0
    override var area: Double {
        return 3.1415926 * radius * radius
    }
}
let ci = Circle()
ci.radius = 25.0
print("圆的面积为:\(ci.area)")
```

编译运行以上 Swift 范例，输出结果为

```swift
$ swift main.swift
圆的面积为:1963.495375
```

## 重写属性观察器

可以通过重写来为一个继承来的属性添加属性观察器。这样，当继承来的属性值发生改变时，就可以监测到

> 不可以为继承来的常量存储型属性或继承来的只读计算型属性添加属性观察器

```swift
import Cocoa
class Circle {
    var radius = 12.5
    var area: Double {
        return 3.1415926 * radius * radius
    }
}
class Rectangle: Circle {
    var width = 3.0
    var height = 4.0
    override var area: Double {
        return width * height
    }
}
class Square: Rectangle {
    override var radius: Double {
        didSet {
            width = radius / 5.0 + 1
        }
    }
}
let rect = Rectangle()
rect.width = 6.0
rect.height = 8.0
print("rect 面积为: \(rect.area)")
let sq = Square()
sq.radius = 100.0
print("Square的面积: \(sq.area)")
```

```swift
rect 面积为: 48.0
Square的面积: 84.0
```

## 防止重写

可以使用 **final** 关键字防止属性或者方法被子类重写

重写了**final** 方法，属性或下标脚本，在编译时会报错

可以通过在关键字 **class** 前添加 **final** 来标记整个类标记为 final 的，这样的类是不可被继承的，否则会报编译错误

```swift
import Cocoa
class Circle {
    var radius = 12.5
    final var area: Double {
        return 3.1415926 * radius * radius
    }
}
final class Rectangle: Circle {
    var width = 3.0
    var height = 4.0
    override var area: Double {
        return width * height
    }
}
class Square: Rectangle {
    override var radius: Double {
        didSet {
            width = radius / 5.0 + 1
        }
    }
}
let rect = Rectangle()
rect.width = 6.0
rect.height = 8.0
print("rect 面积为: \(rect.area)")
let sq = Square()
sq.radius = 100.0
print("Square的面积: \(sq.area)")
```

Circle 的属性 area 和 Rectangle 类由于使用了 final 关键字不允许重写，所以执行会报错：

```swift
$ swift main.swift
error: var overrides a 'final' var
    override var area: Double {
                 ^
error: inheritance from a final class 'Rectangle'
class Square: Rectangle 
```
