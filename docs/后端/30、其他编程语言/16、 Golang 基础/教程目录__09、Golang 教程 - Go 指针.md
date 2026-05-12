# 09、Golang 教程 - Go 指针
- 来源：https://ddkk.com/zhuanlan/other/golang/2/9.html
- 分类：其他语言
- 分组：教程目录
- Go 中指针不像 C 语言里的那么难理解，使用指针可以更简单的执行一些任务。
- 变量是一种使用方便的占位符，用于引用计算机内存地址。
- 取地址符是 &，放到一个变量前使用就会返回相应变量的内存地址。

> 和 & 的区别：
>
>
>
> & 是取地址符号，即取得某个变量的地址 , 如 &a。
>
>
>
>
> 是指针运算符，可以表示一个变量是指针类型，也可以表示一个指针变量所指向的存储单元，也就是这个地址所存储的值。

## 1. 指针概念

一个指针变量指向了一个值的内存地址。

类似于变量和常量，在使用指针前需要声明指针。指针声明格式如下：

```java
var varName *varType
```

`varType` 是指针类型，`varName` 为指针变量名，`*` 号用于指定变量是作为一个指针。

```java
var ip *int			// 指向整型
var fp *float32		// 指向浮点型
```

## 2. 使用指针流程

- 定义指针变量。
- 为指针变量赋值。
- 访问指针变量中指向地址的值。

在指针类型前面加上 * 号来获取指针指向的内容。

**示例：**

```java
package main
import "fmt"
func main() {
    var (
        a int = 33 //实际变量
        ip *int	   //指针变量
    )
    // a 的地址赋值给 ip 指针
    ip = &a
    fmt.Println("a 的值：",a)
    fmt.Println("a 的地址：",&a)
    fmt.Println("指针 ip 的值：",ip)
    fmt.Println("指针 ip 指向的值：",*ip)
}
// 结果
a 的值： 33
a 的地址： 0xc00000a0a0
指针 ip 的值： 0xc00000a0a0
指针 ip 指向的值： 33
```

## 3. 空指针

- 当一个指针被定义后没有分配任何变量时，它的值为 nil。
- nil 指针也被称为空指针。
- nil 在概念上和其它语言的 null、None、nil、NULL 一样，都指代零值或空值。
- 一个指针变量通常缩写为 ptr。

```java
package main
import "fmt"
func main() {
   var ptr *int
   fmt.Printf("ptr 的值为 : %x\n", ptr  )
}
// 结果
ptr 的值为 : 0
```

空指针判断：

```java
if(ptr != nil)    /* ptr 不是空指针 */
if(ptr == nil)    /* ptr 是空指针 */
```

## 4. 指针数组

```java
package main
import "fmt"
func main() {
   a := []int{
     10,100,200}
   for i := 0; i < len(a); i++ {
      fmt.Printf("a[%d] = %d\n", i, a[i] )
   }
}
// 结果
a[0] = 10
a[1] = 100
a[2] = 200
```

**如果我们需要保存数组，这样我们就需要使用到指针。**

`声明整型指针数组：`

```java
var ptr [num]*int
```

ptr为整型指针数组。因此每个元素都指向了一个值。以下实例的三个整数将存储在指针数组中：

```java
package main
import "fmt"
func main() {
	a := []int{
     10,100,200}
	var ptr [3]*int		//声明指针数组
	for  i := 0; i < 3; i++ {
		ptr[i] = &a[i]		//整数地址赋值给指针数组
	}
	for  i := 0; i < 3; i++ {
		fmt.Printf("a[%d] = %d\n", i,*ptr[i] )
	}
}
// 结果
a[0] = 10
a[1] = 100
a[2] = 200
```

**综合示例**

```java
package main
import "fmt"
func main() {
	var ptr [3]*int	//声明指针数组
	a := []int{
     10,100,200}	//实际数组
	for i:=0;i<len(a);i++ {
		//地址赋值给指针
		ptr[i] = &a[i]
		fmt.Printf("第 %d 个元素指针地址为 %d\n",i,&a[i])
	}
	//使用指针变量指向值进行遍历
	for j:=0;j<len(ptr);j++ {
		fmt.Printf("a[%d] = %d\n",j,*ptr[j])
	}
	// 实际数组的遍历
	/*
	   for i:=0;i<len(a);i++ {
	       fmt.Printf("a[%d] = %d\n",i,a[i])
	   }
	*/
}
// 结果
第 0 个元素指针地址为 824633795424
第 1 个元素指针地址为 824633795432
第 2 个元素指针地址为 824633795440
a[0] = 10
a[1] = 100
a[2] = 200
```

## 5. 指向指针的指针

- 如果一个指针变量存放的又是另一个指针变量的地址，则称这个指针变量为指向指针的指针变量。
- 当定义一个指向指针的指针变量时，第一个指针存放第二个指针的地址，第二个指针存放变量的地址：
- 指向指针的指针变量声明格式如下：

```java
var ptr **int;
// 以上指向指针的指针变量为整型
```

- 访问指向指针的指针变量值需要使用两个 * 号

**示例一**

```java
package main
import "fmt"
func main() {
	var (
		a int			//变量
		ptr *int		//指针
		pptr **int		//指针的指针
	)
	//变量赋值
	a = 3000
	//ptr 赋值 a 的地址
	ptr = &a
	//pptr 赋值 ptr 的地址
	pptr = &ptr
	fmt.Println("a 的值:",a)
	fmt.Println("a 的地址:",ptr)
	fmt.Println("指针 ptr 指向的值:",*ptr)
	fmt.Println("指针 pptr 指向的值:",*pptr)
	fmt.Println("指针 pptr 指向指针 ptr 指向的值:",**pptr)
	fmt.Println("指针 pptr 的地址:",&pptr)
}
// 结果
a 的值: 3000
a 的地址: 0xc00000a0a0
指针 ptr 指向的值: 3000
指针 pptr 指向的值: 0xc00000a0a0
指针 pptr 指向指针 ptr 指向的值: 3000
指针 pptr 的地址: 0xc000006030
```

**示例二**

```java
package main
import "fmt"
func main() {
	var a int = 5
	var ptr *int = &a	//一级指针，指向 a 的地址，可获取 a 的值
	var pts *int = ptr	//一级指针，指向 ptr 指向的地方，可获得 a 的地址，以及 a 的值
	var pto **int = &ptr	//二级指针，指向 ptr 地址，ptr 指向 &a 的地址，所以 pto 可以获得 ptr 地址，可获得 a 的地址，可获得 a 的值
	var pt3 ***int = &pto 	//三级指针，指向 pto 地址，pto 指向 ptr，ptr 指向 a，可获得 pto 地址，获得 ptr 地址，可获得 a 地址，获得 a 的值
	fmt.Println("a 的地址为:",&a)
	fmt.Println("a 的值为:",a)
	fmt.Println("ptr 的地址为:",&ptr)
	fmt.Println("ptr 指向的地址为:",ptr)
	fmt.Println("pts 的地址为:",&pts)
	fmt.Println("pts 指向的地址为:",pts)
	fmt.Println("pts 指向的地址对应的值为:",*pts)
	fmt.Println("pto 的地址为:",&pto)
	fmt.Println("pto 指向的指针(ptr)的存储地址为:",pto)
	fmt.Println("pto 指向的指针(ptr)所指向的地址为:",*pto)
	fmt.Println("pto 最终指向的地址对应的值(a)为:",**pto)
	fmt.Println("pt3 的地址为:",&pt3)
	fmt.Println("pt3 指向的指针(pto)的存储地址为:",pt3)
	fmt.Println("pt3 指向的指针(pt0)所指向的地址为:",*pt3)
	fmt.Println("pt3 最终指向的地址对应的值(a)为:",***pt3)
}
// 结果
a 的地址为: 0xc0000a2058
a 的值为: 5
ptr 的地址为: 0xc0000cc018
ptr 指向的地址为: 0xc0000a2058
pts 的地址为: 0xc0000cc020
pts 指向的地址为: 0xc0000a2058
pts 指向的地址对应的值为: 5
pto 的地址为: 0xc0000cc028
pto 指向的指针(ptr)的存储地址为: 0xc0000cc018
pto 指向的指针(ptr)所指向的地址为: 0xc0000a2058
pto 最终指向的地址对应的值(a)为: 5
pt3 的地址为: 0xc0000cc030
pt3 指向的指针(pto)的存储地址为: 0xc0000cc028
pt3 指向的指针(pt0)所指向的地址为: 0xc0000cc018
pt3 最终指向的地址对应的值(a)为: 5
```

## 6. 指针作为函数参数

**Go 语言允许向函数传递指针，只需要在函数定义的参数上设置为指针类型即可。**

```java
// 向函数传递指针，并在函数调用后修改函数内的值
package main
import (
	"fmt"
)
func main() {
	// 定义局部变量
	var a int = 100
	var b int = 200
	fmt.Println("原 a 值:", a)
	fmt.Println("原 b 值:", b)
	/*
		调用 swap 函数用于交换值
		&a 指向 a 变量的地址
		&b 指向 b 变量的地址
	*/
	swap(&a, &b)
	fmt.Println("交换后 a 值:", a)
	fmt.Println("交换后 b 值:", b)
}
// 定义交换函数
func swap(x *int, y *int) {
	var temp int
	temp = *x
	*x = *y
	*y = temp
}
/* 交换函数也可以这样写，仅限于 go 语言
func swap(x *int, y *int) {
	*x, *y = *y, *x
}
*/
// 结果
原 a 值: 100
原 b 值: 200
交换后 a 值: 200
交换后 b 值: 100
```
