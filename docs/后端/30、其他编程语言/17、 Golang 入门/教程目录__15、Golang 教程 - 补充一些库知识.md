# 15、Golang 教程 - 补充一些库知识
- 来源：https://ddkk.com/zhuanlan/other/golang/3/15.html
- 分类：其他语言
- 分组：教程目录
## http

- 使用http客户端发送请求
- 使用http.Client控制请求头部
- 使用httputil简化工作

```java
func main() {
	resp, err := http.Get("http://www.baidu.com")
	if err != nil {
		panic(err)
	}
	defer resp.Body.Close()
	s, err := httputil.DumpResponse(resp, true)
	if err != nil {
		panic(err)
	}
	fmt.Printf("%s\n", s)
}
func main() {
	// 自己构造一个request 
	req,err :=http.NewRequest(http.MethodGet,"http://www.baidu.com",nil)
	// 设置头部
	req.Header.Add("User-Agent","Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1")
	// 默认的client 
	resp, err :=http.DefaultClient.Do(req)
	if err != nil {
		panic(err)
	}
	defer resp.Body.Close()
	s, err := httputil.DumpResponse(resp, true)
	if err != nil {
		panic(err)
	}
	fmt.Printf("%s\n", s)
}
/
	// 自定义Client
	//CheckRedirect 重定向会会从这里过
	client := http.Client{
     CheckRedirect: func(req *http.Request, via []*http.Request) error {
		fmt.Println(req)
		return nil
	}}
	resp, err := client.Do(req)
```

## http服务器性能分析

- import _ "net/http/pprof
- 访问/debug/pprof/
- 使用go tool pprof分析性能

```java
// 导入
import (
   "log"
   "net/http"
   _ "net/http/pprof" // _ 表示我这个代码下面没引用，但是让他具有pprof的一些功能， 防止报错加了_ 
   "os"
   "imooc.com/ccmouse/learngo/lang/errhandling/filelistingserver/filelisting"
)
```

- 然后就可以打开网页对应端口的页面看到一些性能的分析http://localhost:8888/debug/pprof/
- 额外功能点开pprof的文件，里面有一些命令 可以获取对应的数据，然后生成图，可以直观的看到性能消耗在哪里
- 性能分析图

## 其他标准库

- 可以通过命令行查看标准库godoc -http :8080, 然后访问http://localhost:8080/pkg/
- [官方标准库，中文版](https://studygolang.com/pkgdoc)
