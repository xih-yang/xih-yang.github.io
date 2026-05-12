# 39、Swift 3 if...else 语句
- 来源：https://ddkk.com/zhuanlan/other/swift3/39.html
- 分类：Swift 3 教程
- 分组：教程目录
一个 **if 语句** 后可跟一个可选的 **else 语句** ，else 语句在布尔表达式为 false 时执行。

## if..else 语法

```swift
if <boolean_expression> {
   /* 如果布尔表达式 <boolean_expression> 为真将执行的语句 */
} else {
   /* 如果布尔表达式 <boolean_expression> 为假将执行的语句 */
}
```

- 如果布尔表达式为 **true** ，则执行 **if** 块内的代码
- 如果布尔表达式为 **false** ，则执行 **else** 块内的代码

## if..else 流程图

## if..else 使用范例

```swift
import Cocoa
var age = 17
if age <= 18 {
    print("豆蔻年华")
} else  {
    print("年轻有为")
}
```

编译执行以上代码，输出结果为:

```swift
豆蔻年华
```
