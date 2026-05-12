# 03、Golang 教程 - 接口
- 来源：https://ddkk.com/zhuanlan/other/golang/3/3.html
- 分类：其他语言
- 分组：教程目录
## 接口

- Go语言中接口类型的独特之处在于它是满足隐式实现的。
- 我们没有必要对于给定的具体类型定义所要满足的接口类型；简单地拥有一些必需的方法就足够了。这种设计可以让你创建一个新的接口类型满足已经存在的具体类型却不会去改变这些类型的定义。当我们使用的类型来自于不受我们控制的包时这种设计时尤其有用。

### 接口约定

- 具体类型：一个具体类型可以准确的描述它所代表的值，并且展示出对类型本身的一些操作方式。
- 抽象类型: 接口类型就是一种抽象类型。他不会暴露出它所代表的对象的内部值的结构和这个对象支持的基础操作的集合。他们只会展示出他们自己的方法。

```java
type Writer interface {
	Write(p []byte) (n int , err error) // 只要一个类型实现了Write 方法 那么他就是实现了这个接口
}
type ByteCounter	int
// 实现了Writer接口
func (c	*ByteCounter) Write(p []byte) (int,	error)	{
	*c	+=	ByteCounter(len(p))	//	convert	int	to	ByteCounter		
	return	len(p),	nil 
}
```

- 接口相当于定义了函数和函数调用者之间的约定，约定好只要你传入实现了这个接口的方法，那么我保证这个函数可以正常工作。
- 一个类型可以自由的使用另一个满足相同接口的类型来进行替换被称作可替换性。

```java
// 给一个类型定义String方法，可以让它满足最广泛使用之一的接口类型fmt.Stringer
package fmt
type Stringer interface {
	String() string
}
```

### 接口类型

- 接口类型具体描述了一系列方法的集合，一个实现了这些方法的具体类型是这个接口类型的实例。

```java
package io
type Reader interface {
	Read(p []byte) (n int, err error)
}
```

- 可以通过组合已经有的接口来定义

```java
// 接口内嵌
type ReadWriter	interface	{
	Reader
	Writer
} 
// 下面的定义也可以
type ReadWriter	interface	{
	Read(p	[]byte)	(n	int,	err	error)				
	Write(p	[]byte)	(n	int,	err	error) 
}
// 或者混合定义也行
....
```

### 实现接口的条件

- 一个类型如果拥有一个接口需要的所有方法，那么这个类型就实现了这个接口
- Go语言中经常会简要吧一个具体的类型描述成一个特定的接口类型
- 接口指定的规则：表达一个类型属于某个接口只要这个类型实现了这个接口

```java
var w io.Writer
w = os.Stdout // 可以，因为os.Stdout实现了io.Writer接口 
// 也可以使用与两边都是接口类型
w = rwc // 如果rwc里面拥有w定义的方法就行了
```

- 对于每一个命名过的具体类型T；它一些方法的接收者是类型T本身然而另一些可能是一个*T的指 针。在T类型的参数上调用一个 *T的方法是合法的，编译器隐式的获取了它的地址。但是，T类型的值并不拥有任何*T指针的方法
- 所以指针类型实现了String方法不等于T类型实现了String方法

```java
var	s	IntSet 
//编译器会隐式去取s的地址，
var	_ =	s.String()	//	OK:	s	is	a	variable	and	&s	has	a	String	method
//然而，由于只有 *IntSet	类型有String方法，所以也只有 *IntSet	类型实现了fmt.Stringer接 口：
var	_	fmt.Stringer =	&s	//	OK 
var	_	fmt.Stringer =	s	//	compile	error:	IntSet	lacks	String	method
```

#### interface{}类型#

- interface{}被称为空接口类型，这个类型是不可或缺的。因为空接口类型对实现它的类型没有要求，所以我们可以将任意一个值赋给空接口类型

```java
var any interface{
     }
any =true
any =12.35
....
any = new(byte.Buffer)
```

- 因为接口的实现只依赖于一个类型有没有实现接口类型的方法，所以没有必要定义一个具体类型和它实现的接口之间的关系。

```java
//在编译期断言一个 *byte.Buffer的值实现了io.Writer接口类型
var w io.Writer = new(byte.Buffer)
```

- 因为任意*bytes.Buffer的值，甚至包括nil通过(*bytes.Buffer)(nil)进行显示的转换都实现 了这个接口，所以我们不必分配一个新的变量。并且因为我们绝不会引用变量w，我们可以使 用空标识符来进行代替。

```java
//	*bytes.Buffer	must	satisfy	io.Writer 
var	_	io.Writer = (*bytes.Buffer)(nil)
```

- 我们可以把每一个具体类型的组基于它们相同的行为可以表示成一个接口类型。
- 不像基于类的语言，他们一个类实现的接口集合需要进行显式的定义，在Go语言中我们可以在需要的时候定义一个新的抽象或者特定特点的组，而不需要修改具体类型的定义。

#### flag.Value接口#

- 帮助命令行标记定义新的符号

```java
var	period	=	flag.Duration("period",	1*time.Second,	"sleep	period")
func	main()	{
	flag.Parse()				
	fmt.Printf("Sleeping	for	%v...",	*period)		
	time.Sleep(*period)				
	fmt.Println() 
}
```

```java
package	flag
//	Value	is	the	interface	to	the	value	stored	in	a	flag. 
type	Value	interface	{
	String()	string //这个表示flag.Value也是一个fmt.Stringer
	Set(string)	error 
}
```

- 定义一个新的类型实现flag接口

```java
//	*celsiusFlag	satisfies	the	flag.Value	interface. 
// 所以celsiulFlage也是一个flag.Value类型了
type celsiusFlag	struct{
     	Celsius	}
func (f	*celsiusFlag) Set(s	string)	error	{
	var	unit string			
	var	value	float64				
	fmt.Sscanf(s,	"%f%s",	&value,	&unit)	//	no	error	check	needed				
	switch	unit	{
	case "C", "°C":								
		f.Celsius = Celsius(value)								
		return	nil			
	case "F", "°F":								
		f.Celsius = FToC(Fahrenheit(value))		
		return	nil				
	}			
	return	fmt.Errorf("invalid	temperature	%q", s) 
}
func CelsiusFlag(name	string,	value	Celsius,	usage	string)	*Celsius	{
	f	:=	celsiusFlag{
     value}				
	flag.CommandLine.Var(&f,	name,	usage)				
	return	&f.Celsius 
}
// 使用
var	temp	=	tempconv.CelsiusFlag("temp",	20.0,	"the	temperature")
func	main()	{
	flag.Parse()				
	fmt.Println(*temp) 
}
```

### 接口值

- 接口值由两个部分组成：一个具体的类型和这个类型的值。他们被称为接口的动态类型和动态值。
- 定义一个变量:

```java
var w io.Writer
```

在Go语言中，变量总是被一个定义明确的值初始化，接口类型也是;对于一个接口的零值就是它的类型和值的部分都是nil

- 一个接口值基于它的动态类型被描述为空或非空，所以这是一个空的接口值。你可以通过使 用w==nil或者w!=nil来判读接口值是否为空。调用一个空接口值上的任意方法都会产生panic:

```java
w.Write([]byte("hello"))	//	panic:	nil	pointer	dereference
```

```java
w	=	os.Stdout
```

- 这个赋值过程调用了一个具体类型到接口类型的隐式转换，这和显式的使用 io.Writer(os.Stdout)是等价的。
- 这个接口值的动态类型被设为*os.Stdout指针的类型描述符，它的动态值持有os.Stdout的拷贝；这是一个代表处理标准输出的os.File类型变量的指针.

调用一个包含`*os.File`类型指针的接口值Writer方法，使得`(*os.File).Writer`方法被调用。
- 接口值可以使用＝＝和!＝来进行比较。两个接口值相等的条件：仅当它们都是nil值或者它们的动态类型相同并且动态值也根据这个动态类型的＝＝操作相等。
- 因为接口值是可比较的，所以它 们可以用在map的键或者作为switch语句的操作数。
- 然而，如果两个接口值的动态类型相同，但是这个动态类型是不可比较的（比如切片），将它们进行比较就会失败并且panic

#### 一个包含nil指针的接口不是nil接口#

- 一个不包含任何值的nil接口值和一个刚好包含nil指针的接口值是不同的。

```java
const debug	= true
func main()	{
	var	buf	*bytes.Buffer			
	if	debug	{
		// 如果true buf正常被赋予一个bytes.Buffer					
		buf	= new(bytes.Buffer)	
	}		
	f(buf)	//	NOTE:	subtly	incorrect!			
	if	debug	{
		//	...use	buf...				
	}
}
//	If	out	is	non-nil,	output	will	be	written	to	it. 
func f(out	io.Writer)	{
	//	...do	something...				
	if	out	!=	nil	{
		out.Write([]byte("done!\n"))				
	} 
}
```

- 如果debug为true的话，buf可以正常被赋值，程序不会有错误
- 如果debug设置为false时，实际上在out.Write 方法调用时程序发生了panic：

```java
if	out	!=	nil	{
	out.Write([]byte("done!\n"))	//	panic:	nil	pointer	dereference 
}
```

- 当main函数调用函数f()时，它给f函数的out参数赋了一个*bytes.Buffer的空指针，所以out的**动态值**是nil，但是他的动态类型是*bytes.Buffer，不是nil；也就是说：out变量是一个包含空指针值的非空接口，所以防御性检查out!=nil的结果依然是true。
- 动态分配机制依然决定(*bytes.Buffer).Write的方法会被调用，但是这次的接收者的值是nil。这个方法会被调用，当它尝试去获取缓冲区时会发生panic。
- 问题在于尽管一个nil的*bytes.Buffer指针有实现这个接口的方法，它也不满足这个接口具体的行为上的要求。
- 解决方案就是将main函数中的变量buf的类型改为 io.Writer，因此可以避免一开始就将一个不完全的值赋值给这个接口

```java
var	buf	io.Writer 
if	debug	{
	buf	= new(bytes.Buffer)	//	enable	collection	of	output 
} 
f(buf) //	OK
```

### sort.Interface接口

- sort包内置的提供了根据一些排序函数来对任何序列排序的功能。Go语言的sort.Sort函数不会对具体的序列和它的元素做任何假设。相反，它使用了一个接口类型\sort.Interface·来指定通用的排序算法和可能被排序到的序列类型之间的约定。
- 一个内置的排序算法需要知道三个东西：序列的长度，表示两个元素比较的结果，一种交换两个元素的方式；

```java
package	sort
type	Interface	interface	{
	Len()	int				
	Less(i,	j	int)	bool	//	i,	j	are	indices	of	sequence	elements				
	Swap(i,	j	int) 
}
```

- 实现了上面这三个方法，就相当于实现了这个接口，就可以用sort.Sort函数进行排序。

```java
type StringSlice []string 
func (p	StringSlice) Len() int {
     	return	len(p)	} 
func (p	StringSlice) Less(i, j	int)	bool	{
     	return	p[i]	<	p[j]	} 
func (p	StringSlice) Swap(i, j	int)	{
     	p[i],	p[j]	=	p[j],	p[i]	}
```

- 然后就可以进行排序

```java
sort.Sort(StringSlice(names))
```

- sort包还提供了一个Reverse函数将排序顺序转变成逆序

```java
sort.Sort(sort.Reverse(tracks))
```

- sort包定义了一个不公开的struct类型reverse，它嵌入了一个sort.Interface。reverse的Less方法调用了内嵌的sort.Interface值的Less方法，但是通过交换索引的方式使排序结果变成逆序。

```java
package	sort
type reverse	struct{
     	Interface	}	//	that	is,	sort.Interface
func (r	reverse)	Less(i,	j	int)	bool	{
     	return	r.Interface.Less(j,	i)	}
//Reverse函数返回一个包含原有sort.Interface值的reverse类型实例
func Reverse(data	Interface)	Interface	{
     	return	reverse{
     data}	}
// reverse的另外两个方法Len 和 Swap 隐式地由原有内嵌的sort.Interface提供。
```

- 对于我们需要的每个切片元素类型和每个排序函数，我们需要定义一个新的sort.Interface实现。那么我们可以让这个struct实现一个函数，然后每次只要定义一个新的排序，而不用重写Len函数和Swap函数

```java
type customSort	struct	{
	t []*Track				
	less func(x,	y	*Track)	bool 
}
func (x	customSort)	Len()	int func	(x	customSort)	
Less(i,	j	int)	bool	{
     	return	x.less(x.t[i],	x.t[j])	} 
func	(x	customSort)	Swap(i,	j	int) {
     	x.t[i],	x.t[j] = x.t[j],	x.t[i]	}
sort.Sort(customSort{
     tracks, func(x, y *Track) bool {
	if	x.Title	!=	y.Title	{
		return	x.Title	<	y.Title			
	}		
	if	x.Year	!=	y.Year	{
		return	x.Year	<	y.Year		
	}			
	if	x.Length	!=	y.Length	{
		return	x.Length	<	y.Length			
	}		
	return	false
}})
```

- 为了使用方便，sort包为[]int,[]string和float64的正常排序提供了特定版本的函数和类型

```java
sort.Ints(values) 
sort.Strings(values) 
```

### http.Handler接口

```java
package http
type Handler interface {
	ServeHTTP(w ResponseWriter, r *Request)
}
func ListenAndServer(address string, h Handker) error
// ListenAndServe函数需要一个例如“localhost:8000”的服务器地址，和一个所有请求都可以分派的Handler接口实例。
// 它会一直运行，直到这个服务因为一个错误而失败（或者启动失败），它的返回值一定是一个非空的错误。
func main()	{
    db := database{
     "shoes":	50,	"socks": 5}				
	log.Fatal(http.ListenAndServe("localhost:8000",	db)) 
}
type dollars float32
func (d	dollars) String() string {
		return	fmt.Sprintf("$%.2f", d)	
}
type database map[string]dollars
func (db  database)	ServeHTTP(w	http.ResponseWriter, req *http.Request)	{
	switch	req.URL.Path	{
		case "/list":			
			for	item,	price	:=	range	db	{
				fmt.Fprintf(w,	"%s:	%s\n",	item,	price)								
			}				
		case "/price":								
			item :=	req.URL.Query().Get("item") //Query()会将http请求解析为一个map					
			price,	ok	:=	db[item]								
			if	!ok	{
				w.WriteHeader(http.StatusNotFound)	//	404	
				fmt.Fprintf(w,	"no	such	item:	%q\n",	item)												
				return							
			}							
			fmt.Fprintf(w,	"%s\n",	price)			
		default:							
			w.WriteHeader(http.StatusNotFound)	//	404								
			fmt.Fprintf(w,	"no	such	page:	%s\n",	req.URL)		
	} 
}	 
```

- 一般不会在同一个函数里面写太多的路径。
- net/http包提供了一个请求多路器ServeMux来简化URL和handlers的联系，一个ServeMux将一批http.Handler聚集到一个单一的http.Handler中。

```java
func main() {
	db := database{
     "shoes":50, "socks":5}
	mux := http.NewServeMux() // 请求多路器
	mux.Handle("/list", http.HandlerFunc(db.list))
	mux.Handle("/price", http.HandlerFunc(db.price))
	log.Fatal(http.ListenAndServe("localhost:8000",	mux)) 
}
type database map[string]dollars
func (db database) list(w http.ResponseWriter, req	*http.Request)	{
	for	item, price	:=	range	db	{
		fmt.Fprintf(w,	"%s:	%s\n",	item,	price)				
	}
}
func (db database)	price(w	http.ResponseWriter, req *http.Request)	{
	item	:=	req.URL.Query().Get("item")				
	price,	ok	:=	db[item]				
	if	!ok	{
		w.WriteHeader(http.StatusNotFound)	//	404		
		fmt.Fprintf(w,	"no	such	item:	%q\n",	item)		
	    return		
	}			
	fmt.Fprintf(w,	"%s\n",	price) 
}
// 两个函数都是同一种函数类型
func(w http.ResponseWriter, req *http.Request)
```

- db.list是一个实现了handler类似行为的函数，但是他部满足http.Handler接口且不能直接传给mux.Handle
- http.HandlerFunc(db.list)是一个转换而不是函数调用

```java
package	http
type HandlerFunc	func(w	ResponseWriter,	r	*Request)
func (f	HandlerFunc) ServeHTTP(w	ResponseWriter,	r	*Request)	{
	f(w,	r) 
}
```

- 这是一个有实现了接口http.Handler方法的函数类型。ServeHTTP方法的行为调用了它本身的函数。因此HandlerFunc是一个让函数值满足一个接口的适配器，这里函数和这个接口仅有的方法有相同的函数签名。
- 因为handler通过这种方式注册非常普遍，ServeMux有一个方便的HandleFunc方法

```java
mux.HandleFunc("/list",	db.list) 
mux.HandleFunc("/price",db.price)
```

- net/http包提供了一个全局的ServeMux实例DefaultServerMux和包级别的 http.Handle和http.HandleFunc函数。
- 为了使用DefaultServeMux作为服务器的主 handler，我们不需要将它传给ListenAndServe函数；nil值就可以工作。

```java
func	main()	{
	db	:=	database{
     "shoes":	50,	"socks":	5}			
	http.HandleFunc("/list",	db.list)				
	http.HandleFunc("/price",	db.price)			
	log.Fatal(http.ListenAndServe("localhost:8000",	nil)) 
}
```

## error接口

```java
package	errors
// 根据传入的错误信息返回一个新的error
// 返回一个指针类型是为了避免同样的错误提示信息被认为是相等的错误。（不同的实例）
func New(text	string)	error	{
     	return	&errorString{
     text}	}
type errorString	struct	{
     	text	string	}
func (e	*errorString)	Error()	string	{
     	return	e.text	}
// 有一个方便的封装函数
package	fmt
import	"errors"
func Errorf(format	string,	args ...interface{
     }) error	{
	return	errors.New(Sprintf(format,	args...)) 
}
```

## 类型断言

- 类型断言是一个使用在接口值上的操作。
- x.(T)被称为断言类型，这里x表示 一个接口的类型和T表示一个类型。类型断言检查它操作对象的动态类型是否和断言的类 型匹配。
- 第一种，如果断言的类型T是一个具体类型，然后类型断言检查x的动态类型是否和T相同。如果这个检查成功了，类型断言的结果是x的动态值，当然它的类型是T;如果检查失败,接下来这个 操作会抛出panic。

```java
var	w	io.Writer 
w	=	os.Stdout 
f	:=	w.(*os.File) // f	==	os.Stdout 
c	:=	w.(*bytes.Buffer)	//	panic:	interface	holds	*os.File,	not	*bytes.Buffer
```

- 第二种：如果断言的类型T是一个接口类型，然后类型断言检查是否x的动态类型满足T。 如果这个检查成功了，动态值没有获取到；这个结果仍然是一个有相同类型和值部分的接口值，但是结果有类型T。换句话说，对一个接口类型的类型断言改变了类型的表述方式，改变 了可以获取的方法集合（通常更大），但是它保护了接口值内部的动态类型和值的部分。

```java
var	w	io.Writer 
w	=	os.Stdout 
rw	:=	w.(io.ReadWriter)	//	success: *os.File has	both	Read	and	Write 
// 断言后w和rw都持有os.Stdout因此它们每个有一个动态类 型*os.File， 但是w是一个io.Writer类型只对外公开文件的Writer方法
w	=	new(ByteCounter) 
rw	=	w.(io.ReadWriter)	//	panic:	*ByteCounter	has	no	Read	method
```

- 如果断言操作的对象是一个nil接口值，那么不论被断言的类型是什么这个类型断言都会失败。我们几乎不需要对一个更少限制性的接口类型（更少的方法集合）做断言，因为它表现 的就像赋值操作一样，除了对于nil接口值的情况。
- 经常地我们对一个接口值的动态类型是不确定的，并且我们更愿意去检验它是否是一些特定 的类型。如果类型断言出现在一个预期有两个结果的赋值操作，这个操作不会在失败的时候发生panic但是代替地返回一个额外的第二个结果，这个结果是一个标识

```java
var	w	io.Writer =	os.Stdout
 f,	ok	:=	w.(*os.File)	//	success:ok,	f	==	os.Stdout 
 b,	ok	:=	w.(*bytes.Buffer)	//	failure:	!ok,	b	==	nil
```

## 基于类型断言区别错误类型

- TODO
