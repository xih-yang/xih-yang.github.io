# 21、Golang 教程 - 文件处理
- 来源：https://ddkk.com/zhuanlan/other/golang/2/21.html
- 分类：其他语言
- 分组：教程目录
计算机中的文件是存储在外部介质（硬盘）上的数据集合，文件分为文本文件和二进制文件。

## 1. 打开和关闭文件

`os.open()` 函数能够打开一个文件，返回一个 `*File` 和一个 `err`，对得到的文件示例 `close()` 方法能够关闭文件。

`示例`

```java
package main
import (
    "fmt"
    "os"
)
// 打开关闭文件
func main() {
    // 打开当前目录下的 abc.txt 文件
    file,err := os.Open("./abc.txt")
    if err != nil {
        fmt.Println("文件打开失败",err)
    } else {
        fmt.Println("文件打开成功")
        file.Close()	// 从内存释放资源
        fmt.Println("文件关闭成功")
    }
}
/*
文件打开成功
文件关闭成功
*/
```

**PS：使用 vscode 运行执行 go run main.go。**

## 2. 读取文件

接收一个字节切片，返回读取的字节数和可能的具体错误，读到文件末尾时会返回 `0` 和 `io.EOF`。

```java
func (f *File) Read(b []byte) (n int, err error)
```

`示例`

- defer 一般用于资源的释放和异常的捕捉
- defer 语句会将其后面跟随的语句进行延迟处理，跟在 defer 后面的语言将会在程序进行最后的 return 之后再执行
- 在 defer 归属的函数即将返回时，将延迟处理的语句按 defer 的逆序进行执行，也就是说，先被 defer 的语句最后被执行，最后被 defer 的语句，最先被执行

```java
package main
import (
    "fmt"
)
func hello() {
    defer fmt.Println("执行 defer")	// 延迟处理，函数关闭前执行
    for i := 0; i < 10; i++ {
        fmt.Println(i)
        if i == 8 {
            break
            /* 手动宕机处理，立马关闭当前程序，并释放内存空间
            panic("程序宕机")
            */ 
        }
    }
    defer fmt.Println("执行 defer")	// 无论放在什么位置，函数关闭执行 defer 语句
}
func main() {
    hello()
}
/*
0
1
2
3
4
5
6
7
8
执行 defer
执行 defer
*/
```

```java
package main
import (
	"fmt"
)
func hello() {
	defer fmt.Println("执行 defer")	// 延迟处理，函数关闭前执行
	for i := 0; i < 10; i++ {
		fmt.Println(i)
		if i == 8 {
			panic("程序宕机")
		}
	}
	defer fmt.Println("执行 defer")	// 无论放在什么位置，函数关闭执行 defer 语句
}
func main() {
	hello()
}
/*
0
1
2
3
4
5
6
7
8
执行 defer
panic: 程序宕机
goroutine 1 [running]:
main.hello()
	D:/goproject/src/dev_code/test/main/main.go:12 +0x225
main.main()
	D:/goproject/src/dev_code/test/main/main.go:19 +0x27
*/
```

```java
package main
import (
    "fmt"
    "io"
    "os"
)
// 打开关闭文件
func main() {
    // 打开当前目录下的 abc.txt 文件
    file,err := os.Open("./abc.txt")
    if err != nil {
        fmt.Println("文件打开失败",err)
        return
    }
    // 文件能打开
    defer file.Close()	// 使用 defer 延迟开关，main 函数即将结束前释放文件资源
    fmt.Println("文件成功打开")
    // 读文件
    var tmp [128]byte	// 定义一个字节切片，每次读 128 字节
    n,err := file.Read(tmp[:])
    // 文件读完
    if err == io.EOF {
        fmt.Println("文件已读完")
        return
    }
    // 读取中报错
    if err != nil {
        fmt.Println("Read from file failed,err",err)
        return
    }
    fmt.Printf("读取 %d 个字节\n",n)
    fmt.Println(string(tmp[:]))
    // fmt.Printf("获取的内容是:%s\n",string(tmp[:]))
}
/*
读取 23 个字节
adadadsad
sdsadasdas
*/
```

`示例：当读取文件内容变成长篇文档，该怎么办?`

```java
《生于忧死于安乐》
舜发于畎亩之中，傅说举于版筑之间，胶鬲举于鱼盐之中，管夷吾举于士，孙叔敖举于海，百里奚举于市。故天将降大任于是人也，必先苦其心志，劳其筋骨，饿其体肤，空乏其身，行拂乱其所为，所以动心忍性，曾益其所不能。
人恒过，然后能改，困于心，衡于虑，而后作﹔征于色，发于声，而后喻。入则无法家拂士，出则无敌国外患者，国恒亡，然后知生于忧患而死于安乐也。
作者:孟子
```

```java
package main
import (
    "fmt"
    "io"
    "os"
)
// 打开关闭文件
func main() {
    // 打开当前目录下的 abc.txt 文件
    file,err := os.Open("./abc.txt")
    if err != nil {
        fmt.Println("文件打开失败",err)
        return
    }
    // 文件能打开
    defer file.Close()	// 使用 defer 延迟开关，main 函数即将结束前释放文件资源
    fmt.Println("文件成功打开")
    // 读文件
    var tmp [128]byte	// 定义一个字节切片，每次读 128 字节
    // for 循环读取内容，输出到程序中
    for {
        _,err := file.Read(tmp[:])
        // 文件读完
        if err == io.EOF {
            fmt.Println("文件已读完",err)
            return
        }
        // 读取中报错
        if err != nil {
            fmt.Println("Read from file failed,err",err)
            return
        }
        fmt.Printf("%s",string(tmp[:]))
    }
}
/*
文件成功打开
获取的内容是:《生于忧死于安乐》
舜发于畎亩之中，傅说举于版筑之间，胶鬲举于鱼盐之中，管夷吾举于士，获取的内容是:孙叔敖举于海，百里奚举于市。故天将降大任于是人也，必先苦其心志，劳其筋骨，饿其体肤，��获取的内容是:�乏其身，行拂乱其所为，所以动心忍性，曾益其所不能。       
人恒过，然后能改，困于心，衡于虑��获取的内容是:�而后作﹔征于色，发于声，而后喻。入则无法家拂士，出则无敌国外患者，国恒亡，然后知生于�获取的内容是:��患而死于安乐也。
作者:孟子��喻。入则无法家拂士，出则无敌国外患者，国恒亡，然后知生于�文件已读完 EOF
*/
```

**解决乱码：使用 bufio 读取。bufio 在 file 的基础上封装了一层 API，支持更多的功能。**

```java
package main
import (
    "fmt"
    "os"
    "io"
    "bufio"
)
// bufio 读数据
func main() {
    file,err := os.Open("./abc.txt")
    if err != nil {
        fmt.Println("文件打开失败",err)
        return
    }
    defer file.Close()
    // 封装一个 API 层
    // 利用缓冲区从文件读数据
    reader := bufio.NewReader(file)
    for {
        str,err := reader.ReadString('\n')	// 字符
        if err == io.EOF {
            fmt.Print(str)	// 要输出，否则不显示
            return
        }
        if err != nil {
            fmt.Println("读取文件内容失败",err)
            return
        }
        fmt.Print(str)	// 取消文件中的自带换行
    }
}
/*
《生于忧死于安乐》
舜发于畎亩之中，傅说举于版筑之间，胶鬲举于鱼盐之中，管夷吾举于士，孙叔敖举于海，百里奚举于市。故天将降大任于是人也，必先苦其心志，劳其筋骨，饿其体肤，空乏其身，行拂乱其所为，所以动心忍性，曾益其所不能。
人恒过，然后能改，困于心，衡于虑，而后作﹔征于色，发于声，而后喻。入则无法家拂士，出则无敌国外患者，国恒亡，然后知生于忧患而死于安乐也。
作者:孟子
*/
```

**示例：ioutil 便捷方式读取文件**

```java
package main
import (
    "fmt"
    "io/ioutil"
)
// ioutil 读取文件
func readFile(filename string) {
    content,err := ioutil.ReadFile(filename)
    if err != nil {
        fmt.Println("READ FILE FAILED,ERR:",err)
        return
    }
    fmt.Println(string(content))
}
func main() {
    readFile("./abc.txt")
}
/*
《生于忧死于安乐》
舜发于畎亩之中，傅说举于版筑之间，胶鬲举于鱼盐之中，管夷吾举于士，孙叔敖举于海，百里奚举于市。故天将降大任于是人也，必先苦其心志，劳其筋骨，饿其体肤，空乏其身，行拂乱其所为，所以动心忍性，曾益其所不能。
人恒过，然后能改，困于心，衡于虑，而后作﹔征于色，发于声，而后喻。入则无法家拂士，出则无敌国外患者，国恒亡，然后知生于忧患而死于安乐也。
作者:孟子
*/
```

**示例：读取奇/偶数行**

```java
package main
import (
	"bufio"
	"fmt"
	"io"
	"os"
)
// bufio 读数据
func main() {
	file, err := os.Open("./abc.txt")
	if err != nil {
		fmt.Println("文件打开失败", err)
		return
	}
	defer file.Close()
	// 利用缓冲区从文件读数据
	reader := bufio.NewReader(file)
	count := 0
	for {
		// 输出奇数行
		str, _, err := reader.ReadLine()
		count++
		if err == io.EOF {
			return
		}
		if err != nil {
			fmt.Println("读取文件内容失败", err)
			return
		}
		if count%2 == 1 {
     	// 0 为偶数
			fmt.Println(string(str))
		}
	}
}
```

## 3. 写入文件

`os.OpenFile()` 函数能够以指定模式打开文件，从而实现文件写入相关功能。

```java
func OpenFile(name string, flag int, perm FileMode)(*File,error) {
    ...
}
```

> 说明：
>
> name：要打开的文件名
>
> flag：打开文件的模式

**模式种类：**

模式
含义

os.O_WRONLY
只写

os.O_CREATE
创建文件

os.O_RDONLY
只读

os.O_RDWR
读写

os.O_TRUNC
清空

os.O_APPEND
追加

perm：文件权限，一个八进制数。r(读)04，w(写)02，x(执行)01。

`示例：Write 和 WriteString 方式。`

```java
package main
import (
    "fmt"
    "os"
)
// 打开文件支持文件写入
func main() {
    // 创建 tmp.txt 文件，分配权限 755
    file,err := os.OpenFile("tmp.txt",os.O_CREATE|os.O_WRONLY,0755)
    if err != nil {
        fmt.Println("打开文件失败",err)
        return
    }
    defer file.Close()
    // 定义写入内容
    str := "hello world"
    // 字节方式写入
    file.Write([]byte("this is test\n"))
    // 字符串方式写入
    file.WriteString(str)
}
/* tmp.txt
this is test
hello world
*/
```

`示例：bufio.NewWriter 方式`

```java
package main
import (
    "fmt"
    "os"
    "bufio"
)
// 打开文件支持文件写入
func main() {
    file,err := os.OpenFile("tmp.txt",os.O_CREATE|os.O_WRONLY|os.O_TRUNC,0666)
    if err != nil {
        fmt.Println("打开文件失败",err)
        return
    }
    defer file.Close()
    // 定义写入内容
    write := bufio.NewWriter(file)
    for i:=0;i<10;i++ {
        write.WriteString("hello world\n")	// 将数据写入缓存
    }
    write.Flush()	// 将缓存中的内容写入文件
}    
/* tmp.txt
hello world
hello world
hello world
hello world
hello world
hello world
hello world
hello world
hello world
hello world
*/
```

`示例：ioutil.WriteFile 方式`

```java
package main
import (
    "fmt"
    "io/ioutil"
)
func main() {
    str := "hello world\nthis is test"
    // 字符串转换为字节数组写入
    err := ioutil.WriteFile("./tmp.txt",[]byte(str),0666)
    if err != nil {
        fmt.Println("文件写入错误",err)
        return
    }
}
/* tmp.txt
hello world
this is test
*/
```
