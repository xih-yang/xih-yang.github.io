# 26、Golang 教程 - HTTP 编程与 MySQL
- 来源：https://ddkk.com/zhuanlan/other/golang/2/26.html
- 分类：其他语言
- 分组：教程目录
Go原生支持 http，直接使用 `import("net/http")` 即可，http 服务性能和 nginx 非常接近，都具备高并发支持的能力，代码实现起来较为简单。

## 1. 服务器配置

`示例：`

[https://www.jianshu.com/p/e494795794cf](https://www.jianshu.com/p/e494795794cf)

```java
package main
import (
	"fmt"
	"net/http"
)
/* HTTP 服务端配置 */
// 业务处理请求和回应
func Hello(res http.ResponseWriter, req *http.Request) {
	// 下面仅作示例，正常写业务流程
	fmt.Println("Hello World!")
	fmt.Fprintln(res,"<h1>Welcome</h1>")
}
func Test(res http.ResponseWriter, req *http.Request) {
	fmt.Println("Hello World!")
	fmt.Fprintln(res,"<h1>test web</h1>")
}
func main() {
	// 路由到站点，调用业务处理函数
	http.HandleFunc("/", Hello)
	http.HandleFunc("/test", Test)
	// 封装监听和接收连接功能，nil 参数表示 DefaultServeMuX
	// 默认使用 DefaultServeMuX {} 类结构作为多路复用服务器的类结构属性结构使用
	err := http.ListenAndServe("0.0.0.0:8000",nil)
	if err != nil {
		fmt.Println("HTTP LISTEN FAILED!\nerr",err)
	}
}
```

`运行，浏览器访问`

## 2. 客户端配置

`示例`

```java
package main
import (
	"fmt"
	"io/ioutil"
	"net/http"
)
/* HTTP 客户端配置 */
func main() {
	// 使用 get 提交 URL 获取请求结果
	// 在 get 函数中放入完全合格域名 FQDN
	res,err := http.Get("https://www.baidu.com/")
	if err != nil {
		fmt.Println("get err:",err)
		return
	}
	// 从 response 结果的 Body 结构体中取到数据
	data, err := ioutil.ReadAll(res.Body)
	if err != nil {
		fmt.Println("get data err:",err)
		return
	}
	fmt.Println(string(data))
}
```

`运行客户端`

```java
D:\goproject\src\dev_code\HTTP\client>go run main.go
<html>
<head>
        <script>
                location.replace(location.href.replace("https://","http://"));
        </script>
</head>
<body>
        <noscript><meta http-equiv="refresh" content="0;url=http://www.baidu.com/"></noscript>
</body>
</html>
```

## 3. 请求方法

`Get 请求`

提交的数据都是追加在 URL 之后，限制点是 URL 的长度不能超过 8K，不适用于提交量大的数据，适用于请求数据，get 请求从服务器中读取资源。

`Post 请求`

数据存放在包中，数据量不受限制，可以提交上传量大的数据信息，post 用于更新服务器资源。

`Put 请求`

用于在服务器上创建资源。

`Delete 请求`

用户在服务器上删除资源。

`Head 请求`

向服务器请求头部信息，用于监控服务状态。

`示例`

```java
package main
import (
    "fmt"
    "net/http"
)
// 定义 URL 切片
var url = []string {
    "http://www.taobao.com",
    "http://www.baidu.com",
    "http://www.google.com",
}
func main() {
    // 遍历 URL 获取头部信息
    for _,v := range url {
        // head 中自带客户端测试访问
        req,err := http.Head(v)
        if err != nil {
            fmt.Printf("head:%s,err:%v\n",v,err)
            return
        }
        // 头部信息输出
        fmt.Printf("head succ,status:%v\n",req.Status)
    }
}
/*
head succ,status:200 OK
head succ,status:200 OK
head:http://www.google.com,err:Head "http://www.google.com": dial tcp 128.121.243.106:80: connectex: A connection attempt failed because the connected party did not properly respond after a period of time, or established connection failed because connected host has failed to respond.
*/
```

`使用自建客户端测试`

```java
package main
import (
	"fmt"
	"net"
	"net/http"
	"time"
)
/* 自建客户端请求速度更快，而且可以控制输出时间 */
var url = []string{
	"http://www.taobao.com",
	"http://www.baidu.com",
	"http://www.google.com",
}
func main() {
	// 遍历 URL 获取头部信息
	for _, v := range url {
		// 自建 client 客户端做测试，优化超时时间
		client := http.Client{
			Transport: &http.Transport{
				// 连接服务端（goland 可能不兼容拨号方式）
				Dial: func(network, addr string) (net.Conn, error) {
					// 设置超时时间 2 秒
					timeout := time.Second * 2
					return net.DialTimeout(network, addr, timeout)
				},
			},
		}
		// 使用自建客户端测试
		req, err := client.Head(v)
		if err != nil {
			fmt.Println("获取请求失败,err:", err)
			return
		}
		// 头部信息输出
		fmt.Printf("来自 %s 的网站，状态是 %s\n", v, req.Status)
	}
}
/*
PS D:\goproject\src\dev_code\HTTP> go run .\main.go
来自 http://www.taobao.com 的网站，状态是 200 OK
来自 http://www.baidu.com 的网站，状态是 200 OK
获取请求失败,err: Head "http://www.google.com": dial tcp 104.31.142.88:80: i/o timeout
*/
```

**常用状态码**

```java
http.StatusContinue = 100 客户端上传数据需要请求服务端同意才可以上传显示的状态码
http.StatusOK= 200 成功连接访问
http.StatusFound = 302 页面跳转的状态码
http.StatusBadRequest = 400 非法请求，服务端无法解析
http.StatusUnauthorized = 401 权限受限，未通过
http.StatusForbidden = 403 禁止访问
http.StatusNotFound = 404 请求页面不存在
http.StatusInternalServerError = 500 服务器内部错误
// ----------------------------------------------- //
>>> HTTP 状态码大全
HTTP 状态码（HTTP Status Code）是用以表示网页服务器 HTTP 响应状态的 3 位数字代码，当浏览器请求某一 URL 时， 服务器根据处理情况返回相应的处理状态。
状态码首位 已定义范围 分类 
1xx 100-101 信息提示
2xx 200-206 成功
3xx 300-305 重定向
4xx 400-415 客户端错误
5xx 500-505 服务器错误
HTTP 常见状态码
状态码 功能描述
200 一切正常
301 永久重定向
302 临时重定向
303 查看其它地址。与301类似。使用GET和POST请求查看
304 未修改。所请求的资源未修改，服务器返回此状态码时，不会返回任何资源。
305 使用代理。所请求的资源必须通过代理访问 
400 客户端请求的语法错误，服务器无法理解
401 用户名或密码错误
403 禁止访问(客户端IP地址被拒绝)
404 文件不存在
414 请求URI头部过长
500 服务器内部错误
501 服务器不支持请求的功能，无法完成请求
502 无效网关
503 当前服务不可用
504 网关请求超时
505 服务器不支持请求的HTTP协议的版本，无法完成处理 
```

`示例：表单业务(账号密码框)`

```java
package main
import (
	"io"
	"net/http"
	"fmt"
)
// 定义页面表单 HTML
const form = `<html>` `<body>` `<form action="#" method="post" name="bar">`
					<input type="text" name="in"/>
					<input type="text" name="in"/>
					<input type="submit" value="Submit"/>
			`</form>` `</body>` `</html>`
// test1 页面处理
func SimpleServer(res http.ResponseWriter, request *http.Request) {
	io.WriteString(res, "<h1>hello world!</h1>")
}
// test2 页面处理
func FormServer(res http.ResponseWriter, request *http.Request) {
	res.Header().Set("Content-Type", "text/html")
    // 提交类型判断
	switch request.Method {
	case "GET":
		io.WriteString(res,form)
	case "POST":
		request.ParseForm()
        // 读取第一个框体内容给 res 做页面回应
		// 若获取第二个文本框内容则使用 request.Form["in"][1]
		io.WriteString(res,request.Form["in"][0])
		io.WriteString(res,"\n")
		io.WriteString(res,request.FormValue("in"))
	}
}
func main() {
	http.HandleFunc("/test1",SimpleServer)
	http.HandleFunc("/test2",FormServer)
	if err := http.ListenAndServe("127.0.0.1:8088",nil);err != nil {
		fmt.Println("服务启动失败,err",err)
		return
	}
}
```

**运行：访问 test1/test2**

**文本框 Submit**

```java
package main
import (
	"fmt"
	"io"
	"net/http"
	"os"
)
//定义页面表单html
const form = `<html>` `<head>` `</head>` `<body>`
	<form action="#" method="post" name="bar">
		<input type="test" name="in"/>
		<input type="test" name="in"/>
		<input type="submit" value="submit"/>
	`</form>` `</body>` `</html>`
//业务请求相应处理
func hello(res http.ResponseWriter, req *http.Request) {
	fmt.Println("hello") //提交给服务器
	fmt.Fprintln(res, "<h1>welcome China</h1>")
}
//form表单处理
func formServer(res http.ResponseWriter, req *http.Request) {
	//头部申明
	res.Header().Set("Content-Type", "text/html")
	//类型判断
	switch req.Method {
	case "GET":
		io.WriteString(res, form)
	case "POST":
		req.ParseForm()
		//读取第一个框体内容给response做页面回应
		io.WriteString(os.Stdout, req.Form["in"][0])
		io.WriteString(res, "\n")
		io.WriteString(res, req.FormValue("in"))
	}
}
func main() {
	//路由到指定位置,跳转相关函数处理
	http.HandleFunc("/test1", hello)
	http.HandleFunc("/test2", formServer)
	if err := http.ListenAndServe("127.0.0.1:8088", nil); err != nil {
		fmt.Println("启动监听失败,err:", err)
		return
	}
}
```

## 4. panic 宕机恢复

⚪web 服务为了防止 goroutine 运行 panic 而终止程序，提出了宕机恢复解决方案。

⚪Recover 是一个 Go 语言的内建函数，可以让进入宕机流程中的 goroutine 恢复过来，**recover 仅在延迟函数 defer 中有效**，在正常的执行过程中，调用 recover 会返回 nil 并且没有其他任何效果，如果当前的 goroutine 陷入恐慌，调用 recover 可以捕获到 panic 的输入值，并且恢复正常的执行。

⚪通常来说，不应该对进入 panic 宕机的程序做任何处理，但有时，需要我们可以从宕机中恢复，至少我们可以在程序崩溃前，做一些操作，举个例子，当 web 服务器遇到不可预料的严重问题时，在崩溃前应该将所有的连接关闭，如果不做任何处理，会使得客户端一直处于等待状态，如果 web 服务器还在开发阶段，服务器甚至可以将异常信息反馈到客户端，帮助调试。

⚪在其他语言里，宕机往往以异常的形式存在，底层抛出异常，上层逻辑通过 `try/catch` 机制捕获异常，没有被捕获的严重异常会导致宕机，捕获的异常可以被忽略，让代码继续运行。

⚪Go 语言没有异常系统，其使用 panic 触发宕机类似于其他语言的抛出异常，recover 的宕机恢复机制就对应其他语言中的 `try/catch` 机制。

**panic 和 recover 的组合有如下特性:**

- 有 panic 没 recover，程序宕机。
- 有 panic 也有 recover，程序不会宕机，执行完对应的 defer 后，从宕机点退出当前函数后继续执行。

**模拟宕机**

```java
package main
import (
	"fmt"
	"io"
	"net/http"
)
// 定义页面表单 HTML
const form = `<html>` `<body>` `<form action="#" method="post" name="bar">`
					<input type="text" name="in"/>
					<input type="text" name="in"/>
					<input type="submit" value="Submit"/>
			`</form>` `</body>` `</html>`
// test1 页面处理
func SimpleServer(w http.ResponseWriter, request *http.Request) {
	io.WriteString(w, "<h1>hello world!</h1>")
	// 制造 panic
	panic("test panic")
}
// test2 页面处理
func FormServer(res http.ResponseWriter, request *http.Request) {
	res.Header().Set("Content-Type", "text/html")
	// 提交类型判断
	switch request.Method {
	case "GET":
		io.WriteString(res,form)
	case "POST":
		request.ParseForm()
		// 读取第一个框体内容给 res 做页面回应
		// 若获取第二个文本框内容则使用 request.Form["in"][1]
		io.WriteString(res,request.Form["in"][0])
		io.WriteString(res,"\n")
		io.WriteString(res,request.FormValue("in"))
	}
}
func main() {
	http.HandleFunc("/test1",SimpleServer)
	http.HandleFunc("/test2",FormServer)
	if err := http.ListenAndServe("127.0.0.1:8088",nil);err != nil {
		fmt.Println("服务启动失败,err",err)
		return
	}
}
```

**访问 test1 遇到我们人为制造的 panic**

**访问 test2 正常**

**recover 延迟处理**

```java
package main
import (
	"fmt"
	"io"
	"net/http"
)
// 定义页面表单 HTML
const form = `<html>` `<body>` `<form action="#" method="post" name="bar">`
					<input type="text" name="in"/>
					<input type="text" name="in"/>
					<input type="submit" value="Submit"/>
			`</form>` `</body>` `</html>`
// test1 页面处理
func SimpleServer(w http.ResponseWriter, request *http.Request) {
	io.WriteString(w, "<h1>hello world!</h1>")
	// 制造 panic
	panic("test panic")
}
// test2 页面处理
func FormServer(res http.ResponseWriter, request *http.Request) {
	res.Header().Set("Content-Type", "text/html")
	// 提交类型判断
	switch request.Method {
	case "GET":
		io.WriteString(res,form)
	case "POST":
		request.ParseForm()
		// 读取第一个框体内容给 res 做页面回应
		// 若获取第二个文本框内容则使用 request.Form["in"][1]
		io.WriteString(res,request.Form["in"][0])
		io.WriteString(res,"\n")
		io.WriteString(res,request.FormValue("in"))
	}
}
// 函数外层加壳
func logPanics(handle http.HandlerFunc) http.HandlerFunc {
	return func(writer http.ResponseWriter, request *http.Request) {
		defer func() {
			// recover() 仅在延迟函数 defer 中有效，可以宕机恢复
			if x := recover(); x != nil {
				log.Printf("[%v]caught panic:%v",request.RemoteAddr,x)
			}
		}()
		handle(writer, request)
	}
}
func main() {
	http.HandleFunc("/test1",logPanics(SimpleServer))
	http.HandleFunc("/test2",logPanics(FormServer))
	if err := http.ListenAndServe("127.0.0.1:8088",nil);err != nil {
		fmt.Println("服务启动失败,err",err)
		return
	}
}
```

**访问 test1 查看结果，正常程序不应该终止**

**程序没有终止，但是异常在控制台被抛出了**

## 5. 模板

模板是用于动态生成页面,或者用于代码生成器的编写。

`示例：main.go`

```java
package main
import (
	"fmt"
	"html/template"
	"os"
)
type Person struct {
	Name string
	Age int
	Title string
}
func main() {
	// 读取模板文件
	t,err := template.ParseFiles("index.html")
	if err != nil {
		fmt.Println("parse file err:",err)
		return
	}
	p := Person{
     Name:"杰森",Age:40,Title:"个人网站"}
	// 输出内容到控制端
	if err := t.Execute(os.Stdout,p);err != nil {
		fmt.Println("THIS IS ERROR:",err.Error())
	}
}
```

`index.html`

```java
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <!-- 点表示当前结构体 -->
    <title>{
    {.Title}}</title>
</head>
<body>
    <h2>{
    {.Name}}</h2>
    <h2>{
    {.Age}}</h2>
</body>
</html>
```

**运行 main.go 看是否能引用 index.html 模板，读取 Person 结构体信息**

```java
D:\goproject\src\dev_code\template>go run main.go
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>个人网站</title>
</head>
<body>
    <h2>杰森</h2>
    <h2>40</h2>
</body>
</html>
```

**示例：在 web 页面展示**

main.go

```java
package main
import (
	"fmt"
	"html/template"
	"net/http"
)
type Person struct {
	Name string
	Age int
	Title string
}
// 模板变量
var myTemplate *template.Template
// HTTP 服务端配置
func userInfo(res http.ResponseWriter, req *http.Request) {
	fmt.Print("user login")
	fmt.Fprintf(res,"<h1>成功登录</h1>")
	p := Person {
		Name: "杰森",
		Age: 40,
		Title: "个人网站",
	}
	myTemplate.Execute(res,p)
}
// 模板函数
func initTemplate(filename string) (err error) {
	// 读取模板文件
	myTemplate,err = template.ParseFiles(filename)
	if err != nil {
		fmt.Println("parse file err：",err)
		return
	}
	return
}
func main() {
	// 初始化模板
	initTemplate("index.html")
	// 路由到站点，调用业务处理函数
	http.HandleFunc("/user/info",userInfo)
	err := http.ListenAndServe("0.0.0.0:8888",nil)
	if err != nil {
		fmt.Println("HTTP LISTEN FAILED")
	}
}
```

index.html

```java
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>{
    {.Title}}</title>
</head>
<body>
    <h1>template_http</h1>
    <h2>{
    {.Name}}</h2>
    <h2>{
    {.Age}}</h2>
</body>
</html>
```

`示例：写入到日志文件`

```java
package main
import (
	"fmt"
	"html/template"
	"net/http"
	"os"
)
type Person struct {
	Name string
	Age int
	Title string
}
// 模板变量
var myTemplate *template.Template
// HTTP 服务端配置
func userInfo(res http.ResponseWriter, req *http.Request) {
	// 实例化 Person
	p := Person {
		Name: "杰森",
		Age: 40,
		Title: "个人网站",
	}
	file,err := os.OpenFile("log.txt",os.O_CREATE|os.O_WRONLY,0755)
	if err != nil {
		fmt.Println("文件加载失败,err:",err)
		return
	}
    // 写入文件
	myTemplate.Execute(file,p)
    // 写入浏览器
    // myTemplate.Execute(res,p)
}
// 模板函数
func initTemplate(filename string) (err error) {
	// 读取模板文件
	myTemplate,err = template.ParseFiles(filename)
	if err != nil {
		fmt.Println("模板加载失败：",err)
		return
	}
	return
}
func main() {
	// 初始化模板
	initTemplate("index.html")
	// 路由到站点，调用业务处理函数
	http.HandleFunc("/user/info",userInfo)
	err := http.ListenAndServe("0.0.0.0:8888",nil)
	if err != nil {
        fmt.Println("HTTP LISTEN FAILED,err:",err)
        return
	}
}
```

**示例：模板逻辑（接上写入日志文件）**

index.html

```java
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>{
     {
     .Title}}</title>
</head>
    <body>
        {
     {
     if gt .Age 18}}
        <h2>hello,old man,姓名:{
     {
     .Name}},年龄:{
     {
     .Age}}</h2>
        {
     {
     else}}
        <h2>hello,young man,姓名:{
     {
     .Name}},年龄:{
     {
     .Age}}</h2>
        {
     {
     end}}
    </body>
</html>
```

运行main.go，浏览器访问生成日志文件。

**写到浏览器中，去掉 myTemplate.Execute(res,p) 注释**

**模板逻辑语句结构**

```java
1. not 非
{
    {if not .condition}}
{
    {end}}
2. and 与
{
    {if and .condition1 .condition2}}
3. or 或
{
    {if or .condition1 .condition2}}
{
    {end}}
4. eq 等于
{
    {if eq .var1 .var2}}
{
    {end}}
5. ne 不等于
{
    {if ne .var1 .var2}}
{
    {end}}
6. lt 小于
{
    {if lt .var1 .var2}}
{
    {end}}
7. le 小于等于
{
    {if le .var1 .var2}}
{
    {end}}
8. gt 大于
{
    {if gt .var1 .var2}}
{
    {end}}
9. ge 大于等于
{
    {if ge .var1 .var2}}
{
    {end}}
10. 当使用 with 指定变量，则 {
    {.}} 就表示该变量值
{
    {with .Name}}
<h2>hello,old man,{
    {.}}</h2>
{
    {end}}
```

**示例：使用 with**

```java
<html>
    <head>
        <title>{
    {.Title}}</title>
    </head>
    <body>
        {
    {with .Name}}
        <h2>姓名是{
    {.}}</h2>
        {
    {end}}
    </body>
</html>
```

运行结果

**示例模板：循环结构 { {range .}} { {end}}**

main.go

```java
package main
import (
	"fmt"
	"html/template"
	"net/http"
)
type Person struct {
	Name string
	Age int
	Title string
}
// 模板变量
var myTemplate *template.Template
// HTTP 服务端配置
func userInfo(res http.ResponseWriter, req *http.Request) {
    fmt.Print("user login")
    fmt.Fprintf(res,"<h1>成功登录</h1>")
    // 定义 Person 切片
    var arr []Person
    p1 := Person{
     Name: "zhangsan",Age: 18,Title: "个人网站"}
    p2 := Person{
     Name: "lisi",Age: 20,Title: "个人网站"}
    p3 := Person{
     Name: "wangwu",Age: 22,Title: "个人网站"}
    arr = append(arr,p1)
    arr = append(arr,p2)
    arr = append(arr,p3)
    myTemplate.Execute(res,arr)
}
// 模板函数
func initTemplate(filename string) (err error) {
	// 读取模板文件
	myTemplate,err = template.ParseFiles(filename)
	if err != nil {
		fmt.Println("模板加载失败：",err)
		return
	}
	return
}
func main() {
	// 初始化模板
	initTemplate("index.html")
	// 路由到站点，调用业务处理函数
	http.HandleFunc("/user/info",userInfo)
	err := http.ListenAndServe("0.0.0.0:8888",nil)
	if err != nil {
        fmt.Println("HTTP LISTEN FAILED,err:",err)
        return
	}
}
```

index.html

```java
<html>
    <head>
        <title>个人页面</title>
    </head>
    <body>
        <table border="1">
            {
    {range .}}
            <tr>
                <td>{
    {.Name}}</td><td>{
    {.Age}}</td><td>{
    {.Title}}</td>
            </tr>
            {
    {end}}
        </table>
    </body>
</html>
```

运行结果

## 6. Mysql

**Windows 安装 mysql**

`cmd 设置代理地址，最好写进环境变量`

```java
go env -w GOPROXY=https://proxy.golang.com.cn,direct
go env -w G0111MODULE=off	#这个也要
```

`下载安装包`

```java
wget http://49.232.8.65/mysql-5.7/mysql-5.7.17.msi
```

`双击安装`

…

密码要自己记得，我先前安装过 mysql，用的 123456

`添加环境变量`

`安装navicat`

user_id 要设置自动递增，点击保存。

`安装git bash`

设置git 环境变量

`在Go 工作目录下安装 go 的 mysql 连接驱动`

```java
go get github.com/go-sql-driver/mysql
go get github.com/jmoiron/sqlx
```

安装需要等待时间较长，如果网络不稳定，需要多试几次。

验证：能导入说明成功，github.com 可能生成，也可能不生成。

如果安装失败处理办法如下:

```java
PS D:\goproject> go env -w GO111MODULE=on 
PS D:\goproject> go mod init goproject   
go: creating new go.mod: module goproject
go: to add module requirements and sums:
        go mod tidy
PS D:\goproject> go env -w GO111MODULE=off
PS D:\goproject> go get github.com/go-sql-driver/mysql
PS D:\goproject> go get github.com/jmoiron/sqlx     
PS D:\goproject> go env -w GO111MODULE=on
PS D:\goproject> go get github.com/go-sql-driver/mysql
go: added github.com/go-sql-driver/mysql v1.6.0
PS D:\goproject> go get github.com/jmoiron/sqlx
go: added github.com/jmoiron/sqlx v1.3.5 
```

[go数据库的增删改查](https://www.cnblogs.com/neozheng/p/11355592.html)

`示例：添加数据(增insert)`

```java
package main
import (
	"fmt"
	"github.com/jmoiron/sqlx"
	_ "github.com/go-sql-driver/mysql"
)
type Person struct {
	// TAG 原信息就是表中定义的属性名，db 是随意的
	UserId	 int    db:"user_id"
	UserName string db:"username"
	Sex      string db:"sex"
	Email    string db:"email"
}
// 数据库结构体
var DB *sqlx.DB
func init() {
	// 连接数据库 --- "用户名:密码@协议(地址:端口)/数据库名"
	// 生产环境密码单独写在配置文件中，使用 MD5 加密
	database,err := sqlx.Open("mysql","root:123456@tcp(127.0.0.1:3306)/school")
	if err != nil {
		fmt.Println("open mysql failed,",err)
		return
	}
	DB = database
}
func main() {
	// 数据插入
	// user_id 如果设置为自增的，则不需要指定
	result,err := DB.Exec("insert into person (username,sex,email) values(?,?,?)","stu01","boy","stu01@qq.com")
	if err != nil {
		fmt.Println("数据写入失败,",err)
		return
	}
	// 获取上一条插入数据的 id
	id,err := result.LastInsertId()
	if err != nil {
		fmt.Println("获取结果失败,",err)
		return
	}
	fmt.Println("data insert success",id)
    if id != 0 {
		fmt.Println("数据写入成功")
		return
	}
}
```

运行结果，在 navicat 里按 F5 刷新

```java
mysql> select * from person;
+---------+----------+------+--------------+
| user_id | username | sex  | email        |
+---------+----------+------+--------------+
|       1 | stu01    | boy  | stu01@qq.com |
+---------+----------+------+--------------+
1 row in set (0.00 sec)
```

`示例：查询数据(查select)`

```java
package main
import (
	"fmt"
	"github.com/jmoiron/sqlx"
	_ "github.com/go-sql-driver/mysql"
)
type Person struct {
	// TAG 原信息就是表中定义的属性名，db 是随意的
	UserId	 int    db:"user_id"
	UserName string db:"username"
	Sex      string db:"sex"
	Email    string db:"email"
}
// 数据库结构体
var DB *sqlx.DB
func init() {
	// 连接数据库 --- "用户名:密码@协议(地址:端口)/数据库名"
	// 生产环境密码单独写在配置文件中，使用 MD5 加密
	database,err := sqlx.Open("mysql","root:123456@tcp(127.0.0.1:3306)/school")
	if err != nil {
		fmt.Println("open mysql failed,",err)
		return
	}
	DB = database
}
func main() {
	// 定义获取数据的切片，用来装载查询结果
	var person []Person
	err := DB.Select(&person,"select user_id,username,sex,email from person where user_id=?",1)
	if err != nil {
		fmt.Println("查询数据失败,",err)
		return
	}
	fmt.Println("查询的数据:",person)
}
```

运行结果

```java
查询的数据: [{
     1 stu01 boy stu01@qq.com}]
```

`示例：修改数据(改update)`

```java
package main
import (
	"fmt"
	"github.com/jmoiron/sqlx"
	_ "github.com/go-sql-driver/mysql"
)
type Person struct {
	// TAG 原信息就是表中定义的属性名，db 是随意的
	UserId	 int    db:"user_id"
	UserName string db:"username"
	Sex      string db:"sex"
	Email    string db:"email"
}
// 数据库结构体
var DB *sqlx.DB
func init() {
	// 连接数据库 --- "用户名:密码@协议(地址:端口)/数据库名"
	// 生产环境密码单独写在配置文件中，使用 MD5 加密
	database,err := sqlx.Open("mysql","root:123456@tcp(127.0.0.1:3306)/school")
	if err != nil {
		fmt.Println("open mysql failed,",err)
		return
	}
	DB = database
}
func main() {
	// 数据修改
	_,err := DB.Exec("update person set username=? where user_id=?", "zc",2)
	if err != nil {
		fmt.Println("修改失败,",err)
		return
	}
    fmt.Println("update succ")
}
```

执行结果

`示例：删除数据(dalete)`

```java
package main
import (
	"fmt"
	"github.com/jmoiron/sqlx"
	_ "github.com/go-sql-driver/mysql"
)
type Person struct {
	// TAG 原信息就是表中定义的属性名，db 是随意的
	UserId	 int    db:"user_id"
	UserName string db:"username"
	Sex      string db:"sex"
	Email    string db:"email"
}
// 数据库结构体
var DB *sqlx.DB
func init() {
	// 连接数据库 --- "用户名:密码@协议(地址:端口)/数据库名"
	// 生产环境密码单独写在配置文件中，使用 MD5 加密
	database,err := sqlx.Open("mysql","root:123456@tcp(127.0.0.1:3306)/school")
	if err != nil {
		fmt.Println("open mysql failed,",err)
		return
	}
	DB = database
}
func main() {
	// 数据修改
	_,err := DB.Exec("delete from person where user_id=?",2)
	if err != nil {
		fmt.Println("删除失败,",err)
		return
	}
	fmt.Println("delete succ")
}
```

执行结果

`示例：在 web 获取后台数据库信息(在表单中根据 id 读取信息)`

```java
package main
import (
	"fmt"
	_ "github.com/go-sql-driver/mysql"
	"github.com/jmoiron/sqlx"
	"io"
	"net/http"
	"strconv"
)
//定义页面表单html
const form = `<html>` `<head>` `</head>` `<body>`
	<form action="#" method="post" name="bar">
		<input type="test" name="in"/>
		<input type="submit" value="search"/>
	`</form>` `</body>` `</html>`
type Person struct {
	// TAG 原信息就是表中定义的属性名，db 是随意的
	UserId	 int    db:"user_id"
	UserName string db:"username"
	Sex      string db:"sex"
	Email    string db:"email"
}
// 数据库结构体
var DB *sqlx.DB
//form表单处理
func formServer(res http.ResponseWriter, req *http.Request) {
	//头部申明
	res.Header().Set("Content-Type", "text/html")
	//类型判断
	switch req.Method {
	case "GET":
		io.WriteString(res, form)
	case "POST":
		req.ParseForm()
		// 获取 form 框体中的数据，转换成 int 类型
		id,err := strconv.Atoi(req.Form["in"][0])
		if err != nil {
			fmt.Println("数据类型转换失败,err:",err)
			return
		}
		// 定义获取数据的切片，用来装载查询结果
		var person []Person
		err = DB.Select(&person,"select user_id,username,sex,email from person where user_id=?",id)
		if err != nil {
			fmt.Println("查询数据失败,",err)
			return
		}
		// 获取查询结果信息
		for _,v := range person {
			io.WriteString(res,strconv.Itoa(v.UserId))
			io.WriteString(res,"\n")
			io.WriteString(res,v.UserName)
			io.WriteString(res,"\n")
			io.WriteString(res,v.Sex)
			io.WriteString(res,"\n")
			io.WriteString(res,v.Email)
			io.WriteString(res,"\n")
		}
	}
}
func init() {
	// 连接数据库 --- "用户名:密码@协议(地址:端口)/数据库名"
	// 生产环境密码单独写在配置文件中，使用 MD5 加密
	database,err := sqlx.Open("mysql","root:123456@tcp(127.0.0.1:3306)/school")
	if err != nil {
		fmt.Println("open mysql failed,",err)
		return
	}
	DB = database
}
func main() {
	http.HandleFunc("/mysql",formServer)
	if err := http.ListenAndServe("127.0.0.1:8088",nil);err != nil {
		fmt.Println("启动监听失败,err:",err)
		return
	}
}
```

在文本框输入 id，运行结果

`示例：在 web 插入信息到数据库中`

```java
package main
import (
	"fmt"
	_ "github.com/go-sql-driver/mysql"
	"github.com/jmoiron/sqlx"
	"io"
	"net/http"
	"strconv"
)
//定义页面表单html
const form = `<!doctype html>`
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport"
          content="width=device-width, user-scalable=no, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>Document</title>
</head>
<body>
<form action="#" method="post" name="bar">
    <p>user_id<input type="test" name="in"/></p>
    <p>username<input type="test" name="in"/></p>
    <p>sex<input type="test" name="in"/></p>
    <p>email<input type="test" name="in"/></p>
    <input type="submit" value="insert"/>
</form>
</body>
`</html>`
type Person struct {
	// TAG 原信息就是表中定义的属性名，db 是随意的
	UserId	 int    db:"user_id"
	UserName string db:"username"
	Sex      string db:"sex"
	Email    string db:"email"
}
// 数据库结构体
var DB *sqlx.DB
//form表单处理
func formServer(res http.ResponseWriter, req *http.Request) {
	//头部申明
	res.Header().Set("Content-Type", "text/html")
	//类型判断
	switch req.Method {
	case "GET":
		io.WriteString(res, form)
	case "POST":
		req.ParseForm()
		// 向数据库插入数据
		h,_ := strconv.Atoi(req.Form["in"][0])
		i := req.Form["in"][1]
		j := req.Form["in"][2]
		k := req.Form["in"][3]
		result,err := DB.Exec("insert into person (user_id,username,sex,email) values(?,?,?,?)",h,i,j,k)
		if err != nil {
			fmt.Println("查询插入失败,",err)
			return
		}
		// 获取上一条插入数据的 id
		num,err := result.LastInsertId()
		if err != nil {
			fmt.Println("获取结果失败,",err)
			return
		}
		fmt.Println("data insert success",num)
		if num != 0 {
			fmt.Println("数据写入成功")
			return
		}
	}
}
func init() {
	// 连接数据库 --- "用户名:密码@协议(地址:端口)/数据库名"
	// 生产环境密码单独写在配置文件中，使用 MD5 加密
	database,err := sqlx.Open("mysql","root:123456@tcp(127.0.0.1:3306)/school")
	if err != nil {
		fmt.Println("open mysql failed,",err)
		return
	}
	DB = database
}
func main() {
	http.HandleFunc("/mysql",formServer)
	if err := http.ListenAndServe("127.0.0.1:8088",nil);err != nil {
		fmt.Println("启动监听失败,err:",err)
		return
	}
}
```

`示例：在 web 更新数据库中的信息`

```java
package main
import (
	"fmt"
	_ "github.com/go-sql-driver/mysql"
	"github.com/jmoiron/sqlx"
	"io"
	"net/http"
	"strconv"
)
//定义页面表单html
const form = `<!doctype html>`
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport"
          content="width=device-width, user-scalable=no, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>Document</title>
</head>
<body>
<form action="#" method="post" name="bar">
	<p>user_id<input type="test" name="in"/></p>
    <p>username<input type="test" name="in"/></p>
    <input type="submit" value="update"/>
</form>
</body>
`</html>`
type Person struct {
	// TAG 原信息就是表中定义的属性名，db 是随意的
	UserId	 int    db:"user_id"
	UserName string db:"username"
	Sex      string db:"sex"
	Email    string db:"email"
}
// 数据库结构体
var DB *sqlx.DB
//form表单处理
func formServer(res http.ResponseWriter, req *http.Request) {
	//头部申明
	res.Header().Set("Content-Type", "text/html")
	//类型判断
	switch req.Method {
	case "GET":
		io.WriteString(res, form)
	case "POST":
		req.ParseForm()
		id,err := strconv.Atoi(req.Form["in"][0])
		if err != nil {
			fmt.Println("数据类型转换失败,err:",err)
			return
		}
		rename := req.Form["in"][1]
		// 更新数据
		_,err = DB.Exec("update person set username=? where user_id=?",rename,id)
		if err != nil {
			fmt.Println("update data err:",err)
			return
		} else {
			io.WriteString(res,"update succ")
		}
	}
}
func init() {
	// 连接数据库 --- "用户名:密码@协议(地址:端口)/数据库名"
	// 生产环境密码单独写在配置文件中，使用 MD5 加密
	database,err := sqlx.Open("mysql","root:123456@tcp(127.0.0.1:3306)/school")
	if err != nil {
		fmt.Println("open mysql failed,",err)
		return
	}
	DB = database
}
func main() {
	http.HandleFunc("/mysql",formServer)
	if err := http.ListenAndServe("127.0.0.1:8088",nil);err != nil {
		fmt.Println("启动监听失败,err:",err)
		return
	}
}
```

`示例：在 web 删除数据库中的信息`

```java
package main
import (
	"fmt"
	_ "github.com/go-sql-driver/mysql"
	"github.com/jmoiron/sqlx"
	"io"
	"net/http"
	"strconv"
)
//定义页面表单html
const form = `<!doctype html>`
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport"
          content="width=device-width, user-scalable=no, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>Document</title>
</head>
<body>
<form action="#" method="post" name="bar">
    <input type="test" name="in"/>
    <input type="submit" value="delete"/>
</form>
</body>
`</html>`
type Person struct {
	// TAG 原信息就是表中定义的属性名，db 是随意的
	UserId	 int    db:"user_id"
	UserName string db:"username"
	Sex      string db:"sex"
	Email    string db:"email"
}
// 数据库结构体
var DB *sqlx.DB
//form表单处理
func formServer(res http.ResponseWriter, req *http.Request) {
	//头部申明
	res.Header().Set("Content-Type", "text/html")
	//类型判断
	switch req.Method {
	case "GET":
		io.WriteString(res, form)
	case "POST":
		req.ParseForm()
		id,err := strconv.Atoi(req.Form["in"][0])
		if err != nil {
			fmt.Println("数据类型转换失败,err:",err)
			return
		}
		// 删除数据
		_,err = DB.Exec("delete from person where user_id=?",id)
		if err != nil {
			fmt.Println("delete data,err:",err)
			return
		} else {
			io.WriteString(res,"del succ")
		}
	}
}
func init() {
	// 连接数据库 --- "用户名:密码@协议(地址:端口)/数据库名"
	// 生产环境密码单独写在配置文件中，使用 MD5 加密
	database,err := sqlx.Open("mysql","root:123456@tcp(127.0.0.1:3306)/school")
	if err != nil {
		fmt.Println("open mysql failed,",err)
		return
	}
	DB = database
}
func main() {
	http.HandleFunc("/mysql",formServer)
	if err := http.ListenAndServe("127.0.0.1:8088",nil);err != nil {
		fmt.Println("启动监听失败,err:",err)
		return
	}
}
```
