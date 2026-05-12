# 02、Android设计模式 - 抽象工厂模式
- 来源：https://ddkk.com/zhuanlan/design/android/1/2.html
- 分类：设计模式
- 分组：教程目录
工厂生产出来的产品都是实现同一个接口或继承同一个抽象类的。而有时候工厂可以生产出不是同一个接口或抽象类的产品，也就是说生产出来的产品是不确定的，就是抽象工厂了。

## 定义

为创建一组相关或相互依赖的对象提供一个接口，而无需指定他们的具体类。

## 使用场景

适用于当一组产品族之间有互相约束的时候。它的起源就来与这种模式，期初是解决不同操作系统的图形化解决方案。Windows和Linux是两个系统，可以看出两个产品族，但里面的按钮和文本要统一风格，他们有个字的产品等级。这就有了约束。

## 由上面可以看出UML图了

AbstractFactory：抽象工厂角色，声明了一组用于创建一种产品的方法，每个方法对应生产一种产品，上面生成产品A和B。

ConcreteFactory：具体工厂角色，实现了抽象工厂中定义的创建产品的方法，生成一组具体的产品，每一个产品又位于某个产品等级中。

AbstractProduct：抽象产品角色，定义了每种产品应有的方法

ConcreteProduct：具体的产品角色，具体了工厂生产的具体独享，实现抽象产品中声明的方法。

**模板**

抽象工厂：

```java
public abstract class AbstractFactory {
    public abstract AbstractProductA createProductA();
    public abstract AbstractProductB createProductB();
}
```

具体的工厂1和2

```java
public class ConcreteFactory1 extends AbstractFactory {
    @Override
    public AbstractProductA createProductA() {
        return new ConcreteProductA1();
    }
    @Override
    public AbstractProductB createProductB() {
        return new ConcreteProductB1();
    }
}
public class ConcreteFactory2 extends AbstractFactory {
    @Override
    public AbstractProductA createProductA() {
        return new ConcreteProductA2();
    }
    @Override
    public AbstractProductB createProductB() {
        return new ConcreteProductB2();
    }
}
```

抽象的产品A和B

```java
public abstract class AbstractProductA {  
    public abstract void method();  
}
public abstract class AbstractProductB {  
    public abstract void method();
}
```

```java
具体的产品A1，A2，B1，B2
```

```java
public class ConcreteProductA1 extends AbstractProductA {  
@Override  
public void method() {  
System.out.println(“产品A1的方法”);  
}
}
public class ConcreteProductA2 extends AbstractProductA {  
@Override  
public void method() {  
System.out.println(“产品A2的方法”);  
}
}
public class ConcreteProductB1 extends AbstractProductB {  
@Override  
public void method() {  
System.out.println(“产品B1的方法”);  
}
}
public class ConcreteProductB2 extends AbstractProductB {  
@Override  
public void method() {  
System.out.println(“产品B2的方法”);  
}
}
```

简单实现
还是以车为例，上一次的奥迪用工厂模式生产了Q3，Q7，但是他们的零件又有差别，Q3的发动机是国产的，轮胎是铁的。Q7的发动机是外国的，轮胎是塑料的。不同的轮胎，不同的发动机，都也是一种产品类型，这时候就能用抽象产品模式：

汽车首先由生产轮胎，发动机，然后组装成汽车。

抽象的工厂类声明要生产两种产品：

```java
public abstract class CarFactory {  
public abstract ITire createTire();  
public abstract IEngine createEngine();  
}
```

轮胎类：

```java
interface ITire {  
void tire();  
}
public class FerricFTire implements ITire {  
@Override  
public void tire() {  
System.out.println(“铁轮胎”);  
}
}
public class PlasticTire implements ITire {  
@Override  
public void tire() {  
System.out.println(“塑料轮胎”);  
}
}
```

引擎类：

```java
interface IEngine {  
    void engine();   
}
public class DomesticEngine implements IEngine {  
    @Override  
    public void engine() {  
    System.out.println(“国产引擎”);  
    }
}
public class ImportIEngine implements IEngine {  
    @Override  
    public void engine() {  
    System.out.println(“进口引擎”);  
    }
}
```

具体工厂类

```java
public class Q3Factory extends CarFactory {  
@Override  
public ITire createTire() {  
return new FerricFTire();  
}
```

```java
@Override
public IEngine createEngine() {
    return new DomesticEngine();
}
```

```java
public class Q7Factory extends CarFactory {  
@Override  
public ITire createTire() {  
return new PlasticTire();  
}
```

```java
@Override
public IEngine createEngine() {
    return new ImportIEngine();
}
```

客户端调用：

```java
public class Client {  
    public static void main(String\[\] args) {  
    CarFactory Q3 = new Q3Factory();  
    Q3.createEngine().engine();  
    Q3.createTire().tire();  
    System.out.println(“===”);  
    CarFactory Q7 = new Q7Factory();  
    Q7.createEngine().engine();  
    Q7.createTire().tire();  
    }
}
```

输出：

国产引擎

## 铁轮胎

进口引擎

塑料轮胎

## 总结

抽象工厂模式用的并不多，它和简单工厂和工厂模式的行为很相近，一般在开发中用工厂模式就可以解决问题。而且这几种模式之间可以很隐晦的转换，所以在用的时候不用特别在意是哪一种工厂模式，只要能达到解耦的目的就行

### 优点

- 也是实现了解耦，客户按抽象工厂进行生产，不需要知道具体的实现是谁。
- 但是在产品等级上加了一个约束，便于管理。

### 缺点

要新家一个产品的时候要改动非常多的对象，而且要新增一大堆的文件。因为每增加一个产品都要修改抽象类，所以他的实现类也要进行相应的修改。
