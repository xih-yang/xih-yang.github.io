# 08、Golang 教程 - Go 数组
- 来源：https://ddkk.com/zhuanlan/other/golang/2/8.html
- 分类：其他语言
- 分组：教程目录
## 1. 数组介绍

- 数组是具有相同唯一类型的一组已编号且长度固定的数据项序列，这种类型可以是任意的原始类型例如整型、字符串或者自定义类型。
- 相对于去声明 number0, number1, ... number99 的变量，使用数组形式 numbers[0], numbers[1]...numbers[99] 更加方便且易于扩展。
- 数组元素可以通过索引（位置）来读取（或者修改），索引从 0 开始，第一个元素索引为 0，第二个索引为 1，以此类推。

## 2. 声明数组

Go语言数组声明需要指定元素类型及元素个数，语法格式如下：

```java
var variable_name [SIZE] variable_type
```

以上为一维数组的定义方式。例如以下定义了数组 balance 长度为 10 类型为 float32：

```java
var balance [10] float32
```

## 3. 初始化数组

以下演示了数组初始化：

```java
var balance = [5]float32{
     1000.0, 2.0, 3.4, 7.0, 50.0}
```

我们也可以通过字面量在声明数组的同时快速初始化数组：

```java
balance := [5]float32{
     1000.0, 2.0, 3.4, 7.0, 50.0}
```

如果数组长度不确定，可以使用 `...` 代替数组的长度，编译器会根据元素个数自行推断数组的长度：

```java
var balance = [...]float32{
     1000.0, 2.0, 3.4, 7.0, 50.0}
或
balance := [...]float32{
     1000.0, 2.0, 3.4, 7.0, 50.0}
```

如果设置了数组的长度，我们还可以通过指定下标来初始化元素：

```java
// 将索引为 1 和 3 的元素初始化
balance := [5]float32{
     1:2.0,3:7.0}
// 初始化数组中 {} 中的元素个数不能大于 [] 中的数字。
package main
import "fmt"
func main() {
	var test1 = [...]int{
     1,2,3,4}
	fmt.Println(test1)
	fmt.Println(len(test1))
	test1 = [4]int{
     1,1:5,3,4}
	fmt.Println(test1)
}
```

如果忽略 [] 中的数字不设置数组大小，Go 语言会根据元素的个数来设置数组的大小：

```java
balance[4] = 50.0
```

## 4. 访问数组元素

数组元素可以通过索引（位置）来读取。格式为数组名后加中括号，中括号中为索引的值。例如：

```java
var a float32 = balance[9]
```

**示例**

```java
package main
import "fmt"
func main() {
	var test = [5]int{
     1,2,3,4,5}
	fmt.Println(test)
	var a int = test[1]
	fmt.Println(a)
}
// 结果
[1 2 3 4 5]
2
```

```java
package main
import "fmt"
// 定义数组（元素，下标，数组长度）
var Array = [10]int{
     1,2,3,4,5,6,7,8,9,10}
func main() {
	// 数组元素提取
	// fmt.Println(Array[0])
	// fmt.Println(Array[9])
	// 数组元素的遍历
	for i:=0;i<10;i++ {
		fmt.Println(Array[i])
	}
}
// ---------------------------------- //
package main
import "fmt"
// 定义数组（元素，下标，数组长度）
var Array = [...]int{
     1,2,3,4,5,6,7,8,9,10}
func main() {
	// 数组元素提取
	// fmt.Println(Array[0])
	// fmt.Println(Array[9])
	// 数组元素的遍历
	for i:=0;i<len(Array);i++ {
		fmt.Println(Array[i])
	}
	// 输出数组长度
	fmt.Println("数组的长度：",len(Array))
}
```

```java
package main
import "fmt"
func main() {
	// 创建长度为 10 的数组 a
	var a [10]int
	// 为数组 a 初始化元素
	for i:=0;i<10;i++ {
		a[i] = i + 100
	}
	// 输出每个数组元素的值
	for j:=0;j<10;j++ {
		fmt.Printf("Element[%d] = %d\n",j,a[j])
	}
}
// ---------------------------------- //
package main
import "fmt"
func main() {
	var i,j,k int
	// 声明数组的同时快速初始化数组
	balance := [5]float32{
     1000.0, 2.0, 3.4, 7.0, 50.0}
	/* 输出数组元素 */
	for i = 0; i < 5; i++ {
		fmt.Printf("balance[%d] = %f\n", i, balance[i] )
	}
	balance2 := [...]float32{
     1000.0, 2.0, 3.4, 7.0, 50.0}
	/* 输出每个数组元素的值 */
	for j = 0; j < 5; j++ {
		fmt.Printf("balance2[%d] = %f\n", j, balance2[j] )
	}
	//  将索引为 1 和 3 的元素初始化
	balance3 := [5]float32{
     1:2.0,3:7.0}
	for k = 0; k < 5; k++ {
		fmt.Printf("balance3[%d] = %f\n", k, balance3[k] )
	}
}
```

```java
package main
import "fmt"
func main() {
	var grade [5]float64
	for i:=0;i<len(grade);i++ {
		fmt.Printf("输入第 %d 的成绩：",i+1)
		fmt.Scanln(&grade[i])
		if grade[i] < 60 {
			grade[i] = 60
		}
	}
	fmt.Printf("grade 数组：%v\n",grade)
	for i:=0;i<len(grade);i++ {
		fmt.Printf("第 %v 位的成绩是：%v \n",i+1,grade[i])
	}
}
// 结果
输入第 1 的成绩：25
输入第 2 的成绩：36
输入第 3 的成绩：85
输入第 4 的成绩：96
输入第 5 的成绩：100
grade 数组：[60 60 85 96 100]
第 1 位的成绩是：60 
第 2 位的成绩是：60 
第 3 位的成绩是：85 
第 4 位的成绩是：96 
第 5 位的成绩是：100 
```

## 5. array 遍历迭代

range 关键字可以对 array 进行迭代，每次返回一个 index 和对应的元素值。可以将 range 的迭代结合 for 循环对 array 进行遍历。

```java
package main
import "fmt"
func main() {
	var arr = []int{
     1,3,5,7,9}
	for index,value := range arr {
		fmt.Println("index:",index," value:",value)
	}
}
// 结果
index: 0  value: 1
index: 1  value: 3
index: 2  value: 5
index: 3  value: 7
index: 4  value: 9
```

## 6. 指针数组

**可以声明一个指针类型的数组，这样数组中就可以存放指针。注意，指针的默认初始化值为 nil。**

```java
// 创建一个指向 int 类型的数组
arr := [5]*int{
     1:new(int), 3:new(int)}
```

**上面的 *int 表示数组只能存储 *int 类型的数据，也就是指向 int 的指针类型。new(TYPE) 函数会为一个 TYPE 类型的数据结构划分内存并做默认初始化操作，并返回这个数据对象的指针，所以 new(int) 表示创建一个 int 类型的数据对象，同时返回指向这个对象的指针。**

```java
// 对数组中的指针元素进行赋值
package main
import "fmt"
func main() {
    arr_name := [5]*int{
     1:new(int), 3:new(int)}
    *arr_name[1]=10
    *arr_name[3]=30
    // 赋值一个新元素
    arr_name[4]=new(int)
    fmt.Println(*arr_name[1])
    fmt.Println(*arr_name[3])
    fmt.Println(*arr_name[4])
}
```

## 7. 数组赋值

- 在 Go 中，由于数组算是一个值类型，所以可以将它赋值给其它数组。
- 因为数组类型的完整定义为 [n]TYPE，所以数组赋值给其它数组的时候，n 和 TYPE 必须相同。

```java
// 声明一个长度为5的string数组
var str_arr1 [5]string
// 声明并初始化另一个string数组
str_arr2 := [5]string{
     "Perl","Shell","Python","Go","Java"}
// 将str_arr2拷贝给str_arr1
str_arr1 = str_arr2
```

```java
package main
import "fmt"
func main() {
    var str_arr1 [3]*string
    str_arr2 := [3]*string{
        new(string),
        new(string),
        new(string),
    }
    *str_arr2[0] = "Perl"
    *str_arr2[1] = "Python"
    *str_arr2[2] = "Shell"
    // 数组赋值，拷贝指针本身，而不拷贝指向的值
    str_arr1 = str_arr2
    // 将输出Python
    fmt.Println(*str_arr1[1])
}
```

## 8. 传递数组参数给函数

Go中的传值方式是按值传递，这意味着给变量赋值、给函数传参时，都是直接拷贝一个副本然后将副本赋值给对方的。这样的拷贝方式意味着：

- 如果数据结构体积庞大，则要完整拷贝一个数据结构副本时效率会很低
- 函数内部修改数据结构时，只能在函数内部生效，函数一退出就失效了，因为它修改的是副本对象

**数组同样也遵循此规则。对于数组的赋值，上面数组拷贝中已经解释过了。如果函数的参数是数组类型，那么调用函数时传递给函数的数组也一样是这个数组拷贝后的一个副本。**

```java
// 创建一个 100W 个元素的数组，将其传递给函数 foo()
var big_arr [1e6]int
func foo(a [1e6]int) {
    ...
}
// 调用foo
foo(bigarr)
```

- 当上面声明 big_arr 后，就有 100W 个元素，假设这个 int 占用 8 字节，整个数组就占用 800W 字节，大约有 8M 数据。当调用 foo 的时候，Go 会直接复制这 8M 数据形成另一个数组副本，并将这个副本交给 foo 进行处理。在 foo 中处理的数组，实际上是这个副本，foo() 不会对原始的 big_arr 产生任何影响。
- **可以将数组的指针传递给函数，这样指针传递给函数时，复制给函数参数的是这个指针**，总共才 8 个字节(每个指针占用 1 个机器字长，64 位机器上是 64bit 共占用 8 字节)，复制的数据量非常少。而且，因为复制的是指针，foo() 修改这个数组时，会直接影响原始数组。

```java
var big_arr [1e6]int
// 生成数组的指针
ref_big_arr := &big_arr
func foo(ra *[1e6]int) {
    ...
}
// 调用foo，传递指针
foo(ref_big_arr)
```

- **形参设定数组大小**

```java
void myFunction(param [10]int)
{
.
.
.
}
```

- **形参未设定数组大小**

```java
void myFunction(param []int)
{
.
.
.
}
```

**示例**

```java
// 函数接收整形数组参数，另一个参数指定了数组元素的个数，并求和
package main
import "fmt"
//定义数组,有5个元素
var numbers [5]int
func main() {
	numbers = [5]int{
     10, 20, 30, 40, 50}
	fmt.Println("元素和为:", sum(numbers))
}
func sum(arr [5]int) int {
	//定义求和的变量s
	s := 0
	//求和过程
	for i := range arr {
		s += arr[i]
	}
	return s
}
//输出结果如下
元素和为: 150
```

```java
// 函数接收整形数组参数，另一个参数指定了数组元素的个数，并求出平均值
package main
import "fmt"
var (
	//数组长度为5
	nums = [5]int{
     10, 20, 40, 60, 80}
	avg  float32
	s    int
)
func main() {
	//数组作为参数传递给函数
	avg = sums(nums, len(nums))
	//输出返回的平均值
	fmt.Printf("平均值为: %f", avg)
}
//传入数组和他的长度，返回值的类型为float32
func sums(x [5]int, length int) float32 {
	for i := 0; i < length; i++ {
		s += x[i]
	}
	avg = float32(s) / float32(length)
	return avg
}
//输出结果如下
平均值为: 42.000000
```

## 9. 多维数组

可以通过组合两个一维数组的方式构成二维数组。一般在处理具有父、子关系或者有坐标关系的数据时，二维数组比较有用。

**多维数组声明方式：**

```java
var var_name [SIZE1][SIZE2]...[SIZEN] var_type
// 声明三维整型数组
var threedim [5][10][4]int
```

> 二维数组

二维数组是最简单的多维数组，二维数组本质上是由一维数组组成的。二维数组定义方式如下：

```java
var arrayName [ x ][ y ] var_type
// 二维数组中的元素可通过 a[ i ][ j ] 来访问
```

**示例**

```java
package main
import "fmt"
func main() {
	// 创建数组
	values := [][]int{
     }
	// 定义两个一维数组
	row1 := []int{
     1,2,3}
	row2 := []int{
     4,5,6}
	// 使用 append() 函数向空的二维数组添加两行一维数组
	values = append(values,row1)
	values = append(values,row2)
	// 显示两行数据
	fmt.Println("Row 1")
	fmt.Println(values[0])
	fmt.Println("Row 2")
	fmt.Println(values[1])
	// 访问第一个元素
	fmt.Println("第一个元素为：")
	fmt.Println(values[0][0])
}
// 结果
Row 1
[1 2 3]
Row 2
[4 5 6]
第一个元素为：
1
```

> 初始化二维数组

多维数组可通过大括号来初始值。以下实例为一个 3 行 4 列的二维数组：

```java
a := [3][4]int{
	{
     0, 1, 2, 3},     /* 第一行索引为 0 */
	{
     4, 5, 6, 7},     /* 第二行索引为 1 */
	{
     8, 9, 10, 11},   /* 第三行索引为 2 */
}
// 注意，上面的代码中倒数第二行的 } 必须有逗号，因为最后一行的 } 不能单独一行，也可以写成下面这样
a := [3][4]int {
	{
     0,1,2,3},			//第1行索引为0
	{
     4,5,6,7},			//第2行索引为1
	{
     8,9,10,11}}		//第3行索引为2
```

`初始化一个 2 行 2 列的二维数组`

```java
package main
import "fmt"
func main() {
	//创建二维数组
	list := [2][2]string{
     }
	//向二维数组中添加元素
	list[0][0] = "你好" //第1个一维数组中的第1个元素
	list[0][1] = "欢迎" //第1个一维数组中的第2个元素
	list[1][0] = "来到" //第2个一维数组中的第1个元素
	list[1][1] = "南京" //第2个一维数组中的第2个元素
	//输出结果
	fmt.Println(list)
}
//输出结果如下
[[你好 欢迎] [来到 南京]]
```

> 访问二维数组

- 二维数组通过指定坐标来访问。如数组中的行索引与列索引，例如：

```java
//访问二维数组 val 第三行的第四个元素
val := a[2][3]
或
var value int = a[2][3]
```

- 二维数组可以使用循环嵌套来输出元素

```java
package main
import "fmt"
func main() {
	nums := [2][3]int{
		{
     1, 2, 3},
		{
     4, 5, 6},
	}
	//遍历二维数组中的每个元素
	//外层循环读取行
	for i := 0; i < 2; i++ {
		//内层循环读取列
		for j := 0; j < 3; j++ {
			fmt.Println(nums[i][j])
		}
	}
}
//输出结果如下
1
2
3
4
5
6
```

- 创建各个维度元素数量不一致的多维数组

```java
package main
import "fmt"
func main() {
	// 创建空的二维数组
	list := [][]string{
     }
	// 创建三一维数组，各数组长度不同
	num1 := []string{
     "zhang", "wang", "zhao"}
	num2 := []string{
     "li"}
	num3 := []string{
     "sun", "jin"}
	// 使用 append() 函数将一维数组添加到二维数组中
	list = append(list, num1)
	list = append(list, num2)
	list = append(list, num3)
	// 循环输出
	for i := range list {
		fmt.Printf("list: %v\n", i)
		fmt.Println(list[i])
	}
}
//输出结果如下
list: 0
[zhang wang zhao]
list: 1
[li]
list: 2
[sun jin]
```
