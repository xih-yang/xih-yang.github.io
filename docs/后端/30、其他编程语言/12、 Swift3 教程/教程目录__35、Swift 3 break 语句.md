# 35、Swift 3 break 语句
- 来源：https://ddkk.com/zhuanlan/other/swift3/35.html
- 分类：Swift 3 教程
- 分组：教程目录
Swift **break** 语句会立刻结束整个控制流的执行

在嵌套循环（即一个循环内嵌套另一个循环）里，break 语句会停止执行最内层的循环，然后开始执行该块之后的下一行代码

### Swift break 语法格式

```swift
break
```

### break 流程图：

### break 使用实例

```swift
import Cocoa
var step = 15
repeat{
    step = step + 2
    // step 等于 17 时终止循环
    if( step == 19 ){
        break
    }
    print( "step 的值为 \(step)")
} while step < 20
```

编译运行以上 Swift 范例，输出结果为

```swift
step 的值为 17
```
