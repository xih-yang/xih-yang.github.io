# 40、Swift 3 repeat...while 循环
- 来源：https://ddkk.com/zhuanlan/other/swift3/40.html
- 分类：Swift 3 教程
- 分组：教程目录
Swift **repeat...while** 循环不像 for 和 while 循环在循环体开始执行前先判断条件语句，而是在循环执行结束时判断条件是否符合

### Swift3 repeat...while 语法格式

```swift
repeat
{
   //statement(s);
}while( condition );
```

> 条件表达式出现在循环的尾部，所以循环中的 statement(s) 会在条件被测试之前至少执行一次

如果条件为 true，控制流会跳转回上面的 repeat，然后重新执行循环中的 statement(s) 这个过程会不断重复，直到给定条件变为 false 为止

数字0, 字符串 '0' 和 "", 空的 list(), 及未定义的变量都为 **false** ， 其他的则都为 **true**

true 取反使用 **!** 号或 **not** ，取反后返回 false

### repeat...while 语句流程图

## repeat...while 使用范例

```swift
import Cocoa
var step = 15
repeat{
    step = step + 2
    print( "step 的值为 \(step)")
} while step < 20
```

执行以上程序，输出结果为

```swift
step 的值为 17
step 的值为 19
step 的值为 21
```
