# 19、Golang 教程 - 接口
- 来源：https://ddkk.com/zhuanlan/other/golang/2/19.html
- 分类：其他语言
- 分组：教程目录
**发现输出哪里不同**

```java
package main
import "fmt"
// 父类结构体 Car
type Car struct {
    weight int
    name string
}
// 父方法
func (c Car) Run() {
    fmt.Println("Running")
}
// 子结构体 Train
type Train struct {
    // 匿名
    Car
    wheel int
}
// 子方法
func (p Train) String() string {
    str := fmt.Sprintf("name=[%s],wheel=[%d]",p.name,p.wheel)
    return str
}
func main() {
    var train Train
    train.weight = 140000
    train.name = "train"
    train.wheel = 8
    fmt.Println(train)
    train.Run()
    fmt.Printf("%s",train)
}
/* 结果
name=[train],wheel=[8]
Running
name=[train],wheel=[8]
*/
```

## 1. 接口定义

- Interface 类型可以定义一组**方法**，不需要实现，并且不能包含任何变量，称之为接口。
- 接口不需要显示的实现，只需要一个变量，含有接口类型中的所有方法，那么这个变量就实现了这个接口，如果一个变星含有了多个 interface 类型的方法，那么这个变量就实现了多个接口。

`语法`

```java
type example interface {
    Method1(参数列表)返回值列表
    Method2(参数列表)返回值列表
    ...
}
```

`示例：空接口使用`

```java
package main
import "fmt"
// 空接口(空指针)
type Test interface{
     }
func main() {
    // 声明接口
    var t Test
    var a interface{
     }	// 等于 var a Test
    var b int
    a = b
    fmt.Printf("a 数据类型：%T\n",a)
    fmt.Printf("Test 数据类型：%T\n",t)
}
/* 结果
a 数据类型：int
Test 数据类型：<nil>
*/
```

`示例：结构体使用接口打印信息`

```java
package main
import "fmt"
type Student struct {
    Name string
    Age int
    Score float32
}
// 接口定义：接口是功能的抽象，不需要实现
type Test interface {
    Print()
}
// 指针类型实现接口（接口中的方法）
func (p *Student) Print() {
    fmt.Println("name:",p.Name)
    fmt.Println("age:",p.Age)
    fmt.Println("score:",p.Score)
}
/* 值类型实现接口
func (p Student) Print() {
    fmt.Println("name:",p.Name)
    fmt.Println("age:",p.Age)
    fmt.Println("score:",p.Score)
}
*/
func main() {
    // 定义接口变量
    var t Test
    // 结构体初始化
    var stu Student = Student {
        Name: "zhangsan",
        Age: 18,
        Score: 90,
    }
    // 结构体赋值接口
    // t = stu 是值类型使用
	t = &stu
    // 实现接口功能
	t.Print()
}
/* 结果
name: zhangsan
age: 18
score: 90
*/
```

`示例：多接口方法实现`

```java
package main
import "fmt"
type Student struct {
    Name string
    Age int
    Score float32
}
// 接口定义
type Test interface {
    Print()
    Sleep()
}
// 指针类型实现接口
func (p *Student) Print() {
    fmt.Println("name:",p.Name)
    fmt.Println("age:",p.Age)
    fmt.Println("score:",p.Score)
}
// 接口中包含多个方法，如果要使用此接口，就要实现接口中包含的所有方法
func (p *Student) Sleep() {
    fmt.Println("学生在睡觉")
}
func main() {
    var t Test
    var stu Student = Student {
        Name: "zhangsan",
        Age: 18,
        Score: 90,
    }
    // 接口应用
    t = &stu
    t.Print()
    t.Sleep()
}
/*
name: zhangsan
age: 18
score: 90
学生在睡觉
*/ 
```

## 2. 多态

`示例：为不同数据类型的实体提供统一的接口。`

```java
package main
import "fmt"
// 学生
type Student struct {
	Name string
	Age int
	Score float32
}
// 教师
type Teacher struct {
	Name string
	Age int
	Class int
}
// 接口定义
type Test interface {
	Print()
	Sleep()
}
// 学生实现接口
func (p Student) Print() {
	fmt.Println("name:",p.Name)
	fmt.Println("age:",p.Age)
	fmt.Println("score:",p.Score)
}
func (p Student) Sleep() {
	fmt.Println("学生在睡觉")
}
// 教师实现接口
func (t Teacher) Print() {
	fmt.Println("name:",t.Name)
	fmt.Println("age:",t.Age)
	fmt.Println("class:",t.Class)
}
func (t Teacher) Sleep() {
	fmt.Println("教师在休息")
}
func main() {
	var t Test
	var stu Student = Student {
		Name: "zhangsan",
		Age: 18,
		Score: 90,
	}
	var tea Teacher = Teacher {
		Name: "lisi",
		Age: 50,
		Class: 01,
	}
	// 多态表现
	t = stu
	t.Print()
	t.Sleep()
	fmt.Println("---------------------------")
	t = tea
	t.Print()
	t.Sleep()
}
/*
name: zhangsan
age: 18
score: 90
学生在睡觉
---------------------------
name: lisi
age: 50
class: 1
教师在休息
*/
```

继承关系实现多态

```java
package main
import "fmt"
// 父结构体
type Persion struct {
    Name string
    Age int
}
// 学生子结构体
type Student struct {
	Persion
	Score float32
}
// 教师子结构体
type Teacher struct {
	Persion
	Class int
}
// 接口定义
type Test interface {
	Print()
	Sleep()
}
// 学生实现接口
func (p Student) Print() {
	fmt.Println("name:",p.Name)
	fmt.Println("age:",p.Age)
	fmt.Println("score:",p.Score)
}
func (p Student) Sleep() {
	fmt.Println("学生在睡觉")
}
// 教师实现接口
func (t Teacher) Print() {
	fmt.Println("name:",t.Name)
	fmt.Println("age:",t.Age)
	fmt.Println("class:",t.Class)
}
func (t Teacher) Sleep() {
	fmt.Println("教师在休息")
}
func main() {
	var t Test
    // 学生初始化
	var stu Student
	stu.Name = "zhangsan"
	stu.Age = 18
	stu.Score = 90
    // 教师初始化
	var tea Teacher 
	tea.Name = "lisi"
	tea.Age = 50
	tea.Class = 01
	// 多态表现
	t = stu
	t.Print()
	t.Sleep()
	fmt.Println("---------------------------")
	t = tea
	t.Print()
	t.Sleep()
}
/*
name: zhangsan
age: 18
score: 90
学生在睡觉
---------------------------
name: lisi
age: 50
class: 1
教师在休息
*/
```

**综合示例：在电脑上定义一个 USB 接口，实现鼠标、U 盘存储、电扇的功能**

```java
package main
// 电脑结构体
type Computer struct {
    Brand string	// 品牌
    Price float32	// 价格
}
// USB 接口
type USB interface {
    mouse()		// 鼠标功能
    store()		// 存储
    fan()		// 风扇
}
// 接口实现
func (c Computer) mouse() {
    fmt.Println("鼠标控制")
}
func (c Computer) store() {
    fmt.Println("U 盘存储")
}
func (c Computer) fan() {
    fmt.Println("吹风扇")
}
func main() {
    // 接口变量
    var u USB
    // 笔记本初始化
    var computer Computer
    computer.Brand = "thinkpad"
    computer.Price = 5000
    // 接口调用
    u = computer
    u.mouse()
    u.store()
    u.fan()
}
/*
鼠标控制
U 盘存储
吹风扇
*/
```

`示例：多接口的实现`

```java
package main
import "fmt"
// 接口1
type Test1 interface {
    Print()
}
// 接口2
type Test2 interface {
    Sleep()
}
type Student struct {
    Name string
    Age int
}
// 多接口实现
func (s Student) Print() {
    fmt.Println("name:",s.Name)
    fmt.Println("age:",s.Age)
}
func (s Student) Sleep() {
    fmt.Println("正在睡觉")
}
func main() {
    // 接口1变量
    var t1 Test1
    // 接口2变量
    var t2 Test2
    // 初始化结构体
    var stu Student = Student {
        Name: "zhangsan",
        Age: 18,
    }
    // 多接口应用
    t1 = stu
    t2 = stu
    t1.Print()
    t2.Sleep()
}
/*
name: zhangsan
age: 18
正在睡觉
*/
```

## 3. 系统接口调用

`示例：使用接口进行排序`

**结构体切片插入**

```java
package main
import (
    "fmt"
    "math/rand"
)
// 结构体
type Student struct {
    Name string
    Age int
    Score float32
}
// 切片
type StudentArray []Student
func main() {
    // Student 切片
    var stus StudentArray
    // 生成 10 个结构体放入切片中
    for i:=0;i<10;i++ {
        var stu Student = Student {
            Name: fmt.Sprintf("stu%d",rand.Intn(100)),
            Age: rand.Intn(120),
            Score: rand.Float32()*100,
        }
        // 结构体元素存放入切片中
        stus = append(stus,stu)
    }
    // 遍历
    for _,v := range stus {
        fmt.Println(v)
    }
}
/* 结果
{stu81 87 66.45601}
{stu59 1 68.682304}
{stu25 20 9.696952}
{stu0 14 81.36399}
{stu62 89 31.805817}
{stu74 51 29.310184}
{stu37 26 20.318687}
{stu66 8 86.249146}
{stu47 67 75.2573}
{stu88 30 69.67192}
*/
```

`示例：实现排序`

API 官方地址：https://pkg.go.dev/sort#Interface

```java
package main
import (
    "fmt"
    "math/rand"
    "sort"
)
// 结构体
type Student struct {
    Name string
    Age int
    Score float32
}
// 切片
type StudentArray []Student
// 实现 sort 接口
func (sa StudentArray) Len() int {
    return len(sa)
}
func (sa StudentArray) Less(i,j int) bool {
    return sa[i].Name > sa[j].Name	// < 升序
}
func (sa StudentArray) Swap(i,j int) {
    sa[i],sa[j]=sa[j],sa[i]
} 
func main() {
    // Student 切片
    var stus StudentArray
    // 生成 10 个结构体放入切片中
    for i:=0;i<10;i++ {
        var stu Student = Student {
            Name: fmt.Sprintf("stu%d",rand.Intn(100)),
            Age: rand.Intn(120),
            Score: rand.Float32()*100,
        }
        // 结构体元素存放入切片中
        stus = append(stus,stu)
    }
    // 遍历
    for _,v := range stus {
        fmt.Println(v)
    }
    fmt.Println("--------------------")
    // 排序
    sort.Sort(stus)
    // 遍历
    for _,v := range stus {
        fmt.Println(v)
    }
}
/*
{stu81 87 66.45601}
{stu59 1 68.682304}
{stu25 20 9.696952}
{stu0 14 81.36399}
{stu62 89 31.805817}
{stu74 51 29.310184}
{stu37 26 20.318687}
{stu66 8 86.249146}
{stu47 67 75.2573}
{stu88 30 69.67192}
--------------------
{stu88 30 69.67192}
{stu81 87 66.45601}
{stu74 51 29.310184}
{stu66 8 86.249146}
{stu62 89 31.805817}
{stu59 1 68.682304}
{stu47 67 75.2573}
{stu37 26 20.318687}
{stu25 20 9.696952}
{stu0 14 81.36399}
*/
```

## 4. 接口嵌套

`示例:文件读写测试`

```java
package main
import "fmt"
type Reader interface {
    Read()
}
type Writer interface {
    Writer()
}
// 接口嵌套
type ReadWriter interface {
    Reader
    Writer
}
// 文件结构体
type File struct {
     }
// 实现 Reader 接口
func (f *File) Read() {
    fmt.Println("文件读取")
}
// 实现 Writer 接口
func (f *File) Writer() {
    fmt.Println("文件写入")
}
// 读写操作函数
func Test(rw ReadWriter) {
    rw.Read()
    rw.Writer()
}
func main() {
    // 初始化文件
    var f File
    Test(&f)
}
/* 结果
文件读取
文件写入
*/
```

## 5. 类型断言

**作用：因为接口是一般类型，需要明确具体类型的时候就需要使用类型断言。**

```java
package main
import "fmt"
func main() {
    var a interface{
     }
    var b int
    a = b
    // 断言赋值
    c := a.(int)
    fmt.Printf("类型:%T\n",c)
}
/*
类型:int
*/
```

`示例：断言判断`

```java
package main
import "fmt"
func Test(t interface{
     }) {
    // 转换类型判断
    v,err := t.(int)
    if err == false {
        fmt.Println("convert type err")
        return
    }
    v++
    fmt.Println(v)
}
func main() {
    var a int
    Test(a)
}
/*
1
*/
```

`示例：多类型判断`

```java
package main
import (
	"fmt"
)
// 传递多个类型数据
// 长度不固定，类型不固定的数据传递给 items
// ... 表示长度不固定，interface{} 空接口表示任意数据类型
func classifier(items ...interface{
     }) {
	// i 是下标，x 是值（k/v）
	for i, x := range items {
		// 变量.(type) 只能作用在 Switch 语句中，专门用于类型判断
		switch x.(type) {
		case bool:
			fmt.Printf("%d is a bool\n", i)
		case int, int32, int64:
			fmt.Printf("%d is a int\n", i)
		case float32, float64:
			fmt.Printf("%d is a float\n", i)
		case string:
			fmt.Printf("%d is a string\n", i)
		default:
			fmt.Printf("unkown")
		}
	}
}
func main() {
	classifier("zhangsan", 18, 90.5, false, nil)
}
/*
0 is a string
1 is a int
2 is a float
3 is a bool
unkown
*/
```

## 6. 链表使用

`示例`

```java
package main
import "fmt"
// 节点结构体
type LinkNode struct {
    data interface{
     }
    next *LinkNode
}
// 链表结构体
type Linkstruct {
    head *LinkNode
    tail *LinkNode
}
// 从头部插入
func (p *Link) InsertHead(data interface{
     }) {
    node := &LinkNode {
        data: data,
        next: nil,
    }
    // 判断是否为空链表
    if p.head == nil && p.tail == nil {
        p.head = node
        p.tail = node
        return
    }
    // 当前节点的 next 是原头部节点
    node.next = p.head
    // 更新头部
    p.head = node
}
// 从尾部插入
func (p *Link) InsertTail(data interface{
     }) {
    node := &LinkNode {
        data: data,
        next: nil,
    }
    // 判断是否为空链表
    if p.head == nil && p.tail == nil {
        p.head = node
        p.tail = node
        return
    }
    // 原尾部节点的 next 是当前节点
    p.tail.next = node
    // 更新尾部
    p.tail = node
}
// 遍历方法
func (p *Link) Req() {
    lp := p.head
    for lp != nil {
        fmt.Println(lp)
        lp = lp.next
    }
}
func main() {
    // 定义链表
    var intLinkLink
    for i := 0; i < 10; i++ {
        // intLink.InsertHead(i)
        intLink.InsertTail(i)
    }
    intLink.Req()
}
/*
&{0 0xc000004090}
&{1 0xc0000040a8}
&{2 0xc0000040c0}
&{3 0xc0000040d8}
&{4 0xc0000040f0}
&{5 0xc000004108}
&{6 0xc000004120}
&{7 0xc000004138}
&{8 0xc000004150}
&{9 <nil>}
*/
```

**注意：切片不可以赋值给空接口，只能单独每个元素赋值**

```java
var a []int
var b []interface
b = a	// 出现报错
```
