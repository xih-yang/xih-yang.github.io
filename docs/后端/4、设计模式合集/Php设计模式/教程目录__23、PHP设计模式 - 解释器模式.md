# 23、PHP设计模式 - 解释器模式
- 来源：https://ddkk.com/zhuanlan/design/php/23.html
- 分类：设计模式
- 分组：教程目录
### 解释器模式

给定一个语言，定义它的文法的一种表示，并定义一个解释器，这个解释器使用该表示来解释语言中的句子。

### 模式结构

- AbstractExpression:抽象表达式。声明一个抽象的解释操作，该接口为抽象语法树中所有的节点共享。
- TerminalExpression:终结符表达式。实现与文法中的终结符相关的解释操作。实现抽象表达式中所要求的方法。文法中每一个终结符都有一个具体的终结表达式与之相对应。
- NonterminalExpression:非终结符表达式。为文法中的非终结符相关的解释操作。
- Context: 环境类。包含解释器之外的一些全局信息。

### 结构图

### PHP代码实现

```java
<?php
/**
 * 解释器模式
 */
//AbstractExpression:抽象表达式
abstract class AbstractExpression
{
    abstract public function Interpret($context);
}
//TerminalExpression:终结符表达式
class TerminalExpression extends AbstractExpression
{
    public function Interpret($context)
    {
        var_dump('终端解释器');
    }
}
//NonterminalExpression:非终结符表达式
class NonterminalExpression extends AbstractExpression
{
    public function Interpret($context)
    {
        var_dump('非终端解释器');
    }
}
//Context: 环境类
class Context
{
    public function __set($name, $value)
    {
        $this->$name=$value;
    }
    public function __get($name)
    {
        return $this->$name;
    }
}
$context=new Context();
$lists[]=new TerminalExpression();
$lists[]=new NonterminalExpression();
$lists[]=new TerminalExpression();
$lists[]=new NonterminalExpression();
foreach ($lists as $value){
    $value->Interpret($context);
}
```

### 运行结果

```java
string '终端解释器' (length=15)
string '非终端解释器' (length=18)
string '终端解释器' (length=15)
string '非终端解释器' (length=18)
```
