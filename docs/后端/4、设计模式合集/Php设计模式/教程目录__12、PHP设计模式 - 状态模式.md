# 12、PHP设计模式 - 状态模式
- 来源：https://ddkk.com/zhuanlan/design/php/12.html
- 分类：设计模式
- 分组：教程目录
### 状态模式

状态模式(State Pattern) ：允许一个对象在其内部状态改变时改变它的行为，对象看起来似乎修改了它的类。其别名为状态对象(Objects for States)，状态模式是一种对象行为型模式。

### 模式结构

状态模式包含如下角色：

- Context: 环境类
- State: 抽象状态类
- ConcreteState: 具体状态类

### 结构图

### PHP代码实现

```java
<?php
/**
 * 状态模式
 */
//State: 抽象状态类
abstract class State
{
    abstract public function Handle(Context $context);
}
//Context: 环境类
class Context
{
    public function __construct(State $state)
    {
        $this->state=$state;
    }
    public function __get($name)
    {
        return $this->$name;
    }
    public function __set($name, $value)
    {
        $this->$name=$value;
    }
    public function Request(){
        $this->state->Handle($this);
    }
}
//ConcreteState: 具体状态类
class ConcreteStateA extends State
{
    public function __construct(){
        var_dump('ConcreteStateA');
    }
    public function Handle(Context $context)
    {
        $context->state=new ConcreteStateB();
    }
}
class ConcreteStateB extends State
{
    public function __construct(){
        var_dump('ConcreteStateB');
    }
    public function Handle(Context $context)
    {
        $context->state=new ConcreteStateA();
    }
}
$a=new Context(new ConcreteStateA());
$a->Request();
$a->Request();
$a->Request();
$a->Request();
```

### 运行结果

```java
string 'ConcreteStateA' (length=14)
string 'ConcreteStateB' (length=14)
string 'ConcreteStateA' (length=14)
string 'ConcreteStateB' (length=14)
string 'ConcreteStateA' (length=14)
```
