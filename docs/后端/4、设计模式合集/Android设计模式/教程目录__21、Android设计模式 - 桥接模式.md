# 21、Android设计模式 - 桥接模式
- 来源：https://ddkk.com/zhuanlan/design/android/1/21.html
- 分类：设计模式
- 分组：教程目录
桥接模式也叫桥梁模式，和生活中一样，桥梁就是用来连接河道两岸的主要建筑。桥接模式也是起着连接两边的作用，连接的两边就是抽象部分和实现部分，这就需要在程序设计的时候划分好抽象部分和实现部分了。

## 定义

将抽象部分与实现部分分离，使他们都可以独立地进行变化。

## 使用场景

- 一个类存在两个独立维度的变化，且两个维度都需要进行拓展。
- 一个系统需要在构件的抽象化角色和具体化角色之间增加更多的灵活性，避免两个层次之间建立静态的继承联系，可以用桥接模式使他们在抽象层建立一个关联关系。
- 不想使用继承或使用继承会导致生成一大堆类的时候。

## UML

- Abstraction: 抽象部分，抽象部分保持对实现部分的引用，抽象部分的方法要调用实现部分的对象来实现。一般为抽象类。
- RefinedAbstraction: 优化的抽象部分，一般是对抽象部分的方法进行完善和拓展，是抽象部分的具体实现
- Implementor：实现部分，可以是接口和抽象类，方法不一定要和抽象部分保持一致。一般情况下由实现部分提供基本的操作，而抽象部分定义基于这些操作的业务方法。
- ConcreteImplementorA,B: 具体的实现部分。

模板代码：

实现部分的接口：

```java
public interface Implementor{
    void operationImpl();
}
```

具体的实现部分：

```java
public class ConcreteImplementorA implements  Implementor{
    @Override
    public void operationImpl() {
        //具体的实现
    }
}
public class ConcreteImplementor implements  Implementor{
    @Override
    public void operationImpl() {
        //具体的实现
    }
}
```

抽象部分：

```java
public abstract class Abstraction{
    private Implementor mImplementor;
    public Abstraction(Implementor mImplementor) {
        this.mImplementor = mImplementor;
    }
    public void operation(){
        //调用实现部分的具体方法
        mImplementor.operationImpl();
    }
}
```

优化的抽象部分：

```java
public class RefinedAbstraction extends Abstraction{
    public RefinedAbstraction(Implementor mImplementor) {
        super(mImplementor);
    }
    //可以增加拓展其他方法，也可以重写父类的方法，也能调用父类的方法
    @Override
    public void refinedperation() {
        //对抽象的父类的方法进行拓展
    }
}
```

## 简单实现

拿书中举得例子。这里用桥接模式来建立两个维度之间的联系。对咖啡来说，可以分为两个维度，杯子大小是一个维度，加不加糖又是一个维度。这两个没有谁是抽象部分谁是具体部分。就拿杯子大小作为抽象部分来做一个简单实现：

抽象的糖，相当于实现部分的接口：

```java
public abstract class CoffeeSugar {
    public abstract void makeSugar();
}
```

两种实现部分的实现，加不加糖：

```java
public class AddSugar extends CoffeeSugar {
    @Override
    public void makeSugar() {
        System.out.println("加糖的");
    }
}
public class NoSugar extends CoffeeSugar {
    @Override
    public void makeSugar() {
        System.out.println("不加糖的");
    }
}
```

杯子的抽象，相当于抽象部分,持有一个糖的引用：

```java
public abstract class CoffeeCup {
    protected CoffeeSugar coffeeSugar;
    public CoffeeCup(CoffeeSugar coffeeSugar) {
        this.coffeeSugar = coffeeSugar;
    }
    public  void makeCup(){
        coffeeSugar.makeSugar();
    }
}
```

优化的抽象部分，有大小两种杯子：

```java
public class LargeCup extends CoffeeCup {
    public LargeCup(CoffeeSugar coffeeSugar) {
        super(coffeeSugar);
    }
    @Override
    public void makeCup() {
        System.out.println("大杯的");
        super.makeCup();
    }
}
public class SmallCup extends CoffeeCup {
    public SmallCup(CoffeeSugar coffeeSugar) {
        super(coffeeSugar);
    }
    @Override
    public void makeCup() {
        System.out.println("小杯的");
        super.makeCup();
    }
}
```

客户端调用：

```java
public class Client {
    public static void main(String[] args) {
        CoffeeSugar addSugar = new AddSugar();
        CoffeeSugar noSugar = new NoSugar();
        CoffeeCup coffee = new LargeCup(addSugar);
        coffee.makeCup();
        System.out.println("---");
        coffee = new LargeCup(noSugar);
        coffee.makeCup();
        System.out.println("---");
        coffee = new SmallCup(noSugar);
        coffee.makeCup();
    }
}
```

输出：

这样就把两个维度连接到一起了。而且两个维度是可以独立拓展的。比如如果想加上个中杯，或者来个多糖少糖等分类，只需要多实现几个类就行了，然后由客户端去调用。这样就能在两个维度上独立的拓展。

再想加上第三个维度也是很简单的，现在要加上年龄分类，有老年人喝的喝年轻人喝的，者又是一个维度。

这时可以把前面两个已经连接在一起的看做是一个维度，让新的去桥接者个已有的。

抽象的people，持有一个之前的桥接，把people和CoffeeCup连接起来：

```java
ublic abstract class People {
    protected CoffeeCup coffeeCup;
    public People(CoffeeCup coffeeCup) {
        this.coffeeCup = coffeeCup;
    }
    public abstract void age();
}
```

具体的年龄分类：

```java
public class YoungPeople extends People {
    public YoungPeople(CoffeeCup coffeeCup) {
        super(coffeeCup);
    }
    @Override
    public void age() {
        System.out.println("年轻人喝的");
        coffeeCup.makeCup();
    }
}
public class OldPeople extends People {
    public OldPeople(CoffeeCup coffeeCup) {
        super(coffeeCup);
    }
    @Override
    public void age() {
        System.out.println("老年人喝的");
        coffeeCup.makeCup();
    }
}
```

然后客户端只需要这样

```java
public class Client {
    public static void main(String[] args) {
        CoffeeSugar addSugar = new AddSugar();
        CoffeeSugar noSugar = new NoSugar();
        CoffeeCup coffee = new LargeCup(addSugar);
        coffee.makeCup();
        System.out.println("---");
        coffee = new LargeCup(noSugar);
        coffee.makeCup();
        System.out.println("---");
        coffee = new SmallCup(noSugar);
        coffee.makeCup();
        System.out.println("-----");
        //再次桥接
        People people = new OldPeople(coffee);
        people.age();
    }
}
```

输出：

## 总结

桥接模式就是把系统分为抽象部分和实现部分，而建立桥接的方式也很简单。就是让抽象部分持有实现部分的引用，可以通过这个引用调用实现部分的具体方法。

使用这个系统最重要的是把握系统的分离，分不好就失去了灵活的拓展性，因此不容易设计。

### 优点

- 分离成抽象部分和实现部分，并且两部分都可以独立的拓展，一个部分变化不会引起另一部分的变化，提高了系统的拓展性。
- 复用性强，避免了使用继承产生大量继承类的问题。

### 缺点

- 将系统分离为抽象部分和实现部分，会增加系统的复杂度和设计难度。如果系统不能分离出两个独立的维度的话，就不适合使用这个模式。
