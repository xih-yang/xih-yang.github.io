# 37、Swift 3 嵌套 if 语句
- 来源：https://ddkk.com/zhuanlan/other/swift3/37.html
- 分类：Swift 3 教程
- 分组：教程目录
在Swift 语言中，可以在一个 if 或 else if 语句内使用另一个 if 或 else if 语句

## 嵌套 if 语句语法

```swift
if <boolean_expression_1> {
   /* 当 <boolean_expression_1> 表达式 true 时执行 */
   if <boolean_expression_2> {
      /* 当 <boolean_expression_2> 表达式 true 时执行 */
   }
}
```

可以嵌套 **else if...else** ，方式与嵌套 *if* 语句相似

### 范例

```swift
import Cocoa
var age = 30
if age <= 18 {
    print("豆蔻年华")
} else if age >= 30 {
  print("你大于等于30岁")
  if age == 30 {
    print("30而立")
   }
}
```

编译编译运行以上 Swift 范例，输出结果为

```swift
你大于等于30岁
30而立
```
