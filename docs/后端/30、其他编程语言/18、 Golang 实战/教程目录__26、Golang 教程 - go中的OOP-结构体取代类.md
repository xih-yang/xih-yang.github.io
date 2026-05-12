# 26、Golang 教程 - go中的OOP-结构体取代类
- 来源：https://ddkk.com/zhuanlan/other/golang/4/26.html
- 分类：其他语言
- 分组：教程目录
Go不是纯粹的面向对象编程语言。下面摘自Go的[FAQs](https://golang.org/doc/faq#Is_Go_an_object-oriented_language) 解答了Go是否是面向对象的问题。

翻译：可以说是，也可以说不是。虽然GO具有类型和方法，并且允许面向对象的编程风格，但是没有类型层次结构。Go中的”接口”概念提供了一种不同的特性，我们认为这种特性很容易使用，而且在某些方面更通用。在go中也可以使用类型嵌套，来实现类似于子类化功能-但又不完全相同。此外，Go中的方法比C++或Java中的方法更通用：可以为任何类型的数据定义这些方法，甚至是内置类型，比如普通的“未装箱”整数。它们不限于结构体(类)。

在下面的教程中，我们将讨论如何使用Go实现`面向对象`的编程概念。与其他面向对象的语言（如Java）相比，它们在一些实现上有很大不同。

## 结构代替类#

Go不支持类，但它提供了`结构体`。可以在结构体中添加方法。这提供了将数据和方法捆绑在一起的行为，类似于类。

让我们用一个例子来更好的理解。

在示例中，我们将创建一个自定义包，它有助于我们更好地理解结构体是如何有效地取代类的。

在Go工作区内创建一个名为`oop`文件夹。在`oop`的文件夹中创建一个名为`employee`的子文件夹。在`employee`文件夹中，创建一个名为`employee.go`的文件。

文件夹结构如下：

```java
       workspacepath -> oop -> employee -> employee.go
```

在`employee.go`文件夹中添加如下代码。

```java
package employee
import (  
    "fmt"
)
type Employee struct {
    FirstName   string
    LastName    string
    TotalLeaves int
    LeavesTaken int
}
func (e Employee) LeavesRemaining() {
    fmt.Printf("%s %s has %d leaves remaining", e.FirstName, e.LastName, (e.TotalLeaves - e.LeavesTaken))
}
```

在上面的例子中，第一行指明了这个文件属于`employee`包。然后定义了一个结构体`Employee`，结构体中有一个方法`LeaveRemaining` 该方法会计算和显示员工的剩余休假数。现在我们有了一个结构体和方法，类似一个类一样。

在`oop`文件夹中创建一个名为`main.go`的文件。

现在文件夹结构如下：

```java
workspacepath -> oop -> employee -> employee.go  
workspacepath -> oop -> main.go  
```

`main.go`文件内容如下：

```java
package main
import "oop/employee"
func main() {
	e := employee.Employee{
		FirstName:   "Sam",
		LastName:    "Adolf",
		TotalLeaves: 30,
		LeavesTaken: 20,
	}
	e.LeavesRemaining()
}
```

我们在第 `3` 行引用了 `employee` 包。在 `main()`（`第 12 行`），我们调用了 `Employee` 的 `LeavesRemaining()` 方法。

程序运行,输出如下：

```java
Sam Adolf has 10 leaves remaining
```

## New()函数代替构造函数#

上述程序看起来是正确的，但是有一点小问题。我们来看看，如果定义一个`零值`变量结构体会发生什么。修改`main.go`代码如下：

```java
package main
import "oop/employee"
func main() {
	var e employee.Employee
	e.LeavesRemaining()
}
```

我们所做的唯一改变是在第`6`行创建一个零值`Employee`。该程序将输出:

```java
has 0 leaves remaining
```

如您所见，使用零值创建的变量`Employee`没什么用。它没有有效的名字，姓氏，也没有有效的休假详情。

在像Java这样的其他OOP语言中，这个问题可以通过使用构造函数来解决。可以使用参数化构造函数创建有效对象。

Go没有提供构造函数。如果一个类型的零值是不合法的，应该将该类型设置为不导出，防止在其他包中导出该类型，并且需要提供一个函数`NewT(parameters)`去初始化带参数的`T`类型的的变量。Go中的一个约定是，应该把创建 `T` 类型变量的函数命名为 `NewT(parameters)`。这就类似于构造器了。如果一个包只含有一种类型，按照 Go 的约定，应该把函数命名为 `New(parameters)`， 而不是 `NewT(parameters)`。

我们来修改程序，保证新建的每一个`employee`变量都是合法有用的。

首先应该让 `Employee` 结构体不可导出，然后创建一个 `New` 函数，用于创建 `Employee` 结构体变量。修改后的 `employee.go` 代码如下：

```java
package employee
import (  
    "fmt"
)
type employee struct {
    firstName   string
    lastName    string
    totalLeaves int
    leavesTaken int
}
func New(firstName string, lastName string, totalLeave int, leavesTaken int) employee {
    e := employee {
     firstName, lastName, totalLeave, leavesTaken}
    return e
}
func (e employee) LeavesRemaining() {
    fmt.Printf("%s %s has %d leaves remaining", e.firstName, e.lastName, (e.totalLeaves - e.leavesTaken))
}
```

我们进行了一些重要的修改。我们把 `Employee` 结构体的首字母改为小写 `e`，也就是将 `type Employee struct` 改为了 `type employee struct`。通过这种方法，我们把 `employee` 结构体变为了不可导出，防止其他包对它的访问。除非特殊需求，否则将未导出结构体的所有字段都取消导出是一种很好的做法。由于我们不会在外部包需要 `employee` 的字段，因此我们也让这些字段改为无法导出。

同样，我们还修改了 `LeavesRemaining()` 的方法。

现在由于 `employee` 不可导出，因此不能在其他包内直接创建 `Employee` 类型的变量。于是我们在第 `14` 行提供了一个可导出的 `New`函数，该函数接收必要的参数，返回一个新创建的 `employee` 结构体变量。

这个程序还需要一些必要的修改，但现在先运行这个程序，编译器会报错，如下所示：

```java
go/src/constructor/main.go:6: undefined: employee.Employee 
```

这是因为我们将 `Employee` 设置为不可导出，因此编译器会报错，提示该类型没有在 `main.go` 中定义。完美！正是我们想要的，现在没有其他包能够创建零值`employee`。我们已成功阻止创建不可用的`employee`结构体。现在创建`employee`的唯一方法是使用该`New`函数。

如下所示，修改 `main.go` 里的内容。

```java
package main
import "oop/employee"
func main() {
	e := employee.New("Sam", "Adolf", 30, 20)
	e.LeavesRemaining()
}
```

该文件唯一的修改就是第 `6` 行。通过向 `New` 函数传入所需变量，我们创建了一个新的 `employee` 结构体变量。

下面是修改后的两个文件最终内容：

`employee.go`

```java
package employee
import (  
    "fmt"
)
type employee struct {
    firstName   string
    lastName    string
    totalLeaves int
    leavesTaken int
}
func New(firstName string, lastName string, totalLeave int, leavesTaken int) employee {
    e := employee {
     firstName, lastName, totalLeave, leavesTaken}
    return e
}
func (e employee) LeavesRemaining() {
    fmt.Printf("%s %s has %d leaves remaining", e.firstName, e.lastName, (e.totalLeaves - e.leavesTaken))
}
```

`main.go`

```java
package main  
import "oop/employee"
func main() {
    e := employee.New("Sam", "Adolf", 30, 20)
    e.LeavesRemaining()
}
```

运行此程序将输出，

```java
Sam Adolf has 10 leaves remaining
```

现在，你可以理解，尽管Go没有提供类，但是结构体可以有效的替代类，`New(parameters)`方法可以替代构造函数。
