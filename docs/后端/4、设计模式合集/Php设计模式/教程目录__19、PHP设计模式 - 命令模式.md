# 19、PHP设计模式 - 命令模式
- 来源：https://ddkk.com/zhuanlan/design/php/19.html
- 分类：设计模式
- 分组：教程目录
### 命令模式

命令模式(Command Pattern)：将一个请求封装为一个对象，从而使我们可用不同的请求对客户进行参数化；对请求排队或者记录请求日志，以及支持可撤销的操作。命令模式是一种对象行为型模式，其别名为动作(Action)模式或事务(Transaction)模式。

### 模式结构

命令模式包含如下角色：

- Command: 抽象命令类
- ConcreteCommand:具体命令类
- Invoker: 调用者
- Receiver: 接收者

### 结构图

### PHP代码实现

```java
<?php
/**
 * 命令模式
 */
//Command: 抽象命令类
abstract class Command
{
    public function __construct($receiver){
        $this->receiver=$receiver;
    }
    abstract public function Execute();
}
//ConcreteCommand:具体命令类
class ConcreteCommand extends Command
{
    public function Execute(){
        $this->receiver->Action();
    }
}
//Invoker: 调用者
class Invoker
{
    public function SetCommand(Command $command){
        $this->command=$command;
    }
    public function ExecuteCommand(){
        $this->command->Execute();
    }
}
//Receiver: 接收者
class Receiver
{
    public function Action(){
        var_dump('执行请求');
    }
}
$r=new Receiver();
$c=new ConcreteCommand($r);
$i=new Invoker();
$i->SetCommand($c);
$i->ExecuteCommand();
```

### 运行结果

```java
string '执行请求' (length=12)
```
