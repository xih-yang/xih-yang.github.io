# 16、Golang 教程 - 结构体链表
- 来源：https://ddkk.com/zhuanlan/other/golang/2/16.html
- 分类：其他语言
- 分组：教程目录
概念：结构体是自定义复杂数据结构，struct 里面可以包含多个字段(属性)，struct 类型可以定义方法，和函数有区分，struct 属于值类型，且可以做嵌套，Go 中没有 Class 类型，只有 struct 类型。

**示例：回顾结构体定义**

```java
package main
import "fmt"
type Car struct {
    // 定义属性，大写可跨包调用
    Name string
    Color string
    next Person	// 嵌套结构体
}
type Person struct {
    Owner string
    Age uint
}
func main() {
    // 定义结构体变量 c 属于 Car
    var c Car
    c.Name = "baoma"
    c.Color = "yellow"
    c.next.Owner = "zc"
	c.next.Age = 25
    fmt.Println(c)
}
// 结果
{
     baoma yellow {
     zc 25}}
```

**struct 定义的三种形式：其中 2 和 3 都是返回结构体的指针。**

```java
1. var stu Student
2. var stu *Student = new(Student)
3. var stu *Student = &Student{
     }
```

**调用属性**

```java
stu.Name    stu.Age    stu.Score
or
(*stu).Name    (*stu).Age    (*stu).Score
```

**复杂数据类型和基本数据类型的区别**

```java
/* 1. 基本数据类型是系统定义的，& 直接显示内存地址。
   2. 复杂数据类型(结构体等)是自定义的，其中可能包含很多类型的基本数据类型，为了和基本数据类型区分，使用 & 会显示 &{数据内容}。
   3. * 代表变量为指针类型，** 为二级指针（指向各个内存地址），& 取地址。
   */
package main
import "fmt"
type Student struct {
	Name   string
	Age    int
}
func main() {
	// 创建一个结构体
	var stu1 *Student = &Student{
     }
	stu1.Name = "stu1"
	stu1.Age = 20
	fmt.Println(stu1)
	fmt.Println(&stu1)
    fmt.Println(&*stu1)
	fmt.Println(*stu1)
	fmt.Printf("%p\n",stu1)		// %p 强制显示内存地址
	fmt.Printf("%p\n",&*stu1)
	fmt.Printf("%p\n",&Student{
     })
}
// 结果
&{
     stu1 20}
0xc000006028
&{
     stu1 20}
{
     stu1 20}
0xc000004480	// stu1 的地址
0xc000004480	// stu1 等于 &*stu1
0xc000004500
```

## 1. 存储方式

```java
package main
import "fmt"
type Student struct {
    Name string
    Age int
    Score float32
    next *Student	// 链表
}
func main() {
    // 实体
    var head Student
    head.Name = "test"
    head.Age = 20
    head.Score = 80
    fmt.Println(head)
}
// 结果
{
     test 20 80 <nil>}
```

`值类型存储方式地址空间连续`

```java
package main
import "fmt"
type Student struct {
    Name string
    Age int32
    Score float32
}
func main() {
    var stu *Student = &Student {
        Name: "zhangsan",
        Age: 18,
        Score: 90,
    }
    fmt.Printf("Name:%p\n",&stu.Name)
    fmt.Printf("Age:%p\n",&stu.Age)
    fmt.Printf("Score:%p\n",&stu.Score)
}
// 结果，地址是 16 进制
Name:0xc000004480
Age:0xc000004490
Score:0xc000004494
```

## 2. 链表更新

### 2.1 链表定义

链表方式串联结构体。**链表大小不固定，地址不连续，长度不固定，链表中第一个元素称为头部，最后一个元素指针指向 nil**。链表分类为：单链表、双链表、循环单链表、循环双链表。

```java
package main
import "fmt"
type Student struct {
    Name	string
    Age		int
    Score	float32
    next	*Student	// 单链，指向下一个结构体地址
}
func main() {
    // 头部结构节点
    var head Student
    head.Name = "head"
    head.Age = 18
    head.Score = 100
    // 第二个结构体节点
    var stu1 Student
    stu1.Name = "stu1"
    stu1.Age = 20
    stu1.Score = 90
    // 将结构体串联
    head.next = &stu1
    // 定义指针指向链表头部
    var p *Student = &head
    // 遍历链表：链表下个节点不为空则继续执行下去，将各个节点(结构体)信息输出
    // p 指针是指向下一个结构体地址，加 * 就是下一个结构体
    for p != nil {
        fmt.Println(*p)
        // p 变更为下一个结构体地址
        p = p.next
    }
}
// 结果
// head 的 next 存放的是 stu1 的地址
// stu1 的 next 没有下一个，为 nil 
{
     head 18 100 0xc000078330}
{
     stu1 20 90 <nil>}
```

```java
package main
import "fmt"
type Student struct {
	Name	string
	Age		int
	Score	float32
	next	*Student	// 单链，下一个
}
func main() {
	// 头部结构节点
	var head Student
	head.Name = "head"
	head.Age = 18
	head.Score = 100
	// 第二个结构体节点
	var stu1 Student
	stu1.Name = "stu1"
	stu1.Age = 20
	stu1.Score = 90
    // 第一个指针
	head.next = &stu1
	// 第三个结构体节点
	var stu2 Student
	stu2.Name = "stu2"
	stu2.Age = 30
	stu2.Score = 80
    // 第二个指针
	stu1.next = &stu2
	var p *Student = &head
	for p != nil {
		fmt.Println(*p)
		// p 变更为下一个结构体地址
		p = p.next
	}
}
// 结果
{
     head 18 100 0xc000078330}
{
     stu1 20 90 0xc000078360}
{
     stu2 30 80 <nil>}
```

### 2.2 将遍历链表封装成函数

```java
package main
import "fmt"
type Student struct {
	Name	string
	Age		int
	Score	float32
	next	*Student	// 单链，下一个
}
func main() {
	// 头部结构节点
	var head Student
	head.Name = "head"
	head.Age = 18
	head.Score = 100
	// 第二个结构体节点
	var stu1 Student
	stu1.Name = "stu1"
	stu1.Age = 20
	stu1.Score = 90
    // 第一个指针
	head.next = &stu1
	// 第三个结构体节点
	var stu2 Student
	stu2.Name = "stu2"
	stu2.Age = 30
	stu2.Score = 80
    // 第二个指针
	stu1.next = &stu2
    // 调用遍历链表函数，传第一个结构体地址
    Req(&head)
}
// 遍历链表
func Req(p *Student) {
    for p != nil {
		fmt.Println(*p)
		p = p.next
	}
}
```

### 2.3 尾部添加元素（结构体节点）

```java
package main
import (
	"fmt"
	"math/rand"
)
type Students struct {
	Name string
	Age int
	Score float32
	next *Students
}
func main() {
	var stu1 Students
	stu1.Name = "stu1"
	stu1.Age = 25
	stu1.Score = 62
	var stu2 Students
	stu2.Name = "stu2"
	stu2.Age = 30
	stu2.Score = 100
	stu1.next = &stu2
	// 声明尾部变量
	var tail = &stu2
	// 尾部批量添加节点
	for i:=3;i<10;i++ {
		// 节点定义
		var stu Students = Students {
			Name: fmt.Sprintf("stu%d", i),
			Age: rand.Intn(100),
			Score: rand.Float32()*100,
		}
        // 生成结构体串联
		tail.next = &stu
		tail = &stu
	}
	Req(&stu1)
}
func Req(p *Students) {
	for p != nil {
		fmt.Println(*p)
		p = p.next
	}
}
```

```java
{
     stu1 25 62 0xc000078360}
{
     stu2 30 100 0xc000078390}
{
     stu3 81 94.05091 0xc0000783c0}
{
     stu4 47 43.77142 0xc0000783f0}
{
     stu5 81 68.682304 0xc000078420}
{
     stu6 25 15.651925 0xc000078450}
{
     stu7 56 30.091187 0xc000078480}
{
     stu8 94 81.36399 0xc0000784b0}
{
     stu9 62 38.06572 <nil>}
```

**定义成函数**

```java
package main
import (
	"fmt"
	"math/rand"
)
type Students struct {
	Name string
	Age int
	Score float32
	next *Students
}
func main() {
	var stu1 Students
	stu1.Name = "stu1"
	stu1.Age = 25
	stu1.Score = 62
	var stu2 Students
	stu2.Name = "stu2"
	stu2.Age = 30
	stu2.Score = 100
	stu1.next = &stu2
	// 声明尾部变量
	insertTail(&stu2)
    // 遍历结构体元素
	Req(&stu1)
}
// 尾部添加元素
func insertTail(tail *Students) {
	for i:=3;i<10;i++ {
		// 节点定义
		var stu Students = Students {
			Name: fmt.Sprintf("stu%d", i),
			Age: rand.Intn(100),
			Score: rand.Float32()*100,
		}
		// 生成结构体串联
		tail.next = &stu
		tail = &stu
	}
}
// 遍历结构体元素
func Req(p *Students) {
	for p != nil {
		fmt.Println(*p)
		p = p.next
	}
}
```

### 2.4 头部添加元素

```java
package main
import (
	"fmt"
	"math/rand"
)
type Student struct {
	Name   string
	Age    int
	Score  float32
	next    *Student
}
func main() {
	// 创建一个头部结构体
	var head *Student = &Student{
     }
	head.Name = "syhj"
	head.Age = 20
	head.Score = 100
    // 定义添加元素循环
	for i:=0;i<5;i++ {
		var stu = Student {
			Name: fmt.Sprintf("stu%d", i),
			Age: rand.Intn(100),
			Score:	rand.Float32()*100,
		}
		stu.next = head
		head = &stu
	}
	// 循环输出
	for head != nil {
		fmt.Println(*head)
		head = head.next
	}
}
```

```java
{
     stu4 56 30.091187 0xc000078420}
{
     stu3 25 15.651925 0xc0000783f0}
{
     stu2 81 68.682304 0xc0000783c0}
{
     stu1 47 43.77142 0xc000078390}
{
     stu0 81 94.05091 0xc000078360}
{
     syhj 20 100 <nil>}
```

**定义成函数**

```java
package main
import (
	"fmt"
	"math/rand"
)
type Student struct {
	Name   string
	Age    int
	Score  float32
	next    *Student
}
func main() {
	// 创建一个头部结构体
	var stu1 *Student = &Student{
     }
	stu1.Name = "stu1"
	stu1.Age = 20
	stu1.Score = 100
	// 头部添加元素
	insertHead(&stu1)
	// 循环遍历输出
	Req(stu1)
}
// 头部插入节点
// p 为二级指针，调整 p 指向的一级地址
// 地址是一个值，其对应了一个内存空间，是系统分配的，无法修改的，只能修改二级指针的指向
func insertHead(p **Student) {
	for i:=0;i<5;i++ {
		var stu = Student {
			Name: fmt.Sprintf("stu%d", i),
			Age: rand.Intn(100),
			Score:	rand.Float32()*100,
		}
        // 指向下个节点
		stu.next = *p
		*p = &stu
	}
}
// 遍历结构体元素
func Req(p *Student) {
	for p != nil {
		fmt.Println(*p)
		p = p.next
	}
}
```

```java
{
     stu4 56 30.091187 0xc000078420}
{
     stu3 25 15.651925 0xc0000783f0}
{
     stu2 81 68.682304 0xc0000783c0}
{
     stu1 47 43.77142 0xc000078390}
{
     stu0 81 94.05091 0xc000078360}
{
     stu1 20 100 <nil>}
```

**重点：值类型如果想要外部数据和函数处理结果同步，两种方法：传参指针、return 返回值。单纯的调用函数体结果会被覆盖。**

**递归方式**

```java
// 递归可能存在压栈问题，其消耗的内存资源要比二级指针高
func insertHead(p *Student,i int) {
    var stu Student = Student {
        Name: fmt.Sprintf("stu%d",i),
        Age: rand.Intn(100),
    }
    if i < 5 {
        i++
        stu.next = p
        p = &stu
        insertHead(p, i)
    } else {
        Req(p)	// 遍历元素
    }
}
```

### 2.5 插入元素

```java
package main
import (
	"fmt"
	"math/rand"
)
type Student struct {
	Name   string
	Age    int
	Score  float32
	next    *Student
}
func main() {
	// 创建一个头部结构体
	var stu1 *Student = &Student{
     }
	stu1.Name = "stu1"
	stu1.Age = 20
	stu1.Score = 100
	// 头部添加元素
	insertHead(&stu1)
	// 定义新节点
	var newNode *Student = &Student{
     }
	newNode.Name = "nowNode"
	newNode.Age = 35
	newNode.Score = 88
	// 调用指定位置插入新节点
	addNode(stu1, newNode)
	// 循环遍历输出
	Req(stu1)
}
// 头部插入节点
func insertHead(p **Student) {
	for i:=0;i<10;i++ {
		var stu = Student {
			Name: fmt.Sprintf("stu%d", i),
			Age: rand.Intn(100),
			Score:	rand.Float32()*100,
		}
		stu.next = *p
		*p = &stu
	}
}
// 中间插入节点
func addNode(p *Student, newNode *Student) {
	for p != nil {
		if p.Name == "stu6" {
			// 嫁接下一个节点
			newNode.next = p.next
			p.next = newNode
		}
		// 插入节点指向下个节点
		p = p.next
	}
}
// 遍历结构体元素
func Req(p *Student) {
	for p != nil {
		fmt.Println(*p)
		p = p.next
	}
}
```

```java
{
     stu9 37 21.855305 0xc0000b8510}
{
     stu8 11 29.310184 0xc0000b84e0}
{
     stu7 28 46.888985 0xc0000b84b0}
{
     stu6 62 38.06572 0xc0000b8570}
{
     nowNode 35 88 0xc0000b8480}
{
     stu5 94 81.36399 0xc0000b8450}
{
     stu4 56 30.091187 0xc0000b8420}
{
     stu3 25 15.651925 0xc0000b83f0}
{
     stu2 81 68.682304 0xc0000b83c0}
{
     stu1 47 43.77142 0xc0000b8390}
{
     stu0 81 94.05091 0xc0000b8360}
{
     stu1 20 100 <nil>}
```

### 2.6 删除元素

```java
package main
import (
	"fmt"
	"math/rand"
)
type Student struct {
	Name   string
	Age    int
	Score  float32
	next    *Student
}
func main() {
	// 创建一个头部结构体
	var stu1 *Student = &Student{
     }
	stu1.Name = "stu1"
	stu1.Age = 20
	stu1.Score = 100
	// 头部添加元素
	insertHead(&stu1)
	// 定义新节点
	var newNode *Student = &Student{
     }
	newNode.Name = "nowNode"
	newNode.Age = 35
	newNode.Score = 88
	// 调用指定位置插入新节点
	addNode(stu1, newNode)
    // 调用删除节点
    delNode(stu1)
	// 循环遍历输出
	Req(stu1)
}
// 头部插入节点
func insertHead(p **Student) {
	for i:=0;i<10;i++ {
		var stu = Student {
			Name: fmt.Sprintf("stu%d", i),
			Age: rand.Intn(100),
			Score:	rand.Float32()*100,
		}
		stu.next = *p
		*p = &stu
	}
}
// 中间插入节点
func addNode(p *Student, newNode *Student) {
	for p != nil {
		if p.Name == "stu6" {
			// 嫁接下一个节点
			newNode.next = p.next
			p.next = newNode
		}
		// 插入节点指向下个节点
		p = p.next
	}
}
// 删除节点
func delNode(p *Student) {
    var prev *Student = p
    for p != nil {
        if p.Name == "stu6" {
            prev.next = p.next
            break
        }
        // 平移
        // 前节点赋值
        prev = p
        // 后节点赋值
        p = p.next
    }
}
// 遍历结构体元素
func Req(p *Student) {
	for p != nil {
		fmt.Println(*p)
		p = p.next
	}
}
```

```java
{
     stu9 37 21.855305 0xc000078510}
{
     stu8 11 29.310184 0xc0000784e0}
{
     stu7 28 46.888985 0xc000078570}
{
     nowNode 35 88 0xc000078480}	// stu6 被删除
{
     stu5 94 81.36399 0xc000078450}
{
     stu4 56 30.091187 0xc000078420}
{
     stu3 25 15.651925 0xc0000783f0}
{
     stu2 81 68.682304 0xc0000783c0}
{
     stu1 47 43.77142 0xc000078390}
{
     stu0 81 94.05091 0xc000078360}
{
     stu1 20 100 <nil>}
```
