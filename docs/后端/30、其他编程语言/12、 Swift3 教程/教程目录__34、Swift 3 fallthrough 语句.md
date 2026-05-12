# 34、Swift 3 fallthrough 语句
- 来源：https://ddkk.com/zhuanlan/other/swift3/34.html
- 分类：Swift 3 教程
- 分组：教程目录
-layout: post title: Swift 3 fallthrough 语句 date: 2017-08-19 23:42:39 updated: 2017-08-19 23:42:39 parent: /penglei/swift3/swift3-basic-loops.html comments: true tags: swift swift3 switch fallthrough categories: swift3

Swift **fallthrough** 语句让 case 之后的语句会按顺序继续运行，且不论条件是否满足都会执行

Swift 中的 switch 不会从上一个 case 分支落入到下一个 case 分支中

只要第一个匹配到的 case 分支完成了它需要执行的语句，整个switch代码块完成了它的执行

> 在大多数语言中，switch 语句块中，case 要紧跟 break，否则 case 之后的语句会顺序运行，而在 Swift 语言中，默认是不会执行下去的，switch 也会终止

想在Swift 中让 case 之后的语句会按顺序继续运行，则需要使用 fallthrough 语句

### fallthrough 语法格式

```swift
fallthrough
```

> 一般在 switch 语句中不使用 fallthrough 语句

### 没有用到 fallthrough 的范例

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
