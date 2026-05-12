# 04、Golang 教程 - 运算符
- 来源：https://ddkk.com/zhuanlan/other/golang/2/4.html
- 分类：其他语言
- 分组：教程目录
## 概述

- 运算符是—种特殊的符号，用以表示数据的运算、赋值和比较等。
- 常用运算符如下：

## 1. 算数运算符

下表列出了所有 Go 语言的算术运算符。假定 A 值为 10，B 值为 20。

运算符
描述
实例

+
相加
A + B 输出结果 30

-
相减
A - B 输出结果 -10

*
相乘
A * B 输出结果 200

/
相除
B / A 输出结果 2

%
求余
B % A 输出结果 0

++
自增
A++ 输出结果 11

–
自减
A-- 输出结果 9

```java
package main
import "fmt"
func main() {
   var a int = 21
   var b int = 10
   var c int
   c = a + b
   fmt.Printf("第一行 - c 的值为 %d\n", c )
   c = a - b
   fmt.Printf("第二行 - c 的值为 %d\n", c )
   c = a * b
   fmt.Printf("第三行 - c 的值为 %d\n", c )
   c = a / b
   fmt.Printf("第四行 - c 的值为 %d\n", c )
   c = a % b
   fmt.Printf("第五行 - c 的值为 %d\n", c )
   a++
   fmt.Printf("第六行 - a 的值为 %d\n", a )
   a=21   // 为了方便测试，a 这里重新赋值为 21
   a--
   fmt.Printf("第七行 - a 的值为 %d\n", a )
}
// 结果
第一行 - c 的值为 31
第二行 - c 的值为 11
第三行 - c 的值为 210
第四行 - c 的值为 2
第五行 - c 的值为 1
第六行 - a 的值为 22
第七行 - a 的值为 20
```

## 2. 赋值运算符

运算符
描述
实例

=
简单的赋值运算符，将一个表达式的值赋给一个左值
C = A + B 将 A + B 表达式结果赋值给 C

+=
相加后再赋值
C += A 等于 C = C + A

-=
相减后再赋值
C -= A 等于 C = C - A

*=
相乘后再赋值
C *= A 等于 C = C * A

/=
相除后再赋值
C /= A 等于 C = C / A

%=
求余后再赋值
C %= A 等于 C = C % A

检查左边值是否大于右边值，如果是返回 True 否则返回 False。
(A > B) 为 False

=
检查左边值是否大于等于右边值，如果是返回 True 否则返回 False。
(A >= B) 为 False

>
右移运算符">>“是双目运算符。右移n位就是除以2的n次方。 其功能是把”>>“左边的运算数的各二进位全部右移若干位，”>>"右边的数指定移动的位数。
A >> 2 结果为 15 ，二进制为 0000 1111

```java
package main
import "fmt"
func main() {
   //uint 无符号整数（正数）
   var a uint = 60      /* 60 = 0011 1100 */  
   var b uint = 13      /* 13 = 0000 1101 */
   var c uint = 0          
   c = a & b       /* 12 = 0000 1100 */
   fmt.Printf("第一行 - c 的值为 %d\n", c )
   c = a | b       /* 61 = 0011 1101 */
   fmt.Printf("第二行 - c 的值为 %d\n", c )
   c = a ^ b       /* 49 = 0011 0001 */
   fmt.Printf("第三行 - c 的值为 %d\n", c )
   c = a << 2     /* 240 = 1111 0000 */
   fmt.Printf("第四行 - c 的值为 %d\n", c )
   c = a >> 2     /* 15 = 0000 1111 */
   fmt.Printf("第五行 - c 的值为 %d\n", c )
}
// 结果
第一行 - c 的值为 12
第二行 - c 的值为 61
第三行 - c 的值为 49
第四行 - c 的值为 240
第五行 - c 的值为 15
```

## 6. 其他运算符

运算符
描述
实例

&
返回变量存储地址
&a 返回变量的实际内存地址

*
指针变量
*a 返回指针变量对应的数值

```java
package main
import "fmt"
func main() {
   var a int = 4
   var b int32
   var c float32
   var ptr *int
   /* 运算符实例 */
   fmt.Printf("第 1 行 - a 变量类型为 = %T\n", a );
   fmt.Printf("第 2 行 - b 变量类型为 = %T\n", b );
   fmt.Printf("第 3 行 - c 变量类型为 = %T\n", c );
   /*  & 和 * 运算符实例 */
   ptr = &a     /* 'ptr' 包含了 'a' 变量的地址 */
   fmt.Printf("a 的值为  %d\n", a);
   fmt.Printf("*ptr 为 %d\n", *ptr);
}
// 结果
第 1 行 - a 变量类型为 = int
第 2 行 - b 变量类型为 = int32
第 3 行 - c 变量类型为 = float32
a 的值为  4
*ptr 为 4
//-------------------------------------------//
package main
import "fmt"
func main() {
	var a int = 18
	fmt.Printf("a 的值为 %d\n",a)
	fmt.Printf("a 的地址值为 %v\n",&a)
	var ptr *int = &a
	fmt.Printf("ptr 的地址值为 %v\n",ptr)
	fmt.Printf("ptr 的值为 %d\n",*ptr)
}
// 结果
a 的值为 18
a 的地址值为 0xc00000a0a0
ptr 的地址值为 0xc00000a0a0
ptr 的值为 18
```

## 7. 运算符优先级

**为了提高优先级，可以加 ()**
