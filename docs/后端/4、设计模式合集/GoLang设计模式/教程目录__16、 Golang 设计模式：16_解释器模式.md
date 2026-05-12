# 16、 Golang 设计模式：16_解释器模式
- 来源：https://ddkk.com/zhuanlan/design/golang/16.html
- 分类：设计模式
- 分组：教程目录
## 1、介绍

> 给定一个语言，定义它的文法的一种表示，并定义一个解释器，这个解释器使用该表示来解释语言中的句子。

解释器模式（Interpreter）是一种针对特定问题设计的一种解决方案。例如，匹配字符串的时候，由于匹配条件非常灵活，使得通过代码来实现非常不灵活。

举个例子，针对以下的匹配条件：

- 以+开头的数字表示的区号和电话号码，如+861012345678；
- 以英文开头，后接英文和数字，并以.分隔的域名，如www.liaoxuefeng.com；
- 以/开头的文件路径，如/path/to/file.txt；
- ...

因此，需要一种通用的表示方法——正则表达式来进行匹配。正则表达式就是一个字符串，但要把正则表达式解析为语法树，然后再匹配指定的字符串，就需要一个解释器。

实现一个完整的正则表达式的解释器非常复杂，但是使用解释器模式却很简单：

```java
String s = "+861012345678";
System.out.println(s.matches("^\\+\\d+$"));
```

类似的，当我们使用JDBC时，执行的SQL语句虽然是字符串，但最终需要数据库服务器的SQL解释器来把SQL“翻译”成数据库服务器能执行的代码，这个执行引擎也非常复杂，但对于使用者来说，仅仅需要写出SQL字符串即可。

#### 解释器模式的结构

**抽象解释器**：声明一个所有具体表达式都要实现的抽象接口（或者抽象类），接口中主要是一个interpret()方法，称为解释操作。具体解释任务由它的各个实现类来完成，具体的解释器分别由终结符解释器TerminalExpression和非终结符解释器NonterminalExpression完成。

**终结符表达式**：实现与文法中的元素相关联的解释操作，通常一个解释器模式中只有一个终结符表达式，但有多个实例，对应不同的终结符。终结符一半是文法中的运算单元，比如有一个简单的公式R=R1+R2，在里面R1和R2就是终结符，对应的解析R1和R2的解释器就是终结符表达式。

**非终结符表达式**：文法中的每条规则对应于一个非终结符表达式，非终结符表达式一般是文法中的运算符或者其他关键字，比如公式R=R1+R2中，+就是非终结符，解析+的解释器就是一个非终结符表达式。非终结符表达式根据逻辑的复杂程度而增加，原则上每个文法规则都对应一个非终结符表达式。

**环境角色**：这个角色的任务一般是用来存放文法中各个终结符所对应的具体值，比如R=R1+R2，我们给R1赋值100，给R2赋值200。这些信息需要存放到环境角色中，很多情况下我们使用Map来充当环境角色就足够了。

## 2、示例

示例代码：

```java
package main
import (
	"fmt"
	"strconv"
	"strings"
)
//解释器接口
type Node interface {
	Interpret() int //解释方法
}
//数据节点
type ValNode struct {
	val int
}
func (vn *ValNode) Interpret() int {
	return vn.val
}
//=============加法节点=============
type AddNode struct {
	left, right Node
}
func (an *AddNode) Interpret() int {
	return an.left.Interpret() + an.right.Interpret()
}
//=============减法节点=============
type SubNode struct {
	left, right Node
}
func (an *SubNode) Interpret() int {
	return an.left.Interpret() - an.right.Interpret()
}
//=============解释对象=============
type Parser struct {
	exp   []string //表达式
	index int      //索引
	prev  Node     //前序节点
}
func (p *Parser) newValNode() Node { //执行数据操作
	v, _ := strconv.Atoi(p.exp[p.index])
	p.index++
	return &ValNode{val: v}
}
func (p *Parser) newAddNode() Node { //执行加法操作( + )
	p.index++
	return &AddNode{
		left:  p.prev,
		right: p.newValNode(),
	}
}
func (p *Parser) newSubNode() Node { //执行减法操作( - )
	p.index++
	return &SubNode{
		left:  p.prev,
		right: p.newValNode(),
	}
}
func (p *Parser) Result() Node { //返回结果
	return p.prev
}
func (p *Parser) Parse(exp string) { //对表达式进行解析
	p.exp = strings.Split(exp, " ") //通过空格分割
	for {
		if p.index >= len(p.exp) {
			return
		}
		switch p.exp [p.index] {
		case "+":
			p.prev = p.newAddNode()
		case "-":
			p.prev = p.newSubNode()
		default:
			p.prev = p.newValNode()
		}
	}
}
func main() {
	p := Parser{}
	p.Parse("1 + 2 + 3 - 4 + 10") //是通过空格进行解释的
	fmt.Println(p.Result().Interpret())
}
```

UML图：
