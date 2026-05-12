# 41、Swift 3 switch 语句
- 来源：https://ddkk.com/zhuanlan/other/swift3/41.html
- 分类：Swift 3 教程
- 分组：教程目录
Swift **switch** 语句允许测试一个变量是否等于多个值时的情况

> Swift 语言中只要匹配到 case 语句，则整个 switch 语句执行完成

### switch 语法格式

```swift
switch expression {
   case expression1  :
      statement(s)
      fallthrough /* 可选 */
   case expression2, expression3  :
      statement(s)
      fallthrough /* 可选 */
   // 可选
   default : 
      statement(s);
}
```

一般在switch 语句中不使用 fallthrough 语句

这里我们需要注意 case 语句中如果没有使用 **fallthrough** 语句，则在执行当前的 case 语句后，switch 会终止，控制流将跳转到 switch 语句后的下一行

如果使用了 **fallthrough** 语句，则会继续执行之后的 case 或 default 语句，不论条件是否满足都会执行

> 在大多数语言中，switch 语句块中，case 要紧跟 break，否则 case 之后的语句会顺序运行，而在 Swift 语言中，默认是不会执行下去的，switch 也会终止。

如果想在 Swift 中让 case 之后的语句会按顺序继续运行，则需要使用 fallthrough 语句

### switch 语句使用范例 1

```swift
import Cocoa
var age = 18
switch age {
case 18  :
    print("年方二八")
case 30  :
    print("30 而立")
case 40 :
    print("40 不惑")
default :
    print("啊，你好年轻")
}
```

编译执行上面的代码，输出结果为:

```swift
年方二八
```

### switch 中使用 fallthrough 范例 2

```swift
import Cocoa
var age = 30
switch age {
case 18  :
    print("年方二八")
case 30  :
    fallthrough
case 40 :
    print("你要么是30岁，要么是40岁")
default :
    print("啊，你好年轻")
}
```

编译执行以上代码，输出结果为:

```swift
你要么是30岁，要么是40岁
```
