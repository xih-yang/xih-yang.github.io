# 07、Golang 教程 - 包
- 来源：https://ddkk.com/zhuanlan/other/golang/4/7.html
- 分类：其他语言
- 分组：教程目录
## 什么是包？为什么使用包？

到目前为止，我们已经看到了GO程序：它只有一个文件，它有一个主函数和几个其他函数。在实际场景中，这种在一个文件中编写所有源代码的方法是行不通的。以这种方式编写的代码是不可能重用和维护的。包（`package`）用于解决这样的问题。

包用于组织go源代码以获得更好的可重用性和可读性。软件包提供了代码的分隔，因此可以轻松维护应用程序。

例如，假设我们正在创建一个go图像处理应用程序，它提供了图像裁剪，锐化，模糊和颜色增强等功能。一种组织代码的方式是将同一个功能相关的所有代码放到一个独立的包中。例如，裁剪可以是单独的一个包，锐化可以是另一个包。这样做的好处是，颜色增强功能可能需要一些锐化处理。那么，颜色增强代码可以简单地导入（我们即将讨论导入）锐化包并开始使用其功能。这样代码就变得易于重用。

我们将逐步创建一个计算矩形面积和对角线的应用程序。

我们将通过此应用程序更好地了解包。

## main函数与main包

每个可执行的go应用程序都必须包含`main`函数。这个函数是程序的入口点。`main` 函数应该包含在 `main` 包中。

指定一个特定源文件属于一个包的语法为：`package packagename`，这条语句应该放在源文件非注释的第一行。

让我们开始为我们的应用程序创建`main`函数 和 `main`包，在go工作区的`src`文件夹中创建一个`geometry`文件夹，并在该目录下新建`geometry.go`。

在`geometry.go`中编写以下代码：

```java
//geometry.go
package main
import "fmt"
func main() {
	fmt.Println("Geometrical shape properties")
}
```

`package main` 这一行指定了该文件属于 `main` 包。`import "packagename"` 语句用来导入一个包，这里我们导入 `fmt` 包，该包导出了 `Println` 方法。然后是 `main` 函数，在这里仅打印 `Geometrical shape properties`。

执行`go install geometry` 命令编译上面的程序。该命令在 `geometry` 目录下查找包含 `main` 函数的文件，在这种情况下，它找到`geometry.go`。找到后编译该文件并在工作区的`bin` 目录下生成二进制文件`geometry`（在Windows下是 geometry.exe）。 现在工作区结构如下所示：

```java
src  
    geometry
            gemometry.go
bin  
    geometry
```

执行`workspacepath/bin/geometry`，`workspacepath`是自己工作区的路径，这条命令会运行 `bin` 目录下的 `geometry` 二进制文件。你应该可以看到如下输出：

```java
Geometrical shape properties
```

## 创建自定义包

下面我们将创建一个 `rectangle` 包，将与矩形相关的功能都放在这个包里。

属于包的源文件应放在它们自己的单独文件夹中。Go中的一个约定是使用与包名称相同的名称命名此文件夹。

因此让我们在 `geometry` 目录下创建一个 `rectangle` 子目录。所有放在该目录下的源文件都应该以 `package rectangle` 开头，因为这些源文件都属于 `rectangle` 包。

在`rectangle` 目录下新建 `rectangle.go` ，编写如下代码：

```java
//rectprops.go
package rectangle
import "math"
func Area(len, wid float64) float64 {
    area := len * wid
    return area
}
func Diagonal(len, wid float64) float64 {
    diagonal := math.Sqrt((len * len) + (wid * wid))
    return diagonal
}
```

在上面的代码中我们实现了两个函数 `Area` 和`Diagonal`分别用于计算矩形的面积和对角线。矩形的面积为长与宽的积。矩形的对角线为长与宽的平方和再开根号。这里调用 `math` 包中的 `Sqrt`函数来计算平方根。

注意上面实现的两个函数的函数名 `Area` 和 `Diagonal` 都是以大写字母开头的。这是必须的，我们将很快解释为什么需要这样做。

## 导入自定义包

要使用自定义包，我们必须先导入它。`import path`是导入自定义包的语法。我们必须指定`path` 为 根据工作区目录的相对路径。我们当前的文件夹结构如下：

```java
src  
   geometry
           geometry.go
           rectangle
                    rectprops.go
```

语句`import "geometry/rectangle"` 表示我们要导入 `rectangle` 包。

在`geometry.go` 中添加如下代码：

```java
//geometry.go
package main
import (
	"fmt"
	"geometry/rectangle" //importing custom package
)
func main() {
	var rectLen, rectWidth float64 = 6, 7
	fmt.Println("Geometrical shape properties")
	/*Area function of rectangle package used
	 */
	fmt.Printf("area of rectangle %.2f\n", rectangle.Area(rectLen, rectWidth))
	/*Diagonal function of rectangle package used
	 */
	fmt.Printf("diagonal of the rectangle %.2f ", rectangle.Diagonal(rectLen, rectWidth))
}
```

上面的代码导入了 `rectangle` 包并且使用 `Area` 和 `Diagonal` 函数计算矩形的面积和对角线。在 `Printf` 中的 `%.2f` 格式说明符是将浮点数截断保留两位小数。程序运行，输出如下：

```java
Geometrical shape properties  
area of rectangle 42.00  
diagonal of the rectangle 9.22
```

## 导出名称

我们将`rectangle`包下的`Area`和`Diagonal`函数首字母的大写。这在Go中有特殊意义。任何以大写字母开头的变量或函数都是go中的导出名称。只有被导出的的函数和变量才能被其它包访问。在这种情况下，我们需要在`main`包中使用`Area`和`Diagonal`函数。因此需要将它们的首字母大写。(首字母大写类似于java中的public，首字母小写类似于java中的private)

如果将`rectprops.go` 中的 `Area(len, wid float64)`改成 `area(len, wid float64)`，并且将 `geometry.go` 中的 `rectangle.Area(rectLen, rectWidth)`改成 `rectangle.area(rectLen, rectWidth)`，那么运行程序时编译器将会报错：`geometry.go:11: cannot refer to unexported name rectangle.area`。因此，如果想访问包外的函数，必须将其首字母大写。

## init 函数

每个包都可以包含一个`init`函数。`init`函数不应该有任何请求参数 和 返回类型。在我们的源代码中无法显式调用`init`函数。`init`函数如下所示

```java
func init() {
}
```

`init`函数可用于执行初始化任务，也可用于在执行开始之前验证程序的正确性。

包的初始化顺序如下：

**1、** 首先初始化包级别变量；

**2、** 接下来调用`init`函数一个包可以有多个`init`函数（在单个文件中或分布在多个文件中），并按照编译器解析它们的顺序调用它们；

如果一个包导入了另一个包，被导入的包先初始化。

尽管一个包可能被包含多次，但是它只被初始化一次。

下面让我们对我们的程序做一些修改来理解`init`函数。

首先，让我们为`rectprops.go`文件添加一个`init`函数：

```java
//rectprops.go
package rectangle
import "math"
import "fmt"
/*
 * init function added
 */
func init() {
	fmt.Println("rectangle package initialized")
}
func Area(len, wid float64) float64 {
	area := len * wid
	return area
}
func Diagonal(len, wid float64) float64 {
	diagonal := math.Sqrt((len * len) + (wid * wid))
	return diagonal
}
```

我们添加了一个简单的`init`函数，只需打印 `rectangle package initialized`

现在我们来修改 `main` 包。我们知道矩形的 `length` 和 `width` 应该大于 `0`。我们将在 `geometry.go` 中添加 `init` 函数和包级别的变量来定义检查。

修改`geometry.go`文件，如下所示：

```java
//geometry.go
package main
import (
	"fmt"
	"geometry/rectangle" //importing custom package
	"log"
)
/*
 * 1. package variables
 */
var rectLen, rectWidth float64 = 6, 7
/*
*2. init function to check if length and width are greater than zero
 */
func init() {
	fmt.Println("main package initialized")
	if rectLen < 0 {
		log.Fatal("length is less than zero")
	}
	if rectWidth < 0 {
		log.Fatal("width is less than zero")
	}
}
func main() {
	fmt.Println("Geometrical shape properties")
	fmt.Printf("area of rectangle %.2f\n", rectangle.Area(rectLen, rectWidth))
	fmt.Printf("diagonal of the rectangle %.2f ", rectangle.Diagonal(rectLen, rectWidth))
}
```

我们对`geometry.go` 做了如下修改：

**1、**`rectLen`和`rectWidth`变量从`main`函数级别移动到包级别；

**2、** 添加`init`函数当`rectLen`或`rectWidth`小于`0`时，该函数利用`log.Fatal`打印一条日志并终止程序；

main 包的初始化顺序为：

**1、** 首先初始化被导入的包因此`rectangle`包先被初始化；

**2、** 然后初始化包级别的变量：`rectLen`和`rectWidth`；

**3、**`init`函数被调用；

**4、** 最后`main`函数被调用；

如果您运行该程序，您将获得以下输出:

```java
rectangle package initialized  
main package initialized  
Geometrical shape properties  
area of rectangle 42.00  
diagonal of the rectangle 9.22  
```

正如所料，首先调用`rectangle`包的`init`函数，然后初始化包级别变量`rectLen`和`rectWidth`。接下来调用`main`包的`init`函数。它检查`rectLen`和`rectWidth`是否小于零，如果小于`0`则终止。我们将会在单独的教程中详细了解`if`语句。现在您可以假设`if rectLen < 0`将检查`rectLen`是否小于`0`，如果是，则程序将被终止。`rectWidth`类似。在上面的程序中，两个条件都是假的并且程序继续执行。最后调用`main`函数。

让我们稍微修改一下该程序，来加深了解 `init`函数的使用。

将`geometry.go` 中的 `var rectLen, rectWidth float64 = 6, 7` 这一行改为 `var rectLen, rectWidth float64 = -6, 7`。这里将 `rectLen` 改为负值。

现在，如果您运行该应用程序，您将看到：

```java
rectangle package initialized  
main package initialized  
2017/04/04 00:28:20 length is less than zero  
```

像上面一样， `rectangle` 包首先被初始化，然后是 `main` 包中的包级别变量 `rectLen`和 `rectWidth` 初始化。接着调用 `main` 包的 `init` 函数，因为 `rectLen` 是小于 `0` 的，因此程序打印`length is less than zero`后退出。

## 使用空白标识符#

在Go 中只导入包却不在代码中使用它是非法的。如果你这么做了，编译器会报错。这样做的原因是为了避免未使用的包膨胀，这将显着增加编译时间。将 `geometry.go` 中的代码替换为如下代码：

```java
//geometry.go
package main 
import (   
     "geometry/rectangle" //importing custom package
)
func main() {
}
```

上面的程序会抛出错误 `geometry.go:6: imported and not used: "geometry/rectangle"`

但是在开发过程中，导入包却不立即使用它是很常见的。可以用空指示符`_`来处理这种情况。

以下代码可以避免上述程序中的错误：

```java
package main
import (
	"geometry/rectangle"
)
var _ = rectangle.Area //error silencer
func main() {
}
```

`var _ = rectangle.Area` 这一行代码屏蔽了错误。我们应该跟踪这些类型的`"错误消音器"`， 在开发结束时，我们应该去掉这些`"错误消音器"`，并且如果没有使用相应的包，这些包也应该被一并移除。因此，建议在`import` 语句之后,在包级别中写`"错误消音器"`。

有时我们导入一个包只是为了确保该包初始化，而我们不需要使用包中的任何函数或变量。例如，我们也许需要确保`rectangle`包的`init`函数被调用而不打算在代码中的任何地方使用这个包。空指示符仍然可以处理这种情况，像下面的代码一样：

```java
package main
import (
	_ "geometry/rectangle"
)
func main() {
}
```

运行上述程序将输出`rectangle package initialized`。我们已经成功初始化了`rectangle`包，即使它没有在代码中的任何地方使用。
