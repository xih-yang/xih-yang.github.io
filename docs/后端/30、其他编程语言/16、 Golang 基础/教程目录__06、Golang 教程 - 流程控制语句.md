# 06、Golang 教程 - 流程控制语句
- 来源：https://ddkk.com/zhuanlan/other/golang/2/6.html
- 分类：其他语言
- 分组：教程目录
## 一、分支结构

### 1. if 分支

Go语言提供了以下几种条件判断语句：

语句
描述

if 语句
if 语句 由一个布尔表达式后紧跟一个或多个语句组成。

if…else 语句
if 语句 后可以使用可选的 else 语句, else 语句中的表达式在布尔表达式为 false 时执行。

if 嵌套语句
你可以在 if 或 else if 语句中嵌入一个或多个 if 或 else if 语句。

switch 语句
switch 语句用于基于不同条件执行不同动作。

select 语句
select 语句类似于 switch 语句，但是select会随机执行一个可运行的case。如果没有case可运行，它将阻塞，直到有case可运行。

#### 1.1 单分支

```java
if 条件表达式 {
  逻辑代码
}
```

当条件表达式为 true 时，就会执行得的代码。

> 条件表达式左右的 () 可以不写，也建议不写。
>
> if 和表达式中间，一定要有空格。
>
> 在Golang 中，{} 是必须有的，就算你只写一行代码。

```java
package main
import "fmt"
func main() {
	var count int = 100
	if count > 30 {
		fmt.Println("数量充足！")
	}
}
// ------ //
数量充足！
```

#### 1.2 双分支

```java
if 条件表达式 {
   逻辑代码1
} else {
   逻辑代码2
}
// 下面代码格式是错误的
if 条件表达式 {
   逻辑代码1
}
else {
   逻辑代码2
} 
```

**示例：**

```java
package main
import "fmt"
func main() {
	var count int = 70
	if count < 30 {
		fmt.Println("库存不足")
	} else {
		fmt.Println("库存充足")
	}
}
```

#### 1.3 多分支

```java
if 条件表达式1 {
    逻辑代码1
} else if 条件表达式2 {
    逻辑代码2
}
......
else {
    逻辑代码n
}
```

**示例：**

```java
// 方法一
package main
import "fmt"
func main() {
	var grade int
	fmt.Println("请输入分数:")	// 提示语句
	fmt.Scanf("%d",&grade)
	a := grade
	if a >= 90 {
		fmt.Println("成绩为 A")
	}
	if a >= 80 && a < 90 {
		fmt.Println("成绩为 B")
	}
	if a >= 60 && a < 80 {
		fmt.Println("成绩为 C")
	}
	if a < 60 {
		fmt.Println("成绩为 D")
	}
}
// 方法二
package main
import "fmt"
func main() {
	var grade int
	fmt.Println("请输入分数:")	// 提示语句
	fmt.Scanf("%d",&grade)
	a := grade
	if a >= 90 {
		fmt.Println("成绩为 A")
	} else if a >= 80 {
     //else隐藏：score < 90
		fmt.Println("成绩为 B")
	} else if a >= 70 {
     //score < 80
		fmt.Println("成绩为 C")
	} else if a >= 60 {
     //score < 70
		fmt.Println("成绩为 D")
	} else {
     //score < 60
		fmt.Println("成绩为 E")
	}
}
```

#### 1.4 嵌套

```java
if 布尔表达式 1 {
   /* 在布尔表达式 1 为 true 时执行 */
   if 布尔表达式 2 {
      /* 在布尔表达式 2 为 true 时执行 */
   }
}
```

**示例：**

```java
package main
import "fmt"
func main() {
	var a int = 100
	var b int = 200
	if a == 100 {
		if b == 200 {
			fmt.Printf("a 的值为 %d\n",a)
			fmt.Printf("b 的值为 %d\n",b)
		}
	}
}
// -----双重判断用户密码输入----- //
package main
import "fmt"
func main() {
	var a int
	var b int
	fmt.Printf("请输入密码：\n")
	fmt.Scan(&a)
	if a == 654321 {
		fmt.Printf("请再次输入密码：")
		fmt.Scan(&b)
		if b == 123456 {
			fmt.Printf("密码正确，门锁已打开!")
		} else {
			fmt.Printf("密码错误，已报警!")
		}
	} else {
		fmt.Printf("密码错误，已报警!")
	}
}
```

### 2. switch 分支

- switch 后是一个表达式（即：常量值、变量、一个有返回值的函数等都可以）
- case 后面的值如果是常量值（字面量），则要求不能重复
- case 后的各个值的数据类型，必须和 switch 的表达式数据类型一致
- case 后面可以带多个值，使用逗号间隔。比如 case val1,val2,...
- case 后面不需要带 break
- default 语句不是必须的，位置也是随意的
- switch 后也可以不带表达式，当做 if 分支来使用
- switch 后也可以直接声明/定义一个变量，分号结束，不推荐
- switch 穿透，利用 fallthrough 关键字，如果在 case 语句块后增加 fallthrough，则会继续执行下一个 case，也叫 switch 穿透

```java
switch 表达式 {
	case 值1,值2,...:
	    语句块1
	case 值3,值4,...:
		语句块2
	......
	default:
		语句块
}
```

**示例：**

```java
package main
import "fmt"
func main() {
	var score float64
	fmt.Println("请输入分数（0-100）：")
	fmt.Scanf("%f",&score)
	switch score/10 {
	case 10 :
		fmt.Println("等级为 A")
	case 9 :
		fmt.Println("等级为 A")
	case 8 :
		fmt.Println("等级为 B")
	case 7 :
		fmt.Println("等级为 B")
	case 6 :
		fmt.Println("等级为 C")
	default:
		fmt.Println("不合格")
	}
}
```

**Type Switch**

- switch 语句还可以被用于 type-switch 来判断某个 interface 变量中实际存储的变量类型。
- Type Switch 语法格式如下：

```java
switch x.(type){
    case type:
       statement(s);      
    case type:
       statement(s); 
    /* 你可以定义任意个数的case */
    default: /* 可选 */
       statement(s);
}
```

```java
package main
import "fmt"
func main() {
   var x interface{
     }
   switch i := x.(type) {
      case nil:  
         fmt.Printf(" x 的类型 :%T",i)                
      case int:  
         fmt.Printf("x 是 int 型")                      
      case float64:
         fmt.Printf("x 是 float64 型")          
      case func(int) float64:
         fmt.Printf("x 是 func(int) 型")                      
      case bool, string:
         fmt.Printf("x 是 bool 或 string 型" )      
      default:
         fmt.Printf("未知型")    
   }  
}	// x 的类型 :<nil>
// ---------------------------- //
package main
import "fmt"
// 全局变量可以不被调用，函数中声明的变量一定要被调用
// type-Switch 语句判断数据类型
func main() {
	var num = 3.14
	make_type(num)
}
func make_type(x interface{
     }) {
	// 判断数据类型 type 只能使用搭配 Switch，如果想单独使用输出数据类型，需要使用反射
	switch i := x.(type) {
	case nil:
		fmt.Printf("数据类型为 %T",i)
	case int:
		fmt.Println("数据类型为 int")
	case float32,float64:
		fmt.Println("数据类型为浮点型")
	case string:
		fmt.Println("数据类型为字符串")
	case bool:
		fmt.Println("数据类型为 bool")
	default:
		fmt.Println("其他类型")
	}
 }	// 数据类型为浮点型
// -----反射判断数据类型-----//
package main
import (
	"fmt"
	"reflect"
)
// 全局变量可以不被调用，函数中声明的变量一定要被调用
// type-Switch 语句判断数据类型
func main() {
	var num *int
	fmt.Println("num 的数据类型：",reflect.TypeOf(num))
}	// num 的数据类型： *int
```

**fallthrough**

- 使用 fallthrough 会强制执行后面的 case 语句，fallthrough 不会判断下一条 case 的表达式结果是否为 true。

```java
package main
import "fmt"
func main() {
    switch {
    case false:
            fmt.Println("1、case 条件语句为 false")
            fallthrough
    case true:
            fmt.Println("2、case 条件语句为 true")
            fallthrough
    case false:
            fmt.Println("3、case 条件语句为 false")
            fallthrough
    case true:
            fmt.Println("4、case 条件语句为 true")
    case false:
            fmt.Println("5、case 条件语句为 false")
            fallthrough
    default:
            fmt.Println("6、默认 case")
    }
}
// 结果
2、case 条件语句为 true
3、case 条件语句为 false
4、case 条件语句为 true
```

> switch 从第一个判断表达式为 true 的 case 开始执行，如果 case 带有 fallthrough，程序会继续执行下一条 case，且它不会去判断下一个 case 的表达式是否为 true。

**多条件匹配**

```java
switch{
    case 1,2,3,4:
    default:
}
```

- 不同的 case 之间不使用 break 分隔，默认只会执行一个 case。
- 如果想要执行多个 case，需要使用 fallthrough 关键字，也可用 break 终止。

```java
switch{
    case 1:
    ...
    if(...){
        break
    }
    fallthrough // 此时switch(1)会执行case1和case2，但是如果满足if条件，则只执行case1
    case 2:
    ...
    case 3:
}
```

### 3. select 语句

- select 是 Go 中的一个控制结构，类似于用于通信的 switch 语句。每个 case 必须是一个通信操作，要么是发送要么是接收。
- select 随机执行一个可运行的 case。如果没有 case 可运行，它将阻塞，直到有 case 可运行。一个默认的子句应该总是可运行的。

**语法：**

```java
select {
    case communication clause  :
       statement(s);      
    case communication clause  :
       statement(s);
    /* 你可以定义任意数量的 case */
    default : /* 可选 */
       statement(s);
}
```

> 每个 case 都必须是一个通信。
>
> 所有 channel 表达式都会被求值。
>
> 所有被发送的表达式都会被求值。
>
> 如果任意某个通信可以进行，它就执行，其他被忽略。
>
> 如果有多个 case 都可以运行，Select 会随机公平地选出一个执行。其他不会执行。
>
> 否则：
>
> 如果有 default 子句，则执行该语句。
>
> 如果没有 default 子句，select 将阻塞，直到某个通信可以运行；Go 不会重新对 channel 或值进行求值。

**示例：**

```java
package main
import "fmt"
func main() {
   var c1, c2, c3 chan int
   var i1, i2 int
   select {
      case i1 = <-c1:
         fmt.Printf("received ", i1, " from c1\n")
      case c2 <- i2:
         fmt.Printf("sent ", i2, " to c2\n")
      case i3, ok := (<-c3):  // same as: i3, ok := <-c3
         if ok {
            fmt.Printf("received ", i3, " from c3\n")
         } else {
            fmt.Printf("c3 is closed\n")
         }
      default:
         fmt.Printf("no communication\n")
   }    
}
// no communication
/// ------------------------------------ ///
package main
import (
	"fmt"
	"time"
)
func Chann(ch chan int, stopCh chan bool) {
	for j := 0; j < 10; j++ {
		ch <- j
		time.Sleep(time.Second)
	}
	stopCh <- true
}
func main() {
	ch := make(chan int)
	c := 0
	stopCh := make(chan bool)
	go Chann(ch, stopCh)
	for {
		select {
		case c = <-ch:
			fmt.Println("Receive C", c)
		case s := <-ch:
			fmt.Println("Receive S", s)
		case _ = <-stopCh:
			goto end
		}
	}
end:
}
```

[https://blog.csdn.net/ma2595162349/article/details/112911710](https://blog.csdn.net/ma2595162349/article/details/112911710)

## 二、循环结构

Go语言提供了以下几种类型循环处理语句：

循环类型
描述

for 循环
重复执行语句块

循环嵌套
在 for 循环中嵌套一个或多个 for 循环

### 1. for 循环

Go语言的 For 循环有 3 种形式，只有其中的一种使用分号。

- 和 C 语言的 for 一样：

```java
for init; condition; post {
      }
```

- 和 C 的 while 一样：

```java
for condition {
      }
```

- 和 C 的 for(;;) 一样：

```java
for {
      }
```

**示例：**

```java
// 计算 1 到 10 的数字之和：55
package main
import "fmt"
func main() {
        sum := 0
        for i := 0; i <= 10; i++ {
                sum += i
        }
        fmt.Println(sum)
}
// 无限循环
package main
import "fmt"
func main() {
    for true  {
        fmt.Printf("这是无限循环。\n");
    }
}
// For-each range 循环（对字符串、数组、切片等进行迭代输出元素）
package main
import "fmt"
func main() {
        strings := []string{
     "google", "runoob"}
        for i, s := range strings {
                fmt.Println(i, s)
        }
        numbers := [6]int{
     1, 2, 3, 5}
        for i,x:= range numbers {
                fmt.Printf("第 %d 位 x 的值 = %d\n", i,x)
        }  
}
```

### 2. 循环控制语句

- 循环控制语句可以控制循环体内语句的执行过程。
- GO 语言支持以下几种循环控制语句：

控制语句
描述

break 语句
经常用于中断当前 for 循环或跳出 switch 语句

continue 语句
跳过当前循环的剩余语句，然后继续进行下一轮循环。

goto 语句
将控制转移到被标记的语句。

return 语句
返回函数值

break

```java
package main
import "fmt"
func main(){
        //功能：求1-100的和，当和第一次超过300的时候，停止程序
        var sum int = 0
        for i := 1 ; i <= 100 ; i++ {
                sum += i
                fmt.Println(sum)
                if sum >= 300 {
                        //停止正在执行的这个循环：
                        break 
                }
        }
        fmt.Println("-----ok")
}
/// --- 标签的使用 --- ///
package main
import "fmt"
func main() {
label:
	for i:=1;i<=5;i++ {
		fmt.Println("外层:",i)
		for j:=1;j<=8;j++ {
			fmt.Println("内层",j)
			if j > 5 {
				break label
			}
		}
	}
}
```

continue

```java
package main
import "fmt"
func main(){
        //功能：输出1-100中被6整除的数：
        //方式1：
        // for i := 1; i <= 100; i++ {
        // 	if i % 6 == 0 {
        // 		fmt.Println(i)
        // 	}
        // }
        //方式2：
        for i := 1; i <= 100; i++ {
                if i % 6 != 0 {
                        continue //结束本次循环，继续下一次循环
                }
                fmt.Println(i)
        }
}
// -----------------------//
package main
import "fmt"
func main(){
        //双重循环：
        for i := 1; i <= 5; i++ {
                for j := 2; j <= 4; j++ {
                        if i == 2 && j == 2 {
                                continue
                        }
                        fmt.Printf("i: %v, j: %v \n",i,j)
                }
        }
        fmt.Println("-----ok")
}
// -----------------------//
package main
import "fmt"
func main(){
        //双重循环：
        label:
        for i := 1; i <= 5; i++ {
                for j := 2; j <= 4; j++ {
                        if i == 2 && j == 2 {
                                continue label
                        }
                        fmt.Printf("i: %v, j: %v \n",i,j)
                }
        }
        fmt.Println("-----ok")
}
// -----------------------//
package main
import "fmt"
/*continue使用标记*/
func main() {
	fmt.Println("外层循环开始")
abc:
	for i := 1; i <= 5; i++ {
		fmt.Println("外层：", i)
		for j := 10; j < 20; j++ {
			fmt.Println("内层：", j)
			if j > 15 {
				continue abc
			}
		}
	}
	fmt.Println("外层循环结束")
}
```

goto

```java
package main
import "fmt"
func main(){
        fmt.Println("hello golang1")
        fmt.Println("hello golang2")
        if 1 == 1 {
                goto label1 //goto一般配合条件结构一起使用
        }
        fmt.Println("hello golang3")
        fmt.Println("hello golang4")
        fmt.Println("hello golang5")
        fmt.Println("hello golang6")
        label1:
        fmt.Println("hello golang7")
        fmt.Println("hello golang8")
        fmt.Println("hello golang9")
}
// ------ //
package main
import "fmt"
/*标签在goto语句之前  实现类似循环操作*/
/*标签在goto语句之后  实现跳过语句步骤执行*/
func main() {
	//初始值
	i := 4
	fmt.Println(i)
	i++
	//退出条件
	if i == 5 {
		goto HERE
	}
	fmt.Println("语句1")
	fmt.Println("语句2")
	fmt.Println("语句3")
HERE: //跳转标记
	fmt.Println("语句4")
}
```

return

```java
package main
import "fmt"
func main(){
        for i := 1; i <= 100; i++ {
                fmt.Println(i)
                if i == 14 {
                        return //结束当前的函数
                }
        }
        fmt.Println("hello golang")
}
```
