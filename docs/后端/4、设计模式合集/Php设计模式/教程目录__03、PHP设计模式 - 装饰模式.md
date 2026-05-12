# 03、PHP设计模式 - 装饰模式
- 来源：https://ddkk.com/zhuanlan/design/php/3.html
- 分类：设计模式
- 分组：教程目录
### 装饰模式

装饰模式(Decorator Pattern) ：动态地给一个对象增加一些额外的职责(Responsibility)，就增加对象功能来说，装饰模式比生成子类实现更为灵活。其别名也可以称为包装器(Wrapper)，与适配器模式的别名相同，但它们适用于不同的场合。根据翻译的不同，装饰模式也有人称之为“油漆工模式”，它是一种对象结构型模式。

### 模式结构

装饰模式包含如下角色：

- Component: 抽象构件
- ConcreteComponent: 具体构件
- Decorator: 抽象装饰类
- ConcreteDecorator: 具体装饰类

### 结构图

### PHP代码实现

```java
<?php
//Component类
abstract class Component
{
    abstract public function operation();
}
//ConcreteComponent类
class ConcreteComponent extends Component
{
    public function operation()
    {
        var_dump('具体对象操作');
    }
}
//Decorator类
abstract class Decorator extends Component
{
    public function setComponent($component){
        $this->component=$component;
    }
    public function operation()
    {
        if($this->component!=null){
            $this->component->operation();
        }
    }
}
//ConcreteDecoratorA类
class ConcreteDecoratorA extends Decorator
{
    public function operation()
    {
        parent::operation();
        var_dump('装饰对象A的操作');
    }
}
//ConcreteDecoratorB类
class ConcreteDecoratorB extends Decorator
{
    public function operation()
    {
        parent::operation();
        self::addBehavior();
        var_dump('装饰对象B的操作');
    }
    public function addBehavior()
    {
        var_dump('装饰对象B独有操作');
    }
}
$a=new ConcreteComponent();
$b1=new ConcreteDecoratorA();
$b2=new ConcreteDecoratorB();
$b1->setComponent($a);
$b2->setComponent($b1);
$b2->operation();
```

### 运行结果

```java
string '具体对象操作' (length=18)
string '装饰对象A的操作' (length=22)
string '装饰对象B独有操作' (length=25)
string '装饰对象B的操作' (length=22)
```
