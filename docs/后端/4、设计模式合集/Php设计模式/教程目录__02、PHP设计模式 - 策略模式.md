# 02、PHP设计模式 - 策略模式
- 来源：https://ddkk.com/zhuanlan/design/php/2.html
- 分类：设计模式
- 分组：教程目录
### 策略模式

策略模式作为一种软件设计模式，指对象有某个行为，但是在不同的场景中，该行为有不同的实现算法。比如每个人都要“交个人所得税”，但是“在美国交个人所得税”和“在中国交个人所得税”就有不同的算税方法。

### 组成

**1、** 抽象策略角色：策略类，通常由一个接口或者抽象类实现；

**2、** 具体策略角色：包装了相关的算法和行为；

**3、** 环境角色：持有一个策略类的引用，最终给客户端调用；

### 实现

#### 结构图

#### 步骤

**1、** 定义抽象角色类（定义好各个实现的共同抽象方法）；

**2、** 定义具体策略类（具体实现父类的共同方法）；

**3、** 定义环境角色类（接收保存实例，统一执行策略类接口方法）；

### PHP代码实现

```java
<?php
//抽象策略模式
interface Strategy
{
    public function AlgorithmInterface();
}
//具体策略模式
class ConcreteStrategyA implements Strategy
{
    public function AlgorithmInterface(){
        var_dump('A实现');
    }
}
class ConcreteStrategyB implements Strategy
{
    public function AlgorithmInterface(){
        var_dump('B实现');
    }
}
class ConcreteStrategyC implements Strategy
{
    public function AlgorithmInterface(){
        var_dump('C实现');
    }
}
//环境角色类
class Context
{
    public function __construct($strategy){
        $this->strategy=$strategy;
    }
    public function contextInterface(){
        $this->strategy->AlgorithmInterface();
    }
}
$a=new Context(new ConcreteStrategyA());
$a->contextInterface();
```

### 运行结果

`string(7) "A实现"`
