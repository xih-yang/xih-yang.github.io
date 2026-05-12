# 19、Android设计模式 - 代理模式
- 来源：https://ddkk.com/zhuanlan/design/android/1/19.html
- 分类：设计模式
- 分组：教程目录
代理模式也叫委托模式，是结构型设计模式。代理就是让别人帮你做事，比如帮你带饭，请律师打官司什么的。

## 定义

为其他对象提供一种代理以控制对这个对象的访问。

## 使用场景

- 当一个对象不能或者不想直接访问另一个对象时，可以通过一个代理对象来间接访问。为保证客户端使用的透明性，委托对象和代理对象要实现同样的接口。
- 被访问的对象不想暴露全部内容时，可以通过代理去掉不想被访问的内容。

## UML

- Subject: 抽象主题类，声明真是主体与代理主题的共同接口方法。
- RealSubject: 真实主题类，定义了代理所表示的真是对象，执行具体的业务方法。客户端通过代理类来间接的调动这个真实主题中的方法。
- ProxySubject: 代理类，持有一个真实类的引用，在接口方法中调用真实主题相应的方法，达到代理的作用。

## 简单实现

就以打官司为例。我们一般人要打官司都要找个律师来代理。

### 静态代理

先建立一个起诉类的接口：

```java
public interface ILawsuit {
    void submit();//提交申请
    void burden();//进行举证
    void defend();//开始辩护
    void finish();//诉讼完成
}
```

真正的起诉者：

```java
public class Civilian implements ILawsuit {
    @Override
    public void submit() {
        System.out.println("起诉");
    }
    @Override
    public void burden() {
        System.out.println("举证");
    }
    @Override
    public void defend() {
        System.out.println("辩护");
    }
    @Override
    public void finish() {
        System.out.println("胜诉");
    }
}
```

找的律师：

```java
public class Lawyer implements ILawsuit {
    private ILawsuit civilian;
    public Lawyer(ILawsuit civilian) {
        this.civilian = civilian;
    }
    @Override
    public void submit() {
        civilian.submit();
    }
    @Override
    public void burden() {
        civilian.burden();
    }
    @Override
    public void defend() {
        civilian.defend();
    }
    @Override
    public void finish() {
        civilian.finish();
    }
}
```

客户端调用，调用律师的方法，通过律师调用真正的su起诉者的方法。

```java
public class Client {
    public static void main(String[] args) {
        ILawsuit civilian = new Civilian();
        ILawsuit lawyer = new Lawyer(civilian);
        lawyer.submit();
        lawyer.burden();
        lawyer.defend();
        lawyer.finish();
    }
}
```

输出：

一个代理可以代理多个类，就像这个律师可以给很多人打官司，只需要在实现一个具体的ILawsuit就行了。代理会根据传进来的被代理者调用传进来的被代理者的方法。

### 动态代理

代理模式大致分为两大部分：静态代理和动态代理。

上面是是一种静态代理，代理者的代码时先生成写好，然后再对其进行编译，在代码运行前，代理类的class编译文件就已经存在了。

动态代理是相反的，通过反射动态的生成代理者对象，也就是说在写代码的时候根本不知道要代理谁，具体代理谁会在执行阶段决定。

Java提供了一个便捷的动态代理接口InvocationHandler，动态代理类只要实现这个接口就行：

```java
public class DynamicProxy implements InvocationHandler {
    @Override
    public Object invoke(Object proxy, Method method, Object[] args) throws Throwable {
        return null;
    }
}
```

看一下动态代理的用法：

```java
public class DynamicProxy implements InvocationHandler {
    private Object object;
    public DynamicProxy(Object object) {
        this.object = object;
    }
    @Override
    public Object invoke(Object proxy, Method method, Object[] args) throws Throwable {
        //当然这里可以对方法名进行判断过滤 if(method.getName().equals("***"))
        Object result = method.invoke(object,args);
        return result;
    }
}
```

客户端调用：

```java
public class Main {
    public static void main(String[] args) {
        ILawsuit lawsuit = new Civilian();
        DynamicProxy proxy = new DynamicProxy(lawsuit);
        ClassLoader loader = lawsuit.getClass().getClassLoader();
        //动态创建代理类，需要传入一个类加载器ClassLoader；一个你希望这个代理实现的接口列表，这里要代理ILawsuit接口；
        //和一个InvocationHandler的实现，也就是前面创建的proxy。
        ILawsuit lawyer = (ILawsuit) Proxy.newProxyInstance(loader,new Class[]{ILawsuit.class},proxy);
        lawyer.submit();
        lawyer.burden();
        lawyer.defend();
        lawyer.finish();
    }
}
```

输出和上面一毛一样：

动态代理并不局限与代理一个接口的实现，可以根据运行时传入的接口，动态的生成代理类，然后通过Method的invoke方法来执行被代理类的真实方法。非常灵活。

### 其他分类

静态代理和动态代理是从code方便进行分类的。这两个分类根据适用范围来分都可以分为下面几种：

- 远程代理：为摸个对象在不同的内存地址空间提供局部代理，是系统Server部分隐藏，以便Client不用考虑Server的存在。
- 虚拟代理：如果要创建一个资源消耗较大的对象，可以先用一个代理对象表示，在真正需要的时候才真正创建。
- 保护代理：用代理对象控制对一个对象的访问，给不同的用户提供不同的访问权限。
- 智能引用：在引用原始对象的时候附加额外操作，并对指向原始对象的引用增加引用计数。

## 总结

代理模式使用非常广泛，从分类就能感觉出来，而且其他的设计模式中也会有代理模式的影子。

### 优点

优点可以从他的适用范围看出来

-协调调用者和被调用者，降低系统耦合度。

-用小对象代表大对象，减少系统资源消耗，提高系统运行速度，如虚拟代理。

-控制用户对呗调用者的使用权限，如保护代理。

### 缺点

- 首先当然是比直接调用原始对象多了一个中间者，会让结构有点复杂。
- 调用原始对象的方法要通过代理来调用，可能会造成请求处理速度变慢。
