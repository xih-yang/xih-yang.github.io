# 11、Golang 教程 - 数组与切片
- 来源：https://ddkk.com/zhuanlan/other/golang/4/11.html
- 分类：其他语言
- 分组：教程目录
## 数组

数组是同一类型的元素的集合。例如，整数 `5`, `8`, `9`, `79`, `76` 的集合就构成了一个数组。Go不允许在数组中混合使用不同类型的元素（例如包含整数和字符串的数组）。

数组是一种非常有用的数据结构，因为其占用的内存是连续分配的。由于内存连续，CPU 能把正在使用的数据缓存更久的时间。而且内存连续很容易计算索引，可以快速迭代数组里的所 有元素。数组的类型信息可以提供每次访问一个元素时需要在内存中移动的距离。既然数组的每 个元素类型相同，又是连续分配，就可以以固定速度索引数组中的任意数据，速度非常快。

## 数组声明

数组的类型为 `[n]T`，其中 `n` 表示数组中元素的数量，T 表示数组中每个元素的类型。元素的个数 `n` 也是数组类型的一部分（我们将在稍后详细讨论）。

声明数组有不同的方法。让我们逐一看看它们。

```java
package main
import (
	"fmt"
)
func main() {
	var a [3]int //int array with length 3
	fmt.Println(a)
}
```

`var a [3] int`声明一个长度为`3`的整型数组。数组中的所有元素都会自动赋值为数组类型的`零值`。在这种情况下，`a`是一个整型数组，因此数组`a`中的所有元素都分配为 `int` 的零值 也就是`0`。运行上述程序将输出 `[0 0 0]`。

数组的索引从 `0` 开始到 `length - 1` 结束。下面让我们给上面的数组赋值。

```java
package main
import (
	"fmt"
)
func main() {
	var a [3]int //int array with length 3
	a[0] = 12    // array index starts at 0
	a[1] = 78
	a[2] = 50
	fmt.Println(a)
}
```

`a[0]`表示数组的第一个元素，依次类推。上面的程序将输出 `[12 78 50]`

让我们使用`short hand declaration`(简写声明：声明并赋值)创建相同的数组：

```java
package main
import (
	"fmt"
)
func main() {
	a := [3]int{
     12, 78, 50} // short hand declaration to create array
	fmt.Println(a)
}
```

上面的程序同样输出 `[12 78 50]`

在简写声明时，不必为数组中的所有元素分配值。

```java
package main
import (
	"fmt"
)
func main() {
	a := [3]int{
     12}
	fmt.Println(a)
}
```

上面程序中`a := [3]int{12}` 这一行声明了一个长度为 `3` 的数组，但是只提供了一个值 `12`。剩下的两个元素被自动赋值为元素类型的`零值`。运行程序输出为：`[12 0 0]`。

在声明数组时你可以忽略数组的长度并用 `...` 代替，让编译器为你自动推断数组的长度。比如下面的程序：

```java
package main
import (
	"fmt"
)
func main() {
	a := [...]int{
     12, 78, 50} // ... makes the compiler determine the length
	fmt.Println(a)
}
```

数组的大小是该类型的一部分。所以`[5]int`，`[25]int`是不同的类型。因此，一旦声明，数组里存储的数据类型和数组长度就都不能改变了。不要担心这种限制，因为`slices(切片)`存在可以克服这一缺点。

```java
package main
func main() {
    a := [3]int{
     5, 78, 8}
    var b [5]int
    b = a //not possible since [3]int and [5]int are distinct types
}
```

在上面的程序中，我们试图将类型`[3]int`的数组赋值给`[5]int`类型的数组，因此编译器将抛出错误：`main.go:6: cannot use a (type [3]int) as type [5]int in assignment`。

## 数组是值类型#

Go中的数组是值类型而不是引用类型。这意味着当将它们分配给新变量时，会将原始数组的副本分配给新变量。如果对新变量进行了更改，则它不会影响原始数组。

```java
package main
import "fmt"
func main() {
	a := [...]string{
     "USA", "China", "India", "Germany", "France"}
	b := a // a copy of a is assigned to b
	b[0] = "Singapore"
	fmt.Println("a is ", a)
	fmt.Println("b is ", b)
}
```

上面程序将数组 `a` 的副本赋值给数组 `b`。然后将 `b` 的第一个元素赋值为 `Singapore`。这将不会影响到原数组 `a`。程序的输出为：

```java
a is [USA China India Germany France]  
b is [Singapore China India Germany France]  
```

同样的，当数组作为参数传递给函数时，也是值传递，在函数内部对参数数组进行赋值 ，原始数组不变。

```java
package main
import "fmt"
func changeLocal(num [5]int) {
	num[0] = 55
	fmt.Println("inside function ", num)
}
func main() {
	num := [...]int{
     5, 6, 7, 8, 8}
	fmt.Println("before passing to function ", num)
	changeLocal(num) //num is passed by value
	fmt.Println("after passing to function ", num)
}
```

在上面的程序中，数组`num`实际上是通过值传递给函数的`changeLocal`，因此函数调用不会改变原始数组。该程序将输出：

```java
before passing to function  [5 6 7 8 8]
inside function  [55 6 7 8 8]
after passing to function  [5 6 7 8 8]
```

## 数组的长度#

内置函数 `len` 用于获取数组的长度：

```java
package main
import "fmt"
func main() {
	a := [...]float64{
     67.7, 89.8, 21, 78}
	fmt.Println("length of a is", len(a))
}
```

上述程序的输出是：`length of a is 4`

## 使用 range 遍历数组#

`for` 循环可以用来遍历数组中的元素：

```java
package main
import "fmt"
func main() {
	a := [...]float64{
     67.7, 89.8, 21, 78}
	for i := 0; i < len(a); i++ {
      //looping from 0 to the length of the array
		fmt.Printf("%d th element of a is %.2f\n", i, a[i])
	}
}
```

上述方案采用了`for`循环来遍历数组，索引从`0`开始 到 `len(a) - 1`结束。该程序运行将打印：

```java
0 th element of a is 67.70  
1 th element of a is 89.80  
2 th element of a is 21.00  
3 th element of a is 78.00  
```

Go提供了一种更好、更简洁的方法来迭代数组，方法是使用`for range`形式。`range` 既返回索引，又返回该索引处的值。让我们使用`range`重写上面的代码。我们还将计算数组所有元素的和：

```java
package main
import "fmt"
func main() {
	a := [...]float64{
     67.7, 89.8, 21, 78}
	sum := float64(0)
	for i, v := range a {
      //range returns both the index and value
		fmt.Printf("%d the element of a is %.2f\n", i, v)
		sum += v
	}
	fmt.Println("\nsum of all elements of a", sum)
}
```

上面的程序中， `for i, v := range a` 是 `range` 形式的 `for` 循环。`range` 将返回数组的索引和相对应的元素。我们打印这些值并计算数组 `a` 中所有元素的总和。程序的输出如下：

```java
0 the element of a is 67.70
1 the element of a is 89.80
2 the element of a is 21.00
3 the element of a is 78.00
sum of all elements of a 256.5
```

如果您只想要数组元素 并不需要索引时，可以通过将索引替换为 `_` 空标识符来完成此操作。

```java
for _, v := range a {
      //ignores index  
}
```

上面的代码忽略了索引。同样的，也可以忽略值。

## 多维数组#

到目前为止我们创建的数组都是单维的。可以创建多维数组。

```java
package main
import (
	"fmt"
)
func printarray(a [3][2]string) {
	for _, v1 := range a {
		for _, v2 := range v1 {
			fmt.Printf("%s ", v2)
		}
		fmt.Printf("\n")
	}
}
func main() {
	a := [3][2]string{
		{
     "lion", "tiger"},
		{
     "cat", "dog"},
		{
     "pigeon", "peacock"}, //this comma is necessary. The compiler will complain if you omit this comma
	}
	printarray(a)
	var b [3][2]string
	b[0][0] = "apple"
	b[0][1] = "samsung"
	b[1][0] = "microsoft"
	b[1][1] = "google"
	b[2][0] = "AT&T"
	b[2][1] = "T-Mobile"
	fmt.Printf("\n")
	printarray(b)
}
```

上面的程序中，第17行利用简写声明创建了一个二维数组a。第 20 行的逗号是必须的，这是因为词法分析器根据简单的规则自动插入分号。如果你想了解更多，请阅读：[https://golang.org/doc/effective_go.html#semicolons](https://golang.org/doc/effective_go.html#semicolons) 。

在第`23` 行声明了另一个二维数组 `b`，并通过索引的方式给数组 `b` 中的每一个元素赋值。这是初始化二维数组的另一种方式。

第`7` 行声明的函数 `printarray` 通过两个嵌套的 `for range` 打印二维数组的内容。上面程序的输出为：

```java
lion tiger 
cat dog 
pigeon peacock 
apple samsung 
microsoft google 
AT&T T-Mobile
```

以上是对数组的介绍，尽管数组看起来足够灵活，但是它具有固定的长度限制。而`切片(Slices)`却没有这个限制，事实上,在 Go 中，切片比数组更为常见。

## 切片#

`切片(slice)`是建立在数组之上的更方便，更灵活，且功能强大的包装器。切片本身并不存储任何数据，它只是对现有数组的引用。

## 创建切片#

元素类型为 `T` 的切片表示为： `[]T`。

```java
package main
import (
	"fmt"
)
func main() {
	a := [5]int{
     76, 77, 78, 79, 80}
	var b []int = a[1:4] //creates a slice from a[1] to a[3]
	fmt.Println(b)
}
```

语法`a[start:end]`从数组`a`创建一个切片，切片从索引`start`开始到索引 `end-1` 结束。

因此，在上面程序第`9`行中，`a[1:4]`创建了数组`a`的一个切片，从`a`数组索引`1`开始 到索引`3` 结束。因此，因此 `b` 的值为：`[77 78 79]`。

让我们看看切片的另一种创建方法。

```java
package main
import (
	"fmt"
)
func main() {
	c := []int{
     6, 7, 8} //creates and array and returns a slice reference
	fmt.Println(c)
}
```

在上面程序中第`9`行，`c:=[]int{6，7，8}`创建一个长度为`3`的整型数组，并返回一个切片给`c`。

## 修改切片#

切片本身不拥有任何的数据。它只是底层数组的表示。对切片所做的任何修改都将反映在底层数组中。

```java
package main
import (
	"fmt"
)
func main() {
	darr := [...]int{
     57, 89, 90, 82, 100, 78, 67, 69, 59}
	dslice := darr[2:5]
	fmt.Println("array before", darr)
	for i := range dslice {
		dslice[i]++
	}
	fmt.Println("array after", darr)
}
```

在上面程序的第`9`行中，我们从数组的索引`2`、`3`和`4`创建切片`dslice`。`for`循环将这些索引中的值递增`1`。当我们在`for`循环之后打印数组时，我们可以看到对切片的更改反映在数组中。程序的输出是：

```java
array before [57 89 90 82 100 78 67 69 59]
array after [57 89 91 83 101 78 67 69 59]
```

当多个切片共享相同的底层数组时，每个切片所做的更改都将反映在数组中。

```java
package main
import (
	"fmt"
)
func main() {
	numa := [3]int{
     78, 79, 80}
	nums1 := numa[:] //creates a slice which contains all elements of the array
	nums2 := numa[:]
	fmt.Println("array before change 1", numa)
	nums1[0] = 100
	fmt.Println("array after modification to slice nums1", numa)
	nums2[1] = 101
	fmt.Println("array after modification to slice nums2", numa)
}
```

上面程序的第 `9` 行， `numa[:]` 中缺少了开始和结束的索引值，这种情况下开始和结束的索引值默认为 `0` 和 `len(numa)`。这里 `nums1` 和 `nums2` 两个切片共享了同一个数组。运行程序的输出为：

```java
array before change 1 [78 79 80]
array after modification to slice nums1 [100 79 80]
array after modification to slice nums2 [100 101 80]
```

从输出中可以清楚地看出，当切片共享同一个数组时，每个切片所做的修改都会反映在数组中。

## 切片的长度和容量#

切片的长度是切片中元素的数量。切片的容量是从创建切片的索引开始的基础数组中的元素数。

让我们写一些代码来更好地理解这一点。

```java
package main
import (
	"fmt"
)
func main() {
	fruitarray := [...]string{
     "apple", "orange", "grape", "mango", "water melon", "pine apple", "chikoo"}
	fruitslice := fruitarray[1:3]
	fmt.Printf("length of slice %d capacity %d", len(fruitslice), cap(fruitslice)) //length of is 2 and capacity is 6
}
```

在上面的程序中，`fruitslice`是从`fruitarray`底层数组的 索引`1` 到 `3`创建的切片。因此`fruitslice`切片的长度为`2`。

`fruitarray`底层数组的长度为`7`。`fruiteslice` 是从 `fruitarray` 的索引 `1` 开始的。因此 `fruiteslice` 的容量是从 `fruitarray` 的第 `1` 个元素开始算起，到数组的最后一个元素的个数，这个值是 `6`。因此 `fruitslice` 的容量是 `6`。运行程序输出为：`length of slice 2 capacity 6`。

切片可以根据其容量重新切片。最大为其容量，超过此范围的任何操作都将导致程序抛出运行时错误。

```java
package main
import (
	"fmt"
)
func main() {
	fruitarray := [...]string{
     "apple", "orange", "grape", "mango", "water melon", "pine apple", "chikoo"}
	fruitslice := fruitarray[1:3]
	fmt.Printf("length of slice %d capacity %d\n", len(fruitslice), cap(fruitslice)) //length of is 2 and capacity is 6
	fruitslice = fruitslice[:cap(fruitslice)]                                        //re-slicing furitslice till its capacity
	fmt.Println("After re-slicing length is", len(fruitslice), "and capacity is", cap(fruitslice))
}
```

在上面的程序中， 第 `11` 行修改 `fruitslice` 的长度为它的容量。上面的程序输出如下：

```java
length of slice 2 capacity 6  
After re-slicing length is 6 and capacity is 6  
```

## 使用make创建切片#

函数`func make([]T, len, cap) []T` 可以用来创建切片，该函数接受类型，长度和容量作为参数，返回切片。容量是可选的，默认与长度相同。使用 `make` 函数将会创建一个数组并返回它的切片。

```java
package main
import (
	"fmt"
)
func main() {
	i := make([]int, 5, 5)
	fmt.Println(i)
}
```

用`make` 创建的切片的元素值默认为元素类型的`零值`。运行上面程序输出为：`[0 0 0 0 0]`。

## 追加元素到切片#

我们已经知道数组有固定的长度限制，切片是动态的，可以使用`append`函数将新元素追加到切片。追加函数的定义是 `func append(s []T, x ...T) []T`。

`x…T` 表示 `append` 函数可以接受的参数个数是可变的。这种函数叫做[变参函数](/zhuanlan/other/golang/4/12.html)。

但有一个问题可能会困扰你。如果切片的底层是数组，并且数组本身具有固定长度限制，那么切片如何具有动态长度的呢？其实是这样的，当新元素追加到切片时，会创建一个新数组。将现有数组的元素复制到此新数组，并返回此新数组的新切片引用。新切片的容量现在是旧切片的两倍。很酷吧。以下程序将使事情变得清晰。

```java
package main
import (
	"fmt"
)
func main() {
	cars := []string{
     "Ferrari", "Honda", "Ford"}
	fmt.Println("cars:", cars, "has old length", len(cars), "and capacity", cap(cars)) // capacity of cars is 3
	cars = append(cars, "Toyota")
	fmt.Println("cars:", cars, "has new length", len(cars), "and capacity", cap(cars)) // capacity of cars is doubled to 6
}
```

在上述程序中，`cars`最初的容量为`3`。在第 `10` 行我们追加了一个新的元素给 `cars`。并将 `append(cars, "Toyota")` 的返回值重新赋值给 `cars`。现在 `cars` 的容量翻倍，变为 `6`。运行程序输出为：

```java
cars: [Ferrari Honda Ford] has old length 3 and capacity 3
cars: [Ferrari Honda Ford Toyota] has new length 4 and capacity 6
```

切片的零值为 `nil`。一个 `nil` 切片的长度和容量都为 `0`。可以利用 `append` 函数给一个 `nil` 切片追加值。

```java
package main
import (
	"fmt"
)
func main() {
	var names []string //zero value of a slice is nil
	if names == nil {
		fmt.Println("slice is nil going to append")
		names = append(names, "John", "Sebastian", "Vinay")
		fmt.Println("names contents:", names)
	}
}
```

在上面的程序中，`names`初始是`nil`，然后我们追加了`3`个字符串到`names`。运行程序输出是：

```java
slice is nil going to append
names contents: [John Sebastian Vinay]
```

也可以使用`...`操作符将一个切片追加到另一个切片。你可以在可变参数函数教程中了解有关此操作符的更多信息。

```java
package main
import (
	"fmt"
)
func main() {
	veggies := []string{
     "potatoes", "tomatoes", "brinjal"}
	fruits := []string{
     "oranges", "apples"}
	food := append(veggies, fruits...)
	fmt.Println("food:", food)
}
```

上面的程序中，在第`10`行将 `fruits` 追加到 `veggies` 并赋值给 `food`。`...`操作符用来展开切片。程序的输出为：`food: [potatoes tomatoes brinjal oranges apples]`。

## 将切片作为函数的参数#

切片可以被认为内部是由结构类型表示的。它的样子就像下面这样：

```java
type slice struct {
    Length        int
    Capacity      int
    ZerothElement *byte
}
```

切片包含长度，容量和指向底层数组第`0`个元素的指针。当一个切片传递给一个函数时，即使它是通过值传递的，但是指针变量始终指向相同的底层数组。因此，当切片作为参数传递给函数时，函数内部所做的更改也会在函数外部可见。让我们写一个程序来验证一下：

```java
package main
import (
	"fmt"
)
func subtactOne(numbers []int) {
	for i := range numbers {
		numbers[i] -= 2
	}
}
func main() {
	nos := []int{
     8, 7, 6}
	fmt.Println("slice before function call", nos)
	subtactOne(nos)                               //function modifies the slice
	fmt.Println("slice after function call", nos) //modifications are visible outside
}
```

在上面的程序中，第 `17` 行将切片中的每个元素的值减`2`。在函数调用之后打印切片的的内容，发现切片内容发生了改变。你可以回想一下，这和数组是不同的，在函数内部对数组所做的更改在函数外不可见。所以上面的程序输出如下：

```java
slice before function call [8 7 6]
slice after function call [6 5 4]
```

## 多维切片#

同数组一样，切片也可以有多个维度。

```java
package main
import (
	"fmt"
)
func main() {
	pls := [][]string{
		{
     "C", "C++"},
		{
     "JavaScript"},
		{
     "Go", "Rust"},
	}
	for _, v1 := range pls {
		for _, v2 := range v1 {
			fmt.Printf("%s ", v2)
		}
		fmt.Printf("\n")
	}
}
```

该程序的输出是：

```java
C C++  
JavaScript  
Go Rust  
```

## 内存优化#

切片持有对底层数组的引用。只要切片在内存中，就不能对数组进行垃圾回收。在内存管理方面，这是必须要关注的。假设我们有一个非常大的数组，我们只处理它的一小部分。因此，我们从该数组创建一个切片并开始处理切片。这里需要注意的重要一点是，由于切片引用了数组，因此数组仍然在内存中。

解决该问题的一个方法是使用 copy 函数 `func copy(dst, src []T) int` 来创建该切片的一个拷贝。这样我们就可以使用这个新的切片，原来的数组可以被垃圾回收。

```java
package main
import (
	"fmt"
)
func countries() []string {
	countries := []string{
     "USA", "Singapore", "Germany", "India", "Australia"}
	neededCountries := countries[:len(countries)-2]
	countriesCpy := make([]string, len(neededCountries))
	copy(countriesCpy, neededCountries) //copies neededCountries to countriesCpy
	return countriesCpy
}
func main() {
	countriesNeeded := countries()
	fmt.Println(countriesNeeded)
}
```

在上面程序中，第 `9` 行 `neededCountries := countries[:len(countries)-2]` 创建一个底层数组为 `countries` 并排除最后两个元素的切片。第 `11` 行将 `neededCountries` 拷贝到 `countriesCpy` 并在下一行返回 `countriesCpy`。现在数组 `countries` 可以被垃圾回收，因为 `neededCountries` 不再被引用。
