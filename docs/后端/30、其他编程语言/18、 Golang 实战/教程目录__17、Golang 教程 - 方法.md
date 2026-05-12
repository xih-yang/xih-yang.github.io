# 17、Golang 教程 - 方法
- 来源：https://ddkk.com/zhuanlan/other/golang/4/17.html
- 分类：其他语言
- 分组：教程目录
## 什么是方法#

方法是一个具有特殊的接收器类型的函数，在 `func` 关键字和函数名之间加入了一个特殊的接收器类型。该接收器可以是结构体类型或非结构体类型。接收器可以在方法内部访问。

以下是创建方法的语法。

```java
func (t Type) methodName(parameter list) {
}
```

上面的代码片段创建了一个名为`methodName`的方法，该方法接收器类型为`Type`。

## 方法示例#

让我们编写一个简单的程序，它会在结构体类型上创建一个方法并调用它。

```java
package main
import (
	"fmt"
)
type Employee struct {
	name     string
	salary   int
	currency string
}
/*
 displaySalary() method has Employee as the receiver type
*/
func (e Employee) displaySalary() {
	fmt.Printf("Salary of %s is %s%d", e.name, e.currency, e.salary)
}
func main() {
	emp1 := Employee{
		name:     "Sam Adolf",
		salary:   5000,
		currency: "$",
	}
	emp1.displaySalary() //Calling displaySalary() method of Employee type
}
```

上面程序中，我们已经在结构体类型 `Employee` 上创建了一个名为 `displaySalary` 的方法。在 `displaySalary()` 方法内部可以访问它的接收器，类型为 `Employee` 的 `e`。在第 `17` 行，我们使用接收器 `e`，并打印它的 `name`，`currency` 以及 `salary`。

在第`26`行，我们使用 `emp1.displaySalary()` 这样的语法来调用方法。

程序的输出为：`Salary of Sam Adolf is $5000`。

## 我们已经有函数了，为什么还要用方法呢？#

上面的程序已经被重写为只使用函数，没有方法。

```java
package main
import (
	"fmt"
)
type Employee struct {
	name     string
	salary   int
	currency string
}
/*
 displaySalary() method converted to function with Employee as parameter
*/
func displaySalary(e Employee) {
	fmt.Printf("Salary of %s is %s%d", e.name, e.currency, e.salary)
}
func main() {
	emp1 := Employee{
		name:     "Sam Adolf",
		salary:   5000,
		currency: "$",
	}
	displaySalary(emp1)
}
```

在上面的程序中，我们使用 `displaySalary` 函数替换了方法，并将 `Employee` 结构体作为参数传给它。该程序的输出与上面的程序输出一样：`Salary of Sam Adolf is $5000`。

那么为什么我们可以用函数完成同样的工作，却还要使用方法呢？这里有几个原因，让我们逐一看看它们。

- Go不是纯粹的面向对象编程语言，它不支持类。因此，通过在类型上建立方法来实现类似行为。
- go可以在不同类型上定义具有相同名称的方法，而不允许具有相同名称的函数。假设我们有Square和Circle两个结构体。在Square和Circle中定义一个相同名称Area方法。看下面的程序：

```java
package main
import (
	"fmt"
	"math"
)
type Rectangle struct {
	length int
	width  int
}
type Circle struct {
	radius float64
}
func (r Rectangle) Area() int {
	return r.length * r.width
}
func (c Circle) Area() float64 {
	return math.Pi * c.radius * c.radius
}
func main() {
	r := Rectangle{
		length: 10,
		width:  5,
	}
	fmt.Printf("Area of rectangle %d\n", r.Area())
	c := Circle{
		radius: 12,
	}
	fmt.Printf("Area of circle %f", c.Area())
}
```

这个程序打印：

```java
Area of rectangle 50  
Area of circle 452.389342  
```

接口正是应用方法的这点属性,我们将在下面的教程中讨论接口的细节。

## 指针接收器与值接收器#

到目前为止，我们已经看到只有值接收器的方法。可以使用指针接收器创建方法。值接收器和指针接收器之间的区别在于，使用指针接收器的方法内部进行的更改对于调用者是可见的，而在值接收器中则不是这种情况。让我们在程序的帮助下理解这一点。

```java
package main
import (
	"fmt"
)
type Employee struct {
	name string
	age  int
}
/*
Method with value receiver
*/
func (e Employee) changeName(newName string) {
	e.name = newName
}
/*
Method with pointer receiver
*/
func (e *Employee) changeAge(newAge int) {
	e.age = newAge
}
func main() {
	e := Employee{
		name: "Mark Andrew",
		age:  50,
	}
	fmt.Printf("Employee name before change: %s", e.name)
	e.changeName("Michael Andrew")
	fmt.Printf("\nEmployee name after change: %s", e.name)
	fmt.Printf("\n\nEmployee age before change: %d", e.age)
	(&e).changeAge(51)
	fmt.Printf("\nEmployee age after change: %d", e.age)
}
```

上面的程序中， `changeName` 方法有一个值接收器 `(e Employee)`，而 `changeAge` 方法有一个指针接收器 `(e *Employee)`。在 `changeName` 中改变 `Employee` 的字段 `name` 的值对调用者而言是不可见的，因此程序在调用 `e.changeName("Michael Andrew")` 方法之前和之后，打印的 `name` 是一致的。而由于 `changeAge` 是一个指针接收器 `(e *Employee)`，因此通过调用方法 `(&e).changeAge(51)` 来修改 `age` 对于调用者是可见的。 程序的输出如下：

```java
Employee name before change: Mark Andrew  
Employee name after change: Mark Andrew
Employee age before change: 50  
Employee age after change: 51  
```

在上面的程序第`36`行，我们用 `(&e).changeAge(51)` 来调用 `changeAge` 方法。因为 `changeAge` 有一个指针类型的接收器，我们必须使用 `(&e)` 来调用。但这不是必须的，Go允许我们省略 `&` 符号，可以只写为 `e.changeAge(51)`。Go 将 `e.changeAge(51)`解析为 `(&e).changeAge(51)`。

下面的程序使用 `e.changeAge(51)` 来替代 `(&e).changeAge(51)`。它与上面的程序的打印结果是一样的。

```java
package main
import (
	"fmt"
)
type Employee struct {
	name string
	age  int
}
/*
Method with value receiver
*/
func (e Employee) changeName(newName string) {
	e.name = newName
}
/*
Method with pointer receiver
*/
func (e *Employee) changeAge(newAge int) {
	e.age = newAge
}
func main() {
	e := Employee{
		name: "Mark Andrew",
		age:  50,
	}
	fmt.Printf("Employee name before change: %s", e.name)
	e.changeName("Michael Andrew")
	fmt.Printf("\nEmployee name after change: %s", e.name)
	fmt.Printf("\n\nEmployee age before change: %d", e.age)
	e.changeAge(51)
	fmt.Printf("\nEmployee age after change: %d", e.age)
}
```

## 何时使用指针接收器以及何时使用值接收器#

通常，当方法内对接收器所做的更改要对调用者可见时，可以使用指针接收器。

指针接收器也可用于复制数据结构代价比较大的地方。考虑一个包含许多字段的结构体。若使用值作为接收器将拷贝整个结构体，这样代价是很大的。在这种情况下，如果使用指针接收器，则不会复制结构体，而仅仅是指向结构体指针的拷贝。

在其他情况下，可以使用值接收器。

## 匿名字段的方法#

可以调用属于结构体的匿名字段的方法，就好像该匿名字段的方法属于包含该字段的结构体一样。

```java
package main
import (
	"fmt"
)
type address struct {
	city  string
	state string
}
func (a address) fullAddress() {
	fmt.Printf("Full address: %s, %s", a.city, a.state)
}
type person struct {
	firstName string
	lastName  string
	address
}
func main() {
	p := person{
		firstName: "Elon",
		lastName:  "Musk",
		address: address{
			city:  "Los Angeles",
			state: "California",
		},
	}
	p.fullAddress() //accessing fullAddress method of address struct
}
```

在上面的程序第`32`行，我们通过 `p.fullAddress()` 调用了 `address` 的方法 `fullAddress()`。像 `p.address.fullAddress()` 这样的直接调用是不必要的。程序输出为：

```java
Full address: Los Angeles, California  
```

## 在方法中使用值接收器 与 在函数中使用值参数#

这是很多新手遇到的问题。我会尽可能把它说明白。

当一个函数有一个值参数时，它只接受一个值参数。

当一个方法有一个值接收器时，它可以接受值和指针接收器。

让我们通过一个例子来理解这一点。

```java
package main
import (
	"fmt"
)
type rectangle struct {
	length int
	width  int
}
func area(r rectangle) {
	fmt.Printf("Area Function result: %d\n", (r.length * r.width))
}
func (r rectangle) area() {
	fmt.Printf("Area Method result: %d\n", (r.length * r.width))
}
func main() {
	r := rectangle{
		length: 10,
		width:  5,
	}
	area(r)
	r.area()
	p := &r
	/*
	   compilation error, cannot use p (type *rectangle) as type rectangle
	   in argument to area
	*/
	//area(p)
	p.area() //calling value receiver with a pointer
}
```

第`12`行，函数 `func area(r rectangle)` 接受一个值参数，而方法 `func (r rectangle) area()` 接受一个值接收器。

在第`25`行，我们传递了一个值来调用 `area` 函数 `area(r)`，它将被执行。同样地，我们通过值接收器调用 `area` 方法 `r.area()` 它也可以执行。

在第`28`行，我们创建了一个指向 `r` 的指针 `p`。如果我们尝试将这个指针传递给只接受值的 `area` 函数那么编译器将报错，如果将`33`行的注释去掉,运行将报错：`compilation error, cannot use p (type *rectangle) as type rectangle in argument to area.`。这是我们预期的。

现在来到了微妙的部分，第`35`行 `p.area()` 使用指针接收器 `p` 调用了接受一个值接收器的方法 `area` 。这是完全合法的。原因是对于 `p.area()`，Go 将其解析为 `(&p).area()`，因为 `area` 方法必须接受一个值接收器。为了方便Go语言把 `p.area()` 解释为 `(*p).area()`。

程序的输出为：

```java
Area Function result: 50  
Area Method result: 50  
Area Method result: 50 
```

## 在方法中使用指针接收器 与 在函数中使用指针参数#

与值参数相似，一个接受指针参数的函数只能接受指针，而一个指针接收器的方法既可以接受值接收器 也可以接受指针接收器。

```java
package main
import (
	"fmt"
)
type rectangle struct {
	length int
	width  int
}
func perimeter(r *rectangle) {
	fmt.Println("perimeter function output:", 2*(r.length+r.width))
}
func (r *rectangle) perimeter() {
	fmt.Println("perimeter method output:", 2*(r.length+r.width))
}
func main() {
	r := rectangle{
		length: 10,
		width:  5,
	}
	p := &r //pointer to r
	perimeter(p)
	p.perimeter()
	/*
	   cannot use r (type rectangle) as type *rectangle in argument to perimeter
	*/
	//perimeter(r)
	r.perimeter() //calling pointer receiver with a value
}
```

在上面的程序中，第`12`行定义了一个函数 `perimeter`，该函数接受一个指针作为参数，而`17`行定义了一种具有指针接收器的方法。

`27`行我们通过指针参数调用 `perimeter` 函数，在第`28`行我们通过一个指针接收器调用 `perimeter` 方法。一切都很好。

在被注释掉的第`33`行，我们试图通以一个值 `r` 调用 `perimeter` 函数。这是非法的，因为一个接受指针为参数的函数不能接受一个值作为参数。如果去掉注释运行程序，则编译将报错：`main.go:33: cannot use r (type rectangle) as type *rectangle in argument to perimeter.`。

在第`35`行我们通过一个值接收器`r` 调用接受一个指针接收器的 `perimeter` 方法。这是合法的，为了方便，`r.perimeter()` 这一行将被 Go 解析为 `(&r).perimeter()`。程序的输出为：

```java
perimeter function output: 30  
perimeter method output: 30  
perimeter method output: 30  
```

## 非结构体类型的方法#

到目前为止，我们只在结构体类型上定义了方法。也可以在非结构类型上定义方法，但是要注意一点。要在类型上定义方法，方法的接收器类型的定义和方法的定义应该在同一个包中。到目前为止，我们定义在结构体上的所有方法都位于同一个`main`包中，因此它们起作用。

```java
package main
func (a int) add(b int) {
}
func main() {
}
```

在上面的程序第`3`行我们试图添加一个方法 `add` 给内置类型 `int`。这是不允许的，因为定义方法 `add` 所在的包和定义类型 `int` 的包不是同一个包。这个程序将会报编译错误：`cannot define new methods on non-local type int`。

实现此功能的方法是为内置类型`int`创建类型别名，然后使用此类型别名作为接收器创建一个方法。

```java
package main
import "fmt"
type myInt int
func (a myInt) add(b myInt) myInt {
	return a + b
}
func main() {
	num1 := myInt(5)
	num2 := myInt(10)
	sum := num1.add(num2)
	fmt.Println("Sum is", sum)
}
```

上面的程序中第`5`行，我们为 `int` 创建了一个类型别名 `myInt`。在第`7`行，我们定义了一个方法 `add`，以 `myInt` 作为接收器。

程序的输出为： `Sum is 15`。
