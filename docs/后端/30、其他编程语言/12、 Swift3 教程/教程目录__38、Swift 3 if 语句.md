# 38、Swift 3 if 语句
- 来源：https://ddkk.com/zhuanlan/other/swift3/38.html
- 分类：Swift 3 教程
- 分组：教程目录
一个 **if 语句** 由一个布尔表达式后跟一个或多个语句组成

## Swift if 语句语法

```swift
if <boolean_expression> {
   /* 如果布尔表达式 <boolean_expression> 为真将执行的语句 */
}
```

- 如果布尔表达式为 **true** ，则 if 语句内的代码块将被执行
- 如果布尔表达式为 **false** ，则 if 语句结束后的第一组代码（闭括号后）将被执行

### 流程图

### Swift if 语句使用范例

```swift
import Cocoa
var age = 17
if age <= 18 {
    print("豆蔻年华")
}
if age > 18 {
    print("年轻有为")
}
```

编译执行以上代码，输出结果为:

```swift
豆蔻年华
```
