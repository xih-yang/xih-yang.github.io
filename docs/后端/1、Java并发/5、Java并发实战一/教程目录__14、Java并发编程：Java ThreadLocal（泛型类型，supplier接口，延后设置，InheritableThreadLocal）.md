# 14、Java并发编程：Java ThreadLocal（泛型类型，supplier接口，延后设置，InheritableThreadLocal）
- 来源：https://ddkk.com/zhuanlan/java/concurrency/5/14.html
- 分类：Java并发
- 分组：教程目录
Java ThreadLocal类可以创建只能由同一个线程读写的变量。因此，即使两个线程正在执行相同的代码，并且代码引用了相同的ThreadLocal变量，两个线程也无法看到彼此的ThreadLocal变量。因此，Java ThreadLocal类提供了一种使代码线程安全的简单方法，而没有这个方法则线程不是安全的。

## 创建ThreadLocal

创建一个ThreadLocal实例就像创建其他Java对象一样，通过new操作符。下面的示例演示了如何创建ThreadLocal变量：

```java
private ThreadLocal threadLocal = new ThreadLocal();
```

这段代码每个线程只需要执行一次。多个线程现在可以在这个ThreadLocal中获取和设置值，并且每个线程只能看到它自己设置的值。

## 设置ThreadLocal值

创建ThreadLocal后，可以使用其set（）方法设置要存储在其中的值。

```java
threadLocal.set("A thread local value");
```

## 获取ThreadLocal值

可以使用其get（）方法读取存储在ThreadLocal中的值。下面是获取存储在Java ThreadLocal中的值的示例：

```java
String threadLocalValue = (String) threadLocal.get();
```

## 删除ThreadLocal值

可以删除ThreadLocal变量中的值。通过调用ThreadLocal remove（）方法删除值。下面是删除Java ThreadLocal上的值的示例：

```java
threadLocal.remove();
```

## 泛型类型ThreadLocal

可以使用泛型类型创建ThreadLocal。使用泛型类型时，只能将泛型类型的对象设置为ThreadLocal上的值。此外，不必对get（）返回的值进行类型转换。下面是一个泛型ThreadLocal示例：

```java
private ThreadLocal<String> myThreadLocal = new ThreadLocal<String>();
```

现在只能在ThreadLocal实例中存储字符串。此外，不需要对从ThreadLocal获得的值进行类型转换：

```java
myThreadLocal.set("Hello ThreadLocal");
String threadLocalValue = myThreadLocal.get();
```

## 初始化ThreadLocal值

在调用set（）赋值之前，可以为Java ThreadLocal设置一个初始值，该值将在第一次调用get（）时使用。指定ThreadLocal的初始值有两种方式：

- 创建一个ThreadLocal子类来重写initialValue（）方法。
- 使用Supplier接口的实现来创建ThreadLocal。

一下章节将演示这两种方式。

### 重写initialValue（）

为Java ThreadLocal变量指定初始值的第一种方法是创建ThreadLocal的子类，该子类重写其initialValue（）方法。创建ThreadLocal的子类的最简单方法就是创建一个匿名子类，就在这里创建ThreadLocal变量。下面是创建ThreadLocal的匿名子类的示例，该子类重写initialValue（）方法：

```java
private ThreadLocal myThreadLocal = new ThreadLocal<String>() {
    @Override protected String initialValue() {
        return String.valueOf(System.currentTimeMillis());
    }
};
```

注意，不同的线程仍然会看到不同的初始值。每个线程都将创建自己的初始值。只有从initialValue（）方法返回完全相同的对象，所有线程才会看到相同的对象。但是，使用ThreadLocal的首要目的是为了避免不同的线程看到相同的实例。

### 实现一个Supplier接口

为Java ThreadLocal变量指定初始值的第二种方法是使用其静态factory方法withInitial(Supplier)，传递Supplier接口的实现作为参数。Supplier接口的实现提供了ThreadLocal的初始值。下面是一个使用其withInitial（）静态工厂方法创建ThreadLocal的示例，传递了一个简单的Supplier实现作为参数：

```java
ThreadLocal<String> threadLocal = ThreadLocal.withInitial(new Supplier<String>() {
    @Override
    public String get() {
        return String.valueOf(System.currentTimeMillis());
    }
});
```

由于Supplier是一个功能接口，因此它可以使用Java Lambda表达式实现。下面是将Supplier实现作为lambda表达式提供给withInitial（）：

```java
ThreadLocal threadLocal = ThreadLocal.withInitial(
        () -> {
      return String.valueOf(System.currentTimeMillis()); } );
```

如你所见，这比前面的示例略短。但是，如果使用lambda表达式最密集的语法，语句还可以更短：

```java
ThreadLocal threadLocal3 = ThreadLocal.withInitial(
        () -> String.valueOf(System.currentTimeMillis()) );
```

## ThreadLocal值的延后设置

在某些情况下，不能使用标准方法设置初始值。例如，你可能需要一些在创建ThreadLocal变量时不可用的配置信息。在这种情况下，可以延后设置初始值。下面是如何在Java ThreadLocal上延后设置初始值的示例：

```java
public class MyDateFormatter {
    private ThreadLocal<SimpleDateFormat> simpleDateFormatThreadLocal = new ThreadLocal<>();
    public String format(Date date) {
        SimpleDateFormat simpleDateFormat = getThreadLocalSimpleDateFormat();
        return simpleDateFormat.format(date);
    }
    private SimpleDateFormat getThreadLocalSimpleDateFormat() {
        SimpleDateFormat simpleDateFormat = simpleDateFormatThreadLocal.get();
        if(simpleDateFormat == null) {
            simpleDateFormat = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
            simpleDateFormatThreadLocal.set(simpleDateFormat);
        }
        return simpleDateFormat;
    }
}
```

注意format（）方法调用getThreadLocalSimpleDateFormat（）方法来获取Java SimpleDatFormat实例。如果尚未在ThreadLocal中设置simpledataformat实例，则会创建一个新的simpledataformat设给ThreadLocal变量。一旦一个线程在ThreadLocal变量中设置了自己的SimpleDateFormat，该线程将使用同一个SimpleDateFormat对象。但只限于该线程。每个线程都创建自己的SimpleDateFormat实例，因为它们看不到在ThreadLocal变量上设置的其他实例。

SimpleDateFormat类不是线程安全的，因此多个线程不能同时使用它。为了解决这个问题，上面的MyDateFormatter类为每个线程创建一个SimpleDateFormat，因此调用format（）方法的每个线程都将使用自己的SimpleDateFormat实例。

## ThreadLocal与线程池或ExecutorService一起使用

如果计划在任务内部使用Java ThreadLocal，并将任务传递给Java线程池或Java ExecutorService，请记住，你无法确定哪个线程执行任务。但是，如果只需要确保每个线程使用其自己的某个对象实例，则不会有问题。所以可以将Java ThreadLocal与线程池或ExecutorService配合使用。

## 完整的ThreadLocal示例

下面是一个完全可运行的Java ThreadLocal示例：

```java
public class ThreadLocalExample {
    public static void main(String[] args) {
        MyRunnable sharedRunnableInstance = new MyRunnable();
        Thread thread1 = new Thread(sharedRunnableInstance);
        Thread thread2 = new Thread(sharedRunnableInstance);
        thread1.start();
        thread2.start();
        thread1.join(); //wait for thread 1 to terminate
        thread2.join(); //wait for thread 2 to terminate
    }
}
```

```java
public class MyRunnable implements Runnable {
    private ThreadLocal<Integer> threadLocal = new ThreadLocal<Integer>();
    @Override
    public void run() {
        threadLocal.set( (int) (Math.random() * 100D) );
        try {
            Thread.sleep(2000);
        } catch (InterruptedException e) {
        }
        System.out.println(threadLocal.get());
    }
}
```

这个例子创建了一个MyRunnable实例，并传递给两个不同的线程。两个线程都执行run（）方法，因此在ThreadLocal实例上设置不同的值。如果set（）调用是同步的，并且不是ThreadLocal对象，则第二个线程将重写第一个线程设置的值。

但是，由于它是一个ThreadLocal对象，因此两个线程无法看到彼此的值。因此，它们设置和读取的是不同的值。

## InheritableThreadLocal

InheritableThreadLocal类是ThreadLocal的子类。InheritableThreadLocal将对值的访问权授予线程和该线程创建的所有子线程，而不是每个线程在ThreadLocal中都有自己的值。
