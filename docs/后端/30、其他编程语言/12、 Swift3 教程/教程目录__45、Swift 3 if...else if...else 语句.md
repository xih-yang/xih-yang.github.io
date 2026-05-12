# 45、Swift 3 if...else if...else 语句
- 来源：https://ddkk.com/zhuanlan/other/swift3/45.html
- 分类：Swift 3 教程
- 分组：教程目录
一个 **if 语句** 后可跟一个可选的 **else if...else 语句**

**else if...else 语句** 在测试多个条件语句时是非常有用的

使用if , else if , else 语句时需要注意以下几点：

- if 语句后可以有 0 个或 1 个 else，但是如果 有 else if 语句，else 语句需要在 else if 语句之后
- if 语句后可以有 0 个或多个 else if 语句，else if 语句必须在 else 语句出现之前
- 一旦 else 语句执行成功，其他的 else if 或 else 语句都不会执行

## if...else if...else 语法

```swift
if <boolean_expression_1> {
   /* 如果 <boolean_expression_1> 表达式为 true 则执行该语句 */
} else if <boolean_expression_2> {
   /* 如果 boolean_expression_2> 表达式为 true 则执行该语句 */
} else if <boolean_expression_3> {
   /* 如果 <boolean_expression_3> 表达式为 true 则执行该语句 */
} else {
   /* 如果以上所有条件表达式都不为 true 则执行该语句 */
}
```

### if...else if...else 使用范例

```swift
import Cocoa
var age = 30
if age <= 18 {
    print("豆蔻年华")
} else if age == 30 {
    print("30而立")
} else if age == 40 {
    print("40不惑")
} else  {
    print("年轻有为")
}
```

编译执行上面的代码，输出结果为:

```swift
30而立
```
