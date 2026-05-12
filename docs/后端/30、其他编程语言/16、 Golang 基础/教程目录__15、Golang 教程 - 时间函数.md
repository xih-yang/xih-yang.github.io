# 15、Golang 教程 - 时间函数
- 来源：https://ddkk.com/zhuanlan/other/golang/2/15.html
- 分类：其他语言
- 分组：教程目录
## 1. 时间概念

```java
1小时=60分钟	Hour
1分钟=60秒		Minute
1秒=1000毫秒	Second
1毫秒= 1000微秒	Millisecond
1微秒=1000纳秒	Microsecond
1纳秒	Nanosecond
```

```java
// 时间格式化
package main
import (
    "fmt"
    "time"
)
func main() {
    // 获取当前时间
    now := time.Now()	
    // 格式化字符串，时间必须固定
    fmt.Println(now.Format("02/1/2006 15:04:05"))	// go 语言发布时间，固定时间不可变更
    fmt.Println(now.Format("2006/1/02 15:04"))
    fmt.Println(now.Format("2006/1/02"))
    times := now.Format("02/1/2006 15:04:05")
    fmt.Printf("times 数据类型 %T\n",times)  
}
```

```java
05/4/2022 14:42:23
2022/4/05 14:42
2022/4/05
times 数据类型 string
```

## 2. 获取当前日期

```java
package main
import (
    "fmt"
    "time"
)
func main() {
    // 获取当前日期
    now := time.Now()
    times := now.Format("2006/1/02 15:04:05")
    fmt.Println(times)
    // 2022/4/05 14:45:30
    // 第一次按空格分割
    slice1 := strings.Fields(times)
    fmt.Println(slice1[0])
    fmt.Println(slice1[1])
    // 第二次按 / 分割
    slice2 := strings.Split(slice1[0],"/")
    fmt.Println("年份:",slice2[0])
    fmt.Println("月份:",slice2[1])
    fmt.Println("日期:",slice2[2])
    fmt.Printf("slice2 数据类型 %T\n",slice2)
    // 奇数是会员日，偶数非会员日
    // 数据类型转换 string --> int
    // 判断是否有余数
    num,_ := strconv.Atoi(slice2[2])
    if num % 2 != 0 {
        fmt.Println("会员日")
    } else {
        fmt.Println("非会员日")
    }
}
```

```java
2022/4/05 15:01:07
2022/4/05
15:01:07
年份: 2022
月份: 4
日期: 05
slice2 数据类型 []string
会员日
```

## 3. 统计程序执行时间

```java
// 精确到微妙
package main
import (
    "fmt"
    "time"
)
func main() {
    // 使用时间戳统计时间
    start := time.Now().UnixNano()
    sleepTime()
    end := time.Now().UnixNano()
    fmt.Printf("cost: %d us",(end - start)/1000)
}
func sleepTime() {
    time.Sleep(time.Millisecond * 100)
}
```

```java
cost: 100728 us
```
