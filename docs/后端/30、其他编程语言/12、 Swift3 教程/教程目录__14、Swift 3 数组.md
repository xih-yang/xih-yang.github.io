# 14、Swift 3 数组
- 来源：https://ddkk.com/zhuanlan/other/swift3/14.html
- 分类：Swift 3 教程
- 分组：教程目录
Swift 数组使用有序列表存储同一类型的多个值，相同的值可以多次出现在一个数组的不同位置中

Swift 数组会强制检测元素的类型，如果类型不同则会报错，Swift 数组应该遵循像 Array`` 这样的形式，其中Element是这个数组中唯一允许存在的数据类型

如果创建一个数组，并赋值给一个变量，则创建的集合就是可以修改的

也就是说在创建数组后，可以通过添加、删除、修改的方式改变数组里的项目

如果将一个数组赋值给常量，数组就不可更改，并且数组的大小和内容都不可以修改

## 创建数组

可以使用构造语法来创建一个由特定数据类型构成的空数组

```swift
var someArray = [SomeType]()
```

以下是创建一个初始化大小数组的语法：

```swift
var someArray = [SomeType](repeating: InitialValue, count: NumbeOfElements)
```

### 范例 1

创建一个类型为 Int ，数量为 3，初始值为 0 的空数组

```swift
var someInts = [Int](repeating: 0, count: 3)
```

### 范例 2

创建含有三个元素的数组

```swift
var someInts:[Int] = [10, 20, 30]
```

## 访问数组

可以根据数组的索引来访问数组的元素

### 语法

```swift
var someVar = someArray[index]
```

index 索引从 0 开始，即索引 0 对应第一个元素，索引 1 对应第二个元素，以此类推

下面的范例演示了学习如何创建，初始化，访问数组

```swift
import Cocoa
var someInts = [Int](repeating: 10, count: 3)
var someVar = someInts[0]
print( "第一个元素的值 \(someVar)" )
print( "第二个元素的值 \(someInts[1])" )
print( "第三个元素的值 \(someInts[2])" )
```

编译运行以上 Swift 范例，输出结果为

```swift
第一个元素的值 10
第二个元素的值 10
第三个元素的值 10
```

## 修改数组

可以使用 append() 方法或者赋值运算符 += 在数组末尾添加元素

```swift
import Cocoa
var someInts = [Int]()
someInts.append(20)
someInts.append(30)
someInts += [40]
var someVar = someInts[0]
print( "第一个元素的值 \(someVar)" )
print( "第二个元素的值 \(someInts[1])" )
print( "第三个元素的值 \(someInts[2])" )
```

编译运行以上 Swift 范例，输出结果为

```swift
第一个元素的值 20
第二个元素的值 30
第三个元素的值 40
```

### 可以通过索引修改数组元素的值

```swift
import Cocoa
var someInts = [Int]()
someInts.append(20)
someInts.append(30)
someInts += [40]
// 修改最后一个元素
someInts[2] = 50
var someVar = someInts[0]
print( "第一个元素的值 \(someVar)" )
print( "第二个元素的值 \(someInts[1])" )
print( "第三个元素的值 \(someInts[2])" )
```

编译运行以上 Swift 范例，输出结果为

```swift
第一个元素的值 20
第二个元素的值 30
第三个元素的值 50
```

## 遍历数组

遍历数组有两种方法

### for-in 循环

可以使用 for-in 循环来遍历所有数组中的数据项

```swift
import Cocoa
var someStrs = [String]()
someStrs.append("Apple")
someStrs.append("Amazon")
someStrs.append("DDKK.COM 弟弟快看，程序员编程资料站")
someStrs += ["Google"]
for item in someStrs {
   print(item)
}
```

编译运行以上 Swift 范例，输出结果为

```swift
Apple
Amazon
DDKK.COM 弟弟快看，程序员编程资料站
Google
```

### 2. enumerate() 方法

如果同时需要每个数据项的值和索引值，可以使用 String 的 enumerate() 方法来进行数组遍历

```swift
import Cocoa
var someStrs = [String]()
someStrs.append("Apple")
someStrs.append("Amazon")
someStrs.append("DDKK.COM 弟弟快看，程序员编程资料站")
someStrs += ["Google"]
for (index, item) in someStrs.enumerated() {
    print("在 index = \(index) 位置上的值为 \(item)")
}
```

编译运行以上 Swift 范例，输出结果为

```swift
在 index = 0 位置上的值为 Apple
在 index = 1 位置上的值为 Amazon
在 index = 2 位置上的值为 DDKK.COM 弟弟快看，程序员编程资料站
在 index = 3 位置上的值为 Google
```

## 合并数组

可以使用加法操作符（+）来合并两种已存在的相同类型数组

新数组的数据类型会从两个数组的数据类型中推断出来

```swift
import Cocoa
var intsA = [Int](repeating: 2, count:2)
var intsB = [Int](repeating: 1, count:3)
var intsC = intsA + intsB
for item in intsC {
    print(item)
}
```

编译运行以上 Swift 范例，输出结果为

```swift
2
2
1
1
1
```

## count 属性

只读属性 count 可以统计数组元素的个数

```swift
import Cocoa
var intsA = [Int](count:2, repeatedValue: 2)
var intsB = [Int](count:3, repeatedValue: 1)
var intsC = intsA + intsB
print("intsA 元素个数为 \(intsA.count)")
print("intsB 元素个数为 \(intsB.count)")
print("intsC 元素个数为 \(intsC.count)")
```

编译运行以上 Swift 范例，输出结果为

```swift
intsA 元素个数为 2
intsB 元素个数为 3
intsC 元素个数为 5
```

## isEmpty 属性

只读属性 isEmpty 可以判断数组是否为空，返回布尔值

```swift
import Cocoa
var intsA = [Int](count:2, repeatedValue: 2)
var intsB = [Int](count:3, repeatedValue: 1)
var intsC = [Int]()
print("intsA.isEmpty = \(intsA.isEmpty)")
print("intsB.isEmpty = \(intsB.isEmpty)")
print("intsC.isEmpty = \(intsC.isEmpty)")
```

编译运行以上 Swift 范例，输出结果为

```swift
intsA.isEmpty = false
intsB.isEmpty = false
intsC.isEmpty = true
```
