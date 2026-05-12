# 02、Golang 教程 - 础语法
- 来源：https://ddkk.com/zhuanlan/other/golang/2/2.html
- 分类：其他语言
- 分组：教程目录
## 1. go 标记

Go程序可以由多个标记组成，可以是关键字，标识符，常量，字符串，符号。如以下 GO 语句由 6 个标记组成：

```java
fmt.Println("Hello, World!")
```

6个标记是(每行一个)：

```java
1. fmt
2. .
3. Println
4. (
5. "Hello, World!"
6. )
```

## 2. 行分隔符

在Go 程序中，一行代表一个语句结束。每个语句不需要像 C 家族中的其它语言一样以分号 ; 结尾，因为这些工作都将由 Go 编译器自动完成。

如果你打算将多个语句写在同一行，它们则必须使用 `;` 人为区分，但在实际开发中我们并不鼓励这种做法。

以下为两个语句：

```java
fmt.Println("Hello, World!")
fmt.Println("菜鸟教程：runoob.com")
```

## 3. 注释类型

- 单行注释：//
- 多行注释：/* `` */

## 4. 标识符

标识符用来命名变量、类型等程序实体。一个标识符实际上就是一个或是多个字母(AZ和az)数字(0~9)、下划线_组成的序列，但是第一个字符必须是字母或下划线而不能是数字。

以下是有效的标识符：

```java
mahesh   kumar   abc   move_name   a_123
myname50   _temp   j   a23b9   retVal
```

以下是无效的标识符：

```java
1ab（以数字开头）
case（Go 语言的关键字）
a+b（运算符是不允许的）
```

## 5. 字符串连接

Go语言的字符串可以通过 `+` 实现：

```java
package main
import "fmt"
func main() {
    fmt.Println("Google" + "Runoob")
}
// GoogleRunoob
```

## 6. 关键字

下面列举了 Go 代码中会使用到的 25 个关键字或保留字：

break
default
func
interface
select

case
defer
go
map
struct

chan
else
goto
package
switch

const
fallthrough
if
range
type

continue
for
import
return
var

除了以上介绍的这些关键字，Go 语言还有 36 个预定义标识符：

append
bool
byte
cap
close
complex
complex64
complex128
uint16

copy
false
float32
float64
imag
int
int8
int16
uint32

int32
int64
iota
len
make
new
nil
panic
uint64

print
println
real
recover
string
true
uint
uint8
uintptr

程序一般由关键字、常量、变量、运算符、类型和函数组成。

程序中可能会使用到这些分隔符：括号 ()，中括号 [] 和大括号 {}。

程序中可能会使用到这些标点符号：.、,、;、: 和 …。

## 7. Go 语言的空格

Go语言中变量的声明必须使用空格隔开，如：

```java
var age int;
```

语句中适当使用空格能让程序更易阅读。

无空格：

```java
fruit=apples+oranges;
```

在变量与运算符间加入空格，程序看起来更加美观，如：

```java
fruit = apples + oranges; 
```

## 8. 字符串格式化

Go语言中使用 **fmt.Printf** 格式化字符串并赋值给新串：

```java
package main
import (
	"fmt"
)
func main() {
	// %d 表示整型数字，%s 表示字符串
	var num = 123
	var data = "2020-12-31"
	fmt.Printf("数字为 %d，时间为 %s",num,data)
}
```

```java
package main
import "fmt"
type point struct {
    x, y int
}
func main() {
    // 格式化整型，使用%d是一种
    // 标准的以十进制来输出整型的方式
    // 有符号十进制整数(int)（%ld、%Ld：长整型数据(long),%hd：输出短整形。）
    fmt.Println("=====%d,输出十进制====")
    fmt.Printf("%d\n", 110)
    //Output: 110
    // 输出整型的二进制表示方式
    fmt.Println("=====%b,输出二进制====")
    fmt.Printf("%b\n", 110)
    //Output: 1101110
    // 输出整型数值所对应的字符(char):一个字节，占8位
    // 可参考 ASCII
    fmt.Println("=====%c,输出一个值的字符(char)====")
    fmt.Printf("%c\n",97)
    //Output: a
    // 输出一个值的十六进制,每个字符串的字节用两个字符输出
    fmt.Println("=====%x,输出一个值的十六进制,每个字符串的字节用两个字符输出====")
    fmt.Printf("0x%x\n", 10)
    fmt.Printf("%x\n", "abc")
    //Output: 0xa
    //Output: 616263
    // 输出浮点型数值
    fmt.Println("=====%f,输出浮点型数值====")
    fmt.Printf("%f\n", 27.89)
    //Output: 27.890000
    // 输出基本的字符串
    fmt.Println("=====%s,输出基本字符串====")
    fmt.Printf("%s-%s-%s\n","I","am","batu")
    //Output: I-am-batu
    // 输出带双引号的字符串
    fmt.Println("=====%q,输出带双引号的字符串====")
    fmt.Printf("%q\n","string")
    //Output: "string"
    // Go提供了几种打印格式，用来格式化一般的Go值
    p := point{
     1, 2}
    fmt.Println("=====%p,输出一个指针的值====")
    fmt.Printf("%p\n", &p)
    //Output: 0xc042004390
    fmt.Println("=====%v,输出结构体的对象值====")
    fmt.Printf("%v\n", p)
    //Output: {1 2}
    // 如果所格式化的值是一个结构体对象，那么%+v的格式化输出
    fmt.Println("=====%+v,输出结构体的成员名称和值====")
    fmt.Printf("%+v\n", p)
    //Output: {x:1 y:2}
    fmt.Println("=====%#v,输出一个值的Go语法表示方式====")
    fmt.Printf("%#v\n",p)
    //Output: main.point{x:1, y:2}
    fmt.Println("=====%T,输出一个值的数据类型====")
    fmt.Printf("%T\n",p)
    //Output: main.point
    // 当输出数字的时候，经常需要去控制输出的宽度和精度。
    // 可以使用一个位于%后面的数字来控制输出的宽度，默认情况下输出是右对齐的，左边加上空格
    fmt.Println("=====控制输出的宽度和精度====")
    fmt.Printf("|%5d|%5d|\n", 12, 345)
    //Output: |   12|  345|
    fmt.Println("=====输出宽度,同时指定浮点数====")
    fmt.Printf("|%5.2f|%5.2f|\n", 1.2, 3.456)
    //Output: | 1.20| 3.46|
    fmt.Println("=====左对齐====")
    fmt.Printf("|%-5.2f|%-5.2f|\n", 1.2, 3.45)
    //Output: |1.20 |3.45 |
}
```

```java
===== %d,输出十进制 ====
110
===== %b,输出二进制 ====
1101110
===== %c,输出一个值的字符(char) ====
a
===== %x,输出一个值的十六进制,每一个字符串的字节用两个字符输出 ====
0xa
616263
===== %f,输出浮点型数值 ====
27.890000
===== %s,输出基本字符串 ====
I-am-batu
===== %q,输出带双引号的字符串 ====
“string”
===== %p,输出一个指针的值 ====
0xc82000a410
===== %v,输出结构体的对象值 ====
{
     1 2}
===== %+v,输出结构体的成员名称和值 ====
{
     x:1 y:2}
===== %#v,输出一个值的Go语法表示方式 ====
main.point{
     x:1, y:2}
===== %T,输出一个值的数据类型 ====
main.point
```

[http://www.zzvips.com/article/72451.html](http://www.zzvips.com/article/72451.html)
