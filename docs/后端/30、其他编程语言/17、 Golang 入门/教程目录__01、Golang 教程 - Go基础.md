# 01、Golang 教程 - Go基础
- 来源：https://ddkk.com/zhuanlan/other/golang/3/1.html
- 分类：其他语言
- 分组：教程目录
## Go语言入门

- Go是一门编译型语言，Go语言的工具链将源代码及其依赖转换成**计算机的机器指令**
- Go语言提供的工具都通过一个单独的命令go调用，go命令有一系列子命令。

```java
go run helloworld.go  run指令，编译源文件，链接库文件，并允许最终生产的可执行文件
go build helloworld.go build指令，生成名为helloworld的可执行的二进制文件
go get gopl.io/ch1/helloworld get指令，可以从网上获取代码，并放到对应目录中（$GOPATH/src/gopl.io/ch1/helloworld）
```

```java
package main
// hello world
import "fmt"
func main(){
	fmt.Println("hello world")
}
```

- Go语言通过package组织，一个包由位于单个目录下的一个或者多个.go源文件组成；每一个源文件都以一条package声明语句开始
- main包比较特殊，它定义了一个独立可执行的程序，**在main包里面的main函数，是整个程序执行时的入口。**
- import导入使用到的包，，**必须导入需要的包，缺少了必要的包或者有多余的包，程序都无法编译通过**
- import声明必须跟在文件的package声明之后。随后，则是组成程序的函数(func)、变量(var)、常量(const)、 类型(type)的声明语句.
- Go语言**不需要在语句或者声明的末尾添加分号**，，**编译器会主动把特定符号后的换行符转换为分号**, 因此换行符添加的位置会影响Go代码的正确解析。举个例子, **函数的左括号 { 必须和 func 函数声明在同一行上, 且位于末尾，不能独占一行**，而在表达式 x + y 中，可在 + 后换行，不能在 + 前换行（译 注：以+结尾的话不会被插入分号分隔符，但是以x结尾的话则会被分号分隔符，从而导致编 译错误）。

## 1.2 命令行参数

- os包提供了一些与操作系统交互的函数和变量。程序的命令行参数可从**os 包的Args变量**获取;
- os.Args变量是一个字符串（string）的切片（slice） ；Go语言里也采用左闭右开形式, 即，区间包括第一个索引元素，不包括最后一个；
- os.Args的第一个元素，os.Args[0], 是命令本身的名字；s[m:n]形式的切片表达式，产生从第m个元素到第n-1个元素的切片;如果省略切片表达式的m或n，会默认传入0或 len(s);

```java
import	(	// 导入包也可以通过这种形式
	"fmt"				
	"os" 
)
func	main()	{
	var	s,	sep	string	//变量会在声明的时候直接初始化，如果没有显式初始化，直接赋予类型零值 ""			
	for	i	:=	1;	i	<	len(os.Args);	i++	{
     	// Go语言只有for一种循环语句  左大括号必须和post语句在同一行 
	// := 短变量声明  ++，--只能放在变量名后面，而且不能组成表达式						 
		s	+=	sep	+	os.Args[i]		//  用 + 号连接字符串						
		sep	=	"	"				
	}				
	fmt.Println(s) 
}
```

### for

- for的几种形式

```java
for imitialization; condition; post {
}
for condition {
}
for {
}
// 遍历区间
// 每次循环迭代，range产生一对值，索引以及在该索引处的元素值。
for _,age := range os.Args[1:] {
	//.....
}
```

- Go语言不允许使用无用的局部变量，解决方法是使用空标识符,_(下划线)。空标识符可用于任何语法需要变量名但程序逻辑不需要的时候，eg，在循环里，丢弃不需要的循环索引。

### map

- map中不含某个键时，用于计算时，表达式（counts[line]+1）counts[line]的值将被计算为其类型的零值(0).map的迭代顺序不确定

### scanner

```java
import	(				
	"bufio"		// 处理输入输出的包		
	"fmt"				
	"os" 
)
func main()	{
	counts	:=	make(map[string]int)  // 创建一个map （key可以为任意类型，只要能用==比较）
	input	:=	bufio.NewScanner(os.Stdin)			
	for	input.Scan()	{
     	//读取下一行，并且移除行末的换行符。 读到的时候返回true				
			counts[input.Text()]++	//读取到的内容通过input.Text（）获取
	}			
	//	NOTE:	ignoring	potential	errors	from	input.Err()				
	for	line,	n	:=	range	counts	{
		if	n	>	1	{
				fmt.Printf("%d\t%s\n",	n,	line) // 格式化输出
				//%t 布尔  %q 带双引号的字符串或带单引号的字符 %v 变量的自然形式 %T 变量的类型
				// %% 百分号				
		}			
}
```

### url

```java
package	main
import	(				
 	"fmt"				
 	"io/ioutil"				
 	"net/http"		
 	"os" 
)
func main()	{
	for	_,	url	:=	range os.Args[1:]	{
		resp, err := http.Get(url)								
		if	err	!=	nil	{
			fmt.Fprintf(os.Stderr,	"fetch:	%v\n",	err)			
			os.Exit(1)			
		}				
		b,	err	:=	ioutil.ReadAll(resp.Body)							
		resp.Body.Close()		// 关闭resp的Body流						
		if	err	!=	nil	{
			fmt.Fprintf(os.Stderr,	"fetch:	reading	%s:	%v\n",	url,	err)															
			os.Exit(1)	// 终止进程，返回1的错误码				
		}								
		fmt.Printf("%s",	b)				
	} 
}
```

### 并发获取多个url

- 协程

### switch

- go语言不需要显式的再每一个case后面写break，语言默认执行完case后的逻辑语句会自动退出。如果想要相邻几个case都执行同一逻辑的化，需要自己显式地写上一个fallthrough 语句来覆盖这种默认行为，
- switch可以不带操作对象，默认用true代替，然后将每个case的表达式和true值进行比较

```java
func Signum(x int) int {
	switch {
	case x > 0 :
		return +1
	default:
	    return 0
	case x < 0 :
		return -1
	}
}
```

- switch 也可以紧跟一个简短的变量声明，一个自增表达式，赋值语句，或者一个函数调用

## 第二章:程序结构

### 命名

- 大小写敏感
- 如果一个名字是在函数内部定义的，那么它就只在函数内部有效
- 如果是再函数外部定义，那么将再当前包所有文件中都可以访问。
- 名字的开头字母的大小写决定了名字在包外的可见性。如果一个名字是大写字母开头，那么它就是导出类型的，可以被外部的包访问。
- 包名字一般用小写字母
- 使用驼峰命名法。

### 声明

- var （变量）, const（常量）, type（类型）, func（函数）

### 变量

```java
var 变量名字 类型 = 表达式  // 类型和表达式可以2选1
// 如果初始化表达式被省略，那么将用零值初始化该变量
// 在go语言中不存在未初始化的变量
```

- 可以在一个声明语句中同时声明一组变量，或用一组初始化表达式声明并初始化一组变量。
- 如果省略每个变量的类型，将可以声明多个类型不同的变量

```java
var i,j,k int
var b,f,s = true, 2.3, "four"
```

- 初始化表达式可以是字面量或任意类型的表达式。在包级别声明的变量会在main入口执行前完成初始化。局部变量将在声明语句被执行到的时候完成初始化

### 简短变量声明

- 广泛用于大部分的局部变量的声明和初始化。

```java
t := 0.0
i,j := 0, 1
```

- 简短变量声明左边的变量可能并不是全部都是刚刚声明的。如果有一些已经在相同的词法域声明过了，那么简短变量声明语句对这些已经声明过的变量就只有赋值的行为了，简短变量声明语句中必须至少要声明一个新的变量

#### 指针#

```java
x	:=	1 
p	:=	&x	//	p,	of	type	*int,	points	to	x 
fmt.Println(*p)	//	"1" 
*p	=	2	//	equivalent	to	x	=	2 
fmt.Println(x)		//	"2"
```

- 在go语言中，返回函数中局部变量的地址是安全的。

```java
func f() *int {
	v := 1
	return &v
}
```

#### new函数#

- 可以调用内建的new函数，表达式new(T)将创建一个T类型的匿名变量，初始化为T类型的零值，然后返回变量的地址，指针类型为*T

```java
p := new(int) // p 为 *int 类型
```

- 如果两种类型都是空的，也就是说类型的大小是0，有可能有相同的地址，如果类型的大小为0的化，可能导致Go语言的自动垃圾回收器有不同的行为。(eg struct{} 和 [0]int)

#### 变量的生命周期#

- 对于在包一级声明的变量：生命周期和整个程序的运行周期一致
- 局部变量的声明周期：到创建一个变量到该百年来不再被引用为止
- 编译器会自动选择在栈上分配局部变量或者在堆上分配局部变量

```java
var global *int
func f() {
	var x int
	x = 1  // 必须在堆上分配，因为函数退出后依然可以通过包一级的global变量找到，（x局部变量从函数f中逃逸了）
	global = &x
}
func g() {
	y := new(int)
	*y = 1  // 编译器可以选择在栈上分配*y的存储空间（也可以在堆上），虽然用new方式
}
```

#### 赋值#

```java
// ++ ,-- 是语句 不是表达式
v++
v--
x = i++ // 错误！！！！
```

- 元素赋值允许同时更新多个变量，在赋值之前，赋值语句左边的所有表达式将会先进行求值，然后统一更新左边对应的变量的值

```java
x,y = y,x
a[i],a[j] = a[j],a[i]
```
