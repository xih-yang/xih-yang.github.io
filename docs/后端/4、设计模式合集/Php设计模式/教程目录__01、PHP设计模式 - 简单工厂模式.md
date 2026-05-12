# 01、PHP设计模式 - 简单工厂模式
- 来源：https://ddkk.com/zhuanlan/design/php/1.html
- 分类：设计模式
- 分组：教程目录
### 简单工厂模式

简单工厂模式是属于创建型模式，又叫做静态工厂方法（Static Factory Method）模式，但不属于23种GOF设计模式之一。简单工厂模式是由一个工厂对象决定创建出哪一种产品类的实例。简单工厂模式是工厂模式家族中最简单实用的模式，可以理解为是不同工厂模式的一个特殊实现。

简单工厂模式（Simple Factory Pattern）：定义一个工厂类，它可以根据参数的不同返回不同类的实例，被创建的实例通常都具有共同的父类。因为在简单工厂模式中用于创建实例的方法是静态（static）方法，因此简单工厂模式又被称为静态工厂方法（Static Factory Method）模式，它属于类创建型模式。

### 基本流程

首先将需要创建的各种不同对象（例如各种不同的 Chart 对象）的相关代码封装到不同的类中，这些类称为具体产品类，而将它们公共的代码进行抽象和提取后封装在一个抽象产品类中，每一个具体产品类都是抽象产品类的子类；然后提供一个工厂类用于创建各种产品，在工厂类中提供一个创建产品的工厂方法，该方法可以根据所传入的参数不同创建不同的具体产品对象；客户端只需调用工厂类的工厂方法并传入相应的参数即可得到一个产品对象。

### 举例

以计算器为例实现简单工厂模式。

#### 结构图如图

- OperationFactory（工厂角色）：工厂角色即工厂类，它是简单工厂模式的核心，负责实现创建所有产品实例的内部逻辑；工厂类可以被外界直接调用，创建所需的产品对象；在工厂类中提供了静态的工厂方法 createOperate()，它的返回类型为具体产品角色。
- Operation（抽象产品角色）：它是工厂类所创建的所有对象的父类，封装了各种产品对象的公有方法，它的引入将提高系统的灵活性，使得在工厂类中只需定义一个通用的工厂方法，因为所有创建的具体产品对象都是其子类对象。
- OperateAdd、OperateSub、OperateMul、OperateDiv（具体产品角色）：它是简单工厂模式的创建目标，所有被创建的对象都充当这个角色的某个具体类的实例。每一个具体产品角色都继承了抽象产品角色，需要实现在抽象产品中声明的抽象方法。

#### PHP代码实现

```java
<?php
//抽象产品角色
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
//具体产品角色
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
class OperateMul extends Operation
{
    public function getResult(){
        $result=$this->numA*$this->numB;
        return $result;
    }
}
class OperateDiv extends Operation
{
    public function getResult(){
        if($this->numB==0){
            throw new Exception("除数不能为零", 1);
        }
        $result=$this->numA/$this->numB;
        return $result;
    }
}
//工厂角色
class OperationFactory
{
    public static function createOperate($operate){
        switch ($operate) {
            case '+':
                $oper=new OperateAdd();
                break;
            case '-':
                $oper=new OperateSub();
                break;
            case '*':
                $oper=new OperateMul();
                break;
            case '/':
                $oper=new OperateDiv();
                break;
            default:
                break;
        }
        return $oper;
    }
}
$oper=OperationFactory::createOperate('+');
$oper->numA=5;
$oper->numB=5;
$b=$oper->getResult();
```
