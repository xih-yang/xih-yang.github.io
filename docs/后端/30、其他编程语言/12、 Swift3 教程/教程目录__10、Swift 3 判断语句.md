# 10、Swift 3 判断语句
- 来源：https://ddkk.com/zhuanlan/other/swift3/10.html
- 分类：Swift 3 教程
- 分组：教程目录
判断语句通过设定的一个或多个条件来执行程序，在条件为真时执行指定的语句，在条件为 false 时执行另外指定的语句

### 条件语句执行流程图

可以通过下图来简单了解条件语句的执行过程

### 条件语句

Swift 提供了以下几种类型的条件语句

语句
描述

if 语句
if 语句由一个布尔表达式和一个或多个执行语句组成。

if...else 语句
if 语句后可以有可选的else 语句,else 语句在布尔表达式为 false 时执行

if...else if...else 语句
if后可以有可选的else if...else语句,else if...else语句常用于多个条件判断

内嵌 if 语句
你可以在if或else if中内嵌if或else if语句

switch 语句
switch 语句允许测试一个变量等于多个值时的情况

### if 语句使用范例

```swift
import Cocoa
var age = 19
if age <= 18 {
    print("豆蔻年华")
} else {
    print("年轻有为")
}
```

编译运行以上 Swift 范例，输出结果为

```swift
年轻有为
```

## ? : 运算符

**条件运算符 ? :** ，可以用来替代 **if...else** 语句

它的语法格式如下:

```swift
Exp1 ? Exp2 : Exp3;
```

其中，Exp1、Exp2 和 Exp3 是表达式。请注意，冒号的使用和位置。

?表达式的值是由 Exp1 决定的 - 如果 Exp1 为真，则计算 Exp2 的值，结果即为整个 ? 表达式的值 - 如果 Exp1 为假，则计算 Exp3 的值，结果即为整个 ? 表达式的值

### ?: 运算符使用范例

```swift
import Cocoa
var age = 19
var desc = age <= 18  ? "豆蔻年华" : "年轻有为"
print(desc)
```

编译运行以上 Swift 范例，输出结果为

```swift
年轻有为
```
