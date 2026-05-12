# 19、Golang 教程 - 接口_2
- 来源：https://ddkk.com/zhuanlan/other/golang/4/19.html
- 分类：其他语言
- 分组：教程目录
这是介绍接口的第二篇。如果你还没有阅读第一篇，可以在[这里阅读](/zhuanlan/other/golang/4/18.html)。

## 使用指针接收器和值接收器实现接口#

我们在[第1部分中](/zhuanlan/other/golang/4/18.html)讨论的所有示例接口都是使用值接收器实现的。还可以使用指针接收器实现接口。在使用指针接收器实现接口时需要注意一些细微之处。让我们使用以下程序来了解。

```java
package main
import "fmt"
type Describer interface {
	Describe()
}
type Person struct {
	name string
	age  int
}
func (p Person) Describe() {
      //implemented using value receiver
	fmt.Printf("%s is %d years old\n", p.name, p.age)
}
type Address struct {
	state   string
	country string
}
func (a *Address) Describe() {
      //implemented using pointer receiver
	fmt.Printf("State %s Country %s", a.state, a.country)
}
func main() {
	var d1 Describer
	p1 := Person{
     "Sam", 25}
	d1 = p1
	d1.Describe()
	p2 := Person{
     "James", 32}
	d1 = &p2
	d1.Describe()
	var d2 Describer
	a := Address{
     "Washington", "USA"}
	/* compilation error if the following line is
	   uncommented
	   cannot use a (type Address) as type Describer
	   in assignment: Address does not implement
	   Describer (Describe method has pointer
	   receiver)
	*/
	//d2 = a
	d2 = &a //This works since Describer interface
	//is implemented by Address pointer in line 22
	d2.Describe()
}
```

在上面程序第`13`行，`Person` 结构体以值接收器实现了 `Describer` 接口，而在第`22`行，`Address` 结构体以指针接收器实现了 `Describer` 接口。

正如我们在讨论[方法](/zhuanlan/other/golang/4/17.html)时已经学到的那样，使用值接受器声明的方法，既可以用值来调用，也能用指针调用。不管是一个值，还是一个可以解引用的指针，调用这样的方法都是合法的。

`p1` 的类型是 `Person`，在第 `29` 行，`p1` 赋值给了 `d1`。由于 `Person` 实现了接口变量 `d1`，因此在第 `30` 行，会打印 `Sam is 25 years old`。

类似的，在第 `32` 行，`d1` 又赋值为 `&p2`，在第 `33` 行同样打印输出了 `James is 32 years old`。太棒了！

在`22` 行，结构体 `Address` 使用指针接受器实现了 `Describer` 接口。

如果将第`45`行的注释去掉，我们将得到一个编译错误：`main.go:45: cannot use a (type Address) as type Describer in assignment: Address does not implement Describer (Describe method has pointer receiver)`。这是因为，在第`22`行我们使用的是 `Address` 指针作为接收器来实现 `Describer` 接口，但是我们试图将一个没有实现 `Describer` 的接口的值类型的变量 `a` 赋值给接口变量 `d2`。这是不合法的，这肯定会让你感到惊讶，因为我们之前已经知道带有指针接收器的方法将同时接受指针和值接收器。那么为什么代码不行呢?

原因是: 用一个指针或一个可以获取其地址的值调用指针值方法都是是合法的。但是，存储在接口中的具体值是不可寻址的，因此在第 `45` 行，编译器不能自动获取`a`的地址。所以这段代码报错了。

第`47` 行就可以成功运行，因为我们将 `a` 的地址 `&a` 赋值给了 `d2`。

程序剩下的部分不言自明。程序的输出如下：

```java
Sam is 25 years old  
State Washington Country USA  
```

## 实现多个接口#

一个类型可以实现多个接口。让我们看看如何在以下程序中完成此操作。

```java
package main
import (
	"fmt"
)
type SalaryCalculator interface {
	DisplaySalary()
}
type LeaveCalculator interface {
	CalculateLeavesLeft() int
}
type Employee struct {
	firstName   string
	lastName    string
	basicPay    int
	pf          int
	totalLeaves int
	leavesTaken int
}
func (e Employee) DisplaySalary() {
	fmt.Printf("%s %s has salary $%d", e.firstName, e.lastName, (e.basicPay + e.pf))
}
func (e Employee) CalculateLeavesLeft() int {
	return e.totalLeaves - e.leavesTaken
}
func main() {
	e := Employee{
		firstName:   "Naveen",
		lastName:    "Ramanathan",
		basicPay:    5000,
		pf:          200,
		totalLeaves: 30,
		leavesTaken: 5,
	}
	var s SalaryCalculator = e
	s.DisplaySalary()
	var l LeaveCalculator = e
	fmt.Println("\nLeaves left =", l.CalculateLeavesLeft())
}
```

上面的程序的第`7`行和第`11`行，分别声明两个接口`SalaryCalculator` 和 `LeaveCalculator`。

在第`15`行，声明了结构体 `Employee` ，在第`24`行实现了 `SalaryCalculator` 接口的 `DisplaySalary` 方法，在第`28`行实现了 `LeaveCalculator` 接口的 `CalculateLeavesLeft`方法。现在 `Employee` 同时实现了 `SalaryCalculator` 和 `LeaveCalculator` 两个接口。

在第`41`行我们将 `e` 赋值给 `SalaryCalculator` 类型的变量，在第`43`行我们将同样的变量 `e` 赋值给了 `LeaveCalculator` 类型的变量。这是合法的，因为 `e` 的类型是 `Employee` ，而 `Employee` 实现了 `SalaryCalculator` 和 `LeaveCalculator` 两个接口。

程序的输出为：

```java
Naveen Ramanathan has salary $5200  
Leaves left = 25 
```

## 接口的嵌套#

尽管go不支持继承，但可以通过嵌入其他接口来创建新接口。

让我们看看这是如何完成的。

```java
package main
import (
	"fmt"
)
type SalaryCalculator interface {
	DisplaySalary()
}
type LeaveCalculator interface {
	CalculateLeavesLeft() int
}
type EmployeeOperations interface {
	SalaryCalculator
	LeaveCalculator
}
type Employee struct {
	firstName   string
	lastName    string
	basicPay    int
	pf          int
	totalLeaves int
	leavesTaken int
}
func (e Employee) DisplaySalary() {
	fmt.Printf("%s %s has salary $%d", e.firstName, e.lastName, (e.basicPay + e.pf))
}
func (e Employee) CalculateLeavesLeft() int {
	return e.totalLeaves - e.leavesTaken
}
func main() {
	e := Employee{
		firstName:   "Naveen",
		lastName:    "Ramanathan",
		basicPay:    5000,
		pf:          200,
		totalLeaves: 30,
		leavesTaken: 5,
	}
	var empOp EmployeeOperations = e
	empOp.DisplaySalary()
	fmt.Println("\nLeaves left =", empOp.CalculateLeavesLeft())
}
```

上面程序的第`15`行中的`EmployeeOperations`接口是通过嵌入`SalaryCalculator`和`LeaveCalculator`接口创建的。

任何一个实现了 `SalaryCalculator` 和 `LeaveCalculator` 两个接口的方法的类型，也实现了 `EmployeeOperations` 接口。

`Employee` 结构体实现了 `EmployeeOperations` 接口，因为它在第`29`行和第`33`行分别定义了 `DisplaySalary` 和 `CalculateLeavesLeft` 的方法。

在第`46`行， `Employee` 类型的 `e` 被赋值给 `EmployeeOperations` 类型的 `empOp`。在下面两行，以 `empOp` 作为参数调用 `DisplaySalary()` 和 `CalculateLeavesLeft()`方法。

该程序将输出

```java
Naveen Ramanathan has salary $5200  
Leaves left = 25  
```

## 接口零值#

接口的零值是 `nil`。一个 `nil` 接口的底层类型和值都是 `nil`。

```java
package main
import "fmt"
type Describer interface {
	Describe()
}
func main() {
	var d1 Describer
	if d1 == nil {
		fmt.Printf("d1 is nil and has type %T value %v\n", d1, d1)
	}
}
```

上面的程序中，`d1` 是 `nil`，程序的输出为：

```java
d1 is nil and has type <nil> value <nil>  
```

如果我们尝试在`nil`接口上调用方法，程序会产生 `panic` 异常，因为`nil`接口既没有底层值也没有具体类型。

```java
package main
type Describer interface {
	Describe()
}
func main() {
	var d1 Describer
	d1.Describe()
}
```

上面的程序中，因为 `d1` 是 `nil`。程序将在运行时触发 `panic`：

```java
panic: runtime error: invalid memory address or nil pointer dereference 
[signal SIGSEGV: segmentation violation code=0xffffffff addr=0x0 pc=0xc8527]
```
