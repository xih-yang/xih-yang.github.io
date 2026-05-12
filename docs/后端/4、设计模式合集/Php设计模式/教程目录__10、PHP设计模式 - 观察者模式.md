# 10、PHP设计模式 - 观察者模式
- 来源：https://ddkk.com/zhuanlan/design/php/10.html
- 分类：设计模式
- 分组：教程目录
### 观察者模式

观察者模式(Observer Pattern)：定义对象间的一种一对多依赖关系，使得每当一个对象状态发生改变时，其相关依赖对象皆得到通知并被自动更新。观察者模式又叫做发布-订阅（Publish/Subscribe）模式、模型-视图（Model/View）模式、源-监听器（Source/Listener）模式或从属者（Dependents）模式。

观察者模式是一种对象行为型模式。

### 模式结构

观察者模式包含如下角色：

- Subject: 目标
- ConcreteSubject: 具体目标
- Observer: 观察者
- ConcreteObserver: 具体观察者

### 结构图

### PHP代码实现

```java
<?php
/**
 * 观察者模式
 */
//Subject: 目标
abstract class Subject
{
    private $observers=[];
    public function Attach($observer){
        $this->observers[]=$observer;
    }
    public function Detach($observer){
        foreach ($this->observers as $value){
            if($value != $observer)
                $this->observers[] = $value;
        }
    }
    public function Notify(){
        foreach ($this->observers as $observer){
            $observer->Update();
        }
    }
}
//Observer: 观察者
abstract class Observer
{
    public abstract function Update();
}
//ConcreteSubject: 具体目标
class ConcreteSubject extends Subject
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
//ConcreteObserver: 具体观察者
class ConcreteObserver extends Observer
{
    public function __construct($subject,$name){
        $this->subject=$subject;
        $this->name=$name;
    }
    public function __set($name, $value)
    {
        $this->$name=$value;
    }
    public function __get($name)
    {
        return $this->$name;
    }
    public function Update()
    {
        $this->observerState=$this->subject->SubjectState;
        var_dump('观察者'.$this->name.'的新状态是'.$this->observerState);
    }
}
$a=new ConcreteSubject();
$a->Attach(new ConcreteObserver($a,'X'));
$a->Attach(new ConcreteObserver($a,'Y'));
$a->Attach(new ConcreteObserver($a,'Z'));
$a->SubjectState='ABC';
$a->Notify();
```

### 运行结果

```java
string '观察者X的新状态是ABC' (length=28)
string '观察者Y的新状态是ABC' (length=28)
string '观察者Z的新状态是ABC' (length=28)
```
