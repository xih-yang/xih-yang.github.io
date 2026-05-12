# 20、Golang 教程 - 反射
- 来源：https://ddkk.com/zhuanlan/other/golang/2/20.html
- 分类：其他语言
- 分组：教程目录
```java
变量 ---> 一个值，一个类型，值类型
数组 ---> 相同类型，多个值，长度固定，值类型
切片 ---> 相同类型，多个值，长度动态，引用类型，有序
指针 ---> 地址，引用类型
映射 ---> k-v 按名字取值，无序，相同类型，多个值，长度动态
结构体 ---> 多个值，类型多样，字段（属性）
接口 ---> 接受任意类型的定义
```

反射概念：运行时动态的获取变量的相关信息。

`import ("reflect")`

## 1. reflect

**1、**`reflect.TypeOf`获取变量类型，返回**reflect.Type**类型；

**2、**`reflect.ValueOf`获取变量的值，返回**reflect.Value**类型；

**3、**`reflect.Value.Kind`获取变量的类别，返回一个常量；

**4、**`reflect.Value.Interface()`转换成**interface{}**类型；

```java
int ---> interface ---> reflect.value ---> string
```

`示例：获取变量类型`

```java
package main
import (
    "fmt"
    "reflect"
)
func test(i interface{
     }) {
    // 反射获取值类型
    t := reflect.TypeOf(i)
    fmt.Println(t)
    // 反射获取值
    v := reflect.ValueOf(i)
    fmt.Println(v)
}
func main() {
    var a int = 10
    test(a)
}
/*
int
10
*/
```

`示例：类型和类别`

```java
package main
import (
    "fmt"
    "reflect"
)
type Student struct {
    Name string
    Age int
    Score float32
}
func test(i interface{
     }) {
    // 反射获取类型
    t := reflect.TypeOf(i)
    fmt.Println("类型：",t)
    // 反射获取类别
    v := reflect.ValueOf(i)
    k := v.Kind()
    fmt.Println("类别：",k)
}
func main() {
    var stu Student = Student {
        Name: "zhangsan",
        Age: 19,
        Score: 88,
    }
    test(stu)
}
/*
类型： main.Student
类别： struct
*/ 
```

`示例：断言处理类型转化`

```java
package main
import (
    "fmt"
    "reflect"
)
type Student struct {
    Name string
    Age int
    Score float32
}
func test(i interface{
     }) {
    // 反射获取类型
    t := reflect.TypeOf(i)
    fmt.Println("类型：",t)
    // 反射获取类别
    v := reflect.ValueOf(i)
    k := v.Kind()
    fmt.Println("类别：",k)
    // 转换成接口类型
    iv := v.Interface()
    // 断言
    stu,ok := iv.(Student)
    if ok {
        fmt.Printf("结构：%v 类型：%T\n",stu,stu)
    }
}
func main() {
    var stu Student = Student {
        Name: "zhangsan",
        Age: 19,
        Score: 88,
    }
    test(stu)
}
/*
类型： main.Student
类别： struct
结构：{zhangsan 19 88} 类型：main.Student
*/
```

## 2. ValueOf

获取变量值

```java
reflect.ValueOf(x).Float()
reflect.ValueOf(x).Int()
reflect.ValueOf(x).String()
reflect.ValueOf(x).Bool()
```

`示例:类型转换`

```java
package main
import (
    "fmt"
    "reflect"
)
func testInt(b interface{
     }) {
    val := reflect.ValueOf(b)
    fmt.Printf("val 类型：%T\n",val)
    // 转换成 int 类型，其他类型都可以转化成 string
    a := val.Int()
    fmt.Printf("a 类型：%T\n",a)
}
func main() {
    testInt(100)
}
/*
val 类型：reflect.Value
a 类型：int64
*/
```

## 3. Value.Set

设置变量值

```java
reflect.Value.SetFloat()	#设置浮点数
reflect.Value.SetInt()		#设置整数
reflect.Value.SetString()	#设置字符串
```

`示例：思考为何会报错`

```java
package main
import (
    "fmt"
    "reflect"
)
func testInt(b interface{
     }) {
    val := reflect.ValueOf(b)
    // 更改值
    val.SetInt(100)
    c := val.Int()
    fmt.Printf("类型：%T,值：%d\n",c,c)
}
func main() {
    var i = 10
    testInt(i)
    fmt.Println(i)
}
/*
panic: reflect: reflect.Value.SetInt using unaddressable value
goroutine 1 [running]:
......
*/
```

**修改后**

```java
package main
import (
    "fmt"
    "reflect"
)
func testInt(b interface{
     }) {
    val := reflect.ValueOf(b)
    // 更改值需要value的地址，否则会崩溃，Elem() 表示 *
    val.Elem().SetInt(100)
    c := val.Elem().Int()
    fmt.Printf("类型：%T,值：%d\n",c,c)
}
func main() {
    var i = 10
    testInt(&i)
    fmt.Println(i)
}
/*
类型：int64,值：100
100
*/
```

## 4. 结构体反射

`示例：反射出结构体属性和方法数量`

```java
package main
import (
    "fmt"
    "reflect"
)
type Student struct {
    Name string
    Age int
    Score float32
}
func (s Student) Sleep() {
    fmt.Println("正在睡觉")
}
func (s Student) Run(min interface{
     }) {
    fmt.Printf("跑步%d分钟",min)
}
// 断言结构体
func Test(object interface{
     }) {
    // 获取值
    v := reflect.ValueOf(object)
    // 获取类别
    c := v.Kind()
    // 判断类别是否为结构体
    if c != reflect.Struct {
        fmt.Println("expect struct")
        return
    }
    // 获取结构体字段数量
    num := v.NumField()
    fmt.Println("字段数量:",num)
    // 获取结构体方法数量
    numOfMethod := v.NumMethod()
    fmt.Println("方法数量:",numOfMethod)
}
func main() {
    var stu Student = Student {
        Name: "zhangsan",
        Age: 18,
        Score: 90,
    }
    Test(stu)
}
/*
字段数量: 3
方法数量: 2
*/
```

## 5. 函数反射

`示例：Go 中函数可以赋值给变量。`

```java
package main
import "fmt"
func Hello() {
    fmt.Println("hello world")
}
func main() {
    // 函数可以赋值给变量
    a := Hello
    a()
}
/*
hello world
*/
```

`示例：既然函数可以像普通的类型变量一样，那么在反射机制中就和不同的变量是一样，在反射中函数和方法的类型 (Type) 都是 reflect.Func，如果要调用函数，通过 Value 的 Call() 方法`

```java
package main
import (
    "fmt"
    "reflect"
)
func Hello() {
    fmt.Println("hello world")
}
func main() {
    // 反射获取 hello
    v := reflect.ValueOf(Hello)
    fmt.Printf("类型:%T\n",v)
    // 判断 hello 的类型
    if v.Kind() == reflect.Func {
        fmt.Println("OK")
    }
    // 反射调用函数
    v.Call(nil)
}
/*
类型:reflect.Value
OK
hello world
*/
```

**Value 的 Call() 方法的参数是一个 Value 的 slice，对应的反射函数类型的参数，返回值也是一个 Value 的 slice，同样对应反射函数类型的返回值。**

```java
package main
import (
    "fmt"
    "reflect"
    "strconv"
)
func prints(i int) string {
    fmt.Println("i=",i)
    return strconv.Itoa(i)
}
func main() {
    fv := reflect.ValueOf(prints)
    // 定义参数切片
    params := make([]reflect.Value,1)
    // 参数为 20
    params[0] = reflect.ValueOf(20)
    // 反射函数，获取处理结果
    result := fv.Call(params)
    fmt.Printf("result 类型:%T\n",result)
    fmt.Printf("result 转换后类型:%T,值是:%s\n",result[0].Interface().(string),result[0].Interface().(string))
}
/*
i= 20
result 类型:[]reflect.Value
result 转换后类型:string,值是:20
*/
```

## 6. 方法反射

反射中方法的调用。函数和方法可以说其实本质上是相同的，只不过方法与一个**对象**进行了**绑定**，方法是对象的一种行为，这种行为是对于这个对象的一系列操作，例如修改对象的某个属性。

```java
package main
import (
    "fmt"
    "reflect"
    "strconv"
)
type Student struct {
    age int
    name string
}
func (s *Student) SetAge(i int) {
    s.age = i
}
func (s *Student) SetName(name string) {
    s.name = name
}
func (s *Student) String() string {
    return fmt.Sprintf("%p",s) + "--name:" + s.name + " age:" + strconv.Itoa(s.age)
}
func main() {
    // 实例化
    stu := &Student{
     22,"zhangsan"}
    // 反射获取值，指针方式
    stuV := reflect.ValueOf(&stu).Elem()
    // 也可以使用非指针（值类型） stuV := reflect.ValueOf(stu)
    fmt.Println("Before:",stuV.MethodByName("String").Call(nil)[0])
    // 修改值
    params := make([]reflect.Value,1)
    params[0] = reflect.ValueOf(18)
    stuV.MethodByName("SetAge").Call(params)
    params[0] = reflect.ValueOf("lisi")
    stuV.MethodByName("SetName").Call(params)
    fmt.Println("After:",stuV.MethodByName("String").Call(nil)[0])
}
/*
Before: 0xc000004078--name:zhangsan age:22
After: 0xc000004078--name:lisi age:18
*/
```

`示例：使用 Method 方式`

```java
package main
import (
    "fmt"
    "reflect"
    "strconv"
)
type Student struct {
    age int
    name string
}
func (s *Student) SetAge(i int) {
    s.age = i
}
func (s *Student) SetName(name string) {
    s.name = name
}
func (s *Student) String() string {
    return fmt.Sprintf("%p",s) + "--name:" + s.name + " age:" + strconv.Itoa(s.age)
}
func main() {
    // 实例化
    stu := &Student{
     22,"zhangsan"}
    stuV := reflect.ValueOf(&stu).Elem()
    // 方式二
    fmt.Println("Before:",stuV.Method(2).Call(nil)[0])
    // 索引大小取决于方法名称的 ASCII 大小
    params := make([]reflect.Value,1)
    params[0] = reflect.ValueOf(18)
    stuV.Method(0).Call(params)
    params[0] = reflect.ValueOf("lisi")
    stuV.Method(1).Call(params)
    fmt.Println("After:",stuV.Method(2).Call(nil)[0])
}
/*
Before: 0xc000004078--name:zhangsan age:22
After: 0xc000004078--name:lisi age:18
*/
```
