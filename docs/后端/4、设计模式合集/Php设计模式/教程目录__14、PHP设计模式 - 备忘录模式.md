# 14、PHP设计模式 - 备忘录模式
- 来源：https://ddkk.com/zhuanlan/design/php/14.html
- 分类：设计模式
- 分组：教程目录
### 备忘录模式

在不破坏封装性的前提下，捕获一个对象的内部状态，并在该对象之外保存这个状态。这样就可以将该对象恢复到原先保存的状态。

### 模式结构

- Originator(发起人)：记录当前时刻的内部状态，负责定义哪些属于备份范围的状态，负责创建和恢复备忘录数据。
- Memento(备忘录)：负责存储发起人对象的内部状态，在需要的时候提供发起人需要的内部状态。
- Carataker(管理角色)：对备忘录进行管理，保存和提供备忘录。

### 结构图

### PHP代码实现

```java
<?php
/**
 *备忘录模式
 */
//Originator(发起人)
class Originator
{
    public function __get($name)
    {
        return $this->$name;
    }
    public function __set($name, $value)
    {
        $this->$name=$value;
    }
    public function CreateMemento(){
        return (new Memento($this->state));
    }
    public function SetMemento(Memento $memento){
        $this->state=$memento->GetState();
    }
    public function show(){
        var_dump('State='.$this->state);
    }
}
//Memento(备忘录)
class Memento
{
    public function __construct($state)
    {
        $this->state=$state;
    }
    public function GetState(){
        return $this->state;
    }
}
//Carataker(管理角色)
class Caretaker
{
    public function SetMemento($value){
        $this->memento=$value;
    }
    public function GetMemento(){
        return $this->memento;
    }
}
$a=new Originator();
$a->state='On';
$a->show();
$c=new Caretaker();
$c->SetMemento($a->CreateMemento());
$a->state='Off';
$a->show();
$a->SetMemento($c->GetMemento());
$a->show();
```

### 运行结果

```java
string 'State=On' (length=8)
string 'State=Off' (length=9)
string 'State=On' (length=8)
```
