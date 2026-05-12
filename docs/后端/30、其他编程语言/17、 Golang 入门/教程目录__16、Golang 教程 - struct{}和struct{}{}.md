# 16、Golang 教程 - struct{}和struct{}{}
- 来源：https://ddkk.com/zhuanlan/other/golang/3/16.html
- 分类：其他语言
- 分组：教程目录
## struct{} 和 struct{}{}

- 一般我们知道struct在Go语言中是用于定义结构类型

```java
type User struct {
    Name string
    Age  int
}
```

而`struct {}`是一个无元素的结构体类型，通常在没有信息存储时使用。优点是大小为0，不需要内存来存储struct {}类型的值。

`struct {} {}`是一个复合字面量，它构造了一个struct {}类型的值，该值也是空。

- 比如我们可以用map[string]struct{}来当作成一个set来用

```java
var set map[string]struct{
     } 
set = make(map[string]struct{
     })
set["red"] = struct{
     }{
     } // struct{}{}  构造了一个struct {}类型的值
set["blue"] = struct{
     }{
     }
_, ok := set["red"]
fmt.Println("Is red in the map?", ok)
_, ok = set["green"]
fmt.Println("Is green in the map?", ok)
```

输出内容

```java
Is red in the map? true
Is green in the map? false
```

map可以通过“comma ok”机制来获取该key是否存在,`_, ok := map["key"]`,如果没有对应的值,`ok`为`false`,这样可以通过定义成map[string]struct{}的形式,值不再占用内存。其值仅有两种状态，有或无

### 其他知识点

- chan struct{}：可以用作通道的退出
- 两个structt{}{}地址相等
