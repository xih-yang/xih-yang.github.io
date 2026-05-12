# 03、Golang 教程 - 变量/常量与数据类型
- 来源：https://ddkk.com/zhuanlan/other/golang/2/3.html
- 分类：其他语言
- 分组：教程目录
## 一、变量

### 1. 定义

- 变量来源于数学，是计算机语言中能储存计算结果或能表示值抽象概念。
- 变量可以通过变量名访问。
- Go 语言变量名由字母、数字、下划线组成，其中首个字符不能为数字。
- 声明变量的一般形式是使用 var 关键字。

```java
var identifier type
//可以一次声明多个变量
var identifier1, identifier2 type
```

### 2. 变量声明方式

第一种：指定变量类型，如果没有初始化，则变量默认为零值

```java
var num1 int = 123
var num2 float32	// num2 没有赋值，默认为 0
//---------------------------
package main
import "fmt"
var num1 int = 123
var num2 float32
func main() {
	fmt.Println(num1)
	fmt.Println(num2)
}
//---------------------------
结果：
123
0
```

第二种：根据值自行判定变量类型

```java
var num = 456
//-----------------------
package main
import "fmt"
var num = 456
func main() {
	fmt.Println(num)
}
//----------------------------
456
```

第三种：如果变量已经使用 var 声明过了，再使用 := 声明变量，就产生编译错误

```java
v_name := value
//---------------------------
var intVal int 
intVal :=1 // 这时候会产生编译错误，因为 intVal 已经声明，不需要重新声明
```

```java
intVal := 1 
//等于
var intVal int
intVal =1 
```

```java
f := "Runoob" // var f string = "Runoob"
```

### 3. 多变量声明

```java
//类型相同多个变量, 非全局变量
var vname1, vname2, vname3 type
vname1, vname2, vname3 = v1, v2, v3
var vname1, vname2, vname3 = v1, v2, v3 // 和 python 很像,不需要显示声明类型，自动推断
vname1, vname2, vname3 := v1, v2, v3 // 出现在 := 左侧的变量不应该是已经被声明过的，否则会导致编译错误
// 这种因式分解关键字的写法一般用于声明全局变量
var (
    vname1 v_type1
    vname2 v_type2
)
```

### 4. 全局变量和局部变量

```java
package main
import "fmt"
//全局变量
var num1 = 123
var num2 = 456
func main() {
	//局部变量
	num3 := 789
	fmt.Println(num1)
	fmt.Println(num2)
	fmt.Println(num3)
}
```

程序运行的时候，先加载全局变量，然后加载局部变量。

### 5. 变量的作用域

[http://c.biancheng.net/view/4032.html](http://c.biancheng.net/view/4032.html)

- 在函数体内声明的变量称之为局部变量，它们的作用域只在函数体内，函数的参数和返回值变量都属于局部变量。局部变量不是一直存在的，它只在定义它的函数被调用后存在，函数调用结束后这个局部变量就会被销毁。
- 在函数体外声明的变量称之为全局变量，全局变量只需要在一个源文件中定义，就可以在所有源文件中使用。当然，不包含这个全局变量的源文件需要使用 “import” 关键字引入全局变量所在的源文件之后才能使用这个全局变量。**全局变量声明必须以 var 关键字开头，如果想要在外部包中使用全局变量的首字母必须大写。**
- 在定义函数时函数名后面括号中的变量叫做形式参数（简称形参）。形式参数只在函数调用时才会生效，函数调用结束后就会被销毁，在函数未被调用时，函数的形参并不占用实际的存储单元，也没有实际值。形式参数会作为函数的局部变量来使用。

### 6. 值类型与引用类型

#### 6.1 值类型

- 所有像 int、float、bool 和 string 这些基本类型都属于值类型，使用这些类型的变量 **直接指向存在内存中的值**。
- 当使用等号 = 将一个变量的值赋值给另一个变量时，如：j = i，实际上是在内存中将 i 的值进行了拷贝。
- 可以通过 &i 来获取变量 i 的内存地址，例如：0xc00000a0a0（每次的地址都可能不一样）。

```java
package main
import "fmt"
func main() {
	i := 50
	fmt.Println(&i)
}
//结果
0xc00000a0a0
```

- 值类型变量的值存储在堆中。
- 内存地址会根据机器的不同而有所不同，甚至相同的程序在不同的机器上执行后也会有不同的内存地址。因为每台机器可能有不同的存储器布局，并且位置分配也可能不同。

值的拷贝

```java
//定义了一个数组 a，它是值类型，复制给 b 是 copy，当 b 发生变化后 a 并不会发生任何变化
package main
import "fmt"
func main(){
	a := [5]int{
     2, 3, 4, 5, 6}
	b := a
	fmt.Println(a,b)
	b[2] = 77
	fmt.Println(a,b)
}
//结果
[2 3 4 5 6] [2 3 4 5 6]
[2 3 4 5 6] [2 3 77 5 6]
```

值引用

```java
//定义了一个数组 a，它是引用类型（slice 切片），被 b 引用（指针）后，当 b 发生变化后 a 也发生任何变化
package main
import "fmt"
func main(){
	a := []int{
     2, 3, 4, 5, 6}
	b := a
	fmt.Println(a,b)
	b[2] = 77
	fmt.Println(a,b)
}
//结果
[2 3 4 5 6] [2 3 4 5 6]
[2 3 77 5 6] [2 3 77 5 6]
```

#### 6.2 引用类型

- 复杂的数据通常会需要使用多个字，这些数据一般使用引用类型保存。
- Golang 中引用类型：指针，slice，map，channel，接口，函数等。变量存放的是一个内存地址值，这个地址值指向的空间存的才是最终的值。内存通常在堆中分配，当没有任务变量引用这个地址时，该地址对应的数据空间就成为一个垃圾，通过 GC 回收。
- Go 没有引用传递，都是值传递。

```java
var a = []int{
     1,2,3,4,5}
b := a      //此时a，b都指向了内存中的[1 2 3 4 5]的地址
b[1] = 10   //相当于修改同一个内存地址，所以a的值也会改变
c := make([]int,5,5)    //切片的初始化
copy(c,a)   //将切片acopy到c
c[1] = 20   //copy是值类型，所以a不会改变
fmt.Printf("a的值是%v，a的内存地址是%p\n",a,&a)   //a的值是[1 10 3 4 5]，a的内存地址是0xc42000a180
fmt.Printf("b的值是%v，b的内存地址是%p\n",b,&b)   //b的值是[1 10 3 4 5]，b的内存地址是0xc42000a1a0
fmt.Printf("c的值是%v，c的内存地址是%p\n",c,&c)   //c的值是[1 20 3 4 5]，c的内存地址是0xc42000a1c0
d := &a     //将a的内存地址赋值给d，取值用*d
a[1] = 11
fmt.Printf("d的值是%v，d的内存地址是%p\n",*d,d)   //d的值是[1 11 3 4 5]，d的内存地址是0xc420084060
fmt.Printf("a的值是%v，a的内存地址是%p\n",a,&a)   //a的值是[1 11 3 4 5]，a的内存地址是0xc420084060
```

> 总结：
>
> 值赋值（值类型）和地址赋值（引用类型）是不一样的，值赋值它们的内存地址是不同的，只是值一样，修改一个变量的值不会改另一个；地址赋值两个变量指向了同一个地址，这个内存地址存放了一个值，表现出来的就是两个变量值一样，修改其中一个值另一个也会修改。

[https://zhuanlan.zhihu.com/p/360306642](https://zhuanlan.zhihu.com/p/360306642)

[https://ld246.com/article/1566790851610](https://ld246.com/article/1566790851610)

[https://www.cnblogs.com/aresxin/p/GO-zhi-lei-xing-yu-yin-yong-lei-xing.html](https://www.cnblogs.com/aresxin/p/GO-zhi-lei-xing-yu-yin-yong-lei-xing.html)

### 7. 空白标识符

**Golang 中不允许变量声明了但不使用。既然不想使用，何必声明变量呢，那就将变量用空白符代替，反正空白符就是用来抛弃的。**

```java
package main
import "fmt"
func main() {
	str1,str2,str3,str4 := test()
	fmt.Println("str1=",str1,"\nstr2=",str2,"\nstr3=",str3,"\nstr4=",str4)
}
func test() (int,float64,bool,string) {
	a,b,c,d := 20,30.5,true,"hello"
	return a,b,c,d
}
// 结果
str1= 20 
str2= 30.5 
str3= true 
str4= hello
```

上面的代码如果我们不想要输出第一个参数怎么办呢，代码如下：

```java
package main
import "fmt"
func main() {
	_,str2,str3,str4 := test()
	fmt.Println("str2=",str2,"\nstr3=",str3,"\nstr4=",str4)
}
func test() (int,float64,bool,string) {
	a,b,c,d := 20,30.5,true,"hello"
	return a,b,c,d
}
// 结果
str2= 30.5 
str3= true 
str4= hello
```

**想要替换哪个就在相应位置设为**`-`

## 二、常量

### 1. 定义

- 常量是一个简单值的标识符，在程序运行时，不会被修改的量。
- 常量中的数据类型只可以是布尔型、数字型（整数型、浮点型和复数）和字符串型。
- 常量的定义格式：

```java
const identifier [type] = value
```

**可以省略类型说明符 [type]，因为编译器可以根据变量的值来推断其类型。**

- 显式类型定义：const b string = "abc"
- 隐式类型定义：const b = "abc"

**多个相同类型的声明可以简写为：**

```java
const c_name1, c_name2 = value1, value2
```

声明一个常量

```java
const MAX = 4096
```

声明一个指定类型的常量

```java
const LIMIT int16 = 1024
const LIMIT2 = int16(1024)
```

声明一组常量

```java
const (
    start  = 0x1 
    resume = 0x2 
    stop   = 0x4 
)
```

声明一组指定类型的常量

```java
const (
    start  int8 = 0x1 
    resume int8 = 0x2 
    stop   int8 = 0x4 
)
```

综合示例

```java
package main
import "fmt"
func main() {
   const LENGTH int = 10
   const WIDTH int = 5  
   var area int
   const a, b, c = 1, false, "str" //多重赋值
   area = LENGTH * WIDTH
   fmt.Printf("面积为 : %d", area)
   println()
   println(a, b, c)  
}
//结果
面积为 50
1 false str
```

### 2. iota

- **iota**：特殊常量，可以认为是一个可以被编译器修改的常量。
- **iota** 在 const 关键字出现时将被重置为 0（const 内部的第一行之前），const 中每新增一行常量声明将使 iota 计数一次（iota 可理解为 const 语句块中的行索引）。

```java
package main
import "fmt"
func main() {
    const (
            a = iota   //0
            b          //1
            c          //2
            d = "ha"   //独立值，iota += 1
            e          //"ha"   iota += 1
            f = 100    //iota +=1
            g          //100  iota +=1
            h = iota   //7,恢复计数
            i          //8
    )
    fmt.Println(a,b,c,d,e,f,g,h,i)
}
// 结果
0 1 2 ha ha 100 100 7 8
```

```java
package main
import "fmt"
const (
    i=1<<iota
    j=3<<iota
    k
    l
)
func main() {
    fmt.Println("i=",i)
    fmt.Println("j=",j)
    fmt.Println("k=",k)
    fmt.Println("l=",l)
}
// 结果
i= 1
j= 6
k= 12
l= 24
```

[https://www.runoob.com/go/go-constants.html](https://www.runoob.com/go/go-constants.html)

[https://studygolang.com/articles/3040](https://studygolang.com/articles/3040)

## 三、数据类型

- 在 Go 编程语言中，数据类型用于声明函数和变量。
- 数据类型的出现是为了把数据分成所需内存大小不同的数据，编程的时候需要用大数据的时候才需要申请大内存，就可以充分利用内存。
- Go 语言按类别有以下几种数据类型：

序号
类型和描述

1
布尔型: 布尔型的值只可以是常量 true 或者 false。一个简单的例子：var b bool = true。

2
数字类型: 整型 int 和浮点型 float32、float64，Go 语言支持整型和浮点型数字，并且支持复数，其中位的运算采用补码。

3
字符串类型: 字符串就是一串固定长度的字符连接起来的字符序列。Go 的字符串是由单个字节连接起来的。Go 语言的字符串的字节使用 UTF-8 编码标识 Unicode 文本。

4
派生类型: 包括：指针类型（Pointer）,数组类型,结构化类型(struct),Channel 类型,函数类型,切片类型,接口类型（interface）,Map 类型

### 1. 布尔值

```java
package main
import "fmt"
func main() {
	var a bool = true
	var b bool
	fmt.Println(a)
	fmt.Println(b)
}
// 结果
true
false
```

### 2. 数字类型

序号
类型和描述

1
uint8 无符号 8 位整型 (0 到 255)

2
uint16 无符号 16 位整型 (0 到 65535)

3
uint32 无符号 32 位整型 (0 到 4294967295)

4
uint64 无符号 64 位整型 (0 到 18446744073709551615)

5
int8 有符号 8 位整型 (-128 到 127)

6
int16 有符号 16 位整型 (-32768 到 32767)

7
int32 有符号 32 位整型 (-2147483648 到 2147483647)

8
int64 有符号 64 位整型 (-9223372036854775808 到 9223372036854775807)

```java
package main
import "fmt"
func main() {
	a := 10
	b := 10.0
	c := true
	d := "test"
	fmt.Printf("a 的类型为 %T",a)
	fmt.Println()
	fmt.Printf("b 的类型为 %T",b)
}
//结果
a 的类型为 int
b 的类型为 float64
//---------------------------------------------//
package main
import (
    "fmt"
    "math"
)
func main() {
    fmt.Printf("%f\n", math.Pi)
    fmt.Printf("%.2f\n", math.Pi)
}
// 结果
3.141593
3.14
//-----------------------------------------//
var x complex128 = complex(1, 2) // 1+2i
var y complex128 = complex(3, 4) // 3+4i
fmt.Println(x*y)                 // "(-5+10i)"
fmt.Println(real(x*y))           // "-5"
fmt.Println(imag(x*y))           // "10"
```

[Go语言整型（整数类型）](http://c.biancheng.net/view/13.html)

[Go语言浮点类型（小数类型）][Go 1]

[Go语言复数][Go 2]

### 3. 字符串类型

```java
package main
import "fmt"
func main() {
	a := "ddasas2252"
	fmt.Println(a)
	fmt.Printf("a 的类型为 %T",a)
}
// 结果
ddasas2252
a 的类型为 string
```

**字符类型**：[http://c.biancheng.net/view/18.html](http://c.biancheng.net/view/18.html)

### 4. 其他类型

#### 4.1 指针类型

- **& 取内存地址**
- *** 根据地址取值**

> 基本数据类型和内存

```java
package main
import(
        "fmt"
)
func main(){
        var age int = 18
        //&符号+变量 就可以获取这个变量内存的地址
        fmt.Println(&age) //0xc0000a2058
}
```

> 指针变量

```java
package main
import(
        "fmt"
)
func main(){
        var age int = 18
        //&符号+变量 就可以获取这个变量内存的地址
        fmt.Println(&age) //0xc0000a2058
        //定义一个指针变量：
        //var代表要声明一个变量
        //ptr 指针变量的名字
        //ptr 对应的类型是：*int 是一个指针类型 （可以理解为指向int类型的指针）
        //&age 就是一个地址，是ptr变量的具体的值
        var ptr *int = &age
        fmt.Println(ptr)
        fmt.Println("ptr本身这个存储空间的地址为：",&ptr)
        //想获取ptr这个指针或者这个地址指向的那个数据：
        fmt.Printf("ptr指向的数值为：%v",*ptr) //ptr指向的数值为：18
}
```

> 可以通过指针改变指向值

```java
func main(){
        var num int = 10
        fmt.Println(num)
        var ptr *int = &num
        *ptr = 20
        fmt.Println(num)
}
// 结果
10
20
```

- 指针变量接收的一定是地址值。
- 指针变量的地址不可以不匹配。
- 基本数据类型（又叫值类型），都有对应的指针类型，形式为 *数据类型，比如 int 的对应的指针就是 *int，float32 对应的指针类型就是 *float32。依次类推。

[https://www.runoob.com/go/go-pointers.html](https://www.runoob.com/go/go-pointers.html)

#### 4.2 数组类型

[Golang 数据类型之数组](https://www.cnblogs.com/ssgeek/p/14925152.html#22-%E6%95%B0%E7%BB%84%E7%B1%BB%E5%9E%8B)

#### 4.3 结构化类型(struct)

[https://www.cnblogs.com/sparkdev/p/10761825.html](https://www.cnblogs.com/sparkdev/p/10761825.html)

#### 4.4 Channel 类型

[https://www.cnblogs.com/lianggx6/p/12558663.html](https://www.cnblogs.com/lianggx6/p/12558663.html)

[https://www.jianshu.com/p/9cc621aaf899](https://www.jianshu.com/p/9cc621aaf899)

#### 4.5 函数类型

[https://studygolang.com/articles/2841](https://studygolang.com/articles/2841)

[https://www.cnblogs.com/igoodful/p/11519695.html](https://www.cnblogs.com/igoodful/p/11519695.html)

#### 4.6 切片类型

[https://www.cnblogs.com/Csir/p/9292146.html](https://www.cnblogs.com/Csir/p/9292146.html)

[https://www.imooc.com/code/7503](https://www.imooc.com/code/7503)

[https://www.jb51.net/article/143729.htm](https://www.jb51.net/article/143729.htm)

#### 4.7 接口类型（interface）

[https://www.cnblogs.com/ssgeek/p/15433859.html](https://www.cnblogs.com/ssgeek/p/15433859.html)

[https://blog.csdn.net/whatday/article/details/109775782](https://blog.csdn.net/whatday/article/details/109775782)

#### 4.8 Map 类型

[https://www.perfcode.com/p/1118.html](https://www.perfcode.com/p/1118.html)

[https://www.freesion.com/article/79891268155/](https://www.freesion.com/article/79891268155/)

[https://www.cnblogs.com/zpcoding/p/13603182.html](https://www.cnblogs.com/zpcoding/p/13603182.html)

### 5. 数据类型转换

- Go 在不同类型的变量之间赋值时需要显式转换，并且只有显式转换（强制转换）。
- 类型转换只能在定义正确的情况下转换成功，例如从一个取值范围较小的类型转换到一个取值范围较大的类型 将 int16 转换为 int32。当从一个取值范围较大的类型转换到取值范围较小的类型时 将 int32 转换为 int16 或 将 float32 转换为 int，会发生精度丢失 **截断** 的情况。
- 只有相同底层类型的变量之间可以进行相互转换 如将 int16 类型转换成 int32 类型，不同底层类型的变量相互转换时会引发编译错误 如将 bool 类型转换为 int 类型。
- 语法：valueOfTypeB = typeB(valueOfTypeA)（类型 B 的值 = 类型 B(类型 A 的值)）

```java
package main
import "fmt"
func main() {
	a := 5.2
	b := int(a)
	fmt.Println("a 的值为",a)	// 如果小数为 0 会省略
	fmt.Printf("a 的类型为 %T\n",a)
	fmt.Printf("b 的类型为 %T",b)
}
// 结果
a 的值为 5.2
a 的类型为 float64
b 的类型为 int
```

**字符串格式化参考**：[字符串格式化](/zhuanlan/other/golang/2/2.html?spm=1001.2014.3001.5501#8__133)

#### 5.1 基本数据类型转 string 类型

- 方式 1：fmt.Sprintf("%参数",表达式)(推荐方式)
- 方式 2：使用 strconv 包的函数

**方法一**

```java
package main
import "fmt"
func main(){
	var n1 int = 19
	var n2 float32 = 4.78
	var n3 bool = false
	var n4 byte = 'a'
	var s1 string = fmt.Sprintf("%d",n1)
	fmt.Printf("s1对应的类型是：%T ，s1 = %q \n",s1, s1)
	var s2 string = fmt.Sprintf("%f",n2)
	fmt.Printf("s2对应的类型是：%T ，s2 = %q \n",s2, s2)
	var s3 string = fmt.Sprintf("%t",n3)
	fmt.Printf("s3对应的类型是：%T ，s3 = %q \n",s3, s3)
	var s4 string = fmt.Sprintf("%c",n4)
	fmt.Printf("s4对应的类型是：%T ，s4 = %q \n",s4, s4)
}
// 结果
s1对应的类型是：string ，s1 = "19" 
s2对应的类型是：string ，s2 = "4.780000" 
s3对应的类型是：string ，s3 = "false" 
s4对应的类型是：string ，s4 = "a"
```

**方法一**

```java
package main
import(
        "fmt"
        "strconv"
)
func main(){
        var n1 int = 18
        var s1 string = strconv.FormatInt(int64(n1),10)  //参数：第一个参数必须转为int64类型 ，第二个参数指定字面值的进制形式为十进制
        fmt.Printf("s1对应的类型是：%T ，s1 = %q \n",s1, s1)
        var n2 float64 = 4.29
        var s2 string = strconv.FormatFloat(n2,'f',9,64)
        //第二个参数：'f'（-ddd.dddd）  第三个参数：9 保留小数点后面9位  第四个参数：表示这个小数是float64类型
        fmt.Printf("s2对应的类型是：%T ，s2 = %q \n",s2, s2)
        var n3 bool = true
        var s3 string = strconv.FormatBool(n3)
        fmt.Printf("s3对应的类型是：%T ，s3 = %q \n",s3, s3)
}
// 结果
s1对应的类型是：string ，s1 = "18" 
s2对应的类型是：string ，s2 = "4.290000000" 
s3对应的类型是：string ，s3 = "true"
```

#### 5.2 string 类型转基本类型

```java
package main
import(
        "fmt"
        "strconv"
)
func main(){
        //string-->bool
        var s1 string = "true"
        var b bool
        //ParseBool这个函数的返回值有两个：(value bool, err error)
        //value就是我们得到的布尔类型的数据，err出现的错误
        //我们只关注得到的布尔类型的数据，err可以用_直接忽略
        b , _ = strconv.ParseBool(s1)
        fmt.Printf("b的类型是：%T,b=%v \n",b,b)
        //string---》int64
        var s2 string = "19"
        var num1 int64
        num1,_ = strconv.ParseInt(s2,10,64)
        fmt.Printf("num1的类型是：%T,num1=%v \n",num1,num1)
        //string-->float32/float64
        var s3 string = "3.14"
        var f1 float64
        f1,_ = strconv.ParseFloat(s3,64)
        fmt.Printf("f1的类型是：%T,f1=%v \n",f1,f1)
        //注意：string向基本数据类型转换的时候，一定要确保string类型能够转成有效的数据类型，否则最后得到的结果就是按照对应类型的默认值输出
        var s4 string = "golang"
        var b1 bool
        b1 , _ = strconv.ParseBool(s4)
        fmt.Printf("b1的类型是：%T,b1=%v \n",b1,b1)
        var s5 string = "golang"
        var num2 int64
        num2,_ = strconv.ParseInt(s5,10,64)
        fmt.Printf("num2的类型是：%T,num2=%v \n",num2,num2)
}
// 结果
b的类型是：bool,b=true 
num1的类型是：int64,num1=19 
f1的类型是：float64,f1=3.14 
b1的类型是：bool,b1=false 
num2的类型是：int64,num2=0
```
