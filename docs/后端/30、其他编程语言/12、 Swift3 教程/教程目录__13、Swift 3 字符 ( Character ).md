# 13、Swift 3 字符 ( Character )
- 来源：https://ddkk.com/zhuanlan/other/swift3/13.html
- 分类：Swift 3 教程
- 分组：教程目录
Swift 的字符是一个单一的字符字符串字面量，数据类型为 Character

### 范例

下面的代码创建了两个字符变量

```swift
import Cocoa
let char1: Character = "A"
let char2: Character = "B"
print("char1 的值为 \(char1)")
print("char2 的值为 \(char2)")
```

编译运行以上 Swift 范例，输出结果为

```swift
char1 的值为 A
char2 的值为 B
```

**在Character（字符） 类型的常量中存储更多的字符，则程序执行会报错**

```swift
import Cocoa
// Swift 中以下赋值会报错
let char: Character = "AB"
print("Value of char \(char)")
```

编译运行以上 Swift 范例，输出结果为

```swift
error: cannot convert value of type 'String' to specified type 'Character'
let char: Character = "AB"
```

## 空字符变量

Swift 不允许创建空的 Character（字符） 类型变量或常量

```swift
import Cocoa
// Swift 中以下赋值会报错
let char1: Character = ""
var char2: Character = ""
print("char1 的值为 \(char1)")
print("char2 的值为 \(char2)")
```

编译运行以上 Swift 范例，输出结果为

```swift
error: cannot convert value of type 'String' to specified type 'Character'
let char1: Character = ""
                       ^~
error: cannot convert value of type 'String' to specified type 'Character'
var char2: Character = ""
```

## 遍历字符串中的字符

Swift 的 String 类型表示特定序列的 Character（字符） 类型值的集合

每一个字符值代表一个 Unicode 字符

for-in 循环可以遍历字符串中的 characters 属性来获取每一个字符的值

```swift
import Cocoa
for ch in "DDKK.COM 弟弟快看，程序员编程资料站".characters {
    print(ch)
}
```

编译运行以上 Swift 范例，输出结果为

```swift
简
单
教
程
```

## 字符串连接字符

可以使用 String 的 append() 方法来实现字符串连接字符

```swift
import Cocoa
var varA:String = "Hello "
let varB:Character = "G"
varA.append( varB )
print("varC  =  \(varA)")
```

编译运行以上 Swift 范例，输出结果为

```swift
varC  =  Hello G
```
