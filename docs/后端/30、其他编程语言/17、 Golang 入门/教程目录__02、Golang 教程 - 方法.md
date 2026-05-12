# 02、Golang 教程 - 方法
- 来源：https://ddkk.com/zhuanlan/other/golang/3/2.html
- 分类：其他语言
- 分组：教程目录
## 方法

### 方法声明

- 在函数声明时，在其名字之前放上一个变量，即是一个方法。这个附加的参数会将该函数附 加到这种类型上，即相当于为这种类型定义了一个独占的方法。

```java
package geometry 
import (
	"math"
)
type Point struct {
	X,Y float64
}
type Path []Point
// 函数
func Distance(p,q Point) float64{
	return math.Hypot(q.X-p.X,q.Y-p.Y)
}
// 方法
// p 方法的接收器
func (p Point) Distance(q Point) float64 {
	return math.Hypot(q.X-p.X,q.Y-p.Y)
}
// Go语言能够给任意类型定义方法，
// 我们可以给同一个包内任意的命名类型定义方法，只要这个命名类型的底层类型不是指针或interface
func (p Path) Distance() float64 {
	//....
}
```

- 两个函数调用都是Distance，但是却没有发生冲突。
- 第一个Distance的调用 实际上用的是包级别的函数geometry.Distance，而第二个则是使用刚刚声明的Point，调用的 是Point类下声明的Point.Distance方法。

```java
	p := Point{
     1,2}
	q := Point{
     2,3}
	perim := Path{
		{
     1,1},
		{
     2,2},
	}
	fmt.Println(Distance(p,q)) // 函数调用
	fmt.Println(p.Distance(q)) // 方法调用
	// p.Distance的表达式叫做选择器，选择器也会用来选择一个struct类型的字段，由于方法和字段都在同一个命名空间，所以如果我们声明一个X的方法的话，编译器会报错。
	fmt.Println(perim.Distance()) // 方法调用
	//  编译器会更具方法的名字以及接收器来决定具体调用哪个函数
```

### 基于指针对象的方法

- 当调用一个函数的时候，会对其每一个参数值进行拷贝；接收器的对象也一样，如果这个接收器的变量太大的时候，我们可以用其指针而不是对象来声明

```java
// 这个方法名字为(*Point).ScaleBy
func  (p	*Point)	ScaleBy(factor	float64)	{
	p.X	*=	factor			
	p.Y	*=	factor
}
```

- 在现实的程序里，一般会约定如果Point这个类有一个指针作为接收器的方法，那么所有Point的方法都必须有一个指针接收器，即使是哪些并不需要这个指针接收器的函数
- 只有类型和指向他们的指针能出现在接收器的声明里的两种接收器。在声明方法的时候，如果一个类型名字本身是一个指针的话，是不允许其出现在接收器里面的

```java
type P *int 
fun (P) f() {
     } // error
```

- 调用的方法

```java
p := Point{
     1,	2}
pptr :=	&p 
pptr.ScaleBy(2)
p := Point{
     1,	2} 
(&p).ScaleBy(2) 
fmt.Println(p)	//	"{2,	4}"
//编译器会隐式地帮我们用&p去调用ScaleBy这个方
p.ScaleBy(2)
//我们不能通过一个无法取到地址的接收器来调用指针方法，比如临时变量的内存地址就无法获取得到：
Point{
     1,	2}.ScaleBy(2)	//	compile	error
```

- 总之，**不管你的method的receiver是指针类型还是非指针类型，都是可以通过指针/非指针类型 进行调用的，编译器会帮你做类型转换。**
- 在声明一个method的receiver该是指针还是非指针类型时，你需要考虑两方面：
- 这个对象本身是不是特别大，如果声明为非指针变量时，调用会产生一次拷贝；
- 如果你用指针类型作为receiver，那么你一定要注意，这种指针类型指向的始终是一块内存地址。

### Nil也是一个合法的接收器类型

```java
func (list	*IntList) Sum()	int	{
	if	list	==	nil	{
		return	0		
	}			
	return	list.Value	+	list.Tail.Sum() 
}
//可以通过引用来操作内部值，但是在方法想要修改引用本身是不会影响原始值的，比如把他置为nil，或者让这个引用指向其他的对象，调用方不会受到影响。
```

### 通过嵌入结构体来扩展类型

```java
type Point struct {
      X,Y float64 }
type ColoredPoint struct {
	Point
	Color color.RGBA
}
...
// 调用
var cp ColoredPoint
// 以下两种方法一样
cp.X = 1
cp.Point.X = 1
```

- 我们可以吧ColoredPoint类型当作接收器来调用Point里的方法，即使我们在ColoredPoint里没有声明这些方法。

```java
var	p =	ColoredPoint{
     Point{
     1,	1},	red} 
var	q =	ColoredPoint{
     Point{
     5,	4},	blue} 
fmt.Println(p.Distance(q.Point))	//	ColoredPoint类型的接收器调用Point的方法
p.ScaleBy(2) 
q.ScaleBy(2)
fmt.Println(p.Distance(q.Point))	//	"10"
// 内嵌字段你会指导编译器去生成额外的包装方法来委托已经声明好的方法
// 实现角度
//func (p ColoredPoint) Distance(q Point) float64 { 
//	return p.Point.Distance(q) 
//}
//func (p *ColoredPoint) ScaleBy(factor float64)  { 
//	p.Point.ScaleBy(factor)
//}
```

- 在类型中内嵌的匿名字段也可能是一个命名类型的指针，这种情况下字段和方法会被间接地 引入到当前的类型中，访问需要通过该指针指向的对象去取。

```java
type ColoredPoint struct {
	*Point				
	Color	color.RGBA 
}
p	:=	ColoredPoint{
     &Point{
     1,	1},	red} 
q	:=	ColoredPoint{
     &Point{
     5,	4},	blue} 
fmt.Println(p.Distance(*q.Point))	//	"5" 
```

- 一个类型可以有多个匿名类型，当编译器解析一个选择器的方法时，他会首先去找直接定义在这个类型里的方法，然后找到被内嵌的字段们引入的方法，一直递归往下找。
- 可以给匿名struct类型定义方法

```java
var	cache	=	struct	{
	sync.Mutex				
	mapping	map[string]string 
}{
	mapping : make(map[string]string), 
}
func Lookup(key	string)	string	{
	cache.Lock() // sync.Mxter的方法
	v	:=	cache.mapping[key] 
	cache.Unlock()			
	return	v
}
```

### 方法值和方法表达式

#### 方法值#

- 我们执行一个方法时，一般是：p.Distance()形式；实际上 将其分成两步来执行也是可能的。
- p.Distance叫作“选择器”，选择器会返回一个方法"值"->` 一个将方法(Point.Distance)绑定到特定接收器变量的函数。然后调用时不需要指定接收器，只要传入函数的参数即可：

```java
p := Point{
     1, 2} 
q := Point{
     4, 6}
distanceFromP := p.Distance	//	method	value 
fmt.Println(distanceFromP(q))						
scaleP	:=	p.ScaleBy	//	method	value 
scaleP(2)		
```

- 在一个包的API需要一个函数值，且调用放希望操作的是某一个绑定了对象的方法的话，方法值就派上用场了

```java
type Rocket	struct	{
     	/*	...	*/	} 
func (r	*Rocket) Launch() {
     	/*	...	*/	} 
// 传入一个方法
r	:=	new(Rocket) time.AfterFunc(10	*	time.Second,	func()	{
     	r.Launch()	})
// 直接用方法"值"传入AfterFunc的话可以更为简短
time.AfterFunc(10	*	time.Second,	r.Launch)
```

#### 方法表达式#

- 当T是一个类型时，方法表达式可能会写作T.f或者(*T).f，会返回一个函数"值"，这种函数会将其**第一个参数**用作接收器

```java
p	:=	Point{
     1,	2}
q	:=	Point{
     4,	6}
distance :=	Point.Distance	//	method	expression
fmt.Println(distance(p,	q))	 //	"5" 
fmt.Printf("%T\n",	distance)//	"func(Point,	Point)	float64"
scale	:=	(*Point).ScaleBy
scale(&p,	2) 
fmt.Println(p)	//	"{2	4}"
fmt.Printf("%T\n",	scale)	//	"func(*Point,	float64)"
```

- 这个Distance实际上是指定了Point对象为接收器的一个方法func (p Point) Distance()，通过Point.Distance得到的函数需要比实际的Distance方法多一个参数， 即其需要用第一个额外参数指定接收器，后面排列Distance方法的参数。

-下面的例子，变量op代表Point类型的addition或者 subtraction方法

```java
type Point struct{
     	X,	Y	float64	}
func (p	Point)	Add(q Point) Point {
	return	Point{
     p.X + q.X, p.Y	+ q.Y}	
} 
func (p	Point)	Sub(q	Point)	Point {
	return	Point{
     p.X - q.X, p.Y - q.Y}	
}
type Path	[]Point
func  (path	Path) TranslateBy(offset	Point,	add	bool) {
	var	op func(p, q Point)	Point	//函数格式		
	if	add	{
     	// 指定是哪个函数
		op	=	Point.Add			
	}	else	{
		op	=	Point.Sub		
	}			
	for	i	:=	range	path	{
		path[i]	=	op(path[i],	offset)	
	}
}
```

## 封装

- Go语言只有一种控制可见性的手段：大写首字母的标识符会从定义它们的包中被导出，小写字母的则不会。
- Go语言基于名字的手段使得在语言中最小的封装单元是package；无论你的代码是写在一个函数还是一个方法里， 一个struct类型的字段对同一个包的所有代码都有可见性。
- 只用来访问或修改内部变量的函数被称为setter或者getter，比如log包里的Logger 类型对应的一些函数。在命名一个getter方法时，我们通常会省略掉前面的Get前缀。

```java
package	log 
type Logger	struct	{
	flags int	
	prefix	string	
	//	...
} 
func (l	*Logger) Flags() int //getter
func (l	*Logger) SetFlags(flag	int) 
func (l	*Logger) Prefix() string //getter
func (l	*Logger) SetPrefix(prefix string)
```
