# 20、Swift 3 类
- 来源：https://ddkk.com/zhuanlan/other/swift3/20.html
- 分类：Swift 3 教程
- 分组：教程目录
类的实质是一种数据类型，类似于 **int**、**char** 等基本类型，不同的是它是一种复杂的数据类型

因为它的本质是类型，而不是数据，所以不存在于内存中，不能被直接操作，只有被实例化为对象时，才会变得可操作

我们可以为类定义属性（常量、变量）和方法

> 类是引用类型

### 语法

Swift 使用关键字 class 来定义一个类

```swift
class <classname>
{
   <Definition 1>
   <Definition 2>
   ……
   <Definition N>
}
```

下面的代码定义了一个老师 ( Teacher ) 的类

```swift
class Teacher
{
   var teacher_name: String
   var age: Int 
}
```

## 实例化类

创建一个类的实例是直接在类名后面加括号 ()

```swift
let teacher_item = Teacher()
```

### 范例：类定义和类实例化

```swift
import Cocoa
class Teacher
{
    var teacher_name: String = "张三"
    var age: Int = 27
}
let teacher_of_m = Teacher()
print("小明的老师为:\(teacher_of_m.teacher_name)")
```

编译运行以上 Swift 范例，输出结果为

```swift
$ swift main.swift
小明的老师为:张三
```

## 访问类属性和方法

属性的声明方法和普通的常量变量的声明方法相同，唯一的区别就是属性是在类的上下文中

类以及类实例的属性和方法可以通过 **.** 来访问。

### 语法

```swift
实例化类名.属性名
```

### 范例 ：访问类属性和方法

```swift
import Cocoa
class Teacher
{
    var teacher_name: String = "张三"
    var age: Int = 27
}
let teacher_of_m = Teacher()
print("小明的老师为:\(teacher_of_m.teacher_name),年龄为:\(teacher_of_m.age)")
```

编译运行以上 Swift 范例，输出结果为

```swift
$ swift main.swift
小明的老师为:张三,年龄为:27
```

## 类的初始化方法(构造方法)

我们创建了一个 Teacher类,但是这个 **Teacher** 类没有在创建实例的时候初始化属性

给类添加初始化方法就是: 添加一个 init 初始化方法

> 类的初始化方法不需要用 func 关键词来修饰,也没有返回类型

```swift
import Cocoa
class Teacher
{
    var teacher_name: String
    var age: Int
    init(teacher_name:String,age:Int) {
        self.teacher_name = teacher_name
        self.age = age
    }
    func desc() {
        print("名字为:\(teacher_of_m.teacher_name),年龄为:\(teacher_of_m.age)")
    }
}
let teacher_of_m = Teacher(teacher_name:"张三",age:20)
teacher_of_m.desc()
```

编译运行以上 Swift 范例，输出结果为

```swift
$ swift main.swift
名字为:张三,年龄为:27
```

> 在初始化时 self 是如何区别参数 teacher_name 和属性 teacher_name 的
>
> 当你创建一个实例时像函数的调用的方法一样传入构造器参数
>
> 每一个属性都需要赋值＝要么在声明（numberOfSides）的时候，要么在初始化时(name)

## 类实例化的比较(恒等运算符操作)

恒等运算符就是 ===、!== 两个运算符

类是引用类型，因此可能有多个常量和变量在后台同时指向同一个类实例

为了能够判定两个常量或者变量是否引用同一个类实例，Swift 内建了两个恒等运算符：

恒等运算符
不恒等运算符

===
!==

如果两个常量或者变量引用同一个类实例则返回 true
如果两个常量或者变量引用不同一个类实例则返回 true

```swift
import Cocoa
class Teacher: Equatable {
    let name: String
    init(s: String) {
        name = s
    }
}
func ==(lhs: Teacher, rhs: Teacher) -> Bool {
    return lhs.name == rhs.name
}
let teacher1 = Teacher(s: "DDKK.COM 弟弟快看，程序员编程资料站")
let teacher2 = Teacher(s: "DDKK.COM 弟弟快看，程序员编程资料站")
let teacher3 = teacher2
if teacher1 === teacher2 {
    print("引用相同的类实例 \(teacher1)")
}
if teacher1 !== teacher2 {
    print("引用不相同的类实例 \(teacher2)")
}
if teacher3 === teacher2 {
    print("引用相同的类实例 \(teacher2)")
}
if teacher3 !== teacher2 {
    print("引用不相同的类实例 \(teacher2)")
}
```

编译执行以上程序,输出结果为:

```swift
引用不相同的类实例 __lldb_expr_22.Teacher
引用相同的类实例 __lldb_expr_22.Teacher
```

## 类和结构体对比

Swift 中 **类** 和 结构体 有很多共同点：

- 定义属性用于存储值
- 定义方法用于提供功能
- 定义附属脚本用于访问值
- 定义构造器用于生成初始化值
- 通过扩展以增加默认实现的功能
- 符合协议以对某类提供标准功能

与结构体相比，类还有如下的附加功能：

- 继承允许一个类继承另一个类的特征
- 类型转换允许在运行时检查和解释一个类实例的类型
- 解构器允许一个类实例释放任何其所被分配的资源
- 引用计数允许对一个类的多次引用
