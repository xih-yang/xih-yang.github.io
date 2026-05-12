# 16、Golang 教程 - 结构体
- 来源：https://ddkk.com/zhuanlan/other/golang/4/16.html
- 分类：其他语言
- 分组：教程目录
## 什么是结构体？#

结构体是用户定义的类型，表示若干个字段的集合。有时候应该将多个数据分组到一个整体中，而不是将每个数据作为单独的类型进行维护。这种情况下可以使用结构体。

例如，一个员工有 `firstName`、`lastName` 和 `age` 三个属性，而把这些属性组合在一个结构体 `employee` 中就很合理。

## 结构体的声明#

```java
type Employee struct {
    firstName string
    lastName  string
    age       int
}
```

上面的代码片段声明了一个名为 `Employee` 的结构体类型，它拥有 `firstName`, `lastName` 和 `age` 三个字段。属于同一类型的多个字段可以写到一行，后面是类型名称。在上面的结构体中 `firstName` 与 `lastName` 都是 `string` 类型，因此可以将它们写在一起。

```java
type Employee struct {
    firstName, lastName string
    age, salary         int
}
```

上面的结构体 `Employee` 称为 `命名的结构体`（`Named Structure`）。因为创建了名为 `Employee` 的新类型，而它可以用于创建 `Employee` 类型的结构体变量。

我们也可以定义一个没有类型名称的结构体，这种结构体叫做`匿名结构体`（`Anonymous Structures`）。

```java
var employee struct {
        firstName, lastName string
        age int
}
```

上面的代码片段创建了一个匿名结构体 `employee`。

## 创建命名结构体#

让我们使用一个简单的程序定义一个命名结构体 `Employee`。

```java
package main
import (
	"fmt"
)
type Employee struct {
	firstName, lastName string
	age, salary         int
}
func main() {
	//creating structure using field names
	emp1 := Employee{
		firstName: "Sam",
		age:       25,
		salary:    500,
		lastName:  "Anderson",
	}
	//creating structure without using field names
	emp2 := Employee{
     "Thomas", "Paul", 29, 800}
	fmt.Println("Employee 1", emp1)
	fmt.Println("Employee 2", emp2)
}
```

在上面程序的第`7`行中，我们创建了一个命名结构体`Employee`。在上述程序的第`15`行中，`emp1`通过指定每个字段名称的值来定义结构体。字段名称的顺序不必与声明结构类型时的顺序相同。在这里，我们改变了位置`lastName`并将其移至最后。这没有任何问题。

在上述程序的第`23`行中，`emp2`通过省略字段名称来定义。在这种情况下，必须保持字段的顺序与结构体中声明的顺序相同。

上面的程序输出：

```java
Employee 1 {
     Sam Anderson 25 500}
Employee 2 {
     Thomas Paul 29 800}
```

## 创建匿名结构体#

```java
package main
import (
	"fmt"
)
func main() {
	emp3 := struct {
		firstName, lastName string
		age, salary         int
	}{
		firstName: "Andreah",
		lastName:  "Nikola",
		age:       31,
		salary:    5000,
	}
	fmt.Println("Employee 3", emp3)
}
```

在上述程序的第`8`行中，定义了一个匿名结构体变量 `emp3`。正如我们已经提到的，这个结构被称为匿名结构体，因为它只创建一个新的`struct`变量`emp3`，并且不定义任何新的`struct`类型。

该程序输出：

```java
Employee 3 {
     Andreah Nikola 31 5000}  
```

## 结构体的零值#

定义好结构体，但是并没有显式初始化时，默认情况下会为结构体的字段分配其类型的零值。

```java
package main
import (
	"fmt"
)
type Employee struct {
	firstName, lastName string
	age, salary         int
}
func main() {
	var emp4 Employee //zero valued structure
	fmt.Println("Employee 4", emp4)
}
```

上面的程序定义了 `emp4` 但是没有初始化。因此 `firstName` 和 `lastName` 被赋值为 `string` 类型的`零值`，也就是空字符串`""`。`age`和 `salary` 被赋值为 `int` 类型的`零值`，也就是 `0` 。程序的输出为：

```java
Employee 4 {
       0 0}  
```

也可以为某些字段指定值并忽略其余字段。在这种情况下，忽略的字段名称被赋予其类型的`零值`。

```java
package main
import (
	"fmt"
)
type Employee struct {
	firstName, lastName string
	age, salary         int
}
func main() {
	emp5 := Employee{
		firstName: "John",
		lastName:  "Paul",
	}
	fmt.Println("Employee 5", emp5)
}
```

在上面的程序第`14`和`15`行，`firstName` 和 `lastName` 被初始化，而 `age` 和 `salary` 没有。因此 `age` 和 `salary` 被指定为`int`的`零值`。程序的输出为：

```java
Employee 5 {
     John Paul 0 0} 
```

## 访问结构体中的字段#

使用点`.`操作符来访问结构体中的字段。

```java
package main
import (
	"fmt"
)
type Employee struct {
	firstName, lastName string
	age, salary         int
}
func main() {
	emp6 := Employee{
     "Sam", "Anderson", 55, 6000}
	fmt.Println("First Name:", emp6.firstName)
	fmt.Println("Last Name:", emp6.lastName)
	fmt.Println("Age:", emp6.age)
	fmt.Printf("Salary: $%d", emp6.salary)
}
```

在上面的程序中，通过 `emp6.firstName` 访问 `emp6` 中的字段 `firstName`。程序的输出为：

```java
First Name: Sam  
Last Name: Anderson  
Age: 55  
Salary: $6000  
```

也可以创建一个零值结构体变量，稍后为其字段分配值。

```java
package main
import (
	"fmt"
)
type Employee struct {
	firstName, lastName string
	age, salary         int
}
func main() {
	var emp7 Employee
	emp7.firstName = "Jack"
	emp7.lastName = "Adams"
	fmt.Println("Employee 7:", emp7)
}
```

上面的程序 `emp7` 先被定义，然后给 `firstName` 和 `lastName` 赋值。程序的输出为：

```java
Employee 7: {
     Jack Adams 0 0}  
```

## 结构体指针#

也可以创建指向结构的指针。

```java
package main
import (
	"fmt"
)
type Employee struct {
	firstName, lastName string
	age, salary         int
}
func main() {
	emp8 := &Employee{
     "Sam", "Anderson", 55, 6000}
	fmt.Println("First Name:", (*emp8).firstName)
	fmt.Println("Age:", (*emp8).age)
}
```

在上面的程序中 `emp8` 是一个指向结构体 `Employee` 的指针。`(*emp8).firstName` 是访问 `emp8` 中 `firstName` 字段的语法。程序的输出为：

```java
First Name: Sam
Age: 55
```

在Go 中我们可以使用 `emp8.firstName` 来访问 `firstName` 字段。而不用显示解引用 `(*emp8).firstName`。

```java
package main
import (
	"fmt"
)
type Employee struct {
	firstName, lastName string
	age, salary         int
}
func main() {
	emp8 := &Employee{
     "Sam", "Anderson", 55, 6000}
	fmt.Println("First Name:", emp8.firstName)
	fmt.Println("Age:", emp8.age)
}
```

我们习惯使用`emp8.firstName`访问`firstName`字段，此程序也输出：

```java
First Name: Sam
Age: 55
```

## 匿名字段#

定义结构体类型时可以仅指定字段类型而不指定字段名字。这种字段叫做`匿名字段`（`anonymous field`）。

下面的程序片段创建了一个 `Person` 结构体，它有两个匿名字段 `string` 和 `int` 。

```java
type Person struct {
    string
    int
}
```

让我们使用匿名字段编写程序。

```java
package main
import (
	"fmt"
)
type Person struct {
	string
	int
}
func main() {
	p := Person{
     "Naveen", 50}
	fmt.Println(p)
}
```

在上面的程序中，`Person`是一个带有两个匿名字段的结构体。`p := Person{"Naveen", 50}`定义一个`Person`类型的变量。该程序输出：`{Naveen 50}`。

虽然匿名字段没有名字，但是匿名字段的默认名字为其类型的名称。例如在上面的 `Person` 类型，尽管它的字段是匿名的，但是默认它们拥有它们的类型的名字。因此 `Person` 结构体有两个字段，名为 `string` 和 `int` 的字段。

```java
package main
import (
	"fmt"
)
type Person struct {
	string
	int
}
func main() {
	var p1 Person
	p1.string = "naveen"
	p1.int = 50
	fmt.Println(p1)
}
```

在上面的程序第`14`和`15`行，我们通过使用匿名字段的类型名`("string" 和 "int")`来访问 `Person` 结构体的字段。程序的输出为：

```java
{
     naveen 50}
```

## 结构体嵌套#

结构体的字段也可以是一个结构体。这种结构体称为嵌套结构体。

```java
package main
import (
	"fmt"
)
type Address struct {
	city, state string
}
type Person struct {
	name    string
	age     int
	address Address
}
func main() {
	var p Person
	p.name = "Naveen"
	p.age = 50
	p.address = Address{
		city:  "Chicago",
		state: "Illinois",
	}
	fmt.Println("Name:", p.name)
	fmt.Println("Age:", p.age)
	fmt.Println("City:", p.address.city)
	fmt.Println("State:", p.address.state)
}
```

上面的程序中，`Person` 结构体有一个字段 `address`，而 `address` 同样也是一个结构体。程序的输出为：

```java
Name: Naveen  
Age: 50  
City: Chicago  
State: Illinois 
```

## 提升字段#

如果结构体中的匿名字段也是一个结构体，那么这个匿名结构体字段称为`提升字段`（`Promoted fields`），因为可以从外部结构体变量直接访问匿名结构体类型中的字段，就像这些字段原本属于外部结构体一样。我知道这个定义可能很难理解，所以让我们直接进入一些代码来理解这个：

```java
type Address struct {
    city, state string
}
type Person struct {
    name string
    age  int
    Address
}
```

上面的程序片段中，`Person` 结构体有一个匿名字段 `Address`，这个匿名字段也是一个结构体。现在 `Address` 中的字段 `city` 和 `state` 被称为提升字段，因为它们就好像被直接声明在 `Person` 结构体里一样。

```java
package main
import (
	"fmt"
)
type Address struct {
	city, state string
}
type Person struct {
	name string
	age  int
	Address
}
func main() {
	var p Person
	p.name = "Naveen"
	p.age = 50
	p.Address = Address{
		city:  "Chicago",
		state: "Illinois",
	}
	fmt.Println("Name:", p.name)
	fmt.Println("Age:", p.age)
	fmt.Println("City:", p.city)   //city is promoted field
	fmt.Println("State:", p.state) //state is promoted field
}
```

上面的程序第 `26` 和 `27` 行，提升字段 `city` 和 `state` 就像声明在结构体变量 `p` 中一样，通过 `p.city` 和 `p.state` 的方式被访问。程序的输出如下：

```java
Name: Naveen  
Age: 50  
City: Chicago  
State: Illinois  
```

## 导出结构体和字段#

如果结构体类型以大写字母开头，那么它是导出类型，可以从其他包访问它。类似地，如果结构体的字段以大写字母开头，则可以从其他包中访问它们。

让我们编写一个包含自定义包的程序，以便更好地理解这一点。

在go工作区`src`目录中创建一个名为`structs`的文件夹。在`structs`目录中创建另一个目录`computer`。

在`computer`目录中，创建一个`spec.go`名称的文件，内容如下：

```java
package computer
type Spec struct {
      //exported struct
	Maker string //exported field
	model string //unexported field
	Price int    //exported field
}
```

上面的程序创建了一个包 `computer`，其中包含一个导出类型的结构体 `Spec`，以及它的两个字段 `Maker` 和 `Price`，它还有一个未导出字段 `model`。让我们从`main`包导入这个包并使用 `Spec` 结构体。

在`structs`目录中创建一个名为`main.go`的文件，并在里面编写以下程序：

```java
package main
import "structs/computer"
import "fmt"
func main() {
	var spec computer.Spec
	spec.Maker = "apple"
	spec.Price = 50000
	fmt.Println("Spec:", spec)
}
```

包结构应如下所示:

```java
src  
   structs
          computer
                  spec.go
          main.go
```

在上面程序的第`3`行中，我们导入了`computer`包。在第`8`行和第`9`行，我们访问了结构体`Spec`的两个导出字段`Maker`和`Price`。可以通过执行命令 `go install structs` 和 `workspacepath/bin/structs`，运行该程序，该程序输出：

```java
Spec: {
     apple  50000}
```

如果我们尝试访问未导出的字段`model`，编译器会报错。

```java
package main
import "structs/computer"
import "fmt"
func main() {
	var spec computer.Spec
	spec.Maker = "apple"
	spec.Price = 50000
	spec.model = "Mac Mini"
	fmt.Println("Spec:", spec)
}
```

在上述程序的第`10`行中，我们尝试访问未导出的字段`model`。运行此程序将导致编译错误：

```java
spec.model undefined (cannot refer to unexported field or method model)
```

## 结构体比较#

结构体是值类型，并且如果它们的每个字段都是可比较的，则该结构体是可比较的。如果两个结构体变量的相应字段相等，则认为它们相等。

```java
package main
import (
	"fmt"
)
type name struct {
	firstName string
	lastName  string
}
func main() {
	name1 := name{
     "Steve", "Jobs"}
	name2 := name{
     "Steve", "Jobs"}
	if name1 == name2 {
		fmt.Println("name1 and name2 are equal")
	} else {
		fmt.Println("name1 and name2 are not equal")
	}
	name3 := name{
     firstName: "Steve", lastName: "Jobs"}
	name4 := name{
     }
	name4.firstName = "Steve"
	if name3 == name4 {
		fmt.Println("name3 and name4 are equal")
	} else {
		fmt.Println("name3 and name4 are not equal")
	}
}
```

在上面的程序中，`name` 结构体类型包含两个 `string` 字段。因为 `string` 是可比较的，因此两个 `name` 类型的变量也是可以比较的。

在上面的程序中，`name1` 和 `name2` 是相等的，而 `name3` 和 `name4` 是不相等的。程序的输出如下：

```java
name1 and name2 are equal  
name3 and name4 are not equal 
```

如果结构体包含不可比较的类型的字段，那么这两个结构体是不可比较的。

```java
package main
import (
	"fmt"
)
type image struct {
	data map[int]int
}
func main() {
	image1 := image{
     data: map[int]int{
		0: 155,
	}}
	image2 := image{
     data: map[int]int{
		0: 155,
	}}
	if image1 == image2 {
		fmt.Println("image1 and image2 are equal")
	}
}
```

在上面的程序中，`image` 结构体类型包含了一个字段 `data`，其类型是 `map` 。`map` 是不可比较的类型，因此 `image1` 和 `image2`是不可比较的。如果你运行这个程序，将报错：

```java
main.go:18: invalid operation: image1 == image2 (struct containing map[int]int cannot be compared).。
```
