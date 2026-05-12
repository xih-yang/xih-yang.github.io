# 17、Golang 教程 - 反射reflect
- 来源：https://ddkk.com/zhuanlan/other/golang/3/17.html
- 分类：其他语言
- 分组：教程目录
## 反射的一些基本概念和需要知道的知识

- Golang语言实现的反射机制就是指在运行时动态的调用对象的**方法和属性**，官方自带的reflect包就是反射相关的。
- go的变量包括type, value两部分，type 包括static type和concrete type. (static type是你在编码是看见的类型(如int、string)，concrete type是runtime系统看见的类型)。类型断言能否成功，取决于变量的concrete type，而不是static type. 因此，一个 reader变量如果它的concrete type也实现了write方法的话，它也可以被类型断言为writer.
- 反射是建立在类型之上的，Golang指定类型的变量的类型是静态的（也就是指定int、string这些的变量，它的type是static type），在创建变量的时候就已经确定，反射主要与Golang的interface类型相关（它的type是concrete type）** ，只有interface类型才有反射一说。** 反射就是用来检测存储在接口变量内部(值value；类型concrete type) pair对的一种机制。

## Golang的反射reflect

reflect的基本功能`TypeOf`和`ValueOf`

```java
//ValueOf用来获取输入参数接口中的数据的值，如果接口为空则返回0
func ValueOf(i interface{
     }) Value {
     ...}
//TypeOf用来动态获取输入参数接口中的值的类型，如果接口为空则返回nil
func TypeOf(i interface{
     }) Type {
     ...}
```

`reflect.TypeOf()`是获取interface pair对中的`type`，`reflect.ValueOf()`获取pair中的`value`

```java
package main
import (
	"fmt"
	"reflect"
)
func main() {
	var num float64 = 1.2345
	//type类型
	fmt.Println("type: ", reflect.TypeOf(num)) // type:  float64
	//具体的值
	fmt.Println("value: ", reflect.ValueOf(num)) // value:  1.2345
}
```

也就是说明反射可以将“接口类型变量”转换为“反射类型对象”，反射类型指的是reflect.Type和reflect.Value这两种

### 从relfect.Value中获取接口interface的信息

当执行`reflect.ValueOf(interface)`之后，就得到了一个类型为”relfect.Value”变量，可以通过它本身的`Interface()`方法获得接口变量的真实内容，**然后可以通过类型判断进行转换，转换为原有真实类型。**

```java
// 第一种
//realValue := value.Interface().(已知的类型)
// eg.
package main
import (
	"fmt"
	"reflect"
)
func main() {
	var num float64 = 1.2345
	pointer := reflect.ValueOf(&num)
	value := reflect.ValueOf(num)
	// 可以理解为“强制转换”，但是需要注意的时候，转换的时候，如果转换的类型不完全符合，则直接panic
	// Golang 对类型要求非常严格，类型一定要完全符合
	// 如下两个，一个是*float64，一个是float64，如果弄混，则会panic
	//转换的时候，要区分是指针还是值
	convertPointer := pointer.Interface().(*float64)
	convertValue := value.Interface().(float64)
	//value.Interface()：反射类型对象”再重新转换为“接口类型变量” 
	fmt.Println(convertPointer) // 0xc42000e238
	fmt.Println(convertValue)   // 1.2345
}
//
// 第二种类型
// 未知原有类型【遍历探测其Filed】
package main
import (
	"fmt"
	"reflect"
)
type User struct {
	Id   int
	Name string
	Age  int
}
func (u User) ReflectCallFunc() {
	fmt.Println("Allen.Wu ReflectCallFunc")
}
func main() {
	user := User{
     1, "Allen.Wu", 25}
	DoFiledAndMethod(user)
}
// 通过接口来获取任意参数，然后一一揭晓
func DoFiledAndMethod(input interface{
     }) {
	getType := reflect.TypeOf(input) 
	fmt.Println("get Type is :", getType.Name()) // get Type is : User
	getValue := reflect.ValueOf(input)
	fmt.Println("get all Fields is:", getValue) // get all Fields is: {1 Allen.Wu 25}
	// 获取方法字段
	// 1. 先获取interface的reflect.Type，然后通过NumField进行遍历
	// 2. 再通过reflect.Type的Field获取其Field
	// 3. 最后通过Field的Interface()得到对应的value
	for i := 0; i < getType.NumField(); i++ {
		field := getType.Field(i)
		value := getValue.Field(i).Interface()
		fmt.Printf("%s: %v = %v\n", field.Name, field.Type, value)
		// Id: int = 1
		// Name: string = Allen.Wu
		// Age: int = 25
	}
	// 获取方法
	// 1. 先获取interface的reflect.Type，然后通过.NumMethod进行遍历
	for i := 0; i < getType.NumMethod(); i++ {
		m := getType.Method(i)
		fmt.Printf("%s: %v\n", m.Name, m.Type) // ReflectCallFunc: func(main.User)
	}
}
```

### 通过reflect.Value设置实际变量的值

`reflect.Value`是通过`reflect.ValueOf(X)`获得的，只有当X是**指针**的时候，才可以通过`reflec.Value`修改实际变量X的值

```java
package main
import (
	"fmt"
	"reflect"
)
func main() {
	var num float64 = 1.2345
	fmt.Println("old value of pointer:", num) // old value of pointer: 1.2345
	// 通过reflect.ValueOf获取num中的reflect.Value，注意，参数必须是指针才能修改其值
	pointer := reflect.ValueOf(&num)
	//reflect.Value.Elem() 表示获取原始值对应的反射对象，只有原始对象才能修改，当前反射对象是不能修改的
	newValue := pointer.Elem()
	fmt.Println("type of pointer:", newValue.Type()) //type of pointer: float64
	fmt.Println("settability of pointer:", newValue.CanSet()) //settability of pointer: true
	// 重新赋值
	newValue.SetFloat(77)
	fmt.Println("new value of pointer:", num) //new value of pointer: 77
	// 如果reflect.ValueOf的参数不是指针，会如何？
	pointer = reflect.ValueOf(num)
	//newValue = pointer.Elem() // 如果非指针，这里直接panic，“panic: reflect: call of reflect.Value.Elem on float64 Value”
	//通过CanSet方法查询是否可以设置返回false
}
```

### 通过reflect.ValueOf来进行方法的调用

在工程应用（eg框架工程）中，另外一个常用并且属于高级的用法，就是通过reflect来进行方法【函数】的调用。

```java
package main
import (
	"fmt"
	"reflect"
)
type User struct {
	Id   int
	Name string
	Age  int
}
func (u User) ReflectCallFuncHasArgs(name string, age int) {
	fmt.Println("ReflectCallFuncHasArgs name: ", name, ", age:", age, "and origal User.Name:", u.Name)
}
func (u User) ReflectCallFuncNoArgs() {
	fmt.Println("ReflectCallFuncNoArgs")
}
// 如何通过反射来进行方法的调用？
// 本来可以用u.ReflectCallFuncXXX直接调用的，但是如果要通过反射，那么首先要将方法注册，也就是MethodByName，然后通过反射调动mv.Call
func main() {
	user := User{
     1, "Allen.Wu", 25}
	// 1. 要通过反射来调用起对应的方法，必须要先通过reflect.ValueOf(interface)来获取到reflect.Value，得到“反射类型对象”后才能做下一步处理
	getValue := reflect.ValueOf(user)
	// 2. 先看看带有参数的调用方法
	//需要指定准确真实的方法名字，如果错误将直接panic，MethodByName返回一个函数值对应的reflect.Value方法的名字。
	methodValue := getValue.MethodByName("ReflectCallFuncHasArgs")
	//[]reflect.Value，这个是最终需要调用的方法的参数，可以没有或者一个或者多个，根据实际参数来定。 
	args := []reflect.Value{
     reflect.ValueOf("wudebao"), reflect.ValueOf(30)}
	//reflect.Value'Kind不是一个方法，那么将直接panic。
	methodValue.Call(args)
	//ReflectCallFuncHasArgs name:  wudebao , age: 30 and origal User.Name: Allen.Wu
	// 一定要指定参数为正确的方法名
	// 3. 再看看无参数的调用方法
	methodValue = getValue.MethodByName("ReflectCallFuncNoArgs")
	args = make([]reflect.Value, 0)
	methodValue.Call(args)
	//ReflectCallFuncNoArgs
}
//可以用u.ReflectCallFuncXXX直接调用的，但是如果要通过反射，那么首先要将方法注册，也就是MethodByName，然后通过反射调用methodValue.Call
```

### Golang的反射reflect性能

**Golang的反射很慢**

```java
//这里取出来的 field 对象是 reflect.StructField 类型，但是它没有办法用来取得对应对象上的值。
type_ := reflect.TypeOf(obj)
field, _ := type_.FieldByName("hello")
//如果要取值，得用另外一套对object，而不是type的反射
//fieldValue类型是 reflect.Value. 它是一个具体的值，而不是一个可复用的反射对象了，每次反射都需要malloc这个reflect.Value结构体，并且还涉及到GC。
type_ := reflect.ValueOf(obj)
fieldValue := type_.FieldByName("hello")
```

Golang reflect慢主要有两个原因:

**1、** 涉及到内存分配以及后续的GC；

**2、** reflect实现里面有大量的枚举，也就是for循环，比如类型之类的；
