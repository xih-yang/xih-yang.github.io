# 02、Golang 教程 - hello world
- 来源：https://ddkk.com/zhuanlan/other/golang/4/2.html
- 分类：其他语言
- 分组：教程目录
学习任何编程语言的第一个程序都是Hello world，我就不打破这个传统了。看看Go的"Hello World"吧。

```java
package main
import  "fmt" //引入fmt库
func main() {
    fmt.Println("Hello World!")
}
```

逐行分析这段程序：

第一行是必须的。所有Go语言编写的文件都以package 开头，对于独立运行的执行文件必须是 package main；

第二行表示将fmt包加入main。一般非main的其他package（包）都被称为库，

第三行就是程序中的主函数。Go程序执行时候，首先调用的函数就是main函数。这个是从C中继承过来的。这里是main函数的函数定义。

第四行调用fmt包的函数打印字符串到屏幕。字符串由""包裹，并且可以包含非ASCII的字符。

`注意`：

一个独立的可执行的golang程序，package main是必须出现，紧跟在是引入的各种库，然后是各个函数，这里必须要有一个main函数。main函数是程序的入口。

## 编译与运行

使用命令：`go build helloworld.go` 编译。在同一目录下将会生成`helloworld`的可执行文件。

运行：`./helloworld`

屏幕上输出：`Hello World!`

编译时候还可以使用一些参数来减小编译后的文件大小。

```java
go build -ldflags "-s -w" helloworld.go
```
