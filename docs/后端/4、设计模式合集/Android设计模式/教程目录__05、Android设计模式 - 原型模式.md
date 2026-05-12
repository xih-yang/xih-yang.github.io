# 05、Android设计模式 - 原型模式
- 来源：https://ddkk.com/zhuanlan/design/android/1/5.html
- 分类：设计模式
- 分组：教程目录
原型模式也是一种创建型设计模式，从名字就能理解，这个模式应该有一个样板实例，也就是原型，然后用户从这个原型中复制出一个内部属性一致的实例，也就是克隆。

有时，一个对象的构造比较复杂并且比较耗时时，直接从已有对象复制一个实例比重新构造出来更高效。

## 定义

用原型实例指定创建对象的种类，并通过拷贝这些原型创建新的对象。

## 使用场景

- 对象的初始化要消耗非常多的资源，包括硬件，数据等。可以使用原型模式避免这种资源的消耗。
- 用new来实例化一个对象时需要非常繁琐的数据准备或访问权限时，可以使用原型模式。
- 一个对象要供其他对象访问，而每个调用者都可能会修改他的值，这时可以考虑用原型模式拷贝多个原型的对象供各个调用者使用，不互相影响，即保护性拷贝。
- 需要频繁的创建相似的对象时，比如在一个循环中创建对象。

这里说明一下，使用clone产生实例并不一定都比new来的快，当一些对象的构造非常简单时，new是比clone还快的。但是当对象的构造复杂起来的时候用new构造就会造成较大的成本，这时clone才能体现出效率的优势。

## UML类图

其中Prototype不一定非要实现Cloneable接口，在演示的时候会有两种。

## 简单实现

### 使用Cloneable接口

原型,实现Cloneable接口：

```java
public class Prototype implements Cloneable{
}
```

原型的实现：

```java
public class ConcretePrototype extends Prototype {
    public String name;
    public ArrayList<String> list = new ArrayList<>();
    public ConcretePrototype() {
        System.out.println("执行了ConcretePrototype构造函数");
    }
    @Override
    public ConcretePrototype clone()  {
        ConcretePrototype prototype = null;
        try {
            prototype = (ConcretePrototype) super.clone();
        } catch (CloneNotSupportedException e) {
            e.printStackTrace();
        }
        return prototype;
    }
    @Override
    public String toString() {
        return "ConcretePrototype{" +
                "name='" + name + '\'' +
                ", list=" + list +
                '}';
    }
}
```

使用：

```java
public class MainM {
    public static void main(String[] args) {
        ConcretePrototype concretePrototype = new ConcretePrototype();
        concretePrototype.name="yuanxing";
        concretePrototype.list.add("yuanxing1");
        concretePrototype.list.add("yuanxing2");
        concretePrototype.list.add("yuanxing3");
        ConcretePrototype cloneConcretePrototype = (ConcretePrototype) concretePrototype.clone();
        cloneConcretePrototype.name = "clone";
        System.out.println(concretePrototype.toString());
        System.out.println(cloneConcretePrototype.toString());
    }
}
```

输出：

通过clone方法获得一个实例，而且修改这个实例的内容并不会影响原来的实例的内容。

当然，这样也只是对基本数据类型有效。

### 不实现Cloneable接口

原型：

```java
public class Prototype1 {
}
```

原型的实现：

```java
public class ConcretePrototype1 extends Prototype1 {
    public String name;
    public ArrayList<String> list = new ArrayList<>();
    public ConcretePrototype1() {
        System.out.println("执行了ConcretePrototype构造函数");
    }
    public ConcretePrototype1 clone()  {
        ConcretePrototype1 prototype1 = new ConcretePrototype1() ;
        prototype1.name = this.name;
        prototype1.list=this.list;
        return prototype1;
    }
    @Override
    public String toString() {
        return "ConcretePrototype1{" +
                "name='" + name + '\'' +
                ", list=" + list +
                '}';
    }
}
```

使用：

```java
public class MainM {
    public static void main(String[] args) {
        ConcretePrototype1 concretePrototype1 = new ConcretePrototype1();
        concretePrototype1.name="yuanxing";
        concretePrototype1.list.add("yuanxing1");
        concretePrototype1.list.add("yuanxing2");
        concretePrototype1.list.add("yuanxing3");
        ConcretePrototype1 cloneconcretePrototype1 = (ConcretePrototype1) concretePrototype1.clone();
        cloneconcretePrototype1.name="clone";
        System.out.println(concretePrototype1.toString());
        System.out.println(cloneconcretePrototype1.toString());
    }
}
```

输出的结果是有点不一样的:

直接调用Cloneable的方法是不会再次调用构造方法的，而自己new是一定会调用构造方法的。

我个人觉得这个应该是伪克隆吧，只是写了一个clone的方法，然后在方法中new出一个对象，然后要手动把自己本来的值赋值给新的对象。

## 问题

上面两个都测试了name这个属性，如果在克隆的对象里修改了ArrayList对象list会怎样呢？来试试：

使用：

```java
public class MainM {
    public static void main(String[] args) {
        ConcretePrototype concretePrototype = new ConcretePrototype();
        concretePrototype.name="yuanxing";
        concretePrototype.list.add("yuanxing1");
        concretePrototype.list.add("yuanxing2");
        concretePrototype.list.add("yuanxing3");
        ConcretePrototype cloneConcretePrototype = (ConcretePrototype) concretePrototype.clone();
        cloneConcretePrototype.name = "clone";
        cloneConcretePrototype.list.add("clone1");
        System.out.println(concretePrototype.toString());
        System.out.println(cloneConcretePrototype.toString());
    }
}
```

发现输出并不是预期的：

修改了克隆出来的对象的list，原型中的list的值也变了。

## 深拷贝-浅拷贝

之所以会出现上面的情况，是因为上面的原型中使用的是浅拷贝。Cloneable的方法clone默认就是浅拷贝，浅拷贝并不是把所有字段都重新构造了一份，而是引用了原型中的字段。对于值类型，也就是基本数据类型来说，还有String类型，clone方法会进行一个拷贝，可以让拷贝的对象和原型互不干扰。但是对于引用类型（对象，集合，数组等）来说，clone方法只是让他们指向了同一个内存地址，所以修改其中一个的内容，两个都会变化。

所以对于不是基本类型的属性，在clone的时候要手动调用引用对象的clone方法进行拷贝，也就是深拷贝。

**把重写的clone方法加上深拷贝**

```java
@Override
    public ConcretePrototype clone()  {
        ConcretePrototype prototype = null;
        try {
            prototype = (ConcretePrototype) super.clone();
            prototype.list = (ArrayList<String>) this.list.clone();
        } catch (CloneNotSupportedException e) {
            e.printStackTrace();
        }
        return prototype;
    }
```

然后就会得到我们期望的输出：

## Android源码中的原型模式：

原型模式可能很少单独使用吧，在书中的例子举了个Intent，虽然实现了Cloneable接口，但在clone方法中是直接new的一个Intent，把原型传进去，然后复制给新的Intent：

```java
package android.content;
public class Intent implements Parcelable, Cloneable {
    /**
     * 拷贝构造函数
     */
    public Intent(Intent o) {
        this.mAction = o.mAction;
        this.mData = o.mData;
        this.mType = o.mType;
        this.mPackage = o.mPackage;
        this.mComponent = o.mComponent;
        this.mFlags = o.mFlags;
        this.mContentUserHint = o.mContentUserHint;
        if (o.mCategories != null) {
            this.mCategories = new ArraySet<String>(o.mCategories);
        }
        if (o.mExtras != null) {
            this.mExtras = new Bundle(o.mExtras);
        }
        if (o.mSourceBounds != null) {
            this.mSourceBounds = new Rect(o.mSourceBounds);
        }
        if (o.mSelector != null) {
            this.mSelector = new Intent(o.mSelector);
        }
        if (o.mClipData != null) {
            this.mClipData = new ClipData(o.mClipData);
        }
    }
    @Override
    public Object clone() {
        return new Intent(this);
    }    
}
```

这里可能考虑的就是直接new比clone快吧。。

## 总结

原型模式主要就是拷贝对象，拷贝对象一般有两个作用

**1、** 保护原型不被修改，只给外部提供一个拷贝以供访问，保护性拷贝；

**2、** 避免构造复杂的对象时的资源消耗问题，提升创建对象的效率；

### 优点

- Object的clone方法是一个本地方法，直接操作的是二进制流，性能会好很多。

### 缺点

- 构造方法在clone的时候不会执行，既是优点也是缺点，使用时要注意这个潜在的问题。
