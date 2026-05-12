# 12、Java并发编程：Java同步块（synchronized关键字，四种同步块，数据可见性，指令重排，性能开销，可重入性）
- 来源：https://ddkk.com/zhuanlan/java/concurrency/5/12.html
- 分类：Java并发
- 分组：教程目录
从我4月初开始翻译这部教程到现在，已经有1个半月的时间了。已翻译的内容大约有三分之一以上。由于在翻译过程中，每个段落平均要读五遍，因而耗费了不少时间。而我又是个崇尚劳逸结合的懒人，只能抽出有限的空余时间。所以按照这个进度，完成这个教程应该还要两三个月。还请对该教程感兴趣的朋友保持耐心~

另外，如果认真阅读的你发现了错误，请告诉我以便及时纠正。我们何不众筹一部教程？

——GentlemanTsao，2020-5-17

Java同步块将方法或代码块标记为synchronized。Java中的同步块一次只能在一个线程中执行（取决于你如何使用它）。因此，可以使用Java同步块来避免竞态条件。本Java synchronized教程将更详细地解释Java synchronized关键字是如何工作的。

## Java并发工具包

synchronized机制是Java的第一个同步机制，用于访问多个线程共享的对象。不过，synchronized机制并不怎么先进。这就是为什么Java5有一整套并发工具类，来帮助开发人员实现比使用synchronized更细粒度的并发控制。

## Java synchronized关键字

Java中的同步块用Synchronized关键字标记。Java中的同步块是在某个对象上同步的。同一时刻，在同一对象上同步的所有同步块只能有一个线程在其中执行。所有其他线程将被阻止进入同步块，直到同步块中的线程退出。

synchronized关键字可用于标记四种不同类型的块：

实例方法

静态方法

实例方法中的代码块

静态方法中的代码块

这些块在不同的对象上同步。用哪种类型的同步块要看具体情况。下面将更详细地解释每一个同步块。

## 同步实例方法

下面是一个同步实例方法：

```java
public class MyCounter {
  private int count = 0;
  public synchronized void add(int value){
      this.count += value;
  }
}
```

注意add（）方法声明中synchronized关键字的使用。这告诉Java该方法是同步的。

Java中的同步实例方法在拥有该方法的实例（对象）上同步。因此，每个实例都在不同的对象（所属实例）上同步其同步方法。

在同步实例方法中，每个实例只能执行一个线程。如果存在多个实例，则在每个实例的同步实例方法内，一次可以执行一个线程。每个实例一个线程。

对于同一对象（实例）的所有同步实例方法都是如此。因此，在下面的示例中，只有一个线程可以在两个同步方法中的任何一个方法内执行。每个实例就一个线程：

```java
public class MyCounter {
  private int count = 0;
  public synchronized void add(int value){
      this.count += value;
  }
  public synchronized void subtract(int value){
      this.count -= value;
  }
}
```

## 同步静态方法

把静态方法标记为同步的就像实例方法使用synchronized关键字一样。下面是一个Java同步静态方法示例：

```java
public static MyStaticCounter{
  private static int count = 0;
  public static synchronized void add(int value){
      count += value;
  }
}
```

同样的，这里synchronized关键字告诉Java， add（）方法是同步的。

同步静态方法在它所属类的类对象上同步。由于每个类在Java VM中只存在一个类对象，因此在同一个类中的静态同步方法中只能执行一个线程。

如果一个类包含多个静态同步方法，那么在这些方法中，同一时间只有一个线程可以执行。看看这个静态同步方法示例：

```java
public static MyStaticCounter{
  private static int count = 0;
  public static synchronized void add(int value){
    count += value;
  }
  public static synchronized void subtract(int value){
    count -= value;
  }
}
```

在任何给定时间，只有一个线程可以在add（）或subtract（）其中任何一个方法内执行。如果线程A正在执行add（），则在线程A退出add（）之前，线程B不能执行add（）或subtract（）。

如果静态同步方法位于不同的类中，则可以在每个类的静态同步方法中执行一个线程。每个类一个线程，不管它调用哪个静态同步方法。

## 实例方法中的同步块

你不必同步整个方法，有时最好只同步方法的一部分。这可以用方法中的Java同步块。

下面是未同步的Java方法中的代码同步块：

```java
  public void add(int value){
    synchronized(this){
       this.count += value;   
    }
  }
```

本例使用Java同步块构造将代码块标记为synchronized。这段代码现在将像同步方法一样执行。

注意Java同步块构造在括号中接受了一个对象。在示例中使用“this”，这是add方法的实例。同步构造在括号中获取的对象称为监视（monitor）对象。这段代码称为在监视对象上同步。同步实例方法将其所属的对象用作监视对象。

在同一个监视器对象上同步的java代码块内，只有一个线程可以执行。

以下两个示例都是在调用它们的实例上同步的。因此，它们在同步效果上是等价的：

```java
  public class MyClass {
    public synchronized void log1(String msg1, String msg2){
       log.writeln(msg1);
       log.writeln(msg2);
    }
    public void log2(String msg1, String msg2){
       synchronized(this){
          log.writeln(msg1);
          log.writeln(msg2);
       }
    }
  }
```

同一时刻，只有一个线程可以在这两个方法其中一个内执行。

如果第二个同步块被同步到别的对象而不是MyClass.class上，则可以在每个方法内同时执行一个线程。

## 静态方法中的同步块

同步块也可以在静态方法内部使用。下面是上一节中与静态方法相同的两个示例。这些方法在方法所属类的类对象上同步：

```java
  public class MyClass {
    public static synchronized void log1(String msg1, String msg2){
       log.writeln(msg1);
       log.writeln(msg2);
    }
    public static void log2(String msg1, String msg2){
       synchronized(MyClass.class){
          log.writeln(msg1);
          log.writeln(msg2);  
       }
    }
  }
```

因此，在本例中，只有一个线程可以在两个同步块中的其中一个内执行。

如果第二个同步块被同步到与此不同的对象上，则在同一时间一个线程可以在两个方法中执行。

## 同步块的Lambda表达式

你甚至可以在Java Lambda表达式和匿名类中使用同步块。

下面是一个Java lambda表达式的示例，其中包含一个同步块。请注意，同步块是在包含lambda表达式的类的类对象上同步的。它也可以在另一个对象上同步，如果这更有意义的话（如果给一个特定的用例），但是在这个例子中使用类对象是可以的。

```java
import java.util.function.Consumer;
public class SynchronizedExample {
  public static void main(String[] args) {
    Consumer<String> func = (String param) -> {
      synchronized(SynchronizedExample.class) {
        System.out.println(
            Thread.currentThread().getName() +
                    " step 1: " + param);
        try {
          Thread.sleep( (long) (Math.random() * 1000));
        } catch (InterruptedException e) {
          e.printStackTrace();
        }
        System.out.println(
            Thread.currentThread().getName() +
                    " step 2: " + param);
      }
    };
    Thread thread1 = new Thread(() -> {
        func.accept("Parameter");
    }, "Thread 1");
    Thread thread2 = new Thread(() -> {
        func.accept("Parameter");
    }, "Thread 2");
    thread1.start();
    thread2.start();
  }
}
```

## Java同步示例

下面是一个例子，它启动两个线程，让它们在同一个Counter实例上调用add方法。在同一个实例上，一次只能有一个线程调用add方法，因为该方法在它所属的实例上是同步的。

```java
  public class Example {
    public static void main(String[] args){
      Counter counter = new Counter();
      Thread  threadA = new CounterThread(counter);
      Thread  threadB = new CounterThread(counter);
      threadA.start();
      threadB.start();
    }
  }
```

下面是上例中使用的两个类：Counter和CounterThread。

```java
  public class Counter{
     long count = 0;
     public synchronized void add(long value){
       this.count += value;
     }
  }
```

```java
  public class CounterThread extends Thread{
     protected Counter counter = null;
     public CounterThread(Counter counter){
        this.counter = counter;
     }
     public void run() {
	for(int i=0; i<10; i++){
           counter.add(i);
        }
     }
  }
```

这个例子创建了两个线程，并将同一个计数器实例传递给它们的构造函数。Counter.add（）方法在实例上是同步的，因为add方法是实例方法，并且标记为synchronized。因此，同一时间只能有一个线程调用add（）方法。另一个线程将等待，直到第一个线程离开add（）方法，然后才能执行该方法。

如果这两个线程引用了两个单独的计数器实例，那么同时调用add（）方法就不会有问题。这些调用在不同对象上，因此被调用的方法也会在不同的对象（拥有该方法的对象）上同步。因此，调用不会阻塞。像下面这样：

```java
public class Example {
  public static void main(String[] args){
    Counter counterA = new Counter();
    Counter counterB = new Counter();
    Thread  threadA = new CounterThread(counterA);
    Thread  threadB = new CounterThread(counterB);
    threadA.start();
    threadB.start();
  }
}
```

注意两个线程threadA和threadB不再引用同一个counter实例。counterA和counterB的add方法在其所属的两个实例上同步。因此，对counterA调用add（）不会阻止对counterB调用add（）。

## 同步和数据可见性

如果不使用synchronized关键字（或Java volatile关键字），则无法保证当一个线程更改与其他线程共享的变量值（例如，通过所有线程都有权访问的对象）时，其他线程可以看到更改后的值。既无法保证一个线程保存在CPU寄存器中的变量何时“提交”到主内存；也无法保证其他线程何时从主内存“刷新”保存在CPU寄存器中的变量。

有synchronized关键字就不一样了。当线程进入同步块时，它将刷新线程所有可见变量的值。当线程退出同步块时，线程可见变量的所有更改都将提交到主内存。这与volatile关键字的工作原理类似。

## 同步和指令重新排序

Java编译器和Java虚拟机可以对代码中的指令重新排序，以使它们执行得更快，通常是使重新排序的指令能够由CPU并行执行。

指令重新排序可能会导致多个线程同时执行的代码出现问题。例如，如果发生在同步块内部的变量的写入被重新排序为发生在同步块外部。

为了解决这个问题，Java synchronized关键字对同步块之前、内部和之后的指令重新排序设置了一些限制。这类似于volatile关键字设置的限制。

最终目标是，你可以确保代码工作正常——没有发生任何指令重新排序，导致代码的最终行为不同于代码的预期行为。

## 在哪个对象上同步

正如本Java同步教程中多次提到的，同步块必须在某个对象上同步。实际上，你可以选择任何对象来同步，但建议不要用字符串对象或任何基本类型包装器对象进行同步，因为编译器可能会对这些对象进行优化，从而导致你以为用的是不同实例，而实际上用的是同一个实例。看看这个例子：

```java
synchronized("Hey") {
   //do something in here.
}
```

如果有多个synchronized块在文本字符串值“Hey”上同步，那么编译器实际上可能在幕后使用相同的字符串对象。结果是，这两个同步块随后在同一对象上同步。这可能不是你想要的行为。

对于使用基本类型包装器对象也是如此。看看这个例子：

```java
synchronized(Integer.valueOf(1)) {
   //do something in here.
}
```

如果你调用Integer.valueOf(1)） 多次，它可能会根据相同的输入参数值返回相同的包装器对象实例。也就是说，如果在同一个基本包装器对象上同步多个块(例如.多次使用Integer.valueOf(1) 作为监视对象），则有可能使这些同步块都在同一对象上同步。这也可能不是你想要的行为。

为了安全起见，请在this或new Object() 上进行同步。Java编译器、Java虚拟机或Java库不会在内部缓存或重复使用它们。

## 同步块的局限和替代方案

Java中的同步块有几个局限。例如，Java中的同步块一次只允许一个线程进入。但是，如果两个线程只想读取一个共享值，而不更新它呢？这可能是安全的。作为同步块的替代，你可以使用读/写锁来保护代码，这是比同步块更高级的锁定语义。Java实际上附带了一个内置的ReadWriteLock类，你可以使用它。

如果你想让N个线程进入一个同步块，而不仅仅是一个呢？你可以使用信号量来实现这种行为。Java实际上附带了一个可以使用的内置Java信号量类。

同步块不保证线程按照等待进入的顺序访问同步块。如果您需要保证线程按照它们请求访问同步块的确切顺序访问该块，该怎么办？你需要自己实现公平性。

如果只有一个线程写共享变量，而其他线程只读取该变量，会怎么样？你只需使用volatile变量就可以了，而不需要进行任何同步。

## 同步块性能开销

在Java中，进入和退出同步块相关的性能开销很小。随着java的发展，这种性能开销已经下降，但仍要付出一点小代价。

如果在一个紧密的循环中多次进入和退出同步块，那么进入和退出同步块的性能开销就是最需要担心的。

另外，尽量不要让同步块过大。换句话说，只同步真正需要同步的操作，以避免阻止其他线程执行不需要同步的操作。同步块中只包含绝对必要的指令。这会增加代码的并行性。

## 同步块可重入性

一旦一个线程进入一个同步块，线程就被称为“保持锁定”在该块所同步的监视对象上。如果线程调用了另一个方法，该方法调用了第一个内部有同步块的方法，则持有锁的线程可以重新进入同步块。之所以不会阻塞是因为线程（本身）持有锁。只有当一个不同的线程持有锁（才会阻塞）。看看这个例子：

```java
public class MyClass {
  List<String> elements = new ArrayList<String>();
  public void count() {
    if(elements.size() == 0) {
        return 0;
    }
    synchronized(this) {
       elements.remove();
       return 1 + count();  
    }
  }
}
```

暂且不管上面这种计算列表元素的方法，该方法毫无意义。只需关注count（）方法内的synchronized块内如何递归调用count（）方法。因此，调用count（）的线程可能最终多次进入同一个同步块。这是允许的，也是可能的。

不过，请记住，如果你不仔细的设计代码，线程进入多个同步块的设计可能会导致嵌套管程锁死（nested monitor lockout）。

## 集群设置中的同步块

请记住，同步块只阻止同一个Java虚拟机中的线程进入该代码块。如果同一个Java应用程序在集群中的多个Java虚拟机上运行，那么同一时刻，每个Java虚拟机可能有一个线程进入同步块。

如果需要在集群中的所有Java虚拟机之间进行同步，则需要使用其他同步机制，而不仅仅是同步块。
