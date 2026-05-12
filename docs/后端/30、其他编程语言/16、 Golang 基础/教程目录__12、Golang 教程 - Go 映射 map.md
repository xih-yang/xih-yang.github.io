# 12、Golang 教程 - Go 映射 map
- 来源：https://ddkk.com/zhuanlan/other/golang/2/12.html
- 分类：其他语言
- 分组：教程目录
- 映射是一种数据结构，用于存储一系列无序的键值对（映射基于键来存储值）。
- 映射功能强大的地方是，能够基于键快速检索数据。键就像索引一样，指向与该键关联的值。
- Map 是一种集合，所以我们可以像迭代数组和切片那样迭代它。不过，Map 是无序的，我们无法决定它的返回顺序，这是因为 Map 是使用 hash 表来实现的。
- map 是引用类型，遵守引用类型传递的机制，在一个函数接收 map，修改后，会直接修改原来的 map。
- 容量达到后，再想 map 增加元素，会自动扩容，并不会发生 panic，也就是说 map 能动态的增长键值对。
- map 的 value 经常使用 struct 类型，更适合管理复杂的数据（比 value 是一个 map 更好），比如 value 为 Student/Teacher 结构体。
- 与 C++、Java 不一样，Go 使用映射（map）不需要引入任何库。
- 四种复合类型特点：

复合类型
值的类型
值的变量
值的索引

数组
相同
固定
下标

切片
相同
动态
下标

结构体
不相同
固定
属性名

映射
相同
动态
key 键

## 1. 映射的实现

因为映射也是一个数据集合，所以也可以使用类似处理数组和切片的方式来迭代映射中的元素。但映射是无序集合，所以即使以同样的顺序保存键值对，每次迭代映射时，元素顺序也可能不一样。无序的原因是映射的本质使用了**散列表(hash)**。

map 在底层是用哈希(hash)表实现的，在 `C:\Program Files\Go\src\hash\maphash\maphash.go`，map 是一个 hash 数组列表，由一个个 bucket 组成，示意图如下:

每一个元素都被称为 bucket 的结构体，每一个 bucket 可以保存 8 个键值对，所有元素被 hash 算法填入到数组的 bucket 中，bucket 填满后，将通过一个 overflow 指针来扩展一个 bucket，从来形成链表，以此来解决 hash 冲突的问题，map 就是一个 bucket 指针型的一维数组。

**创建 map 语法如下**

```java
// 创建一个映射，键的类型 string，值的类型 int
dict := make(map[string]int)
dict := make(map[string]int,<元素数量>,)
// 创建一个映射，键值类型都是 string，并对两个键值对进行初始化
dict := map[string]string{
     "name":"zhangsan","address":"nanjing"}
```

映射的键可以是任何值，这个值的类型并不限制，内置类型或者结构体都可以，需要确定这个值可以使用运算符做比较。需要注意的是，切片、函数以及包含切片的结构类型由于是引用类型，均不能作为映射的键。

```java
dict := map[[]string]int{
     }	// 报错：incomparable map key type []string
dict := map[int][]string{
     }	// 切片可以作为值，不可以作为键
```

**map 三种使用方式**

```java
//方式一
//不赋值就需要使用 make() 开辟内存空间，不然会变成 nil map
var a map[string]string
a = make(map[string]string,10)	
a["name"]="Marry"
//方式二
cities := make(map[string]string)
cities["no1"]="北京"
cities["no2"]="上海"
cities["no3"]="赣州"
//方式三
names := map[string]string{
    "name1":"小明",
    "name2":"小花",
    "name3":"小李",
}
```

**示例**

```java
package main
import "fmt"
func main() {
	// 映射声明
	// disc := make(map[string]string)
	dict := map[string]string{
     "name":"zhangsan","address":"nanjing"}
	fmt.Println(dict)
	if len(dict) == 0 {
		fmt.Println("空映射")
	} else {
		fmt.Println("元素个数",len(dict))
	}
}
// 结果
map[address:nanjing name:zhangsan]
元素个数 2
```

## 2. 元素赋值与添加

- map 添加数据只能用键值对赋值的方式，没有 append 函数，因为 map 是无序的，也不存在往中间添加数据一说。
- 使用 map[key]=value 这样的表达式添加数据，如果有存在的 key 会覆盖对应的 value。

```java
// 创建一个空映射，用来存储颜色以及颜色对应的十六进制代码
colors := map[string]string{
     }
// 将 red 的代码加入到映射
colors["red"] = "#DA1337"
```

与切片类似，通过声明一个未初始化的映射可以创建一个值为 nil 的映射。nil 映射不能用于存储键值对，否则会产生运行错误。

```java
// 创建一个 nil 映射
var colors map[string]string
// 将 red 的代码加入到映射
colors["red"] = "#da1337"
// 运行报错
panic: assignment to entry in nil map
```

**示例**

```java
package main
import "fmt"
// 映射赋值
func main() {
	colors := map[string]string{
     }
	// 赋值直接定义键值对，自动添加，键名必须唯一
	// 声明空映射
	// var colors map[string]string
	colors["red"] = "红色"
	colors["blue"] = "蓝色"
	// colors["red"] = "红"
	// colors[""] = "无色"
	// map 的 key 是不能重复的，如果重复了，则以最后这个 key-value 为准
	fmt.Println(colors)
}
// 结果
map[blue:蓝色 red:红色]
```

如果不想出现覆盖的情况，可以判断一下键是否存在再绝对是否添加元素。

```java
if _,ok := map[key];!ok{
    map[key]=value
}
// -------------------------- //
Map1 := make(map[string]string)
countryCapitalMap := make(map[string]string)
Map1["France"] = "巴黎"
Map1["Italy"] = "罗马"
Map1["Japan"] = "东京"
Map1["India"] = "新德里"
Map1["Usa"] = "华盛顿"
for key, value := range countryCapitalMap {
	if v, ok := Map1[key]; !ok {
	    Map1[key] = value
	} 
}
```

## 3. 查找与遍历

从映射取值时有两种方式。

- 第一种方式是获得值以及一个表达这个值是否存在的标志。

```java
package main
import "fmt"
// 映射赋值
func main() {
	colors := map[string]string{
     }
	colors["red"] = "红色"
	colors["blue"] = "蓝色"
	// 第一种方式获取并且判断值是否存在
	value,exe := colors["blue"]
	if exe {
		fmt.Println(value)
	} else {
		fmt.Println("不存在")
	}
}
// 结果
蓝色
```

- 第二种方式是只返回键对应的值，再判断这个值是否有零值，以此来确定键是否存在。这种方式只能用在映射存储的值都是非零值的情况。

```java
package main
import "fmt"
func main() {
	// 第二种方式获取值
	 disc := map[string]int{
     "1":10,"2":20,"3":30}
	 value := disc["2"]
	 if value != 0 {
	 	fmt.Println(value)
	 } else {
	 	fmt.Println("不存在")
	 }
}
// 结果
20
```

**循环遍历访问 map 元素**

```java
// range 可以迭代映射里的所有值
package main
import "fmt"
func main() {
	 disc := map[string]int{
     "1":10,"2":20,"3":30,"4":40,"5":50}
	 // 遍历 map 中所有值
	 for k,v := range disc {
	 	fmt.Printf("key=%s,value=%d\n",k,v)
	 }
}
// 结果
key=1,value=10
key=2,value=20
key=3,value=30
key=4,value=40
key=5,value=50
```

## 4. 元素删除

内置函数 delete() 用于删除容器内的元素。

```java
delete(myMap,"1234")
```

从myMap 中删除键为 1234 的键值对。如果 1234 这个键不存在，那么这个调用将什么都不发生，也不会有任何副作用。但是如果传入的 map 变量的值是 nil，该调用将导致程序抛出异常(panic)。

**示例**

```java
package main
import "fmt"
func main() {
	disc := map[string]int{
     "1":10,"2":20,"3":30,"4":40,"5":50}
	// 遍历 map 中所有值
	for k,v := range disc {
	fmt.Printf("key=%s,value=%d\n",k,v)
	}
	fmt.Println("-----------删除后-----------")
	// 删除元素
	delete(disc,"2")
	for k,v := range disc {
		fmt.Printf("key=%s,value=%d\n",k,v)
	}
}
// 结果
key=3,value=30
key=4,value=40
key=5,value=50
key=1,value=10
key=2,value=20
-----------删除后-----------
key=1,value=10
key=3,value=30
key=4,value=40
key=5,value=50
```

## 5. 将映射传递给函数

在函数间传递映射并不会制造出该映射的副本。当传递映射给函数，并对这个映射做了修改时，所有对这个映射的引用都会察觉到这个修改（**map 是引用类型。传递的是地址**）。

```java
package main
import "fmt"
func main() {
	disc := map[string]int{
     "1":10,"2":20,"3":30,"4":40,"5":50}
	// 遍历 map 中所有值
	for k,v := range disc {
	fmt.Printf("key=%s,value=%d\n",k,v)
	}
	// 映射传参处理
	test(disc)
	fmt.Println("-----------处理后-----------")
	for k,v := range disc {
		fmt.Printf("key=%s,value=%d\n",k,v)
	}
}
func test(m map[string]int) {
	m["2"] = 100
}
// 结果
key=2,value=20
key=3,value=30
key=4,value=40
key=5,value=50
key=1,value=10
-----------处理后-----------
key=1,value=10
key=2,value=100		// map 是引用类型
key=3,value=30
key=4,value=40
key=5,value=50
```

## 6. value 嵌套 map

[https://www.cnblogs.com/PatrickStarGazer/p/15971483.html](https://www.cnblogs.com/PatrickStarGazer/p/15971483.html)

```java
// 存放两个学生信息，每个学生有 name,sex 和 address 信息
package main
import "fmt"
func main(){
	students := make(map[string]map[string]string)
	// 01 和 02 都是键，3 为元素数量(可省略)
	students["01"]=make(map[string]string,3)
	students["01"]["name"]="tom"
	students["01"]["sex"]="男"
	students["01"]["address"]="rode1"
	students["02"]=make(map[string]string,3)
	students["02"]["name"]="Marry"
	students["02"]["sex"]="女"
	students["02"]["address"]="rode2"
	fmt.Println(students)
	fmt.Println(students["02"]["name"])		//取出其中一个信息
}
// 结果
// 0x 键对应的 map value 值
map[01:map[address:rode1 name:tom sex:男] 02:map[address:rode2 name:Marry sex:女]]
Marry
```

## 7. value 嵌套切片

**map 的 value 可以是任意类型，例如嵌套一个 slice 到 map 中**|

```java
func main() {
	testmap := map[string][]string{
     }
	testmap["1"] = []string{
     "001", "002"}
	fmt.Println(testmap["1"])
}
// [001 002]
```

- 综合示例

```java
// 使用 map 来记录学生信息，name 和 age
// 一个学生对应一个 map，并且学生的个数可以动态增加
package main
import "fmt"
func main(){
	// 注意，切片的数据类型为 map
    var students []map[string]string
    students = make([]map[string]string,2)	//切片本身需要 make
    //增加第一个学生信息
     if students[0]==nil {
         students[0]=make(map[string]string,2)
         students[0]["name"]="Marry"
         students[0]["age"]="18"
    }
    //增加第二个学生信息
    if students[1]==nil {
        students[1]=make(map[string]string,2)
        students[1]["name"]="Jack"
        students[1]["age"]="20"
   }
   //使用切片的 append 函数，动态增加学生个数
   newstudent := map[string]string {
       "name":"新的学生Tom",
       "age":"16",
   }
   students = append(students,newstudent)
   fmt.Println(students)
}
// 结果
[map[age:18 name:Marry] map[age:20 name:Jack] map[age:16 name:新的学生Tom]]
```

```java
package main
import "fmt"
func main() {
	// 元素类型为 map 的切片: [map, map, map]
	// 先初始化切片, 因为后续需要用索引初始化 map, 所以要给长度
	a := make([]map[string]int, 2)
	// 使用切片的索引对 map 进行初始化
	a[0] = make(map[string]int, 2)
	// 赋值
	a[0]["Tom"] = 100
	a[0]["Tim"] = 99
	fmt.Println(a) // [map[Tim:99 Tom:100] map[]], 这里因为长度为 2, 用零值补齐, 所以会有 map[]
}
```

- 值为切片的 map

```java
package main
import "fmt"
func main() {
	// 值为切片的 map: map[string][]int, 例: ["语文"][100,99]
	// 先初始化外层的 map
	a := make(map[string][]int, 2)
	// 再初始化内层的切片
	a["语文"] = make([]int, 0, 2)
	// 给切片赋值
	a["语文"] = append(a["语文"], 100, 99)
	a["数学"] = make([]int, 0, 2)
	a["数学"] = append(a["数学"], 97, 93)
	fmt.Println(a)
}
```

- 统计字符串中出现的字符次数

```java
package main
import (
	"fmt"
	"strings"
)
func main() {
	s := "how do you do"
	// 得到一个切片
	words := strings.Split(s, " ")
	// 遍历这个切片, 如果字母存在, v+1, 如果字母不存在, 创建
	a := make(map[string]int, 10) // 创建一个map 用于接收
	// 遍历 words 切片, 把每个单词拿出来
	for _, word := range words {
		// 在 map 中查找, 如果存在, 计数+1, 如果不存在, 则计数=1
		v, ok := a[word]
		if ok {
			a[word] = v + 1
		} else {
			a[word] = 1
		}
	}
	fmt.Println(a) // map[do:2 how:1 you:1]
}
```

## 8. value 嵌套结构体

```java
type aa struct {
	a string
	b int64
	c string
	d int64
}
func main() {
	as := map[int64]*aa{
		11: &aa{
			a: "A",
			b: 1,
			c: "",
			d: 0,
		},
	}
	for index, v := range as {
		//type sf map[int64]aa
		//var aaa sf = map[int64]aa{
		//	index: aa{
		//		c: "nn",
		//	},
		//}
		v.c = "nn"
		fmt.Printf("%#v", as[index])
	}
	//fmt.Println(as)
	//os.Exit(12)
	for _, v := range as {
		fmt.Println(v)
	}
	os.Exit(124)
```

> map 和 struct 的多重嵌套

```java
struct Node1
{
	int data1;
	int data2;
};
struct Node
{
	int key;
	map<int,Node1> myMap1;
};
//map中有Node,Node中有myMap1,myMap1中有Node1,则要想myMap中插入元素，必须由里到外赋值或插入
int main()
{
	//向myMap中插入元素
	map<int,Node> myMap;
	map<int, Node>::iterator it;
	map<int, Node1>::iterator it1;
	int p1 = 4,p=5;
	Node1 N1 = {
     1,2};
	Node N;
	N.key = 3;
	N.myMap1.insert(pair<int, Node1>(p1, N1));
	myMap.insert(pair<int, Node>(p, N));
	//遍历myMap
	for (it = myMap.begin(); it != myMap.end(); it++)
	{
		printf("%d\n",it->first);
		printf("%d\n", it->second.key);
		for (it1 = it->second.myMap1.begin(); it1 != it->second.myMap1.end(); it1++)
		{
			printf("%d\n", it1->first);
			printf("%d\n", it1->second.data1);
			printf("%d\n", it1->second.data2);
		}
	}	
	return 0;
}
```

> struct 作为 map 的 key

```java
type student struct {
	name string
	age int
}
stumap := map[student]int{
	{
     "zhangsan", 18}: 1,
}
//key 是数组
stumap2 := map[[2]int]int{
     {
     1, 2}: 1}
fmt.Println(stumap2)
```
