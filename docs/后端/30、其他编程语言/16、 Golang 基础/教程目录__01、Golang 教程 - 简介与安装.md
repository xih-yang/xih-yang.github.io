# 01、Golang 教程 - 简介与安装
- 来源：https://ddkk.com/zhuanlan/other/golang/2/1.html
- 分类：其他语言
- 分组：教程目录
## 一、简介

Go（Golang）是 Google 的 Robert Griesemer，Rob Pike 及 Ken Thompson 开发的一种计算机编程语言语言。

设计初衷：

Go 语言是谷歌推出的一种编程语言，可以在不损失应用程序性能的情况下降低代码的复杂性。谷歌首席软件工程师罗布派克（Rob Pike）说：我们之所以开发 Go，是因为过去 10 多年间软件开发的难度令人沮丧。派克表示，和今天的 C++ 或 C 一样，Go 是一种系统语言。他解释道：“使用它可以进行快速开发，同时它还是一个真正的编译语言，我们之所以现在将其开源，原因是我们认为它已经非常有用和强大。”

时代背景：

- 计算机硬件技术更新频繁，性能提高很快。目前主流的编程语言发展明显落后于硬件，不能合理利用多核多 CPU 的优势提升软件系统性能。
- 软件系统复杂度越来越高，维护成本越来越高，目前缺乏一个足够简洁高效的编程语言。
- 企业运行维护很多 c/c++ 的项目，c/c++ 程序运行速度虽然很快，但是编译速度确很慢，同时还存在内存泄漏的一系列的困扰需要解决。

应用领域：

Go语言的吉祥物 : 金花鼠 Gordon

- 官网：[https://golang.org/](https://golang.org/)
- 中文网在线标准库文档：[https://studygolang.com/pkgdoc](https://studygolang.com/pkgdoc)

## 二、安装

- 在官网下载 golang 包并安装
- 安装编译工具 vscode(免费) 或者 goland(付费)

具体参考视频：[golang入门到项目实战 [2021最新Go语言教程，没有废话，纯干货！持续更新中…]_哔哩哔哩_bilibili](https://www.bilibili.com/video/av336748125?p=3&spm_id_from=pageDriver)

```java
go get -u -v github.com/nsf/gocode
go get -u -v github.com/rogpeppe/godef
go get -u -v github.com/golang/lint/golint
go get -u -v github.com/lukehoban/go-find-references
go get -u -v github.com/lukehoban/go-outline
go get -u -v sourcegraph.com/sqs/goreturns
go get -u -v golang.org/x/tools/cmd/gorename
go get -u -v github.com/tpng/gopkgs
go get -u -v github.com/newhook/go-symbols
```

`建议用 VPN 连外网，插件都是从 github 上下的。`

**代理地址**

```java
# 如果用了 VPN 还是下载不了在终端执行上面的命令设置代理地址
# 其实是官方下载地址被墙了
go env -w GOPROXY=https://goproxy.cn
# 继续在终端执行 go get -u -v ...... 一系列命令
```

安装Code Runner 插件

**安装 Code Runner 插件后才能在 vscode 运行代码文件。**

## 三、第一个程序

##

```java
// 每一个 go 文件都要归属一个包
package main
// 导入工具包，可以使用包中的方法，函数来实现相关的功能
import "fmt"
// 定义程序运行的主函数（入口有且仅有一个，出口可以有多个）
func main() {
	fmt.Println("hello go!")
}
```

- 运行方式一：安装 code runner 插件运行代码
- 运行方式二：命令行先 go build xxxx.go，然后运行 xxxx.exe
- 运行方式三：命令行执行 go run xxxx.go，不生成 exe 文件直接运行

如果go build 报错

```java
go env -w GO111MODULE=off
```

> 如何构建整个项目

```java
D:\goproject\src>dir
 驱动器 D 中的卷是 新加卷
 卷的序列号是 6294-1130
 D:\goproject\src 的目录
2022-03-14  16:43    <DIR>          .
2022-03-14  16:43    <DIR>          ..
2022-03-14  16:43    <DIR>          dev_code
               0 个文件              0 字节
               3 个目录 338,837,585,920 可用字节
D:\goproject\src>go build .\dev_code\day1\example1
D:\goproject\src>dir
 驱动器 D 中的卷是 新加卷
 卷的序列号是 6294-1130
 D:\goproject\src 的目录
2022-03-14  17:24    <DIR>          .
2022-03-14  17:24    <DIR>          ..
2022-03-14  16:43    <DIR>          dev_code
2022-03-14  17:24         1,926,144 example1.exe
               1 个文件      1,926,144 字节
               3 个目录 338,835,656,704 可用字节
D:\goproject\src>.\example1.exe
hello go!
```
