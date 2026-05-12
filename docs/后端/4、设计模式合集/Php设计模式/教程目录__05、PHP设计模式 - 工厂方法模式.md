# 05、PHP设计模式 - 工厂方法模式
- 来源：https://ddkk.com/zhuanlan/design/php/5.html
- 分类：设计模式
- 分组：教程目录
### 工厂方法模式

工厂方法模式(Factory Method Pattern)又称为工厂模式，也叫虚拟构造器(Virtual Constructor)模式或者多态工厂(Polymorphic Factory)模式，它属于类创建型模式。在工厂方法模式中，工厂父类负责定义创建产品对象的公共接口，而工厂子类则负责生成具体的产品对象，这样做的目的是将产品类的实例化操作延迟到工厂子类中完成，即通过工厂子类来确定究竟应该实例化哪一个具体产品类。

### 模式结构

工厂方法模式包含如下角色：

- Product：抽象产品
- ConcreteProduct：具体产品
- Factory：抽象工厂
- ConcreteFactory：具体工厂

### 结构图

### PHP代码实现

```java
<?php
//抽象产品
abstract class Operation
{
    private $numA,$numB;
    public function __set($name,$value){
        $this->$name=$value;
    }
    public function __get($name){
        return $this->$name;
    }
    abstract public function getResult();
}
//具体产品
class OperateAdd extends Operation
{
    public function getResult(){
        $result=$this->numA+$this->numB;
        return $result;
    }
}
class OperateSub extends Operation
{
    public function getResult(){
        $result=$this->numA-$this->numB;
        return $result;
    }
}
//抽象工厂
interface Factory
{
    public function createOperation();
}
//具体工厂
class AddFactory implements Factory
{
    public function createOperation()
    {
        return new OperateAdd();
    }
}
class SubFactory implements Factory
{
    public function createOperation()
    {
        return new OperateSub();
    }
}
$a=new AddFactory();
$b=$a->createOperation();
$b->numA=1;
$b->numB=5;
$c=$b->getResult();
var_dump($c);
```

### 运行结果

```java
int 6
```
