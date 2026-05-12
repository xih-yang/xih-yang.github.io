# 17、Android设计模式 - 适配器模式
- 来源：https://ddkk.com/zhuanlan/design/android/1/17.html
- 分类：设计模式
- 分组：教程目录
适配器模式是咋Android中使用非常广泛的一种设计模式，总到处可见的Adapter就可以看出来。适配器模式类似于电源适配器的设计思想，将两个不兼容的东西通过适配兼容到一起。

在实际开发中，经常会遇见两个没有关系的类型之间的交互。那么有下面两个方式：

**1、** 修改各自类的接口，以达到互相交互的目的；

**2、** 在两个类之间建立一个“混血儿”接口，将两个类型进行兼容，不用修改原来的类的代码；

第一种方式明显不是个好选择，我们不愿意为了一个应用而修改各自的接口。而且如果一个类要适配很多类的话，避免要做很多 这样的修改，既不利于扩展也不利于维护。

第二种就是要说的适配器模式了。

[小宇宙](http://blog.miaolegewu.top/2017/04/07/Android设计模式（十九）-适配器模式/)

## 定义

适配器模式吧一个类的接口变换成客户端锁期待的另一种接口，从而使原本因为接口不匹配而无法在一起工作的两个类能够在一起工作。

## 使用场景

- 系统需要使用现有的类，但是这个类的接口不符合系统的需要。
- 想要建立一个可以重复使用的类，用于与一些批次之间没有太大关联的一些类，包括一些可能在将来引进的类一起工作。
- 需要一个统一的输出接口，而输出的类型不确定。

## UML

适配器模式也分两种，类适配器和对象适配器

### 类适配器

类适配器通过实现Target接口和继承Adaptee类来实现接口转换。比如Target需要operation2，而Adaptee只有operation3，所以Adapter就能把operation3转为operation2供Target使用。

- 目标角色，所期待的接口，虽然是类适配器，但这个目标不能是类。
- 需要适配的接口
- 适配器，把源接口转换成目标接口。这个角色必须是具体类。

### 类适配器简单实现

就以电源适配器为例子，一般笔记本需要5V的电压，而电源都是220V的。这是就需要电源适配器出来干活了。

代码很简单

先建目标接口，需要的是5V的电压

```java
public interface FiveVolt {
    public int getVolt5();
}
```

然后是插座的电压220v

```java
public class Volt220 {
    public int getVolt220(){
        return 220;
    }
}
```

适配器

```java
public class VoltAdapter extends Volt220 implements FiveVolt {
    @Override
    public int getVolt5() {
        return 5;
    }
}
```

这样就解决了接口不兼容的问题

### 对象适配器

对象适配器一样是吧被适配类的API转化成目标类的API。但是，对象适配器模式不是使用继承关系连接到Adaptee类，而是使用代理关系。

目标：

```java
public interface FiveVolt {
    public int getVolt5();
}
```

需要适配的:

```java
public class Volt220 {
    public int getVolt220(){
        return 220;
    }
}
```

适配器:

```java
public class VoltAdapter implements FiveVolt {
    Volt220 volt220 ;
    public VoltAdapter(Volt220 volt220) {
        this.volt220 = volt220;
    }
    @Override
    public int getVolt5() {
        return 5;
    }
    public int getVolt220(){
        return volt220.getVolt220();
    }
}
```

客户端调用：

```java
public class Client {
    public static void main(String[] args) {
        VoltAdapter voltAdapter = new VoltAdapter(new Volt220());
        System.out.println(voltAdapter.getVolt5());
    }
}
```

对象适配器直接把要被适配的对象传递到Adapter中，使用组合的形式实现接口兼容。比类适配器更加灵活，而且不会暴露被适配对象中的方法。

类适配器由于继承了被适配的类，所以这个适配器会拥有被适配对象的方法，导致适配器出现一些奇怪的方法。

适配器模式还经常用于处理不兼容类型的统一输出问题。例如ListView的输入有很多种类型，但输出都是View，适配器就可以做到这一点。

## 总结

### 优点

- 提高现有类和系统类的复用性，适配器能让一个类有更广泛的用途。
- 提高了灵活想，更换适配器就能达到不同的效果。而且不用修改原有代码。
- 类适配器可以重写继承的被适配者的一些方法来增加灵活性
- 对象适配器可以传入不同的对象把不同的对象都适配到同一个接口。

### 缺点

- 过多的使用适配器，会让系统变得非常凌乱，不易整体把握。明明调用A接口，却被适配成B接口。
- java不能多继承，所以类适配器只能适配一个被适配类。
