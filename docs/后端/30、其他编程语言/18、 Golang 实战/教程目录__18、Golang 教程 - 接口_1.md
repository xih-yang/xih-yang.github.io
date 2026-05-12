# 18、Golang 教程 - 接口_1
- 来源：https://ddkk.com/zhuanlan/other/golang/4/18.html
- 分类：其他语言
- 分组：教程目录
## 什么是接口#

在面向对象语言中，接口一般被定义为 ：接口定义了对象的一系列行为。接口仅仅指定了一个对象应该做什么。具体怎么做（实现细节）是由对象决定的。

在Go 中，接口是一组方法签名。当一个类型定义了所有接口里的方法时，就说这个类型实现了这个接口。这和 面向对象`OOP` 很像。接口指定了一个类型应该具有什么方法，而该类型决定怎么实现这些方法。

例如`WashingMachine`是一个包含两个方法 `Cleaning()` 和 `Drying()`的接口。任何提供了 `Cleaning()` 和 `Drying()` 方法定义的类型就可以说它实现了 `WashingMachine` 接口。

## 接口的声明与实现#

让我们通过一个程序看一下如何声明和实现一个接口.

```java
package main
import (
	"fmt"
)
//interface definition
type VowelsFinder interface {
	FindVowels() []rune
}
type MyString string
//MyString implements VowelsFinder
func (ms MyString) FindVowels() []rune {
	var vowels []rune
	for _, rune := range ms {
		if rune == 'a' || rune == 'e' || rune == 'i' || rune == 'o' || rune == 'u' {
			vowels = append(vowels, rune)
		}
	}
	return vowels
}
func main() {
	name := MyString("Sam Anderson")
	var v VowelsFinder
	v = name // possible since MyString implements VowelsFinder
	fmt.Printf("Vowels are %c", v.FindVowels())
}
```

程序的第`8`行创建了一个名为 `VowelsFinder` 接口类型，它有一个方法 `FindVowels() []rune`。

在下一行 `MyString` 类型被创建。

在第`15`行我们添加了一个方法 `FindVowels() []rune` 到接受器类型 `MyString`。现在可以说 `MyString` 实现了 `VowelsFinder` 接口。这与`Java`等其他语言完全不同，`java`中一个类必须用 `implements` 关键字显式的标明实现了一个接口。这在Go中是不需要的，这是隐式实现的，在Go中，如果一个类型包含了一个接口声明的所有方法，那么这个类型就隐式地实现了这个接口。

在第`28`行，我们将 `MyString` 类型的变量 `name` 赋值给 `VowelsFinder` 类型的变量 `v`。这是合法的，因为 `MyString` 实现了 `VowelsFinder`。在下一行，`v.FindVowels()`在 `MyString` 类型上调用 `FindVowels` 方法打印在 `Sam Anderson` 中所有的元音。程序的输出为：`Vowels are [a e o]`。

恭喜！你已经创建并实现了你的第一个接口。

## 接口的实际用途#

上面的程序告诉我们怎么创建和实现接口，但是没有展示接口的实际用途。在上面的程序中，我们可以使用 `name.FindVowels()`替代 `v.FindVowels()`，程序照样可以工作，并且不需要声明接口,那么为什么我们还需要接口呢？

现在让我们来看接口的实际用途。

我们将编写一个简单的程序，根据员工的个人工资计算公司的总支出。为简洁起见，我们假设所有费用均以美元计算。

```java
package main
import (
	"fmt"
)
type SalaryCalculator interface {
	CalculateSalary() int
}
type Permanent struct {
	empId    int
	basicpay int
	pf       int
}
type Contract struct {
	empId    int
	basicpay int
}
//salary of permanent employee is sum of basic pay and pf
func (p Permanent) CalculateSalary() int {
	return p.basicpay + p.pf
}
//salary of contract employee is the basic pay alone
func (c Contract) CalculateSalary() int {
	return c.basicpay
}
/*
total expense is calculated by iterating though the SalaryCalculator slice and summing
the salaries of the individual employees
*/
func totalExpense(s []SalaryCalculator) {
	expense := 0
	for _, v := range s {
		expense = expense + v.CalculateSalary()
	}
	fmt.Printf("Total Expense Per Month $%d", expense)
}
func main() {
	pemp1 := Permanent{
     1, 5000, 20}
	pemp2 := Permanent{
     2, 6000, 30}
	cemp1 := Contract{
     3, 3000}
	employees := []SalaryCalculator{
     pemp1, pemp2, cemp1}
	totalExpense(employees)
}
```

上面程序的第`7`行，定义了一个名为 `SalaryCalculator` 接口类型，该接口只声明了一个方法：`CalculateSalary() int`。

我们公司有两种类型的员工：`Permanent` 和 `Contract` ，分别为第 `11` 和 `17` 行定义的结构体。永久性员工的工资是 `basicpay` 和 `pf` 的总和，而对于合同制员工的工资只是基本工资 `basicpay`。这分别在第`23`行和第`28`行的方法 `CalculateSalary` 中表示。通过声明这个方法，`Permanent`和 `Contract` 都实现了 `SalaryCalculator` 接口。

第`36`行声明的 `totalExpense` 函数展示了使用接口的美妙之处。这个函数接收一个 `SalaryCalculator` 接口的切片 `[]SalaryCalculator` 作为参数。在第`49`行，我们将一个包含了 `Permanent` 和 `Contract` 类型的切片给函数 `totalExpense`。`totalExpense` 函数通过调用各自类型的 `CalculateSalary` 方法来计算总支出。这是在第 `39`行完成的。

这样做的最大优点是`totalExpense`可以扩展到任何新员工类型而无需更改任何代码。假设公司增加了一种新的员工类型 `Freelancer`和不同的计算工资的方法。 `Freelancer` 可以被包含在传递给 `totalExpense` 的切片参数中，而不需要修改 `totalExpense` 的代码。这个方法将完成它应该做的事情，因为 `Freelancer` 也实现了 `SalaryCalculator` 接口。

程序的输出为：`Total Expense Per Month $14050`。

## 接口的内部表示#

可以认为接口内部是这样一个元组 `(type, value)`。`type` 是接口包含的具体类型，`value` 是接具体类型的值。

让我们写一个程序来更好地理解。

```java
package main
import (
	"fmt"
)
type Test interface {
	Tester()
}
type MyFloat float64
func (m MyFloat) Tester() {
	fmt.Println(m)
}
func describe(t Test) {
	fmt.Printf("Interface type %T value %v\n", t, t)
}
func main() {
	var t Test
	f := MyFloat(89.7)
	t = f
	describe(t)
	t.Tester()
}
```

`Test` 接口提供了一个方法 `Tester()`，`MyFloat` 类型实现了这个接口。在第 `24` 行，我们将 `MyFloat` 类型的变量 `f` 赋值给 `Test` 类型的变量 `t` 。现在 `t` 的具体类型是 `MyFloat` 而它的值是 `89.7`。在第`17`行， `describe` 函数打印接口的值和具体类型。程序的输出为：

```java
Interface type main.MyFloat value 89.7  
89.7  
```

## 空接口#

没有任何方法的接口称为空接口。它表示为`interface{}`。由于空接口没有任何方法，因此所有的类型都实现了空接口。

```java
package main
import (
	"fmt"
)
func describe(i interface{
     }) {
	fmt.Printf("Type = %T, value = %v\n", i, i)
}
func main() {
	s := "Hello World"
	describe(s)
	i := 55
	describe(i)
	strt := struct {
		name string
	}{
		name: "Naveen R",
	}
	describe(strt)
}
```

在上面的程序第`7`行中，该`describe(i interface{})`函数将空接口作为参数，因此可以传递任何类型。

我们分别为`13`行,`15`行和`21`行将`string`，`int`和`struct`传递给`describe`函数。

该程序打印：

```java
Type = string, value = Hello World  
Type = int, value = 55  
Type = struct {
      name string }, value = {
     Naveen R}  
```

## 类型断言#

`类型断言`（`type assertion`）用来提取接口的实际类型的值。

`i.(T)`是用来获取接口 `i` 的实际类型 `T` 的值的语法。

一个程序胜过千言万语。让我们写一个类型断言。

```java
package main
import (
	"fmt"
)
func assert(i interface{
     }) {
	s := i.(int) //get the underlying int value from i
	fmt.Println(s)
}
func main() {
	var s interface{
     } = 56
	assert(s)
}
```

上面程序第`12`行，`s` 的实际类型是 `int`。在第`8` 行我们使用 `i.(int)` 来获取 `i` 的 `int` 值。程序的输出为：`56`。

如果实际类型不是 `int`，那么上面的程序会发生什么？让我们来试一下：

```java
package main
import (
	"fmt"
)
func assert(i interface{
     }) {
	s := i.(int)
	fmt.Println(s)
}
func main() {
	var s interface{
     } = "Steven Paul"
	assert(s)
}
```

在上面的程序中，我们将实际类型为 `string` 的变量 `s` 传递给 `assert` 函数，`assert` 函数尝试从其中提取出一个 `int` 值。该程序会报错： `panic: interface conversion: interface {} is string, not int`。

要解决上述问题，我们可以使用以下语法

`v,ok := i.(T)`

如果`i` 的具体类型是 `T`，则 `v` 将具有 `i` 的实际值，`ok` 为 `true`。

如果`i` 的具体类型不是 `T`，则 `ok` 将为 `false`， `v` 将具有 `T` 的`零值`，程序不会报错。

```java
package main
import (
	"fmt"
)
func assert(i interface{
     }) {
	v, ok := i.(int)
	fmt.Println(v, ok)
}
func main() {
	var s interface{
     } = 56
	assert(s)
	var i interface{
     } = "Steven Paul"
	assert(i)
}
```

将`Steven Paul` 传递给 `assert` 函数，`ok` 将是 `false` 因为 `i` 的实际类型不是 `int` 并且 `v` 的值将是`int` 的`零值`,也就是`0`。程序将输出：

```java
56 true  
0 false
```

## Type Switch#

`Type Switch`用来将一个接口的具体类型与多个 `case` 语句指定的类型进行比较。这和一般的 `switch` 语句很像。唯一不同的是 `type switch` 中 `case` 指定的是类型，而一般的 `switch` 语句中 `case` 指定的是值。

`type switch` 的语法与类型断言很相似。在类型断言 `i.(T)`中，将类型 `T` 替换为关键字 `type` 就变成了 `type switch`。让我们看看下面的程序如何工作。

```java
package main
import (
	"fmt"
)
func findType(i interface{
     }) {
	switch i.(type) {
	case string:
		fmt.Printf("I am a string and my value is %s\n", i.(string))
	case int:
		fmt.Printf("I am an int and my value is %d\n", i.(int))
	default:
		fmt.Printf("Unknown type\n")
	}
}
func main() {
	findType("Naveen")
	findType(77)
	findType(89.98)
}
```

上面程序第`8`行，`switch i.(type)` 是一个 `type switch`。每个`case`语句都将具体类型与`i`特定类型进行比较。如果一个 `case` 匹配，则打印相应的语句。程序的输出为：

```java
I am a string and my value is Naveen  
I am an int and my value is 77  
Unknown type  
```

在第`20`行，`89.98` 是 `flaot64` 类型，并不匹配任何一个 `case`。因此在会后一行打印：`Unknown type`。

还可以将类型与接口进行比较。如果我们有一个类型，并且该类型实现了一个接口，则可以将此类型与它实现的接口进行比较。

让我们写一个程序，以便更清晰。

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
	fmt.Printf("%s is %d years old", p.name, p.age)
}
func findType(i interface{
     }) {
	switch v := i.(type) {
	case Describer:
		v.Describe()
	default:
		fmt.Printf("unknown type\n")
	}
}
func main() {
	findType("Naveen")
	p := Person{
		name: "Naveen R",
		age:  25,
	}
	findType(p)
}
```

在上面的程序中，`Person` 结构体实现了 `Describer` 接口。在第 `19` 行的 `case` 语句，`v` 和 `Describe` 接口进行比较。由于 `p` 实现了 `Describer` 接口因此这个 `case` 匹配成功，在第`32`行 `findType(p)` 中 `Person` 的 `Describe()` 方法被调用。

该程序的输出为：

```java
unknown type  
Naveen R is 25 years old  
```
