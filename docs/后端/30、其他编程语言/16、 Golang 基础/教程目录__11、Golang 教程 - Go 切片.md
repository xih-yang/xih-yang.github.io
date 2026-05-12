# 11、Golang 教程 - Go 切片
- 来源：https://ddkk.com/zhuanlan/other/golang/2/11.html
- 分类：其他语言
- 分组：教程目录
- Go 语言切片是对数组的抽象。
- Go 数组的长度不可改变，在特定场景中这样的集合就不太适用，Go 中提供了一种灵活，功能强悍的内置类型切片(“动态数组”)，与数组相比切片的长度是不固定的，可以追加元素，在追加时可能使切片的容量增大。

## 1. 定义切片

- 你可以声明一个未指定大小的数组来定义切片：

```java
var identifier []type
```

**切片不需要说明长度。**

- 或使用 **make()** 函数来创建切片:

```java
var slice1 []type = make([]type, len)
// 也可以简写为
slice1 := make([]type, len)
```

- 也可以指定容量，其中 **capacity** 为可选参数。

```java
make([]T, length, capacity)
```

`这里len 是数组的长度并且也是切片的初始长度。`

## 2. 切片初始化

```java
s := []int{
     1,2,3} 
```

直接初始化切片，**[]** 表示是切片类型，**{1,2,3}** 初始化值依次是 **1,2,3**，其 **cap=len=3**。

```java
s := arr[:] 
```

初始化切片 **s**，是数组 arr 的引用。

```java
s := arr[startIndex:endIndex] 
```

将arr 中从下标 startIndex 到 endIndex-1 下的元素创建为一个新的切片。

```java
s := arr[startIndex:] 
```

默认endIndex 时将表示一直到arr的最后一个元素。

```java
s := arr[:endIndex] 
```

默认startIndex 时将表示从 arr 的第一个元素开始。

```java
s1 := s[startIndex:endIndex] 
```

通过切片 s 初始化切片 s1。

```java
s :=make([]int,len,cap) 
```

通过内置函数 **make()** 初始化切片**s**，**[]int** 标识为其元素类型为 int 的切片。

**示例**

```java
package main
import "fmt"
func main() {
	//定义数组
	arr := [...]int{
     11,22,33,44,55}
	//定义切片
	slice := []int{
     10,20,30,40,50}
	//来自数组 arr 的切片
	slice1 := arr[:]
	fmt.Printf("切片类型：%T\n",slice)
	fmt.Printf("数组类型：%T\n",arr)
	fmt.Printf("slice1 类型：%T\n",slice1)
	fmt.Printf("slice1：%T\n",slice1)
}
// 结果
切片类型：[]int
数组类型：[5]int
slice1 类型：[]int
slice1：[]int
```

```java
package main
import "fmt"
func main() {
    arr := [...]int{
     11,22,33,44,55}
    // 从下标为 1 取到最后一个元素
    // 左闭右开
    slice2 := arr[1:]
    fmt.Println(slice2)
    // 从开头取到第三个元素截止
    slice3 := arr[:3]
    fmt.Println(slice3)
    // 从第二个元素到第四个元素
    slice4 := arr[1:4]
    fmt.Println(slice4)
}
// 结果
[22 33 44 55]
[11 22 33]
[22 33 44]
```

## 3. len() 和 cap() 函数

- 切片是可索引的，并且可以由 len() 方法获取长度。
- 切片提供了计算容量的方法 cap() 可以测量切片最长可以达到多少。

**示例**

```java
package main
import "fmt"
func main() {
    // 初始化长度为 3，最大容量为 5
    var numbers = make([]int, 3, 5)
    printSlice(numbers)
}
func printSlice(x []int) {
    // %v 展示原始数据类型
    fmt.Printf("len=%d cap=%d slice=%v\n", len(x), cap(x), x)
}
// 结果
len=3 cap=5 slice=[0 0 0]
```

## 4. 空(nil)切片

一个切片在未初始化之前默认为 nil，长度为 0。

```java
package main
import "fmt"
func main() {
   var numbers []int
   printSlice(numbers)
   if(numbers == nil){
      fmt.Printf("切片是空的")
   }
}
func printSlice(x []int){
   fmt.Printf("len=%d cap=%d slice=%v\n",len(x),cap(x),x)
}
// 结果
len=0 cap=0 slice=[]
切片是空的
```

## 5. 切片截取

可以通过设置下限及上限来设置截取切片 `[lower-bound:upper-bound]`。

```java
package main
import "fmt"
func main() {
   /* 创建切片 */
   numbers := []int{
     0,1,2,3,4,5,6,7,8}  
   printSlice(numbers)
   /* 打印原始切片 */
   fmt.Println("numbers ==", numbers)
   /* 打印子切片从索引1(包含) 到索引4(不包含)*/
   fmt.Println("numbers[1:4] ==", numbers[1:4])
   /* 默认下限为 0*/
   fmt.Println("numbers[:3] ==", numbers[:3])
   /* 默认上限为 len(s)*/
   fmt.Println("numbers[4:] ==", numbers[4:])
   numbers1 := make([]int,0,5)
   printSlice(numbers1)
   /* 打印子切片从索引  0(包含) 到索引 2(不包含) */
   number2 := numbers[:2]
   printSlice(number2)
   /* 打印子切片从索引 2(包含) 到索引 5(不包含) */
   number3 := numbers[2:5]
   printSlice(number3)
}
func printSlice(x []int){
   fmt.Printf("len=%d cap=%d slice=%v\n",len(x),cap(x),x)
}
// 结果
len=9 cap=9 slice=[0 1 2 3 4 5 6 7 8]
numbers == [0 1 2 3 4 5 6 7 8]
numbers[1:4] == [1 2 3]
numbers[:3] == [0 1 2]
numbers[4:] == [4 5 6 7 8]
len=0 cap=5 slice=[]
len=2 cap=9 slice=[0 1]
len=3 cap=7 slice=[2 3 4]
```

## 6. append() 和 copy() 函数

- 如果想增加切片的容量，我们必须创建一个新的更大的切片并把原分片的内容都拷贝过来。
- 下面的代码描述了从拷贝切片的 copy 方法和向切片追加新元素的 append 方法。
- append 和 copy 是生成了个新的切片，对原切片没影响。

```java
package main
import "fmt"
func main() {
   var numbers []int
   printSlice(numbers)
   /* 允许追加空切片 */
   numbers = append(numbers, 0)
   printSlice(numbers)
   /* 向切片添加一个元素 */
   numbers = append(numbers, 1)
   printSlice(numbers)
   /* 同时添加多个元素 */
   numbers = append(numbers, 2,3,4)
   printSlice(numbers)
   /* 创建切片 numbers1 是之前切片的两倍容量*/
   numbers1 := make([]int, len(numbers), (cap(numbers))*2)
   /* 拷贝 numbers 的内容到 numbers1 */
   copy(numbers1,numbers)
   printSlice(numbers1)  
}
func printSlice(x []int){
   fmt.Printf("len=%d cap=%d slice=%v\n",len(x),cap(x),x)
}
// 结果
len=0 cap=0 slice=[]
len=1 cap=1 slice=[0]
len=2 cap=2 slice=[0 1]
len=5 cap=6 slice=[0 1 2 3 4]
len=5 cap=12 slice=[0 1 2 3 4]
```

## 7. 反转切片

```java
func main(){
	var arr = []int{
     4: 1, 5: -1}
	//	months := [...]string{1: "January", 12: "December"}
	arr = rev(arr)
	fmt.Println(arr)
}
func rev(slice []int) []int {
	fmt.Println(slice)
	for i, j := 0, len(slice)-1; i < j; i, j = i+1, j-1 {
		slice[i], slice[j] = slice[j], slice[i]
	}
	return slice
}
// 结果
[0 0 0 0 1 -1]
[-1 1 0 0 0 0]
```
