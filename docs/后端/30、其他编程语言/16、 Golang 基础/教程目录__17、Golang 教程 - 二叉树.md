# 17、Golang 教程 - 二叉树
- 来源：https://ddkk.com/zhuanlan/other/golang/2/17.html
- 分类：其他语言
- 分组：教程目录
满足以下两个条件的树就是二叉树：

- 本身是有序树
- 树中包含的各个节点的度不能超过 2，即只能是 0、1 或者 2

## 1. 前序遍历

前序遍历二叉树（根左右）

```java
package main
import "fmt"
type Student struct {
    Name string
    Age int
    Score float32
    // 左子树指针
    left *Student
    // 右子树指针
    right *Student
}
func main() {
    // 根节点
    var root Student
    root.Name = "root"
    root.Age = 10
    root.Score = 90
    // 一级左子树
    var left1 Student
    left1.Name = "left1"
    left1.Age = 20
    left1.Score = 80
    root.left = &left1
    // 一级右子树
    var right1 Student
    right1.Name = "right1"
    right1.Age = 30
    right1.Score = 70
    root.right = &right1
    // 二级左子树
    var left2 Student
    left2.Name = "left2"
    left2.Age = 40
    left2.Score = 60
    left1.left = &left2
    // 调用前序遍历函数
    Req(&root)
}
func Req(p *Student) {
	if p == nil {
		return
	}
	fmt.Println(p)
	// 遍历左子树
	Req(p.left)
	// 遍历右子树
	Req(p.right)
}
```

```java
&{
     root 10 90 0xc000078360 0xc000078390}
&{
     left1 20 80 0xc0000783c0 <nil>}
&{
     left2 40 60 <nil> <nil>}
&{
     right1 30 70 <nil> <nil>}
```

## 2. 中序遍历

中序遍历二叉树（左根右）

```java
package main
import "fmt"
type Student struct {
    Name string
    Age int
    Score float32
    // 左子树指针
    left *Student
    // 右子树指针
    right *Student
}
func main() {
    // 根节点
    var root Student
    root.Name = "root"
    root.Age = 10
    root.Score = 90
    // 一级左子树
    var left1 Student
    left1.Name = "left1"
    left1.Age = 20
    left1.Score = 80
    root.left = &left1
    // 一级右子树
    var right1 Student
    right1.Name = "right1"
    right1.Age = 30
    right1.Score = 70
    root.right = &right1
    // 二级左子树
    var left2 Student
    left2.Name = "left2"
    left2.Age = 40
    left2.Score = 60
    left1.left = &left2
    // 调用中序遍历函数（left,root,right）
    Req(&root)
}
func Req(p *Student) {
	if p == nil {
		return
	}
	// 遍历左子树
	Req(p.left)
    // 输出 root 节点
    fmt.Println(p)
	// 遍历右子树
	Req(p.right)
}
```

```java
&{
     left2 40 60 <nil> <nil>}
&{
     left1 20 80 0xc0000783c0 <nil>}
&{
     root 10 90 0xc000078360 0xc000078390}
&{
     right1 30 70 <nil> <nil>}
```

## 3. 后序遍历

后序遍历二叉树（左右根）

```java
package main
import "fmt"
type Student struct {
    Name string
    Age int
    Score float32
    // 左子树指针
    left *Student
    // 右子树指针
    right *Student
}
func main() {
    // 根节点
    var root Student
    root.Name = "root"
    root.Age = 10
    root.Score = 90
    // 一级左子树
    var left1 Student
    left1.Name = "left1"
    left1.Age = 20
    left1.Score = 80
    root.left = &left1
    // 一级右子树
    var right1 Student
    right1.Name = "right1"
    right1.Age = 30
    right1.Score = 70
    root.right = &right1
    // 二级左子树
    var left2 Student
    left2.Name = "left2"
    left2.Age = 40
    left2.Score = 60
    left1.left = &left2
    // 调用中序遍历函数（left,root,right）
    Req(&root)
}
func Req(p *Student) {
	if p == nil {
		return
	}
	// 遍历左子树
	Req(p.left)
    // 遍历右子树
	Req(p.right)
    // 输出 root 节点
    fmt.Println(p)	
}
```

```java
&{
     left2 40 60 <nil> <nil>}
&{
     left1 20 80 0xc0000783c0 <nil>}
&{
     right1 30 70 <nil> <nil>}
&{
     root 10 90 0xc000078360 0xc000078390}
```
