# 11、PHP设计模式 - 抽象工厂模式
- 来源：https://ddkk.com/zhuanlan/design/php/11.html
- 分类：设计模式
- 分组：教程目录
### 抽象工厂模式

抽象工厂模式(Abstract Factory Pattern)：提供一个创建一系列相关或相互依赖对象的接口，而无须指定它们具体的类。抽象工厂模式又称为Kit模式，属于对象创建型模式。

### 模式结构

抽象工厂模式包含如下角色：

- AbstractFactory：抽象工厂
- ConcreteFactory：具体工厂
- AbstractProduct：抽象产品
- Product：具体产品

### 结构图

### PHP代码实现

```java
<?php
/**
 * 抽象工厂模式
 */
//AbstractFactory：抽象工厂
abstract class AbstractProductA
{
    abstract public function use();
}
//ConcreteFactory：具体工厂
class ProductA1 extends AbstractProductA
{
    public function use(){
        var_dump('productA1');
    }
}
class ProductA2 extends AbstractProductA
{
    public function use(){
        var_dump('productA2');
    }
}
//AbstractProduct：抽象产品
abstract class AbstractProductB
{
    abstract public function eat();
}
//Product：具体产品
class ProductB1 extends AbstractProductB
{
    public function eat()
    {
        var_dump('productB1');
    }
}
class ProductB2 extends AbstractProductB
{
    public function eat()
    {
        var_dump('productB2');
    }
}
abstract class AbstractFactory
{
    abstract public function createProductA();
    abstract public function createProductB();
}
class ConcreteFactory1 extends AbstractFactory
{
    public function createProductA()
    {
        return new ProductA1();
    }
    public function createProductB()
    {
        return new ProductB1();
    }
}
class ConcreteFactory2 extends AbstractFactory
{
    public function createProductA()
    {
        return new ProductA2();
    }
    public function createProductB()
    {
        return new ProductB2();
    }
}
$a=new ConcreteFactory1();
$b=$a->createProductA();
$b->use();
$c=new ConcreteFactory2();
$d=$c->createProductB();
$d->eat();
```

### 运行结果

```java
string 'productA1' (length=9)
string 'productB2' (length=9)
```
