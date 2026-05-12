# 10、Golang 教程 - 错误处理和资源管理
- 来源：https://ddkk.com/zhuanlan/other/golang/3/10.html
- 分类：其他语言
- 分组：教程目录
## defer调用

- 确保调用在函数结束时执行
- 参数在调用defer语句时计算,然后押入栈中

```java
func tryDefer() {
	for i := 0; i < 30; i++ {
		defer fmt.Println(i) 
		//29
		//28
		//27
		//26
		//....
		//1
		//0
	}
}
```

- defer列表是一个栈结构，后进先出，

```java
func tryDefer() {
	defer fmt.Println(3)
	defer fmt.Println(2)
	fmt.Println(1)
	//1
	//2
	//3
}
//...
func tryDefer() {
	defer fmt.Println(3)
	defer fmt.Println(2)
	fmt.Println(1)
	panic("error")
	fmt.Println(5)
	//1
	//2
	//3
	//panic: error
}
```

- defer的调用的一般情况
- `Open\Close`
- `Lock\Unlock`
- `PrintHeader\PrintFooter`

```java
func writeFile(filename string) {
	file, err := os.Create(filename)
	if err != nil {
		panic("error")
	}
	defer file.Close()  // 关闭文件
	writer := bufio.NewWriter(file)
	defer writer.Flush() // 把缓存的数据刷到文件中去
	f := fib.Fibonacci()
	for i:=0;i<20;i++{
		fmt.Fprintln(writer,f())
	}
}
func main() {
	writeFile("fib.txt")
}
```

## 错误处理

```java
type error interface {
	Error() string
}
//....
func writeFile(filename string) {
	file, err := os.OpenFile(filename, os.O_EXCL|os.O_CREATE, 0666)
	//err = errors.New("this is a custom error") // 可以自己定义一个error
	if err != nil {
		//fmt.Println("error",err.Error()) //error open fib.txt: file exists
		//return
		if pathError, ok := err.(*os.PathError); !ok {
      //判断err是否为指定类型
			panic(err)
		} else {
			fmt.Println(pathError.Op,  //open
				pathError.Path, //fib.txt
				pathError.Err) //file exists
		}
		return
	}
	defer file.Close()
	writer := bufio.NewWriter(file)
	defer writer.Flush() // 把缓存的数据刷到文件中去
	f := fib.Fibonacci()
	for i := 0; i < 20; i++ {
		fmt.Fprintln(writer, f())
	}
}
func main() {
	writeFile("fib.txt")
}
```

## 补充：类型断言

```java
  <目标类型的值>，<布尔参数> := <表达式>.( 目标类型 ) // 安全类型断言
  <目标类型的值> := <表达式>.( 目标类型 )  //非安全类型断言
```

类型断言的本质，跟类型转换类似，都是类型之间进行转换，不同之处在于，类型断言是在**接口**之间进行，相当于在Java中，对于一个对象，把一种接口的引用转换成另一种。

```java
func test6() {
    var i interface{
     } = "kk"
    j := i.(int) //把i转换成int类型 系统内部检测到不匹配 会调用panic 抛出异常
    fmt.Printf("%T->%d\n", j, j)
}
func test6() {
    var i interface{
     } = "TT"
    j, ok := i.(int)
    if ok {
      //安全类型的断言
        fmt.Printf("%T->%d\n", j, j)
    } else {
        fmt.Println("类型不匹配")
    }
}
```

## 服务器错误统一处理

```java
func main() {
	http.HandleFunc("/list/", func(writer http.ResponseWriter, request *http.Request) {
		path := request.URL.Path[len("/list/"):]
		file, err := os.Open(path)
		if err != nil {
			//访问 ： http://localhost:8888/list/fib.txta
			//open fib.txta: no such file or directory
			// 这样会把我们服务器内部错误暴露给客户端，这样做不好
			// 而且这个本来是一个业务逻辑，不要把错误处理和业务逻辑耦合在一起，把业务逻辑和错误处理分开
			http.Error(writer,err.Error(),http.StatusInternalServerError)
			return
		}
		defer file.Close()
		all, err := ioutil.ReadAll(file)
		if err != nil {
			panic(err)
		}
		writer.Write(all)
	})
	err := http.ListenAndServe(":8888", nil)
	if err != nil {
		panic(err)
	}
}
```

- 错误统一处理

```java
package main
import (
	"learn2/learnerror/server"
	"net/http"
	"os"
)
//  定义一下这个函数类型
type appHandle func(writer http.ResponseWriter, request *http.Request) error
// 错误统一处理 函数式编程，入参是一个函数，出参也是一个函数
func errorWrapper(handle appHandle) func(http.ResponseWriter, *http.Request) {
	return func(writer http.ResponseWriter, request *http.Request) {
		err := handle(writer, request)
		if err != nil {
      // 错误统一处理
			code := http.StatusOK
			switch {
			case os.IsNotExist(err):
				code = http.StatusNotFound
			default:
				code = http.StatusInternalServerError
			}
			http.Error(writer, http.StatusText(code), code)
		}
	}
}
func main() {
	// 用errorWrapper包装一下这个业务逻辑函数
	http.HandleFunc("/list/", errorWrapper(server.HandleFileList))
	err := http.ListenAndServe(":8888", nil)
	if err != nil {
		panic(err)
	}
}
// 业务逻辑
package server
import (
	"io/ioutil"
	"net/http"
	"os"
)
// 把业务逻辑分离开来，如果有错误，就返回一个错误，
func HandleFileList(writer http.ResponseWriter, request *http.Request) error {
	path := request.URL.Path[len("/list/"):]
	file, err := os.Open(path)
	if err != nil {
		return err
	}
	defer file.Close()
	all, err := ioutil.ReadAll(file)
	if err != nil {
		return err
	}
	writer.Write(all)
	return nil // 没有错误返回nil
}
```

## panic 和 recover

### panic

- 不要经常用panic，和其他语言的throw差不多
- 停止当前函数的执行
- 一直向上返回，执行每一层的defer
- 如果没有遇见recover，程序退出

### recover

- 仅在defer调用中使用
- 获取panic的值
- 如果无法处理，可以重新panic

```java
func tryRecover(){
	defer func(){
      // func(){} 只是一个函数体， 要运行这个函数要在后面加上()
		r := recover() //recover只能在defer中调用
		if r == nil {
      // 如果没有异常  r为nil
			return
		}
		if error, ok := r.(error); ok {
			fmt.Println(error.Error())
		}else {
			panic(r) //不知道怎么处理 可以继续panic
		}
	}()
	panic(errors.New("error"))
	// panic(124)//这个因为不是错误 defer中会继续抛出
}
func main() {
		tryRecover()
}
```

## 服务器错误统一处理2

```java
package main
import (
	"learn2/learnerror/server"
	"net/http"
	"os"
)
//  定义一下这个函数类型
type appHandle func(writer http.ResponseWriter, request *http.Request) error
// 错误统一处理 函数式编程，入参是一个函数，出参也是一个函数
func errorWrapper(handle appHandle) func(http.ResponseWriter, *http.Request) {
	return func(writer http.ResponseWriter, request *http.Request) {
		//虽然说http里面发生错误会自己recover 但是我们还是自己做下处理比较好
		defer func() {
      // 匿名函数的写法
			r := recover()
			if r != nil {
				http.Error(writer,http.StatusText(http.StatusInternalServerError),http.StatusInternalServerError)
				return
			}
		}()
		err := handle(writer, request)
		if err != nil {
      // 错误统一处理
			// 我们自己定义的错误，有一些要返回给用户，可以这样做
			if userError,ok:= err.(userError);ok{
       //判断err是否属于某个接口类型
				 http.Error(writer,userError.Error(),http.StatusBadRequest)
				 return
			}
			code := http.StatusOK
			switch {
			case os.IsNotExist(err):
				code = http.StatusNotFound
			default:
				code = http.StatusInternalServerError
			}
			http.Error(writer, http.StatusText(code), code)
		}
	}
}
// 用户可以看到的error类型
// 接口
type userError interface {
	error
	Message() string
}
func main() {
	// 用errorWrapper包装一下这个业务逻辑函数
	// 让 / 下的网页都可以访问，
	http.HandleFunc("/", errorWrapper(server.HandleFileList))
	err := http.ListenAndServe(":8888", nil)
	if err != nil {
		panic(err)
	}
}
//
package server
import (
	"io/ioutil"
	"net/http"
	"os"
	"strings"
)
type userError string
func (e userError) Error() string {
	return e.Message()
}
func (e userError) Message() string {
	return string(e)
}
// 把业务逻辑分离开来，如果有错误，就返回一个错误，
const prefix = "/list/"
func HandleFileList(writer http.ResponseWriter, request *http.Request) error {
	if strings.Index(request.URL.Path, prefix) != 0 {
     // 如果不是以list开头，我们自己抛出一个自己定义的代码
		return userError("path must start with" + prefix) //强转
	}
	path := request.URL.Path[len(prefix):] // 这里可能会切片下标越界
	file, err := os.Open(path)
	if err != nil {
		return err
	}
	defer file.Close()
	all, err := ioutil.ReadAll(file)
	if err != nil {
		return err
	}
	writer.Write(all)
	return nil // 没有错误返回nil
}
```

## error vs panic

- 意料之中使用error
- error是用于防止错误情况的问题，用error进行错误提示
- 当有的错误属于异常情况下，正常代码运行不会出现的问题的情况就需要用panic了，但是也需要进行panic的recover处理
- 意料之外使用panic
- 尽量不要使用panic
