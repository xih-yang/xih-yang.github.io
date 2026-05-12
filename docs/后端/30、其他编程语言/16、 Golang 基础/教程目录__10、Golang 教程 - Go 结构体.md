# 10、Golang 教程 - Go 结构体
- 来源：https://ddkk.com/zhuanlan/other/golang/2/10.html
- 分类：其他语言
- 分组：教程目录
- Go 语言中数组可以存储同一类型的数据，但在结构体中我们可以为不同项定义不同的数据类型。
- 结构体是由一系列具有相同类型或不同类型的数据构成的数据集合。
- 结构体表示一项记录，比如保存图书馆的书籍记录，每本书有以下属性：

```java
- Title ：标题
- Author ： 作者
- Subject ：学科
- ID ：书籍ID
```

## 1. 定义结构体

结构体定义需要使用 **type** 和 **struct** 语句。struct 语句定义一个新的数据类型，结构体中有一个或多个成员。type 语句设定了结构体的名称。结构体的格式如下：

```java
type struct_variable_type struct {
   member definition
   member definition
   ...
   member definition
}
```

**一旦定义了结构体类型，它就能用于变量的声明，语法格式如下：**

```java
variable_name := structure_variable_type {
     value1, value2...valuen}
或
variable_name := structure_variable_type {
      key1: value1, key2: value2..., keyn: valuen}
```

**示例**

```java
package main
import "fmt"
type Person struct {
	name    string
	sex     string
	age     int
	id_card int
}
func main() {
	// 创建一个新的结构体
	fmt.Println(Person{
     "zhangsan","男",20,123456})
	// 使用键值对格式
	fmt.Println(Person{
     name:"lisi",sex:"女",age:18,id_card:654321})
	// 忽略的字段为 0 或 空
	fmt.Println(Person{
     name:"王五",sex:"未知"})
}
// 结果
{
     zhangsan 男 20 123456}
{
     lisi 女 18 654321}
{
     王五 未知 0 0}
```

## 2. 访问结构体成员

如果要访问结构体成员，需要使用点号 **.** 操作符，格式为：

```java
"结构体.成员名"
```

结构体类型变量使用 **struct** 关键字定义，实例如下：

```java
package main
import "fmt"
type Person struct {
    name    string
	sex     string
	age     int
	id_card int
}
func main() {
    var Person1 Person	//声明 Person1 为 Person 类型
    var Person2 Person	//声明 Person2 为 Person 类型
    //Person1 描述
    Person1.name = "tom"
    Person1.sex = "man"
    Person1.age = 30
    Person1.id_card = 123456
    //Person2 描述
    Person2.name = "jerry"
    Person2.sex = "man"
    Person2.age = 25
    Person2.id_card = 654321
    //打印 Person1 信息
    fmt.Printf( "Person1 name : %s\n", Person1.name)
    fmt.Printf( "Person1 sex : %s\n", Person1.sex)
    fmt.Printf( "Person1 age : %d\n", Person1.age)
    fmt.Printf( "Person1 id_card : %d\n", Person1.id_card)
    fmt.Printf( "Person2 name : %s\n", Person2.name)
    fmt.Printf( "Person2 sex : %s\n", Person2.sex)
    fmt.Printf( "Person2 age : %d\n", Person2.age)
    fmt.Printf( "Person2 id_card : %d\n", Person2.id_card)
}
// 结果
Person1 name : tom
Person1 sex : man
Person1 age : 30
Person1 id_card : 123456
Person2 name : jerry
Person2 sex : man
Person2 age : 25
Person2 id_card : 654321
```

## 3. 结构体作为函数参数

可以像其他数据类型一样将结构体类型作为参数传递给函数。并以以下实例的方式访问结构体变量：

```java
package main
import "fmt"
type Person struct {
    name    string
	sex     string
	age     int
	id_card int
}
func main() {
    var Person1 Person	//声明 Person1 为 Person 类型
    var Person2 Person	//声明 Person2 为 Person 类型
    //Person1 描述
    Person1.name = "tom"
    Person1.sex = "man"
    Person1.age = 30
    Person1.id_card = 123456
    //Person2 描述
    Person2.name = "jerry"
    Person2.sex = "man"
    Person2.age = 25
    Person2.id_card = 654321
    //使用函数传参结构体类型数据
    printInfo(Person1)
    printInfo(Person2)
}
//函数定义结构体为形式参数进行传入
func printInfo(per Person) {
    fmt.Println("姓名:",per.name)
    fmt.Println("性别:",per.sex)
    fmt.Println("年龄:",per.age)
    fmt.Println("id:",per.id_card)
}
// 结果
姓名: tom
性别: man
年龄: 30
id: 123456
姓名: jerry
性别: man
年龄: 25
id: 654321
```

## 4. 结构体指针

可以定义指向结构体的指针类似于其他指针变量，格式如下：

```java
var struct_pointer *Person
```

以上定义的指针变量可以存储结构体变量的地址。查看结构体变量地址，可以将 `&` 符号放置于结构体变量前：

```java
struct_pointer = &Person1
```

使用结构体指针访问结构体成员，使用 `.` 操作符：

```java
struct_pointer.title
```

**示例**

```java
package main
import "fmt"
type Person struct {
    name    string
	sex     string
	age     int
	id_card int
}
func main() {
    var Person1 Person	//声明 Person1 为 Person 类型
    var Person2 Person	//声明 Person2 为 Person 类型
    //Person1 描述
    Person1.name = "tom"
    Person1.sex = "man"
    Person1.age = 30
    Person1.id_card = 123456
    //Person2 描述
    Person2.name = "jerry"
    Person2.sex = "man"
    Person2.age = 25
    Person2.id_card = 654321
    //使用函数传参结构体类型数据
    //使用指针传参
    printInfo(&Person1)
    fmt.Println("----------------")
    printInfo(&Person2)
}
//函数定义结构体为形式参数进行传入
func printInfo(per *Person) {
    fmt.Println("姓名:",per.name)
    fmt.Println("性别:",per.sex)
    fmt.Println("年龄:",per.age)
    fmt.Println("id:",per.id_card)
}
// 结果
姓名: tom
性别: man
年龄: 30
id: 123456
----------------
姓名: jerry
性别: man
年龄: 25
id: 654321
```

```java
package main
import "fmt"
type student struct {
	name string
	age  int
}
func main() {
	m := make(map[string]*student)
	stus := []student{
		{
     name: "pprof.cn", age: 18},
		{
     name: "测试", age: 23},
		{
     name: "博客", age: 28},
	}
	for i, stu := range stus {
		m[stu.name] = &stus[i]
	}
	for k, v := range m {
		fmt.Println(k, "=>", v.name)
	}
}
// 结果
测试 => 测试
博客 => 博客
pprof.cn => pprof.cn
```

```java
package main
import (
    "fmt"
)
type Employee struct {
    firstName, lastName string
    age, salary         int
}
func main() {
    emp8 := &Employee{
     "Sam", "Anderson", 55, 6000}
    fmt.Println("First Name:", (*emp8).firstName)
    fmt.Println("Age:", (*emp8).age)
}
// 结果
First Name: Sam
Age: 55
// ------------------------------ //
package main
import (
    "fmt"
)
type Employee struct {
    firstName, lastName string
    age, salary         int
}
func main() {
    emp8 := &Employee{
     "Sam", "Anderson", 55, 6000}
    fmt.Println("First Name:", emp8.firstName)
    fmt.Println("Age:", emp8.age)
}
// 结果
First Name: Sam
Age: 55
```

## 5. 结构体嵌套

- 在结构体中嵌套结构体时使用匿名字段可以更加简便获取内层结构体的字段
- 当内层结构体的字段和外层结构体的字段没有重复时可以直接获取，如果有重复时需要加上内层结构体名才能正常获取
- 这就是 Go 实现继承的方式

`匿名字段访问示例：`

```java
package main
import "fmt"
type foo struct {
	field1 int
	field2 string
}
type bar struct {
	foo
	field1 string
	field3 int
}
func main() {
	foobar := bar{
     }
	foobar.foo.field1 = 1
	foobar.field2 = "hello"
	foobar.field1 = "world"
	foobar.field3 = 2
	fmt.Printf("%v", foobar)
}
// 结果
{
     {
     1 hello} world 2}
```

```java
package main
import (
    "fmt"
)
type Address struct {
    city, state string
}
type Person struct {
    name string
    age int
    address Address
}
func main() {
    var p Person
    p.name = "Naveen"
    p.age = 50
    p.address = Address {
        city: "Chicago",
        state: "Illinois",
    }
    fmt.Println("Name:", p.name)
    fmt.Println("Age:",p.age)
    fmt.Println("City:",p.address.city)
    fmt.Println("State:",p.address.state)
}
// 结果
Name: Naveen
Age: 50
City: Chicago
State: Illinois
```

**结构体中的匿名的结构体字段被称为 promoted 字段，我们用一段代码来理解下**

```java
type Address struct {
    city, state string
}
type Person struct {
    name string
    age  int
    Address
}
```

**在上面的代码片段中，Person 结构体有一个匿名字段 Address，Address 同时也是一个结构体类型。现在 Address 结构体中的字段 city 和 state 被称为 promoted 字段，因为它们可以直接访问，就好像它们是直接在 Person 结构体中声明的一样。**

```java
package main
import (
    "fmt"
)
type Address struct {
    city, state string
}
type Person struct {
    name string
    age  int
    Address
}
func main() {
    var p Person
    p.name = "Naveen"
    p.age = 50
    p.Address = Address{
        city:  "Chicago",
        state: "Illinois",
    }
    fmt.Println("Name:", p.name)
    fmt.Println("Age:", p.age)
    fmt.Println("City:", p.city) //city is promoted field
    fmt.Println("State:", p.state) //state is promoted field
}
// city 和 state 是 promoted 字段，它们可以直接使用 p.city 和 p.state 访问
// 就像它们直接是在结构体 p 中声明一样。
// 结果
Name: Naveen
Age: 50
City: Chicago
State: Illinois
```

## 6. 匿名结构体

```java
// 创建了一个结构体变量 emp3，而并没有定义任何的新结构体类型
package main
import (
    "fmt"
)
func main() {
    emp3 := struct {
        firstName, lastName string
        age, salary         int
    }{
        firstName: "Andreah",
        lastName:  "Nikola",
        age:       31,
        salary:    5000,
    }
    fmt.Println("Employee 3", emp3)
}
// 结果
Employee 3 {
     Andreah Nikola 31 5000}
```

## 7. 匿名字段

在创建结构体时，我们也可以只指定类型而不指定字段名。这些字段被称为匿名字段。

下面的代码片就创建了一个 Person，该结构体有俩个匿名字段 string 和 int。

```java
package main
import (
    "fmt"
)
type Person struct {
    string
    int
}
func main() {
    p := Person{
     "Naveen", 50}
    fmt.Println(p)
}
// 结果
{
     Naveen 50}
```

尽管匿名字段并没有名称，默认情况下，它的数据类型就是它的字段名称。因此，Person 结构体拥有俩个字段，其名称分别为：string 和 int。

```java
package main
import (
    "fmt"
)
type Person struct {
    string
    int
}
func main() {
    var p1 Person
    p1.string = "naveen"
    p1.int = 50
    fmt.Println(p1)
}
// 结果
{
     naveen 50}
```
