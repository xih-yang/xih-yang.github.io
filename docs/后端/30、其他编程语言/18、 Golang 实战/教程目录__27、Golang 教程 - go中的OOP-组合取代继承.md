# 27、Golang 教程 - go中的OOP-组合取代继承
- 来源：https://ddkk.com/zhuanlan/other/golang/4/27.html
- 分类：其他语言
- 分组：教程目录
Go语言不支持继承，但是它支持组合。组合的定义是“放在一起”，组合的一个例子是车的组成，一辆车是由轮子，发动机和其他组件组合而成。

## 结构体嵌套组合#

Go中的组合可以通过将一种结构体类型嵌入另一种结构体类型来实现。

博客文章是组合的经典例子。每篇博文都有标题，内容和作者信息，使用组合可以很好地表示它们。通过学习本教程后面的内容，我们会知道如何实现组合。

我们首先创建一个 `author` 结构体。

```java
package main
import (  
    "fmt"
)
type author struct {
    firstName string
    lastName  string
    bio       string
}
func (a author) fullName() string {
    return fmt.Sprintf("%s %s", a.firstName, a.lastName)
}
```

在上面的代码片段中，我们创建了一个带有 `firstname`、`lastname` 和 `bio`字段的 `author` 结构体。我们还添加了一个 `fullName()` 方法，其中 `author` 作为接收者类型，该方法返回了作者的全名。

下一步是创建`post`结构体。

```java
type post struct {
    title     string
    content   string
    author
}
func (p post) details() {
    fmt.Println("Title: ", p.title)
    fmt.Println("Content: ", p.content)
    fmt.Println("Author: ", p.author.fullName())
    fmt.Println("Bio: ", p.author.bio)
}
```

`post` 结构体的字段有 `title` 和 `content`。它还有一个嵌套的匿名字段 `author`。该字段指定 `author` 组成了 `post` 结构体。现在 `post` 可以访问 `author` 结构体的所有字段和方法。我们同样给 `post` 结构体添加了 `details()` 方法，用来打印`title`，`content`，`fullName`和`author.bio`。

一旦一个结构体嵌套另外一个结构体，Go访问嵌套结构体成员时，就好像是在访问自己结构体成员。也就是说`p.author.fullName()`可以用`p.fullName()`来代替。因此`details()`方法可以重写为：

```java
func (p post) details() {
    fmt.Println("Title: ", p.title)
    fmt.Println("Content: ", p.content)
    fmt.Println("Author: ", p.fullName())
    fmt.Println("Bio: ", p.bio)
}
```

现在我们已经准备好了`author`和`post`结构体了，让我们通过创建博客文章来完成整个程序。

```java
package main
import (  
    "fmt"
)
type author struct {
    firstName string
    lastName  string
    bio       string
}
func (a author) fullName() string {
    return fmt.Sprintf("%s %s", a.firstName, a.lastName)
}
type post struct {
    title   string
    content string
    author
}
func (p post) details() {
    fmt.Println("Title: ", p.title)
    fmt.Println("Content: ", p.content)
    fmt.Println("Author: ", p.fullName())
    fmt.Println("Bio: ", p.bio)
}
func main() {
    author1 := author{
        "Naveen",
        "Ramanathan",
        "Golang Enthusiast",
    }
    post1 := post{
        "Inheritance in Go",
        "Go supports composition instead of inheritance",
        author1,
    }
    post1.details()
}
```

在上面程序中，`main` 函数在第 `31` 行新建了一个 `author` 结构体变量`author1`。而在第 `36` 行，我们创建一个 嵌套`author` 的 `post`结构体变量 `post1`。该程序输出：

```java
Title:  Inheritance in Go  
Content:  Go supports composition instead of inheritance  
Author:  Naveen Ramanathan  
Bio:  Golang Enthusiast  
```

## 结构体切片的嵌套#

我们可以进一步处理这个实例，用博客帖子的切片来创建一个网站。

首先定义`website`结构体。在`main`函数上方增加以下代码：

```java
type website struct {
        []post
}
func (w website) contents() {
    fmt.Println("Contents of Website\n")
    for _, v := range w.posts {
        v.details()
        fmt.Println()
    }
}
```

在添加上面的代码后运行上面的程序时，编译器会以下错误，

```java
main.go:31:9: syntax error: unexpected [, expecting field name or embedded type  
```

此错误指向嵌套的结构体切片 `[]post`。原因是无法嵌套匿名切片。字段名称是必需的。所以让我们修复这个错误并使编译通过。

```java
type website struct {
        posts []post
}
```

我已经给帖子的切片 `[]post` 添加了字段名 `posts`。

现在我们来修改主函数，为我们的新网站创建一些帖子。

修改后的完整代码如下所示：

```java
package main
import (  
    "fmt"
)
type author struct {
    firstName string
    lastName  string
    bio       string
}
func (a author) fullName() string {
    return fmt.Sprintf("%s %s", a.firstName, a.lastName)
}
type post struct {
    title   string
    content string
    author
}
func (p post) details() {
    fmt.Println("Title: ", p.title)
    fmt.Println("Content: ", p.content)
    fmt.Println("Author: ", p.fullName())
    fmt.Println("Bio: ", p.bio)
}
type website struct {
 posts []post
}
func (w website) contents() {
    fmt.Println("Contents of Website\n")
    for _, v := range w.posts {
        v.details()
        fmt.Println()
    }
}
func main() {
    author1 := author{
        "Naveen",
        "Ramanathan",
        "Golang Enthusiast",
    }
    post1 := post{
        "Inheritance in Go",
        "Go supports composition instead of inheritance",
        author1,
    }
    post2 := post{
        "Struct instead of Classes in Go",
        "Go does not support classes but methods can be added to structs",
        author1,
    }
    post3 := post{
        "Concurrency",
        "Go is a concurrent language and not a parallel one",
        author1,
    }
    w := website{
        posts: []post{
     post1, post2, post3},
    }
    w.contents()
}
```

在上面的程序中，我们创建了一个作者`author1`和三个帖子`post1`、`post2`、`post3`。我们最后通过嵌套三个帖子，在第 `62` 行创建了网站 `w`，并在下一行显示内容。

程序会输出：

```java
Contents of Website
Title:  Inheritance in Go  
Content:  Go supports composition instead of inheritance  
Author:  Naveen Ramanathan  
Bio:  Golang Enthusiast
Title:  Struct instead of Classes in Go  
Content:  Go does not support classes but methods can be added to structs  
Author:  Naveen Ramanathan  
Bio:  Golang Enthusiast
Title:  Concurrency  
Content:  Go is a concurrent language and not a parallel one  
Author:  Naveen Ramanathan  
Bio:  Golang Enthusiast
```
