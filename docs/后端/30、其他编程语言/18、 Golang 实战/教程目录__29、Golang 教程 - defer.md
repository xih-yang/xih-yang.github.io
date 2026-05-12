# 29、Golang 教程 - defer
- 来源：https://ddkk.com/zhuanlan/other/golang/4/29.html
- 分类：其他语言
- 分组：教程目录
## 什么是 defer？#

`defer`语句的作用：含有`defer`语句的函数结束之前调用另外一个函数。定义看起来很复杂，我们通过一个例子就很容易理解。

```java
package main
import (  
    "fmt"
)
func finished() {
    fmt.Println("Finished finding largest")
}
func largest(nums []int) {
    defer finished()    
    fmt.Println("Started finding largest")
    max := nums[0]
    for _, v := range nums {
        if v > max {
            max = v
        }
    }
    fmt.Println("Largest number in", nums, "is", max)
}
func main() {
    nums := []int{
     78, 109, 2, 563, 300}
    largest(nums)
}
```

上述函数的功能是找出指定切片中的最大数。`largest`函数有一个`int`型切片作为参数，功能是打印输入切片中最大的数，函数第一行包含一个`defer finished()`语句。这意味着，函数`finished()`将在函数`largest`结束前被调用。运行程序结果如下：

```java
Started finding largest
Largest number in [78 109 2 563 300] is 563
Finished finding largest
```

`largest` 函数开始执行后，会打印上面的两行输出。而就在 `largest`将要返回的时候，又调用了我们的`延迟函数`（`Deferred Function`），打印出文本 `Finished finding largest` 。

## 延迟方法（Defered methods）#

`defer` 不仅限于函数的调用，调用方法也是合法的。我们写一个小程序来测试一下。

```java
package main
import (  
    "fmt"
)
type person struct {
    firstName string
    lastName string
}
func (p person) fullName() {
    fmt.Printf("%s %s",p.firstName,p.lastName)
}
func main() {
    p := person {
        firstName: "John",
        lastName: "Smith",
    }
    defer p.fullName()
    fmt.Printf("Welcome ")  
}
```

在上面的例子中，我们在第 `22` 行延迟了一个方法调用。其他的代码很直观，这里不再解释。该程序输出：

```java
Welcome John Smith  
```

## 实参取值（Arguments Evaluation）#

延迟函数的参数并非在调用的时候确定，而是当执行 `defer` 语句的时候，就会对延迟函数的实参进行求值。

让我们通过一个例子来理解这一点。

```java
package main
import (  
    "fmt"
)
func printA(a int) {
    fmt.Println("value of a in deferred function", a)
}
func main() {
    a := 5
    defer printA(a)
    a = 10
    fmt.Println("value of a before deferred function call", a)
}
```

在上面的程序里的第 `11` 行，`a` 的初始值为 `5`。在第 `12` 行执行 `defer` 语句的时候，由于 `a` 等于 `5`，因此延迟函数 `printA` 的实参也等于 `5`。接着我们在第 `13` 行将 `a` 的值修改为 `10`。下一行会打印出 `a` 的值。该程序输出：

```java
value of a before deferred function call 10
value of a in deferred function 5
```

从上面的输出，我们可以看出，在调用了 `defer` 语句后，虽然我们将 `a` 修改为 `10`，但调用延迟函数 `printA(a)`后，仍然打印的是 `5`。

## defer 栈#

当一个函数有多个延迟调用时，这些`defer`语句的调用放入到一个栈中，按照`先进后出`(`LIFO`)的顺序执行。

下面我们编写一个小程序，使用 `defer` 栈，将一个字符串逆序打印：

```java
package main
import (
	"fmt"
)
func main() {
	name := "Naveen"
	fmt.Printf("Orignal String: %s\n", string(name))
	fmt.Printf("Reversed String: ")
	for _, v := range []rune(name) {
		defer fmt.Printf("%c", v)
	}
}
```

在上面程序中第 `11` 行，`for range` 循环会遍历一个字符串，并在第 `12` 行调用了 `defer fmt.Printf("%c", v)`。这些延迟调用会添加到一个栈中，按照后进先出的顺序执行，因此，该字符串会逆序打印出来。该程序会输出：

```java
Orignal String: Naveen  
Reversed String: neevaN  
```

## defer 的实际应用#

到目前为止，我们看到的代码示例都没有体现出 `defer` 的实际用途。这一节我们将学习一些`defer`的实际应用。

`defer`使用的情况：当一个函数执行与当前代码流程无关。我们通过一个使用 `WaitGroup` 代码的示例来理解这句话的含义。我们首先会写一个没有使用 `defer` 的程序，然后我们会用 `defer` 来修改，看到 `defer` 带来的好处。

```java
package main
import (  
    "fmt"
    "sync"
)
type rect struct {
    length int
    width  int
}
func (r rect) area(wg *sync.WaitGroup) {
    if r.length < 0 {
        fmt.Printf("rect %v's length should be greater than zero\n", r)
        wg.Done()
        return
    }
    if r.width < 0 {
        fmt.Printf("rect %v's width should be greater than zero\n", r)
        wg.Done()
        return
    }
    area := r.length * r.width
    fmt.Printf("rect %v's area %d\n", r, area)
    wg.Done()
}
func main() {
    var wg sync.WaitGroup
    r1 := rect{
     -67, 89}
    r2 := rect{
     5, -67}
    r3 := rect{
     8, 9}
    rects := []rect{
     r1, r2, r3}
    for _, v := range rects {
        wg.Add(1)
        go v.area(&wg)
    }
    wg.Wait()
    fmt.Println("All go routines finished executing")
}
```

在上面的程序里，我们在第 `8` 行创建了 `rect` 结构体，并在第 `13` 行创建了 `rect` 的方法 `area`，计算出矩形的面积。`area` 检查了矩形的长宽是否小于零。如果矩形的长宽小于零，它会打印出对应的提示信息，而如果大于零，它会打印出矩形的面积。

`main` 函数创建了 `3` 个 `rect` 类型的变量：`r1`、`r2`和 `r3`。在第 `34` 行，我们把这 `3` 个变量添加到了 `rects` 切片里。该切片接着使用 `for range` 循环遍历，把 `area` 方法作为一个并发的 Go 协程进行调用(`第 37 行`)。我们用 `WaitGroup wg` 来确保 `main`函数在其他协程执行完毕之后，才会结束执行。`WaitGroup` 作为参数传递给 `area` 方法后，在第 `16` 行、第 `21` 行和第 `26` 行通知 `main` 函数，表示现在协程已经完成所有任务。如果你仔细观察，会发现 `wg.Done()` 只在 `area` 函数返回的时候才会调用，并且与代码流程无关，因此我们可以只调用一次 `defer`，来有效地替换掉 `wg.Done()` 的多次调用。

我们来用 `defer` 来重写上面的代码。

在下面的代码中，我们移除了原先程序中的 `3` 个 `wg.Done()`的调用，而是用一个单独的 `defer wg.Done()` 来取代它(`第 14 行`)。这使得我们的代码更加简洁易懂。

```java
package main
import (  
    "fmt"
    "sync"
)
type rect struct {
    length int
    width  int
}
func (r rect) area(wg *sync.WaitGroup) {
    defer wg.Done()
    if r.length < 0 {
        fmt.Printf("rect %v's length should be greater than zero\n", r)
        return
    }
    if r.width < 0 {
        fmt.Printf("rect %v's width should be greater than zero\n", r)
        return
    }
    area := r.length * r.width
    fmt.Printf("rect %v's area %d\n", r, area)
}
func main() {
    var wg sync.WaitGroup
    r1 := rect{
     -67, 89}
    r2 := rect{
     5, -67}
    r3 := rect{
     8, 9}
    rects := []rect{
     r1, r2, r3}
    for _, v := range rects {
        wg.Add(1)
        go v.area(&wg)
    }
    wg.Wait()
    fmt.Println("All go routines finished executing")
}
```

该程序输出:

```java
rect {
     8 9}'s area 72  
rect {-67 89}'s length should be greater than zero  
rect {
     5 -67}'s width should be greater than zero  
All go routines finished executing  
```

在上面的程序中，使用 `defer` 还有一个好处。假设我们使用 `if` 条件语句，又给 `area` 方法添加了一条返回路径。如果没有使用 `defer` 来调用 `wg.Done()`，我们必须小心并确保我们在这条新添的返回路径里调用了 `wg.Done()`。由于现在我们延迟调用了 `wg.Done()`，因此无需再为这条新的返回路径添加 `wg.Done()` 了。
