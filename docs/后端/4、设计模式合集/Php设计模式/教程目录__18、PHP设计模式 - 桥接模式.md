# 18、PHP设计模式 - 桥接模式
- 来源：https://ddkk.com/zhuanlan/design/php/18.html
- 分类：设计模式
- 分组：教程目录
### 桥接模式

桥接模式(Bridge Pattern)：将抽象部分与它的实现部分分离，使它们都可以独立地变化。它是一种对象结构型模式，又称为柄体(Handle and Body)模式或接口(Interface)模式。

### 模式结构

桥接模式包含如下角色：

- Abstraction：抽象类
- RefinedAbstraction：扩充抽象类
- Implementor：实现类接口
- ConcreteImplementor：具体实现类

### 结构图

### PHP代码实现

```java
<?php
/**
 * 桥接模式
 */
//Implementor：实现类接口
abstract class Implementor
{
    abstract public function Operation();
}
//ConcreteImplementor：具体实现类
class ConcreteImplementorA extends Implementor
{
    public function Operation(){
        var_dump('A的方法执行');
    }
}
class ConcreteImplementorB extends Implementor
{
    public function Operation(){
        var_dump('B的方法执行');
    }
}
//Abstraction：抽象类
abstract class Abstraction
{
    abstract public function Operation();
}
//RefinedAbstraction：扩充抽象类
class RefinedAbstraction extends Abstraction
{
    public function SetImplementor($implementor){
        $this->implementor=$implementor;
    }
    public function Operation(){
        $this->implementor->Operation();
    }
}
$a=new RefinedAbstraction();
$a->SetImplementor(new ConcreteImplementorA());
$a->Operation();
$a->SetImplementor(new ConcreteImplementorB());
$a->Operation();
```

### 运行结果

```java
string 'A的方法执行' (length=16)
string 'B的方法执行' (length=16)
```
