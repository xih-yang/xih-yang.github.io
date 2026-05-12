# 09、Java并发编程：线程安全和共享资源（局部变量，局部对象引用，对象成员变量，线程控制逸出规则）
- 来源：https://ddkk.com/zhuanlan/java/concurrency/5/9.html
- 分类：Java并发
- 分组：教程目录
可以由多个线程同时安全调用的代码称为线程安全代码。线程安全的代码不包含竞态条件。只有当多个线程更新共享资源时，才会出现竞态条件。因此，了解Java线程在执行时共享了哪些资源非常重要。

## 局部变量

局部变量存储在线程自己的堆栈中。这意味着局部变量永远不会在线程之间共享。这也意味着所有的原始局部变量都是线程安全的。以下是线程安全的原始局部变量的示例：

```java
public void someMethod(){
  long threadSafeInt = 0;
  threadSafeInt++;
}
```

## 局部对象引用

对象的局部引用有点不同，引用本身是不共享的。但是，引用的对象并不是存储在每个线程的局部栈中，而是所有对象都存储在共享堆中。

如果局部创建的对象从不在创建它的方法之外使用，则它是线程安全的。实际上，你也可以把它传递给其他方法和对象，只要这些方法或对象不会再把它给其他线程使用。

以下是线程安全局部对象的示例：

```java
public void someMethod(){
  LocalObject localObject = new LocalObject();
  localObject.callMethod();
  method2(localObject);
}
public void method2(LocalObject localObject){
  localObject.setValue("value");
}
```

本例中的LocalObject实例不会从该方法返回，也不会传递给someMethod（）方法外部可访问的其他对象。每个执行someMethod（）方法的线程都将创建自己的LocalObject实例并将其分配给localObject引用。因此，这里使用的LocalObject是线程安全的。

实际上，整个方法someMethod（）都是线程安全的。即使LocalObject实例作为参数传递给同一个类的其他方法，或其他类中的方法，它的使用也是线程安全的。

当然，唯一的例外是，如果其中某个方法使用LocalObject作为参数调用，又存储了LocalObject实例，而存储的实例允许其他线程访问。

## 对象成员变量

对象成员变量（字段）与对象一起存储在堆中。因此，如果两个线程调用同一个对象实例的方法，并且此方法更新对象成员变量，则该方法不是线程安全的。下面是一个非线程安全的方法示例：

```java
public class NotThreadSafe{
    StringBuilder builder = new StringBuilder();
    public add(String text){
        this.builder.append(text);
    }
}
```

如果两个线程同时调用同一个NotThreadSafe实例的add（）方法，则会导致竞态条件。例如：

```java
NotThreadSafe sharedInstance = new NotThreadSafe();
new Thread(new MyRunnable(sharedInstance)).start();
new Thread(new MyRunnable(sharedInstance)).start();
public class MyRunnable implements Runnable{
  NotThreadSafe instance = null;
  public MyRunnable(NotThreadSafe instance){
    this.instance = instance;
  }
  public void run(){
    this.instance.add("some text");
  }
}
```

注意下两个MyRunnable实例是如何共享同一个NotThreadSafe实例的。因此，当它们调用NotThreadSafe实例的add（）方法时，会导致竞态条件。

但是，如果两个线程同时调用不同实例的add（）方法，则不会导致竞态条件。下面是在之前的示例上稍作修改：

```java
new Thread(new MyRunnable(new NotThreadSafe())).start();
new Thread(new MyRunnable(new NotThreadSafe())).start();
```

现在这两个线程都有自己的NotThreadSafe实例，因此它们对add方法的调用不会相互干扰。代码不存在竞态条件了。所以，即使一个对象不是线程安全的，它仍然有避免竞态条件的使用方式。

## 线程控制逸出规则

当试图确定代码对某个资源的访问是否是线程安全时，可以使用线程控制逸出规则：

```java
如果资源的创建、使用和释放（译者注：原文为disposed，这里的意思是丢弃）是在同一个线程的控制下，
并且永远不会逃离出该线程的控制，
则该资源的使用是线程安全的。
```

资源可以是任何共享资源，如对象、数组、文件、数据库连接、套接字等。在Java中，并不总是显式地释放对象，因此“释放”意味着丢弃或将对象的引用置空。

即使对象的使用是线程安全的，但如果该对象指向共享资源（如文件或数据库），则整个应用程序可能不是线程安全的。例如，如果线程1和线程2各自创建自己的数据库连接：连接1和连接2，则每个连接本身的使用是线程安全的。但是连接指向的数据库的使用可能不是线程安全的。例如，如果两个线程都执行这样的代码：

```java
检查是否存在记录X
如果不存在，插入记录X
```

如果两个线程同时执行此操作，并且它们正在检查的记录X恰好是同一个记录，则有可能两个线程最终都会插入该记录。就像这样：

```java
线程 1 检查是否存在记录X. Result = no
线程 2 检查是否存在记录X. Result = no
线程 1 插入记录X
线程 2 插入记录X
```

线程在操作文件或其他共享资源时也可能发生这种情况。因此，有必要认清线程控制的对象究竟是资源，或者仅仅是资源的引用（就像数据库连接那样）。
