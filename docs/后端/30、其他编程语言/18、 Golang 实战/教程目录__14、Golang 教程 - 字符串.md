# 14、Golang 教程 - 字符串
- 来源：https://ddkk.com/zhuanlan/other/golang/4/14.html
- 分类：其他语言
- 分组：教程目录
`String`类型在Go中值得特别提到，因为与其他语言相比，它们的实现方式有所不同。

## 什么是字符串

在Go 中字符串是 `字节切片`。可以通过将内容放在双引号 `""` 之间的方式来创建一个字符串。让我们看一个简单的例子，该例子创建并打印一个字符串：

```java
package main
import (
	"fmt"
)
func main() {
	name := "Hello World"
	fmt.Println(name)
}
```

以上程序将输出： `Hello World`。

Go中的字符串符合 `Unicode` 标准，并以 `UTF-8` 编码。

## 访问字符串中的字节

由于字符串是一个字节切片，因此可以访问字符串的每个字节。

```java
package main
import (
	"fmt"
)
func printBytes(s string) {
	for i := 0; i < len(s); i++ {
		fmt.Printf("%x ", s[i])
	}
}
func main() {
	name := "Hello World"
	printBytes(name)
}
```

在上面的程序中，`len(s)` 返回字符串中的字节数，我们使用 `for` 循环以 `16` 进制表示法打印这些字节。`％x`是十六进制的格式说明符。上面的程序打印：`48 65 6c 6c 6f 20 57 6f 72 6c 64`。这些是 `"Hello World"` 的UTF-8方式编码的`Unicode`值。对`Unicode`和`UTF-8`有基本的了解才能更好地理解字符串。我建议阅读：[https://naveenr.net/unicode-character-set-and-utf-8-utf-16-utf-32-encoding/](https://naveenr.net/unicode-character-set-and-utf-8-utf-16-utf-32-encoding/) 来学习什么是 `Unicode` 和 `UTF-8`。

让我们稍微修改上面的程序来打印字符串的字符。

```java
package main
import (  
    "fmt"
)
func printBytes(s string) {
    for i:= 0; i < len(s); i++ {
        fmt.Printf("%x ", s[i])
    }
}
func printChars(s string) {
    for i:= 0; i < len(s); i++ {
        fmt.Printf("%c ",s[i])
    }
}
func main() {
    name := "Hello World"
    printBytes(name)
    fmt.Printf("\n")
    printChars(name)
}
```

在第`16` 行的 `printChars` 函数中，`%c` 格式化指示符用来打印字符串中的字符。上面的程序输出为：

```java
48 65 6c 6c 6f 20 57 6f 72 6c 64 
H e l l o   W o r l d
```

虽然上面的程序看起来像一个合法的方法来访问字符串的单个字符，但这却存在严重的错误。让我们深入这个代码来看看我们做错了什么。

```java
package main
import (
	"fmt"
)
func printBytes(s string) {
	for i := 0; i < len(s); i++ {
		fmt.Printf("%x ", s[i])
	}
}
func printChars(s string) {
	for i := 0; i < len(s); i++ {
		fmt.Printf("%c ", s[i])
	}
}
func main() {
	name := "Hello World"
	printBytes(name)
	fmt.Printf("\n")
	printChars(name)
	fmt.Printf("\n")
	name = "Señor"
	printBytes(name)
	fmt.Printf("\n")
	printChars(name)
}
```

上述程序的输出是：

```java
48 65 6c 6c 6f 20 57 6f 72 6c 64 
H e l l o   W o r l d 
53 65 c3 b1 6f 72 
S e Ã ± o r
```

在上面的程序第 `28` 行，我们试图打印 `Señor` 中的字符串，但是结果却是 `S e Ã ± o r`，这明显是错的。为什么打印 `Hello World` 是对的，打印 `Señor` 是错的呢？原因是 `ñ` 的 `Unicode` 代码点是 `U+00F1` 而它的 `UTF-8` 编码 占了`c3` 和 `b1`两个字节。而我们将一个字节视为一个字符来打印字符串的方法是错误的。在 `UTF-8` 编码中一个代码点编码后可能占多于 `1` 个字节的空间。那么我们如何解决这个问题呢？。 `rune` 可以帮助我们解决这么问题。

## rune

`rune` 是 Go 中的内置类型，它是 `int32` 的别名。在 Go 中，`rune` 表示一个 `Unicode` 代码点。代码点无论占用多少个字节，它都可以表示为一个 `rune`。让我们修改上面的程序，使用 `rune` 来打印字符串中的字符。

```java
package main
import (
	"fmt"
)
func printBytes(s string) {
	for i := 0; i < len(s); i++ {
		fmt.Printf("%x ", s[i])
	}
}
func printChars(s string) {
	runes := []rune(s)
	for i := 0; i < len(runes); i++ {
		fmt.Printf("%c ", runes[i])
	}
}
func main() {
	name := "Hello World"
	printBytes(name)
	fmt.Printf("\n")
	printChars(name)
	fmt.Printf("\n\n")
	name = "Señor"
	printBytes(name)
	fmt.Printf("\n")
	printChars(name)
}
```

在上面的程序的第 `14` 行，字符串被转换为 `rune` 切片。然后我们遍历该切片并打印其中的字符。程序的输出如下：

```java
48 65 6c 6c 6f 20 57 6f 72 6c 64 
H e l l o   W o r l d 
53 65 c3 b1 6f 72 
S e ñ o r
```

上面的输出是正确的。这正是我们想要的结果。

## 使用 for range 遍历字符串

上面的程序是遍历字符串中字符的一个正确方式。但是 Go 提供了一种更简单的方式来做到这一点：使用`for range` 。

```java
package main
import (
	"fmt"
)
func printCharsAndBytes(s string) {
	for index, rune := range s {
		fmt.Printf("%c starts at byte %d\n", rune, index)
	}
}
func main() {
	name := "Señor"
	printCharsAndBytes(name)
}
```

在上述程序的第`8`行中，使用`for range`循环迭代字符串。循环返回`rune`字节的位置。程序输出：

```java
S starts at byte 0
e starts at byte 1
ñ starts at byte 2
o starts at byte 4
r starts at byte 5
```

从上面的输出中可以清晰的看到`ñ`占了两个字节。

## 用字节切片构造字符串

```java
package main
import (
	"fmt"
)
func main() {
	byteSlice := []byte{
     0x43, 0x61, 0x66, 0xC3, 0xA9}
	str := string(byteSlice)
	fmt.Println(str)
}
```

在上面的程序中，`byteSlice` 是 `"Café"` 经过 `UTF-8` 编码后得到的切片（用 `16` 进制表示） 。上面的程序输出为：`Café`。

如果我们换成对应的十进制数程序会正常工作吗？让我们测试一下：

```java
package main
import (
	"fmt"
)
func main() {
	byteSlice := []byte{
     67, 97, 102, 195, 169} //decimal equivalent of {'\x43', '\x61', '\x66', '\xC3', '\xA9'}
	str := string(byteSlice)
	fmt.Println(str)
}
```

上述程序也将输出`Café`。

## 用 rune 切片构造字符串#

```java
package main
import (
	"fmt"
)
func main() {
	runeSlice := []rune{
     0x0053, 0x0065, 0x00f1, 0x006f, 0x0072}
	str := string(runeSlice)
	fmt.Println(str)
}
```

在上面的程序中，`runeSlice` 包含了字符串 `"Señor"` 的 `16` 进制 `Unicode` 代码码点。程序的输出为：`Señor`。

## 字符串的长度#

[utf8](https://golang.org/pkg/unicode/utf8/#RuneCountInString) 包中的 `func RuneCountInString(s string) (n int)` 方法用来获取字符串的长度。这个方法传入一个字符串参数然后返回字符串中的 `rune` 的数量。

```java
package main
import (
	"fmt"
	"unicode/utf8"
)
func length(s string) {
	fmt.Printf("length of %s is %d\n", s, utf8.RuneCountInString(s))
}
func main() {
	word1 := "Señor"
	length(word1)
	word2 := "Pets"
	length(word2)
}
```

上面程序的输出为：

```java
length of Señor is 5  
length of Pets is 4  
```

## 字符串是不可变的#

字符串在Go中是不可变的。创建字符串后，就无法更改它。

```java
package main
import (
	"fmt"
)
func mutate(s string) string {
	s[0] = 'a' //any valid unicode character within single quote is a rune
	return s
}
func main() {
	h := "hello"
	fmt.Println(mutate(h))
}
```

上面的程序第 `8` 行我们试图将字符串的第一个字符改为 `a`。这是不允许的，因为字符串是不可变的，因此程序将会报错：`main.go:8: cannot assign to s[0]`。

为了修改字符串，可以把字符串转化为一个 `rune` 切片。然后这个切片可以进行任何想要的改变，然后再转化为一个新字符串。

```java
package main
import (
	"fmt"
)
func mutate(s []rune) string {
	s[0] = 'a'
	return string(s)
}
func main() {
	h := "hello"
	fmt.Println(mutate([]rune(h)))
}
```

在上面的程序第 `7` 行 `mutate` 函数接受一个 `rune` 切片作为参数。然后将该切片的第一个元素改为 `a`，最后再转换回新的字符串并返回。程序的第 `13` 行调用了该函数。我们把 `h` 转化为一个 `rune` 切片，并传递给了 `mutate`。这个程序输出 : `aello`。
