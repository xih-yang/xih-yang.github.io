# 08、Golang 教程 - 接口
- 来源：https://ddkk.com/zhuanlan/other/golang/3/8.html
- 分类：其他语言
- 分组：教程目录
## 接口

```java
// 主函数
package main
import (
	"fmt"
	"learn2/test"
)
// 返回接口类型
func getRetriever() retriever {
	return test.Retriever{
     } //由使用者来定义这个结构体是不是实现了retriever接口，而test.Retriever{}本身并没有和retriever有任何的关系
}
// 接口 接口的作用就是
// something can Get
type retriever interface{
	Get(url string) string
}
func main(){
	retriever := getRetriever() //在这里我不用每次换一个具体的实现就要改很多的代码，getRetriever返回的是一个接口类型，只要有Get的方法，下面的代码就可以运行下去
	fmt.Println(retriever.Get("https://www.imooc.com"))
}
// 以下两个方法都实现了Get方法，所以都实现了这个接口
//test
package test
type Retriever struct {
}
func (Retriever) Get(url string) string {
	return "test"
}
//infra
package infra
import (
	"io/ioutil"
	"net/http"
)
type Retriever struct {
     }
func (Retriever) Get(url string) string {
	resp,err := http.Get(url)
	if err != nil {
		panic("error")
	}
	defer resp.Body.Close()
	bytes, _ := ioutil.ReadAll(resp.Body)
	return string(bytes)
}
```

### duck typing

- duck typing是你觉得像鸭子他就是鸭子，从使用者的角度看，描述事物的外部行为而非内部行为。
- 鸭子类型是多态的一种形式，在这种形式中，不管对象属于哪个，也不管声明的具体接口是什么，只要对象实现了相应的方法，函数就可以在对象执行操作，即忽略了真正的类型，转而关注对象有没有实现所需的方法，签名和语义。
- duck typing 是动态绑定的，go语言是编译时绑定，严格来说go不是duck typing，但是从行为上属于duck typing。

#### 与其他语言对比#

- python需要运行时才知道传入的类型有没有实现对应的方法，需要注释来说明接口
- c++需要在编译时才知道，也需要注释来说明
- java没有duck typing 因为他实现接口的话就一定要实现接口的方法。
- go语言的duck typing 具有python 和 c++的灵活性，又具有java的类型检查

> java的缺点就是如果我以后还需要在某个接口里面增加某个方法，那我所有的实现这个接口的代码都要改，go就不需要
>
> 假如我写了一个类：
>
> public class AB implements A,B
>
> 我这样写很可能是因为你的C是后来才定义的。然而我已经写了implements A,B
>
> 你想把我这个class AB的instance直接传给downloader，是不行的。要想传进去要么你改（增加一个adapter)要么我改（改成implements C)
>
> Go语言在这种类似下就不需要改动，可以直接传。

### 接口的实现和定义

- go接口是由使用者定义，而不是有实现者定义，实现者可以实现他想要的任何方法，然后使用者根据判断他有没有实现某个接口的方法来定义他是不是实现了某个接口
- 接口的实现是隐式的，没有具体表明是怎么实现了接口，只要实现了接口里面的方法就可以了

### 接口值类型

- 接口变量相当于一个接口
- interface{}表示任意类型

```java
// 接口类型
type Retriever interface {
	Get(url string) string
}
//传入一个接口类型
func download(r Retriever) string {
	return r.Get("http://www.imooc.com")
}
func main() {
	var r Retriever // 让使用者来决定用哪个类型
	r = mock.Retriever{
     "mock"}
	fmt.Printf("%T %v",r,r)//mock.Retriever {mock}mock
	println(download(r))
	r = real.Retriever{
     "real"}
	fmt.Printf("%T %v",r,r)//real.Retriever {real}real
	println(download(r))
	r = &real.Retriever{
     "realPtr"}// 值类型传入指针或者值都可以
	fmt.Printf("%T %v",r,r)//*real.Retriever &{realPtr}realPtr
	println(download(r))
	r = &ptr.Retriever{
     "ptr"} // 指针类型 一定要传入地址
	fmt.Printf("%T %v",r,r)//*ptr.Retriever &{ptr}ptr
	println(download(r))
}
//real
package real
type Retriever struct {
	Content string
}
func (r Retriever) Get(url string) string {
	return r.Content
}
//ptr
package ptr
type Retriever struct {
	Content string
}
func (r *Retriever) Get(url string) string {
	return r.Content
}
```

- 接口类型也是值传递，但是接口类型可以携带实现者的指针，所以一般用接口类型的值类型就够用了，不用使用接口的指针类型
- 指针接收者实现只能以指针方式使用，值接受者就都可以。
- 接口里面包含的东西是：实现者的类型，实现者的值/指针

```java
// r.(type）获取r里面的指定类型
// Type switch
switch v := r.(type) {
	case mock.Retriever:
		println(v.Content)
	case real.Retriever:
		println(v.Content)
	case *ptr.Retriever:
		println(v.Content)
	}
// 获取到r里面的real.Retriever
// Type assertion
// .(类型名字) 获取r里面具体的类型
 v := r.(real.Retriever） // 这样如果获取不到不会报错，但是如果使用real.Retriever里面具体的方法或者类型会报错
v ，ok:= r.(real.Retriever） //一般先通过判断ok是否为true 再使用里面的东西
```

## 接口的组合

- 接口是值传递，如果想要改变类型的值的话 要传入定义为指针类型，才能改变结构体的值

```java
type Poster interface {
	Post(post string, form map[string]string)
}
// 接口组合，只要有一个struct类型实现了Get Post 他就实现了这个接口
type Server interface {
	Retriever
	Poster
}
func print(s Server) string {
	s.Get("http://...")
	s.Post("post", map[string]string{
		"aa": "bb",
		"cc": "dd",
	})
	return "ok"
}
// 同时实现Get Post 所以他是实现了server接口
package ptr
type Retriever struct {
	Content string
}
func (r *Retriever) Get(url string) string {
	return r.Content
}
// 只有指针类型才能改变r的值
func (r *Retriever) Post(post string, form map[string]string) string {
	 r.Content = form["aa"]
	 return "ok"
}
```

## 常用接口类型

- Stringer ==>` String():定义打印格式
- Reader ==>` Read
- Writer ==>` Write
- ReaderWriter
