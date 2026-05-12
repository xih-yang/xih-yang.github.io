# 42、Swift 3 continue 语句
- 来源：https://ddkk.com/zhuanlan/other/swift3/42.html
- 分类：Swift 3 教程
- 分组：教程目录
Swift **continue** 语句告诉一个循环体立刻停止本次循环迭代，重新开始下次循环迭代

- 对于 **for** 循环， **continue** 语句执行后自增语句仍然会执行
- 对于 **while** 、**repeat...while** 和 **do...while** 循环， **continue** 语句重新执行条件判断语句

### Swift continue 的语法格式

```swift
continue
```

### Swift continue 流程图：

### Swift continue 语句使用范例

```swift
import Cocoa
var step = 5
repeat{
    step = step + 2
    if( step == 15 ){
        continue
    }
    print( "setp 的值为 \(step)")
}while step < 20
```

编译运行以上 Swift 范例，输出结果为

```swift
setp 的值为 7
setp 的值为 9
setp 的值为 11
setp 的值为 13
setp 的值为 17
setp 的值为 19
setp 的值为 21
```
