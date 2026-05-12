# 07、Golang 教程 - 面向对象
- 来源：https://ddkk.com/zhuanlan/other/golang/3/7.html
- 分类：其他语言
- 分组：教程目录
## 结构体和方法

- go语言仅支持封装，不支持继承和多态
- go语言没有class 只有struct
- go语言没有构造函数的说法
- 结构创建在堆上还是栈上？ 不需要知道
- 在调用的时候，编译器很聪明的，要值还是指针，编译器会帮我们转换

```java
package main
import "fmt"
type treeNode struct {
	value       int
	left, right *treeNode
}
// 给结构定义方法
// (node treeNode):接受者 这个参数也是传值
// 和普通函数没有区别
func (node treeNode) print(){
	fmt.Println(node.value)
}
// node是传值，所以修改是没有作用的
func (node treeNode) setValue(value int){
	node.value = value // 指针的话，可以赋值
}
// 改成指针
// 只有使用指针才可以改变结构内容
func (node *treeNode) setValuePtr(value int){
	node.value = value
}
// 使用自定义工厂函数
func createNode(value int) *treeNode {
	// 返回了局部变量的地址
	return &treeNode{
     value: value}
}
func main() {
	var root treeNode
	fmt.Println(root) //{0 <nil> <nil>}
	// 赋值
	root = treeNode{
     value: 3}
	root.left = &treeNode{
     }
	root.right = &treeNode{
     5, nil, nil}
	node := []treeNode{
		{
     value: 3},
		{
     },
		{
     6, nil, &root},
	}// [{3 <nil> <nil>} {0 <nil> <nil>} {6 <nil> 0xc00000c080}]
	root.right.left = new(treeNode)
	root.left.right = createNode(2)
	root.setValue(5)
	fmt.Println(root)//{3 0xc00000c0c0 0xc00000c0e0}
	root.setValuePtr(6)
	fmt.Println(root) // {6 0xc0000a6060 0xc0000a6080}
	fmt.Println(node)
	root.print()
	// nil指针可以调用方法 但是会报错，
	var pRoot *treeNode
	pRoot.setValue(1)
}
```

### 值接受者vs指针接受者

- 要改变内容必须使用指针接受者
- 结构过大考虑指针接受者
- 一致性：如有指针接受者，最好使用指针接受者
- 值接受者是go语言特有的

## 封装

- 名字使用CamelCase
- 首字母大写：public
- 首字母小写：private
- 大小写是针对包来讲，仅对包管理有效

## 包

- 每个目录（不含子目录）一个包
- 包名可以和目录名不一样
- main包包含可执行入口，main函数必须在main包里才可以执行
- 为结构定义的方法必须放在同一个包内，但是可以不同的文件

## 扩展已有类型

- 如何系统的扩展其他人写的类型，
- 定义别名
- 使用组合
- 使用内嵌

```java
// 使用组合
type myTreeNode struct {
	node *Node //包含原有要扩展的类型，然后在他的基础上，扩展自己想要的功能
}
func (myNode *myTreeNode) postOrder(){
	if myNode ==nil{
		return
	}
	// 遍历左子树
	lNode := myTreeNode{
     myNode.node.Left}
	lNode.postOrder()
	// 遍历右子树
	rNode := myTreeNode{
     myNode.node.Right}
	rNode.postOrder()
	// 遍历自己
	myNode.node.Print()
}
// 使用别名扩展类型
type Queue []int
func (q *Queue) Push(v int) {
	*q = append(*q, v)
}
func (q *Queue) Pop()  int{
	v:=(*q)[0]
	*q = (*q)[1:]
	return v
}
// 使用内嵌
// 使用内嵌可以省略很多代码
 使用内嵌 实质上是省略成员名 将成员变量从包中带过来(包括方法和成员变量)
type myTreeNode struct {
	*Node  // 内嵌方法
}
func (myNode *myTreeNode) postOrder(){
	if myNode ==nil{
		return
	}
	// 遍历左子树
	//lNode := myTreeNode{myNode.Node.Left} 类型的最后一个点的后面是他的名字
	lNode := myTreeNode{
     myNode.Left} // 也可以直接省略
	lNode.postOrder()
	// 遍历右子树
	rNode := myTreeNode{
     myNode.Right}
	rNode.postOrder()
	// 遍历自己
	myNode.Print()
}
// 使用内嵌之后，当本身的方法与包中的方法名称一样时，为了区别，调用方法不同
// 这个方法会让Node的方法隐藏起来，要调用的话
// myTree.Print() //调用myTreeNode的Print方法
// myTree.Node.Print() // 调用Node的Print方法
func (myTree *myTreeNode) Print(){
	//。。。。
}
```
