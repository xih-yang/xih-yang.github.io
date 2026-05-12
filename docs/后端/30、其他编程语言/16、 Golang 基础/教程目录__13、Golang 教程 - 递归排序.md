# 13、Golang 教程 - 递归排序
- 来源：https://ddkk.com/zhuanlan/other/golang/2/13.html
- 分类：其他语言
- 分组：教程目录
- 递归，就是在运行的过程中调用自己。
- Go 支持递归。但在使用递归时，开发者需要设置退出条件，否则递归将陷入无限循环中。
- 递归函数对于解决数学上的问题是非常有用的，就像计算阶乘，生成斐波那契数列等。

语法如下：

```java
func recursion() {
    recursion() // 函数调用自身
}
func main() {
    recursion()
}
```

## 1. 阶乘

示例：

```java
package main
import "fmt"
// uint64 无符号整形
func Oper(n uint64) (result uint64) {
	if n > 0 {
		result = n * Oper(n-1)
		return result
	}
	return 1	// 退出条件
}
func main() {
	var i int = 5
    // uint64(i) 是数据类型转换
	fmt.Printf("%d 的阶乘是 %d\n",i,Oper(uint64(i)))
}
// 结果
5 的阶乘是 120
```

## 2. 斐波那契数列

递归实现斐波那契数列

```java
package main
import "fmt"
func Oper(n int) int {
    if n < 2 {
        // 前两位数本身
        return n
    }
    //前两数和
    return Oper(n-2) + Oper(n-1)
}
func main() {
    var i int
    for i = 0; i < 10; i++ {
        fmt.Printf("%d\t",Oper(i))
    }
}
// 结果
0	1	1	2	3	5	8	13	21	34	
```
