# 09、Golang 教程 - 函数式编程
- 来源：https://ddkk.com/zhuanlan/other/golang/3/9.html
- 分类：其他语言
- 分组：教程目录
## 函数式编程

- 函数是一等公民：参数，变量，返回值都可以是函数

## 闭包

- 闭包 = 匿名函数 + 自由变量的引用

```java
func adder() func(value int) int {
	sum := 0 // 自由变量
	// 函数返回的时候不只是返回一个函数，而是返回一个闭包 包括自由变量和局部变量
	return func(value int) int {
      // value 局部变量
		sum += value
		return sum 
	}
}
func main() {
	adder := adder() // 闭包
	for i := 0; i < 10; i++ {
		fmt.Println(adder(i))
	}
	//0
	//1
	//3
	//6
	//10
	//15
	//21
	//28
	//36
	//45
}
```

## 例子

- 斐波那契数列

```java
package main
func fibonacci() func() int {
	a, b := 0, 1
	return func() int {
		a, b = b, a+b
		return a
	}
}
func main() {
	f := fibonacci()
	println(f()) //1
	println(f()) //1
	println(f()) //2
	println(f()) //3
	println(f()) //5
}
```

- 斐波那契数列2

```java
func fibonacci() intGen {
	a, b := 0, 1
	return func() int {
		a, b = b, a+b
		return a
	}
}
// 给函数实现接口，在go语言中 只要是类型，就可以实现接口
type intGen func() int
// 让函数实现Read接口
func (g intGen) Read(p []byte) (n int, err error) {
	next := g()
	s := fmt.Sprintf("%d\n", next)
	if next > 200 {
		return 0, io.EOF
	}
	return strings.NewReader(s).Read(p) //找个代理帮助我们读取
}
func printFileContents(reader io.Reader) {
	scanner := bufio.NewScanner(reader)
	for scanner.Scan() {
		fmt.Println(scanner.Text())
	}
}
func main() {
	f := fibonacci()
	printFileContents(f)//因为函数实现了Reader接口，所以就可以作为参数传入
	//1
	//1
	//2
	//3
	//5
	//8
	//13
	//21
	//34
	//55
	//89
	//144
}
```

- 遍历二叉树

```java
// 传入一个函数 这样就可以对遍历过程中的节点做任意的事情
func (node *Node) TraverseFunc(f func(*Node)) {
	if node == nil {
		return 
	}
	node.left.TraverseFunc(f)
	f(node)
	node.right.TraverseFunc(f)
}
// 调用 数节点
nodeCount := 0
root.TraverseFunc(func(n *Node) {
	nodeCount++
})
fmt.Println(nodeCount)
```

- Go语言没有Lambda表达式，只有匿名函数
