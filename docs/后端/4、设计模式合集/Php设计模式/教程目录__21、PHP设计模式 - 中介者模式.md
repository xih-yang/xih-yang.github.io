# 21、PHP设计模式 - 中介者模式
- 来源：https://ddkk.com/zhuanlan/design/php/21.html
- 分类：设计模式
- 分组：教程目录
### 中介者模式

中介者模式(Mediator Pattern)定义：用一个中介对象来封装一系列的对象交互，中介者使各对象不需要显式地相互引用，从而使其耦合松散，而且可以独立地改变它们之间的交互。中介者模式又称为调停者模式，它是一种对象行为型模式。

### 模式结构

中介者模式包含如下角色：

- Mediator: 抽象中介者
- ConcreteMediator: 具体中介者
- Colleague: 抽象同事类
- ConcreteColleague: 具体同事类

### 结构图

### PHP代码实现

```java
<?php
/**
 * 中介者模式
 */
//Mediator: 抽象中介者
abstract class Mediator
{
    abstract public function Send($message,$colleague);
}
//Colleague: 抽象同事类
abstract class Colleague
{
    public function __construct($mediator)
    {
        $this->mediator=$mediator;
    }
}
//ConcreteMediator: 具体中介者
class ConcreteMediator extends Mediator
{
    public function __set($name, $value)
    {
        $this->$name=$value;
    }
    public function Send($message, $colleague)
    {
        if ($colleague==$this->colleague1){
            $this->colleague2->Notify($message);
        }else{
            $this->colleague1->Notify($message);
        }
    }
}
//ConcreteColleague: 具体同事类
class ConcreteColleague1 extends Colleague
{
    public function Send($message){
        $this->mediator->Send($message,$this);
    }
    public function Notify($message){
        var_dump('1收到消息：'.$message);
    }
}
class ConcreteColleague2 extends Colleague
{
    public function Send($message){
        $this->mediator->Send($message,$this);
    }
    public function Notify($message){
        var_dump('2收到消息：'.$message);
    }
}
$m=new ConcreteMediator();
$c1=new ConcreteColleague1($m);
$c2=new ConcreteColleague2($m);
$m->colleague1=$c1;
$m->colleague2=$c2;
$c1->Send('C1的消息');
$c2->Send('C2的消息');
```

### 运行结果

```java
string '2收到消息：C1的消息' (length=27)
string '1收到消息：C2的消息' (length=27)
```
