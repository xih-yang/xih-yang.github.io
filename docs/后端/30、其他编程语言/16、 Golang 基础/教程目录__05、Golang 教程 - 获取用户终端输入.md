# 05、Golang 教程 - 获取用户终端输入
- 来源：https://ddkk.com/zhuanlan/other/golang/2/5.html
- 分类：其他语言
- 分组：教程目录
**在编程中，需要接收用户输入的数据，就可以使用键盘输入语句来获取。**

## API

**fmt.Scanln(&变量)**

```java
func Scanln(a ...interface{
     }) (n int, err error)
```

ScanIn 类似 Scan，但会在换行时才停止扫描。最后一个条目后必须有换行或者到达结束位置。

- **fmt.Scanf("格式",&变量)**

```java
func Scanf(format string, a ...interface{
     }) (n int, err error)
```

Scanf 从标准输入扫描文本，根据 format 参数指定的格式将成功读取的空白分隔的值保存进成功传递给本函数的参数。返回成功扫描的条目个数和遇到的任何错误。

## 示例

**fmt.Scanln**

```java
package main
import "fmt"
func main() {
	// 实现功能：键盘录入学生的年龄，姓名，成绩，是否 VIP
	var age int
	fmt.Println("请输入学生的年龄：")
	// 传入 age 的地址的目的：在 Scanln 函数中，对地址中的值进行改变的时候，实际外面的 age 被影响了
	fmt.Scanln(&age) // 录入数据的时候，类型一定要匹配，因为底层会自动判定类型的
	var name string
	fmt.Println("请输入学生的姓名：")
	fmt.Scanln(&name)
	var score float32
	fmt.Println("请输入学生的成绩：")
	fmt.Scanln(&score)
	var isVIP bool
	fmt.Println("请输入学生是否是 VIP：")
	fmt.Scanln(&isVIP)
	// 在控制台打印输出
	fmt.Printf("学生年龄为 %v,姓名为 %v,成绩为 %v,是否为VIP %v",age,name,score,isVIP)
}
//---结果---//
请输入学生的年龄：
20
请输入学生的姓名：
zc
请输入学生的成绩：
60
请输入学生是否是 VIP：
true
学生年龄为 20,姓名为 zc,成绩为 60,是否为VIP true
```

**fmt.Scanf**

```java
package main
import "fmt"
func main() {
	// 实现功能：键盘录入学生的年龄，姓名，成绩，是否 VIP
	var age int
	var name string
	var score float32
	var isVIP bool
	fmt.Println("请输入学生的年龄，姓名，成绩，是否VIP，使用空格分割!")
	fmt.Scanf("%d %s %f %t",&age,&name,&score,&isVIP)
	fmt.Printf("学生年龄为 %v,姓名为 %v,成绩为 %v,是否为VIP %v",age,name,score,isVIP)
}
//---结果---//
请输入学生的年龄，姓名，成绩，是否VIP，使用空格分割!
20 ZC 60 true
学生年龄为 20,姓名为 ZC,成绩为 60,是否为VIP true
```

[https://www.cnblogs.com/puti306/p/11414919.html](https://www.cnblogs.com/puti306/p/11414919.html)
