# 06、Android设计模式 - 策略模式
- 来源：https://ddkk.com/zhuanlan/design/android/1/6.html
- 分类：设计模式
- 分组：教程目录
在开发中几女航遇见下面这种情况：实现同一个功能有很多不停的算法和策略，然后根据实际情况来选择不同的算法和策略。

一般的做法是在一个类里写不同的方法，然后根据实际情况用一连串的if-else或switch来选择对应的方法。这种方法多了后，这个类会变得臃肿，难以修改。

所以如果把不同的策略抽象出来，提供一个统一的接口，为每一个策略写一个实现类，这样客户端就能通过调用接口的不同的实现类来动态替换策略。这就是策略模式

## 定义

策略模式定义了一系列的算法，并将一系列算法封装起来，使他们能相互替换。策略模式让算法独立于使用者而独立变化。

## 使用场景

- 针对同一类型的问题有多重解决方式，仅仅是具体行为有差异时。让系统可以动态的选择算法策略。
- 需要安全的封装多重同一类对象时，调用者不会知道算法策略的具体过程。
- 一个类有多个子类，并且在调用的时候用if或switch判断的时候。

## UML

## 简单实现

模拟一下城市交通系统，假设情况如下：

公交：起步2元，超过5公里每公里加1元。

地铁：5公里内3元，5-10公里4元，最多5元。

出租：每公里2元。

### 先看一下原来的写法

写一个类计算并返回价钱：

```java
public class PriceCaculator {
    public static final int BUS = 1;
    public static final int SUBWAY = 2;
    public static final int TAXI =3;
    private int busPrice(int km){
        int busP = 2;
        if (km>5)
            busP = busP+km-5;
        return busP;
    }
    private int subwayPrice(int km){
        int subwayP=0;
        if (km<5)
            subwayP = 3;
        if (km>5&&km<=10)
            subwayP=4;
        if (km>10)
            subwayP=5;
        return subwayP;
    }
    private int taxiPrice(int km) {
        return  2 * km;
    }
    public int getPrice(int km,int type){
        if (type==BUS)
            return busPrice(km);
        if (type == SUBWAY)
            return subwayPrice(km);
        if (type==TAXI)
            return taxiPrice(km);
        return 0;
    }
}
```

客户端调用，不是重点

```java
public class Main {
    public static void main(String[] args) {
        PriceCaculator priceCaculator = new PriceCaculator();
        int price = priceCaculator.getPrice(10,2);
        System.out.println(price);
    }
}
```

可以看到计算价钱那个类已经写了很多了，而且如果要再增加其他交通工具计算方法的话，这个类要增加相应的方法和判断。

### 使用策略模式

先声明一个接口，声明一个计算的方法

```java
public interface CalculateStrategy {
    int calculatePrice(int km);
}
```

实现三个具体的计算方法

```java
public class BusCalculate implements CalculateStrategy {
    @Override
    public int calculatePrice(int km) {
        int busP = 2;
        if (km>5)
            busP = busP+km-5;
        return busP;
    }
}
public class SubwayCalculate implements CalculateStrategy {
    @Override
    public int calculatePrice(int km) {
        int subwayP=0;
        if (km<5)
            subwayP = 3;
        if (km>5&&km<=10)
            subwayP=4;
        if (km>10)
            subwayP=5;
        return subwayP;
    }
}
public class TaxiCalculate implements CalculateStrategy {
    @Override
    public int calculatePrice(int km) {
        return  2 * km;
    }
}
```

然后看看我们现在的计算类，这个是重点

```java
public class PriceCalculate2 {
   private  CalculateStrategy calculateStrategy;
    public void setCalculateStrategy(CalculateStrategy calculateStrategy){
        this.calculateStrategy=calculateStrategy;
    }
    public int getPrice(int km){
       return calculateStrategy.calculatePrice(km);
    }
}
```

客户端调用,这个不是重点

```java
public class Main {
    public static void main(String[] args) {
        PriceCalculate2 priceCalculate2 = new PriceCalculate2();
        priceCalculate2.setCalculateStrategy(new SubwayCalculate());
        int price = priceCalculate2.getPrice(10);
        System.out.println(price);
    }
}
```

这里重点就是计算类了，可以看到里面的解法非常简便。而且如果要新增其他算法的话，直接实现一个接口就可以了，其他类都不需要变化。便于之后的升级或扩展。

## Android源码中的粗略模式

看一下一帮使用属相动画时候的样子：

```java
Animation animation = new AlphaAnimation(1,0);
        animation.setInterpolator(new AccelerateDecelerateInterpolator());
        imageView.setAnimation(animation);
        animation.start();
```

animation.setInterpolator()其实用的就是策略模式，Android中有很多不同的插值器，都实现了Interpolator接口。

然后通过setInterpolator设置给Animation。

在动画执行的时候，会通过设置的计时器来在不同的动画时间执行不同的动画效果。

```java
public void setInterpolator(Interpolator i) {
        mInterpolator = i;
    }
protected void ensureInterpolator() {
        if (mInterpolator == null) {
            //默认就是加速度插值器,在Animation初始化的时候执行。
            mInterpolator = new AccelerateDecelerateInterpolator();
        }
    }
public boolean getTransformation(long currentTime, Transformation outTransformation) {
        ......
            if ((normalizedTime >= 0.0f || mFillBefore) && (normalizedTime <= 1.0f || mFillAfter)) {
                ......
                //通过策略模式来获取不同的值。
                final float interpolatedTime = mInterpolator.getInterpolation(normalizedTime);
                applyTransformation(interpolatedTime, outTransformation);
        }
        ......
    }
```

## 总结

策略模式主要就是为了分离算法和使用，是系统用于很好的拓展性

### 优点

- 结构清晰明了，消除了代码中的一大串选择语句，而是分离为一个个独立的类，代码更清晰。
- 耦合度低，都是基于接口调用和实现，便于拓展和修改。
- 封装更彻底，数据更安全。

### 缺点

- 首先是会产生很多策略类，增加了系统开销。
- 用户要知道所有的策略类。
