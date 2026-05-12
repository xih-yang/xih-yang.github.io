# 07、Golang 教程 - Go 函数
- 来源：https://ddkk.com/zhuanlan/other/golang/2/7.html
- 分类：其他语言
- 分组：教程目录
- 函数是基本的代码块，用于执行一个任务。
- Go 中有 3 种函数：普通函数、匿名函数(没有名称的函数)、方法(定义在 struct 上的函数)。
- Go 中函数参数可以没有名称，例如 func test(int,int)。
- Go 中的函数可以作为一种 type 类型，例如 type callback func(int,int) int。
- Go 程序中最少有一个 main() 函数。
- Go 中不允许函数重载(overload)，也就是说不允许函数同名。
- Go 中的函数不能嵌套函数，但可以嵌套匿名函数(内联形式)。
- 函数是一个值，可以将函数赋值给变量，使得这个变量也成为函数，例如 nextNumber := closePackage()。
- 函数可以作为参数传递给另一个函数，函数的返回值可以是一个函数。这些特性使得函数变得无比的灵活，例如回调函数、闭包等等功能都依赖于这些特性。
- Go 中的函数在 1.18 版本之前不支持泛型，但如果需要泛型的情况，大多数时候都可以通过 接口、type switch、reflection 的方式来解决。但使用这些技术使得代码变得更复杂，性能更低。
- 可以通过函数来划分不同的功能，逻辑上每个函数执行的是指定的任务。
- 函数声明告诉了编译器函数的名称，返回类型和参数。
- Go 中的标准库提供了多种可动用的内置的函数。例如：len() 函数可以接受不同类型参数并返回该类型的长度。如果传入的是字符串则返回字符串的长度，如果传入的是数组，则返回数组中包含的元素个数。

## 1. 基础函数

**语法**

```java
func 函数名(参数列表) (返回值列表) {
	......
}
```

无参数无返回值

```java
func test() {
    ......
}
```

传参有返回值

```java
func test(a int,b int) int {
    ......
    return n
}
```

传参有多个返回值

```java
func test(a int,b int) (int,int) {
    ......
    return a+b,a*b
}
```

**示例**

```java
// 定义 max() 函数传入两个整型参数 num1 和 num2，并返回两个参数的最大值
func max(num1,num2 int) int {
    if num1 > num2 {
        return num1
    } else {
        return num2
    }
}
// 函数的调用
package main
import "fmt"
func main() {
    var test1 int = 100
    var test2 int = 200
    var result int
    result = max(test1,test2)
    fmt.Println("最大值为:",result)
}
func max(num1,num2 int) int {
    if num1 > num2 {
        return num1
    } else {
        return num2
    }
}
// 函数返回多个值
package main
import "fmt"
func main() {
    a,b := multi_value(3,5)
    fmt.Println("和为:",a,"积为:",b)
}
func multi_value(num1,num2 int) (int,int) {
    result1 := num1 + num2
    result2 := num1 * num2
    return result1,result2
}
// 可以空白标识符剔除输出结果 _,b := multi_value(3,5)
```

## 2. 函数参数

- 函数如果使用参数，该变量可称为函数的形参。
- 形参就像定义在函数体内的局部变量。
- 调用函数，可以通过两种方式来传递参数：

传递类型
描述

值传递
值传递是指在调用函数时将实际参数复制一份传递到函数中，这样在函数中如果对参数进行修改，将不会影响到实际参数。

引用传递
引用传递是指在调用函数时将实际参数的地址传递到函数中，那么在函数中对参数所进行的修改，将影响到实际参数。

- 默认情况下，Go 语言使用的是值传递，即在调用过程中不会影响到实际参数。

**示例**

```java
// 使用引用类型进行两数交换
package main
import "fmt"
func main() {
	var (
		a = 10
		b = 20
	)
	fmt.Println("交换前：a=",a,"b=",b)
	swap(&a,&b)		// 交换了 a,b 的地址
	fmt.Println("交换后：a=",a,"b=",b)
}
func swap(x *int,y *int) {
	*x,*y = *y,*x
}
// 结果
交换前：a= 10 b= 20
交换后：a= 20 b= 10
```

```java
// 值传递示例
package main
import "fmt"
type Car struct {
	Price int
	Long int
}
func main() {
	c1 := new(Car)
	c1.Price = 200000
	c1.Long = 5
	fmt.Println("交换前车价:",c1.Price)
	fmt.Println("交换前车长:",c1.Long)
	swap(c1.Price,c1.Long)
	fmt.Println("交换后车价:",c1.Price)
	fmt.Println("交换后车长:",c1.Long)
}
func swap(a,b int) {
	a,b = b,a
}
// 结果
交换前车价: 200000
交换前车长: 5
交换后车价: 200000
交换后车长: 5
```

## 3. 函数作为实参

可以很灵活的创建函数，并作为另外一个函数的实参。

**示例**

```java
package main
import (
    "fmt"
    "math"
)
func main() {
    /*声明函数变量*/
    getRoot := func(x float64) float64 {
     	// 匿名函数，没有给函数定义名称，赋值给函数变量
        return math.Sqrt(x)
    }
    fmt.Println(getRoot(9))	// 使用变量名调用函数
    /*math 数学包的使用*/
    fmt.Println("-10 的绝对值",math.Abs(float64(-10)))
    fmt.Println("5.2 向上取整",math.Ceil(5.2))
    fmt.Println("5.8 向下取整",math.Floor(5.8))
    fmt.Println("11 除以 3 的余数",math.Mod(11,3))
    fmt.Println(math.Modf(5.26))	//取整数，取小数
    fmt.Println("3 的 2 次方",math.Pow(3,2))
    fmt.Println("10 的 4 次方",math.Pow(10,4))
    fmt.Println("8 的开平方",math.Sqrt(8))
    fmt.Println("8 的开立方",math.Cbrt(8))
    fmt.Println("圆周率",math.Pi)
}
```

## 4. 回调函数

- 和其他很多语言一样，golang 中函数也可以作为其它函数的参数进行传递，然后在其它函数内调用执行，一般称之为[回调](https://so.csdn.net/so/search?q=%E5%9B%9E%E8%B0%83&spm=1001.2101.3001.7020)。
- Golang 是编译型语言，区别于解释型语言。解释型语言解释一条，编译一条，执行一条；golang 一个函数体一起编译，一起执行，如果函数体语句太多，其执行起来过于消耗计算机资源。所以我们需要实现程序间的解耦，节省计算机资源，提升运行效率。
- 回调函数的使用可以大大提升编程的效率，这使得它在现代编程中被非常多地使用。同时，有一些需求必须要使用回调函数来实现。

**示例一**

```java
package main
import "fmt"
// 声明函数类型，不写语句结构
type cback func(int) int
func main() {
    // 对回调函数进行隐匿，起到安全保护作用之余，提高程序运行效率
    test_cback(1,callback)
    test_cback(2,func(x int) int {
        fmt.Printf("回调：x：%d\n",x)
        return x
    })    
}
func test_cback(x int,f cback) {
     	// cback 函数作为参数传入，并起名为 f
    f(x)
}
func callback(x int) int {
    fmt.Printf("回调：x：%d\n",x)
    return x
}
// 结果
回调：x：1
回调：x：2
```

**1、** main()调用初始函数test1()；

**2、** 回调函数test2()是test1()的形参；

**3、** test1()调用test2()；

**4、** test1()运行结束，返回main()；

> 函数可以作为另一个函数的参数(典型用法是回调函数)
> 函数可以返回另一个函数，即让另一个函数作为这个函数的返回值(典型用法是闭包)
> 函数可以作为一个值赋给变量(常用在匿名函数)

**示例二**

```java
// 调用函数 test 时，调用真正的实现函数 add
package main
import "fmt"
type Callback func(x, y int) int
// 提供一个接口，让外部去实现
func test(x, y int, callback Callback) int {
    return callback(x, y)
}
// 回调函数的具体实现
func add(x, y int) int {
    return x + y
}
func main() {
    x, y := 1, 2
    fmt.Println(test(x, y, add))
} 
//结果
3
```

**示例三**

```java
package main
/* 实现：加，减，乘，除 */
import "fmt"
type FuncType func(int, int) int
// 实现加法
func Add(a,b int) int {
	return a + b
}
// 实现减法
func Minus(a,b int) int {
	return a - b
}
// 实现乘法
func Mul(a,b int) int {
	return a * b
}
// 实现除法
func Div(a,b int) int {
	return a / b
}
// 回调函数：函数有一个参数是函数类型，这个函数就是回调函数
// 多态：多种形态，调用同一个接口，可以实现不同表现
func Calc(a,b int, test FuncType) (result int) {
	fmt.Println("Calc")
	result = test(a,b)
	return
}
func main() {
	x := Calc(4,2,Add)
	y := Calc(4,2,Minus)
	z := Calc(4,2,Mul)
	k := Calc(4,2,Div)
	fmt.Println("x =",x)
	fmt.Println("y =",y)
	fmt.Println("z =",z)
	fmt.Println("k =",k)
}
// 结果
Calc
Calc
Calc
Calc
x = 6
y = 2
z = 8
k = 2
```

## 5. 函数闭包

匿名函数可作为闭包。匿名函数是一个 “内联” 语句表达式。**匿名函数的优越性在于可以直接使用函数内的变量，不必声明**。

> 在回调函数中，将函数作为传参。
>
> 闭包中，将函数作为返回值（return 返回函数，返回的函数再返回值）。
>
> 一般来说，回调函数和闭包函数附带的还具备一个特性：函数可以作为一个值赋值给变量。
>
> Go 中函数不能嵌套命名函数，所以函数返回函数的时候，只能返回匿名函数（不能 func … func …）。

**示例**

```java
package main
import "fmt"
// 包中包（函数中的函数），将匿名函数限制在 closePackage() 中
// 定义了闭包函数 closePackage() 和一个匿名函数（有一个返回值为 int 类型）
// 匿名函数可以继承 i := 0，不必声明，对匿名函数来说，这个变量相当于全局变量
// 在闭包函数中 return 匿名函数，并在匿名函数结构体中返回运算后 i 的值
func closePackage() func() int {
    i := 0
    // 返回，执行匿名函数，闭包结构
    return func() int {
        i += 1
        return i
    }
}
func main() {
    /*定义函数，使用闭包做 +1 操作*/
    nextNumber := closePackage()
    fmt.Println("使用 nextNumber 做自增")
    fmt.Println(nextNumber()) // 1
    fmt.Println(nextNumber()) // 2
    fmt.Println(nextNumber()) // 3
    fmt.Println("使用 nextNumber 做自增")
    nextNumber1 := closePackage()
    fmt.Println(nextNumber1()) // 1
    fmt.Println(nextNumber1()) // 2
}
// 结果
使用 nextNumber 做自增
1
2
3
使用 nextNumber 做自增
1
2
```

闭包= 函数 + 外层变量的引用

这一整个叫闭包结构。

## 6. 函数方法

同时有函数和方法。一个方法就是一个包含了接受者的函数，接受者可以是命名类型或者结构体类型的一个值或者是一个指针。所有给定类型的方法属于该类型的方法集。

**语法：**

```java
func (var_name var_data_type) function_name() [return_type] {
    /*函数体*/
}
```

**示例：**

```java
package main
import "fmt"
/*定义结构体*/
type Circle struct {
    radius float64
}
func main() {
    var c1 Circle
    c1.radius = 10.00
    fmt.Println("圆的面积 = ",c1.getArea())
}
// 该 method 属于 Circle 类型对象中的方法
func (c Circle) getArea() float64 {
    // c.radius 即为 Circle 类型对象中的属性
    return math.Pi * c.radius * c.radius
}	
// 结果
圆的面积 =  314.1592653589793
```

```java
package main
import "fmt"
// 定义结构体作为接收者
type Car struct {
	// 属性
	Name string
	Color string
}
// 函数方法，这些函数方法属于结构体
func (c Car) Call() {
     	// (c Car) 相当于 c := new(Car)
	fmt.Printf("%s品牌的汽车，颜色是%s正在鸣笛",c.Name,c.Color)
}
func (c Car) Run() {
	fmt.Printf("%s品牌的汽车，颜色是%s正在行驶",c.Name,c.Color)
}
func main() {
	// 实例化 c1
	c1 := new(Car)
	c1.Name = "奔驰"
	c1.Color = "黑色"
	c1.Call()
	fmt.Println()
	// 实例化 c2
	c2 := new(Car)
	c2.Name = "宝马"
	c2.Color = "白色"
	c2.Run()
}
```

[Go基础函数](https://www.cnblogs.com/f-ck-need-u/p/9876203.html)

[Go高阶函数][Go 1]
