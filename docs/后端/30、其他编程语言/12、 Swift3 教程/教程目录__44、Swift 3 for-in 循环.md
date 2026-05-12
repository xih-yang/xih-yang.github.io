# 44、Swift 3 for-in 循环
- 来源：https://ddkk.com/zhuanlan/other/swift3/44.html
- 分类：Swift 3 教程
- 分组：教程目录
Swift **for-in** 循环用于遍历一个集合里面的所有元素，例如由数字表示的区间、数组中的元素、字符串中的字符

### for-in 循环语句语法格式

Swift for-in 循环的语法格式如下

```swift
for <index> in <var> {
   // 循环体
}
```

### Swift for-in 循环语句流程图

### Swift for-in 循环语句 范例 1

```swift
import Cocoa
for i in 3...5 {
    print("\(i) 乘于 5 为：\(i * 5)")
}
```

范例中用来进行遍历的元素是使用闭区间操作符（...）表示的从1到5的数字区间

编译运行以上 Swift 范例，输出结果为

```swift
3 乘于 5 为：15
4 乘于 5 为：20
5 乘于 5 为：25
```

### Swift for-in 循环语句 范例 2

```swift
import Cocoa
var ints:[Int] = [11, 21, 31]
for i in ints {
    print( "i 的值为 \(i)")
}
```

编译运行以上 Swift 范例，输出结果为

```swift
i 的值为 11
i 的值为 21
i 的值为 31
```
