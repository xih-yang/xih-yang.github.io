# 36、Swift 3 while 循环
- 来源：https://ddkk.com/zhuanlan/other/swift3/36.html
- 分类：Swift 3 教程
- 分组：教程目录
Swift **while** 循环从计算单一条件开始， 如果条件为 true，会重复运行一系列语句，直到条件变为 false

### 语法

Swift while 循环的语法格式如下

```swift
while condition
{
   //statement(s)
}
```

语法中的 **statement(s)** 可以是一个语句或者一个语句块。 **condition** 可以是一个表达式。如果条件为true，会重复运行一系列语句，直到条件变为false。

数字0, 字符串 '0' 和 "", 空的 list(), 及未定义的变量都为 **false** ，其他的则都为 **true**

true 取反使用 **!** 号或 **not** ，取反后返回 false

### swift 3 while 循环语句流程图

### swift 3 while 循环语句范例

```swift
import Cocoa
var index = 15
while index < 20 
{
   print( "index 的值为 \(index)")
   index = index + 1
}
```

编译运行以上 Swift 范例，输出结果为

```swift
index 的值为 15
index 的值为 16
index 的值为 17
index 的值为 18
index 的值为 19
```
