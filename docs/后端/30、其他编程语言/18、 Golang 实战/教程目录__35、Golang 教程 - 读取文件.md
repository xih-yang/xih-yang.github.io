# 35、Golang 教程 - 读取文件
- 来源：https://ddkk.com/zhuanlan/other/golang/4/35.html
- 分类：其他语言
- 分组：教程目录
读取文件是所有编程语言中最常见的操作之一。本教程我们将了解如何使用 Go 读取文件。

本教程包含以下部分：

- 将整个文件读取到内存
- 使用绝对文件路径
- 将文件路径作为命令行标志传递
- 将文件绑定在二进制文件中
- 分块读取文件
- 逐行读取文件

##### 将整个文件读取到内存

将整个文件读取到内存是最基本的文件操作之一。我们可以借助 [ioutil 包](https://golang.org/pkg/io/ioutil/)中的 [ReadFile](https://golang.org/pkg/io/ioutil/#ReadFile) 函数来完成该操作。

让我们在 Go 程序所在的目录中，读取一个文件。我已经在 `GOROOT` 中创建了文件夹，在该文件夹内部，有一个文本文件 `test.txt`，我们会使用 Go 程序 `filehandling.go` 来读取它。`test.txt` 包含文本 `"Hello World. Welcome to file handling in Go"`。我的文件夹结构如下：

```java
src
    filehandling
        filehandling.go
        test.txt
```

让我们直接看代码吧

```java
package main
import (  
    "fmt"
    "io/ioutil"
)
func main() {
    data, err := ioutil.ReadFile("test.txt")
    if err != nil {
        fmt.Println("File reading error", err)
        return
    }
    fmt.Println("Contents of file:", string(data))
}
```

在上述程序的第 `9` 行，程序会读取文件，并返回一个字节[切片](/zhuanlan/other/golang/4/11.html)，而这个切片保存在 `data` 中。在第 `14` 行，我们将 `data` 转换为 `string`，并显示出文件的内容。

请在`test.txt` 所在的位置运行该程序。

例如，对于 `linux/mac`，如果 `test.txt` 位于 `/home/naveen/go/src/filehandling`，可以使用下列步骤来运行程序。

```java
$]cd /home/naveen/go/src/filehandling/
$]go install filehandling
$]workspacepath/bin/filehandling
```

对于`windows`，如果 `test.txt` 位于 `C:\Users\naveen.r\go\src\filehandling`，则使用下列步骤。

```java
> cd C:\Users\naveen.r\go\src\filehandling
> go install filehandling
> workspacepath\bin\filehandling.exe 
```

运行程序,输出以下内容：

```java
Contents of file: Hello World. Welcome to file handling in Go.  
```

如果在其他位置运行这个程序,例如 `/home/userdirectory`，会打印下面的错误。

```java
File reading error open test.txt: The system cannot find the file specified.
```

这是因为 Go 是编译型语言。`go install` 会根据源代码创建一个二进制文件。二进制文件独立于源代码，可以在任何位置上运行。由于在运行二进制文件的位置上没有找到 `test.txt`，因此程序会报错，提示无法找到指定的文件。这是相对于二进制文件的路径。

有三种方法可以解决这个问题

**1、** 使用绝对文件路径；

**2、** 将文件路径作为命令行标志传递；

**3、** 将文件绑定在二进制文件中；

让我们一个一个讨论。

## 1.使用绝对文件路径#

解决此问题的最简单方法是传递绝对文件路径。我修改了程序并将路径更改为绝对路径。

```java
package main
import (  
    "fmt"
    "io/ioutil"
)
func main() {
    data, err := ioutil.ReadFile("/home/naveen/go/src/filehandling/test.txt")
    if err != nil {
        fmt.Println("File reading error", err)
        return
    }
    fmt.Println("Contents of file:", string(data))
}
```

现在程序可以从任何位置运行，它将打印出`test.txt`中的内容。

例如，即使从我的家目录运行，它也会工作。

```java
$]cd $HOME
$]go install filehandling
$]workspacepath/bin/filehandling
```

该程序打印出了 `test.txt` 的内容。

这是一个简单的方法，但它的缺点是：**文件必须放在程序指定的路径中，否则就会出错**。

## 2.将文件路径作为命令行标志传递#

解决此问题的另一种方法是将文件路径作为命令行标志传递。使用[flag包](https://golang.org/pkg/flag/)，我们可以从命令行获取文件路径作为输入，然后读取其内容。

让我们先了解一下这个flag包的工作原理。该flag包具有一个[String函数](https://golang.org/pkg/flag/#String)。此函数接受`3`个参数。**第一个**是标志的名称，**第二个**是默认值，**第三个**是标志的简短描述。

让我们编写一个小程序来从命令行中读取文件名。用以下内容替换`filehandling.go`中的内容。

```java
package main  
import (  
    "flag"
    "fmt"
)
func main() {
    fptr := flag.String("fpath", "test.txt", "file path to read from")
    flag.Parse()
    fmt.Println("value of fpath is", *fptr)
}
```

在上述程序中第 `8` 行，通过 `String` 函数，创建了一个字符串标记，名称是 `fpath`，默认值是 `test.txt`，描述为 `file path to read from`。这个函数返回存储 `flag` 值的字符串[变量](/zhuanlan/other/golang/4/3.html)的地址。

在程序访问 `flag` 之前，必须先调用 `flag.Parse()`。

在第`10` 行，程序会打印出 `flag` 值。

使用下面命令运行程序。

```java
wrkspacepath/bin/filehandling -fpath=/path-of-file/test.txt
```

我们传入 `/path-of-file/test.txt`，赋值给了 `fpath` 标记。

该程序输出：

```java
value of fpath is /path-of-file/test.txt 
```

如果程序仅运行，而不传递任何`fpath`，则程序将打印

```java
value of fpath is test.txt  
```

这是因为 `fpath` 的默认值是 `test.txt`。

现在我们知道如何从命令行读取文件路径，让我们继续完成我们的文件读取程序。

```java
package main  
import (  
    "flag"
    "fmt"
    "io/ioutil"
)
func main() {
    fptr := flag.String("fpath", "test.txt", "file path to read from")
    flag.Parse()
    data, err := ioutil.ReadFile(*fptr)
    if err != nil {
        fmt.Println("File reading error", err)
        return
    }
    fmt.Println("Contents of file:", string(data))
}
```

在上述程序里，命令行传入文件路径，程序读取了该文件的内容。使用下面命令运行该程序。

```java
wrkspacepath/bin/filehandling -fpath=/path-of-file/test.txt  
```

请替换`/path-of-file/`为`test.txt`的实际路径。该程序将打印

```java
Contents of file: Hello World. Welcome to file handling in Go.  
```

## 3.将文件绑定在二进制文件中#

从命令行获取文件路径的方法很好，但有一种更好的方法可以解决这个问题。如果我们能够将文本文件捆绑在二进制文件，那会不会很棒？这就是我们下面要做的事情。

有各种[软件包](https://golangbot.com/packages/)可以帮助我们实现。我们会使用 [packr](https://github.com/gobuffalo/packr)，因为它很简单，并且我在项目中使用它时，没有出现任何问题。

第一步就是安装 `packr` 包。

在命令提示符中输入下面命令，安装 `packr` 包。

```java
go get -u github.com/gobuffalo/packr/...  
```

`packr` 会把静态文件,例如 `.txt` 文件转换为 `.go` 文件，接下来，`.go` 文件会直接嵌入到二进制文件中。`packer` 非常智能，在开发过程中，可以从磁盘而非二进制文件中获取静态文件。这样可以防止在开发过程中，只有静态文件变化时，需要重新编译的问题。

我们通过程序来更好地理解它。用以下内容来替换 `filehandling.go` 文件。

```java
package main
import (  
    "fmt"
    "github.com/gobuffalo/packr"
)
func main() {
    box := packr.NewBox("../filehandling")
    data := box.String("test.txt")
    fmt.Println("Contents of file:", data)
}
```

在上面程序的第 `10` 行，我们创建了一个`NewBox`。`NewBox`表示一个文件夹，其内容会嵌入到二进制中。在这里，我指定了 `filehandling`文件夹，其内容包含`test.txt`。在下一行，我们读取了文件内容，并打印出来。

当我处于开发阶段时，我们可以使用 `go install`命令来运行程序。程序可以正常运行。`packr` 非常智能，开发阶段可以从磁盘加载文件。

使用下面命令来运行程序。

```java
go install filehandling  
workspacepath/bin/filehandling  
```

这些命令可以从任何位置运行。`Packr`足够智能，可以获取传递给`NewBox`命令的目录的绝对路径。

这个程序将打印出来

```java
Contents of file: Hello World. Welcome to file handling in Go.  
```

尝试更改`test.txt`内容并再次运行`filehandling`。您可以看到程序打印更新后的`test.txt`内容 而无需任何重新编译。完美:)。

现在我们来看看如何将 `test.txt`打包到我们的二进制文件中。我们使用 `packr` 命令来实现。

运行下面的命令：

```java
packr install -v filehandling 
```

这将打印出来

```java
building box ../filehandling  
packing file filehandling.go  
packed file filehandling.go  
packing file test.txt  
packed file test.txt  
built box ../filehandling with ["filehandling.go" "test.txt"]  
filehandling  
```

此命令将静态文件与二进制文件捆绑在一起。

在运行上述命令之后，使用命令 `workspacepath/bin/filehandling` 来运行程序。程序会打印出 `test.txt` 的内容。于是从二进制文件中，我们读取了 `test.txt` 的内容。

如果你不知道文件到底是由二进制还是磁盘来提供，我建议你删除 `test.txt`，并在此运行 `filehandling` 命令。你将看到，程序打印出了 `test.txt` 的内容。太棒了:D。我们已经成功将静态文件嵌入到了二进制文件中。

##### 分块读取文件

在上一节中，我们学习了如何将整个文件加载到内存中。当文件的大小非常大时，尤其是在`RAM`不足的情况下，将整个文件读入内存是没有意义的。更优化的方法是以小块读取文件。这可以在[bufio包](https://golang.org/pkg/bufio)的帮助下完成。

让我们来编写一个程序，以 `3` 个字节的块为单位读取 `test.txt` 文件。如下所示，替换 `filehandling.go` 的内容。

```java
package main
import (  
    "bufio"
    "flag"
    "fmt"
    "log"
    "os"
)
func main() {
    fptr := flag.String("fpath", "test.txt", "file path to read from")
    flag.Parse()
    f, err := os.Open(*fptr)
    if err != nil {
        log.Fatal(err)
    }
    defer func() {
        if err = f.Close(); err != nil {
            log.Fatal(err)
        }
    }()
    r := bufio.NewReader(f)
    b := make([]byte, 3)
    for {
        _, err := r.Read(b)
        if err != nil {
            fmt.Println("Error reading file:", err)
            break
        }
        fmt.Println(string(b))
    }
}
```

在上述程序的第 `15` 行，我们使用命令行标记传递的路径，打开文件。

在第`19` 行，我们延迟了文件的关闭操作。

在上面程序的第 `24` 行，我们新建了一个`buffered reader`缓冲读取器。在下一行，我们创建了长度和容量为 `3` 的字节切片，程序会把文件的字节读取到切片中。

第`27` 行的 `Read` 方法会读取 `len(b)`个字节，最多 `3`个字节，并返回所读取的字节数。当到达文件最后时，它会返回一个 `EOF` 错误。程序的其他不做解释。

如果我们使用下面命令来运行程序：

```java
$]go install filehandling
$]wrkspacepath/bin/filehandling -fpath=/path-of-file/test.txt
```

程序将输出以下内容

```java
Hel  
lo  
Wor  
ld.  
 We
lco  
me  
to  
fil  
e h  
and  
lin  
g i  
n G  
o.  
Error reading file: EOF
```

##### 逐行读取文件

在本节中，我们将讨论如何使用Go逐行读取文件。这可以使用[bufio包](https://golang.org/pkg/bufio/)完成。

请更换`test.txt`为以下内容：

```java
Hello World. Welcome to file handling in Go.  
This is the second line of the file.  
We have reached the end of the file.  
```

以下是逐行读取文件所涉及的步骤。

**1、** 打开文件；

**2、** 在文件上新建一个scanner；

**3、** 扫描文件并且逐行读取；

将`filehandling.go` 替换为以下内容。

```java
package main
import (  
    "bufio"
    "flag"
    "fmt"
    "log"
    "os"
)
func main() {
    fptr := flag.String("fpath", "test.txt", "file path to read from")
    flag.Parse()
    f, err := os.Open(*fptr)
    if err != nil {
        log.Fatal(err)
    }
    defer func() {
        if err = f.Close(); err != nil {
        log.Fatal(err)
    }
    }()
    s := bufio.NewScanner(f)
    for s.Scan() {
        fmt.Println(s.Text())
    }
    err = s.Err()
    if err != nil {
        log.Fatal(err)
    }
}
```

在上述程序的第 `15`行，我们用命令行标记传入的路径，`打开文件`。在第 `24` 行，我们用文件创建了一个新的 `scanner`。第 `25`行的 `Scan()` 方法读取文件的下一行，如果可以读取，就可以使用 `Text()` 方法。

当`Scan` 返回 `false` 时，除非已经到达文件末尾,此时 `Err()` 返回 `nil`，否则 `Err()`就会返回扫描过程中出现的错误。

如果我使用下面命令来运行程序：

```java
$] go install filehandling
$] workspacepath/bin/filehandling -fpath=/path-of-file/test.txt
```

它会输出

```java
Hello World. Welcome to file handling in Go.  
This is the second line of the file.  
We have reached the end of the file.  
```
