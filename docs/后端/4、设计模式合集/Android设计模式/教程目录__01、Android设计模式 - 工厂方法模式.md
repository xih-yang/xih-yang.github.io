# 01、Android设计模式 - 工厂方法模式
- 来源：https://ddkk.com/zhuanlan/design/android/1/1.html
- 分类：设计模式
- 分组：教程目录
工厂方法模式也是创建型模式。

工厂模式根据抽象程度可以分为三种：简单工厂模式，工厂方法模式，抽象工厂模式。

## 定义

定义一个用于创建对象的接口，让子类决定实例化哪一个类。

## 使用场景

任何需要生成复杂对象的地方，都可以使用工厂方法模式。用new就能创建的对象不需要使用工厂模式，因为使用工厂模式就要增加一个工厂类，增加了系统复杂度。

## UML

### 模式1

抽象的产品：

```java
public abstract class Product {
    public abstract void method();
}
```

具体的产品：

```java
public class ConcreteProductA extends Product {
    @Override
    public void method() {
        System.out.println("产品A");
    }
}
public class ConcreteProductB extends Product {
    @Override
    public void method() {
        System.out.println("产品B");
    }
}
```

抽象的工厂：

```java
public abstract class Factory {
    public abstract Product createProduct();
}
```

具体的工厂：

```java
public class ConcreteFactory extends Factory {
    @Override
    public Product createProduct() {
        return new ConcreteProductA();
    }
}
```

客户端使用:

```java
public class Client {
    public static void main(String[] args) {
        Factory factory = new ConcreteFactory();
        Product product = factory.createProduct();
        product.method();
    }
}
```

这样就生产出来一个ConcreteProductA。

如果想生产ConcreteFactory，在ConcreteFactory里修改为返回ConcreteFactory就行了。

```java
public class ConcreteFactory extends Factory {
    @Override
    public Product createProduct() {
        return new ConcreteProductB();
    }
}
```

### 模式2

通过反射来了解要生产哪个产品

抽象工厂：

```java
public abstract class Factory {
    public abstract <T extends Product> T createProduct(Class<T> clz);
}
```

具体工厂：

```java
public class ConcreteFactory extends Factory {
    @Override
    public <T extends Product> T createProduct(Class<T> clz) {
        Product  product = null;
        try {
            product= (Product) Class.forName(clz.getName()).newInstance();
        } catch (InstantiationException e) {
            e.printStackTrace();
        } catch (IllegalAccessException e) {
            e.printStackTrace();
        } catch (ClassNotFoundException e) {
            e.printStackTrace();
        }
        return (T) product;
    }
}
```

客户端调用：

```java
public class Client {
    public static void main(String[] args) {
        Factory factory = new ConcreteFactory();
        Product product = factory.createProduct(ConcreteProductB.class);
        product.method();
    }
}
```

这样，客户端调用的时候，传入什么产品就生产什么产品。

### 模式3

可以为每个产品都创建一个具体的工厂类，如：

```java
public class ConcreteFactoryA extends Factory {
    @Override
    public Product createProduct() {
        return new ConcreteProductA();
    }
}
public class ConcreteFactoryB extends Factory {
    @Override
    public Product createProduct() {
        return new ConcreteProductA();
    }
}
```

要生产哪个就调用哪个工厂。

这种叫*多工厂方法模式*。

### 简单工厂模式（静态工厂模式）

当确定工厂类只有一个的时候，

```java
public class Factory{
    public static Product createProduct(){
        return new ConcreteProductA();
        //return new ConcreteProductB();
    }
}
```

## 简单实现

以汽车举个例子，

抽象的汽车厂：

```java
public abstract class AodiFactory {
    public abstract <T extends AodiCar> T createAudiCar(Class<T> clz);
}
```

具体的汽车生产工厂：

```java
public class AodiCarFactory extends AodiFactory {
    @Override
    public <T extends AodiCar> T createAudiCar(Class<T> clz) {
        AodiCar aodiCar = null;
        try {
            aodiCar = (AodiCar) (Class.forName(clz.getName())).newInstance();
        } catch (Exception e) {
            e.printStackTrace();
        } 
        return (T) aodiCar;
    }
}
```

抽象的汽车：

```java
public abstract class AodiCar {
    public abstract void diver();
    public abstract void selfNav();
}
```

具体的汽车：

```java
public class AodiQ3 extends AodiCar {
    @Override
    public void diver() {
        System.out.println("Q3启动");
    }
    @Override
    public void selfNav() {
        System.out.println("Q3导航");
    }
}
public class AodiQ5 extends AodiCar {
    @Override
    public void diver() {
        System.out.println("Q5启动");
    }
    @Override
    public void selfNav() {
        System.out.println("Q5导航");
    }
}
```

客户端调用：

```java
public class Client {
    public static void main(String[] args) {
        AodiFactory aodiFactory = new AodiCarFactory();
        AodiCar Q3 = aodiFactory.createAudiCar(AodiQ3.class);
        Q3.diver();
        Q3.selfNav();
        AodiCar Q5 = aodiFactory.createAudiCar(AodiQ5.class);
        Q5.diver();
        Q5.selfNav();
    }
}
```

### Android源码中的工厂方法

书中举例是Activity的onCreate()方法，理由是：在不同的Activity的onCreate方法中调用setContentView会根据设置的不同的布局文件而产生不同的布局，所以可以看做是一个工厂。

个人觉得有点牵强吧。。。不知道你们怎么看呢？

有个很明显的BitmapFactory，应该是符合简单工厂模式的：

```java
package android.graphics;
public class BitmapFactory {
    public static Bitmap decodeFile(String pathName, Options opts) {
        Bitmap bm = null;
        ......
        return bm;
    }
    //有很多静态方法返回一个Bitmap对象。
}
```

## 总结

### 优点

- 降低了对象之间的耦合度，代码结构清晰，对调用者隐藏了产品的生产过程，生产过程改变后，调用者不用做什么改变，易于修改。
- 易于拓展，要增加工厂和产品都非常方便，直接实现接口，不用修改之前的代码。

### 缺点

缺点应该就是会让系统结构复杂化了，如果是非常简单的结构就不需要使用这种模式了。
