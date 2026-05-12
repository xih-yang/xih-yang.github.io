# 18、Golang 教程 - 结构体和方法
- 来源：https://ddkk.com/zhuanlan/other/golang/2/18.html
- 分类：其他语言
- 分组：教程目录
## 1. 别名定义

**变量别名定义**

```java
// 有些变量太长，简化变量名
// 为了安全，隐藏原始变量名
package main
import "fmt"
// int 类型起了别名为 integer
type integer int
func main() {
    // 类型别名定义
    var i integer = 1000
    fmt.Println(i)
    var j int = 100
    // 属性不同类型，需要做强转
    j = int(i)
    fmt.Println(j)
}
// 结果
1000
1000
```

**结构体别名定义**

```java
package main
import "fmt"
type Student struct {
    Number int
}
// 结构体别名
type Stu Student
func main() {
    var a Student
    a = Student{
     30}
    var b Stu
    b = Stu{
     300}
    // 强转类型
    a = Student(b)
    fmt.Println(a)
}
// 结果
{
     300}
```

## 2. 工厂模式

创建构造体时初始化构造体，即对构造体属性变量赋初始值（**初始化赋值**）。在 Go 中没有构造函数，可以使用工厂模式来解决。

```java
package main
import "fmt"
type Student struct {
    Name string
    Age int
}
func main() {
    stu1 := new(Student)
    stu2 := NewStudent("zhangsan",20)
    fmt.Println(stu1)
    fmt.Println(stu2)
}
// 工厂模式
func NewStudent(name string, age int) *Student {
    return &Student {
        Name: name,
        Age: age,
    }
}
```

```java
&{
      0}
&{
     zhangsan 20}
```

```java
package main
import "fmt"
// 造车图纸
type Car struct {
    Name string
    Color string
}
func main() {
    var car1  = new(Car)
    fmt.Println(car1)
    var car2 = NewCar("tom","yellow")
    fmt.Println(car2)
}
// 工厂模式
func NewCar(name string, color string) *Car {
    return &Car {
        Name: name,
        Color: color,
    }
}
```

```java
&{
      }
&{
     tom yellow}
```

> 强调：
>
>
> make 用来创建 map、slice、channel
> new 用来创建值类型

## 3. Tag 原信息

跟其他语言进行对接交互时使用 JSON 格式，有些语言格式有规范大小写严格，为了使 Go 能和其他语言对接数据传输，故使用 Tag 原信息来解决。

```java
package main
import (
    "fmt"
    "encoding/json"
)
type Student struct {
    Name string
    Age int
    Score float32
}
func main() {
    // 初始化：var stu = new(Student) 也可
    var stu Student = Student {
        Name: "stu1",
        Age: 18,
        Score: 80,
    }
    // 使用 json 格式返回字节数组
    data,err := json.Marshal(stu)
    if err != nil {
        fmt.Println("json encode stu failed,err:",err)
        return
    }
    fmt.Println(data)	// 字节数组形式输出
    fmt.Println(string(data))	// 转换成字符串输出
}
```

```java
[123 34 78 97 109 101 34 58 34 115 116 117 49 34 44 34 65 103 101 34 58 49 56 44 34 83 99 111 114 101 34 58 56 48 125]
{
     "Name":"stu1","Age":18,"Score":80}
```

**JSON 格式字段名**

```java
package main
import (
    "fmt"
    "encoding/json"
)
type Student struct {
    // json 打包时字段名
    Name string json:"stu_name"
    Age int json:"stu_age"
    Score float32 json:"stu_score"
}
func main() {
     var stu Student = Student {
        Name: "stu1",
        Age: 18,
        Score: 80,
    }
    // 使用 json 格式返回字节数组
    // 使用 json 格式返回字节数组
    data,err := json.Marshal(stu)
    if err != nil {
        fmt.Println("json encode stu failed,err:",err)
        return
    }
    fmt.Println(data)	// 字节数组形式输出
    fmt.Println(string(data))	// 转换成字符串输出
}
```

```java
[123 34 115 116 117 95 110 97 109 101 34 58 34 115 116 117 49 34 44 34 115 116 117 95 97 103 101 34 58 49 56 44 34 115 116 117 95 115 99 111 114 101 34 58 56 48 125]
{
     "stu_name":"stu1","stu_age":18,"stu_score":80}
```

## 4. 匿名字段

结构体中的字段(属性)没有名称，称之为匿名字段。

```java
package main
import (
    "fmt"
)
type Cart struct {
    name string
    color string
}
type Train struct {
    // 匿名字段，实现继承关系，省略组合形式（c Cart --> Cart）
    // int 是类型，默认情况下，它的数据类型就是它的字段名称
    // java 里只有单继承，想要多继承功能需要定义成接口
    Cart	// 实现继承，单继承一个父类，多继承 N 个父类
    int		// 数据类型定义，仅能存在一次，两个 int 则冲突
}
func main() {
    var t Train
    t.name = "train"
    t.color = "blue"
    t.int = 20	// 直接调用数据类型赋值
    fmt.Println(t)
}
```

```java
{
     {
     train blue} 20}
```

继承的两个结构体中定义相同属性

```java
package main
import (
    "fmt"
)
type Cart struct {
    name string
    color string
}
type Box struct {
    color string
}
type Train struct {
    Cart
    Box
    int
}
func main() {
    var t Train
    t.name = "train"
    t.Cart.color = "blue"
    t.Box.color = "yellow"
    t.int = 20
    fmt.Println(t)
}
```

```java
{
     {
     train blue} {
     yellow} 20}
  Cart		  Box     self
```

自身定义和继承的结构体相同的属性

```java
package main
import (
    "fmt"
)
type Cart struct {
    name string
    color string
}
type Train struct {
    Cart
    int
    color string
}
func main() {
    var t Train
    t.name = "train"
    t.Cart.color = "blue"
	t.color = "green"
    t.int = 20
    fmt.Println(t)
}
```

```java
{
     {
     train blue} 20 green}
```

双继承

```java
package main
import (
	"fmt"
)
type Cart1 struct {
	name string
	color string
}
type Cart2 struct {
	name string
	color string
}
type Train struct {
	Cart1
	Cart2
}
func main() {
	var t Train
	t.Cart1.name = "train1"
	t.Cart1.color = "blue"
	t.Cart2.name = "train2"
	t.Cart2.color = "yellow"
	fmt.Println(t)
}
```

```java
{
     {
     train1 blue} {
     train2 yellow}}
Cart1		   Cart2
```

## 5. 方法

Go中的方法是作用在特定类型的变量上，因此自定义类型，都可以有方法，而不仅仅是 struct。

**语法**

```java
func (recevier type) methodName(参数列表)(返回值){
     }
```

**示例**

```java
package main
import "fmt"
type Student struct {
    Name string
    Age int
}
// 方法
// s 归属于 Student
// 传参和返回值可写可不写
func (s Student) init(name string, age int) Student {
    s.Name = name
    s.Age = age
    return s
}
func main() {
    var stu Student
    s := stu.init("zhangsan",18)
    fmt.Println(s)
}
// 结果
{
     zhangsan 18}
```

```java
package main
import "fmt"
type Student struct {
	Name string
	Age int
}
// 方法
func (s Student) chushi(name string, age int) {
	s.Name = name
	s.Age = age
}
func main() {
	var stu Student = Student{
		Name: "lisi",
		Age: 20,
	}
	stu.chushi("zhangsan",18)
	fmt.Println(stu)
}
// 结果
// struct 是值类型，函数体内的修改对外部不影响
{
     lisi 20}
```

```java
package main
import "fmt"
type Student struct {
	Name string
	Age int
}
// 方法
// 传递指针
func (s *Student) chushi(name string, age int) {
	s.Name = name
	s.Age = age
}
func main() {
	var stu Student = Student{
		Name: "lisi",
		Age: 20,
	}
    // (&stu).chushi("zhangsan",18)	指针自动转化
	stu.chushi("zhangsan",18)
	fmt.Println(stu)
}
// 结果
{
     zhangsan 18}
```

**思考：定义返回方法是否会把初始化的值给返回**

`值传递`

```java
package main
import "fmt"
type Student struct {
	Name string
	Age int
}
// 初始化方法
func (s Student) init(name string, age int) {
	s.Name = name
	s.Age = age
	fmt.Println("初始化完成")
	fmt.Println(s)
}
// 返回结构体
func (s Student) get() Student {
	return s
}
func main() {
	var stu Student
	stu.init("zhangsan",18)
	stu1 := stu.get()
	fmt.Println(stu1)
}
// 结果
初始化完成
{
     zhangsan 18}
{
      0}
```

`引用传递：要想实现封装的效果，需要使用传递指针`

```java
package main
import "fmt"
type Student struct {
	Name string
	Age int
}
// 初始化方法(类似于封装)
func (s *Student) init(name string, age int) {
	s.Name = name
	s.Age = age
	fmt.Println("初始化完成")
	fmt.Println(s)
}
// 返回结构体
// get() 是自己定义的，用来读取私有属性的内容
func (s *Student) get() Student {
	return *s
}
func main() {
	var stu Student
	stu.init("zhangsan",18)
	stu1 := stu.get()
	fmt.Println(stu1)
}
// 结果
初始化完成
&{
     zhangsan 18}
{
     zhangsan 18}
```

**传统数据类型自定义方法，做数据类型转化**

```java
// 方法可以绑定传统类型，不一定是结构体
package main
import "fmt"
type Integer int
// 传统数据类型自定义方法
func (i Integer) convert() string {
    return fmt.Sprintf("%d",i)
}
// 方法：数值类型转换成字符串
func main() {
    var i Integer
    i = 100
    s := i.convert()
    fmt.Printf("类型：%T\n值：%s\n",s,s)
}
// 结果
类型：string
值：100
```

指针传入和值传入的区别

```java
package main
import "fmt"
type Integer int
// 值传递
func (i Integer) convert() string {
    return fmt.Sprintf("%d",i)
}
// 指针传递
func (p *Integer) set(b Integer) {
    *p = b
}
func main() {
    var i Integer
    i = 100
    s := i.convert()
    fmt.Printf("类型：%T，值：%s\n",s,s)
    fmt.Printf("类型：%T，值：%d\n",i,i)
    i.set(200)
    fmt.Println(i)
}
// 结果
类型：string，值：100
类型：main.Integer，值：100
200
```

**方法继承，组合（匿名字段是组合的特殊形式）**

```java
package main
import "fmt"
// 父类结构体 Car
type Car struct {
    weight int
    name string
}
// 父方法
func (c *Car) Run() {
    fmt.Println("Running")
}
// 子结构体 Bike
type Bike struct {
    // 组合（有名字）
    c Car
    wheel int
}
// 子结构体 Train
type Train struct {
    // 匿名
    Car
    wheel int
}
func main() {
    var bike Bike
    bike.c.weight = 100
    bike.c.name = "bike"
    bike.wheel = 2
    var train Train
    train.weight = 140000
    train.name = "train"
    train.wheel = 8
    fmt.Println(bike)
    // 方法继承
    bike.c.Run()
    fmt.Println(train)
    // 方法继承
    train.Run()
}
// 结果
{
     {
     100 bike} 2}
Running
{
     {
     140000 train} 8}
Running
```
