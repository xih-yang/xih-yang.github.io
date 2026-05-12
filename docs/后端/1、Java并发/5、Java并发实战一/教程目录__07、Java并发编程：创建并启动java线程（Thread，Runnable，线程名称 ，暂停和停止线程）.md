# 07、Java并发编程：创建并启动java线程（Thread，Runnable，线程名称 ，暂停和停止线程）
- 来源：https://ddkk.com/zhuanlan/java/concurrency/5/7.html
- 分类：Java并发
- 分组：教程目录
Java线程就像一个虚拟CPU，可以在Java应用程序中执行Java代码。当Java应用程序启动时，它的main（）方法由主线程执行，主线程是Java虚拟机为运行应用程序而创建的一个特殊线程。你可在应用程序内部创建和启动更多的线程，这些线程可以与主线程并行执行应用程序的部分代码。

和其他Java对象一样，Java线程也是对象。线程是java.lang.Thread类的实例，或者是该类的子类的实例。除了作为对象之外，java线程还可以执行代码。在本Java线程教程中，我将讲解如何创建和启动线程。

## 创建和启动线程

在Java中创建线程的过程如下：

```java
  Thread thread = new Thread();
```

要启动Java线程，需要调用其start（）方法，如下所示：

```java
  thread.start();
```

这个例子没有指定线程要执行的代码。因此，线程启动后会立即停止。

有两种方法可以指定线程应该执行的代码。第一种方法是创建线程的子类并重写run（）方法。第二种方法是实现Runnable（java.lang.Runnable）的对象，并将该对象传递给线程构造函数。下面将介绍这两种方法。

## Thread子类

指定线程该运行什么代码的第一种方法，是创建Thread的子类并重写run（）方法。run（）方法是线程在调用start（）之后执行的操作。下面是创建Java Thread子类的示例：

```java
  public class MyThread extends Thread {
    public void run(){
       System.out.println("MyThread running");
    }
  }
```

要创建和启动上述线程，可以执行以下操作：

```java
  MyThread myThread = new MyThread();
  myTread.start();
```

一旦线程启动，start（）调用就返回了，它不会等到run（）方法完成。run（）方法就像是在另一个CPU中执行一样。当run（）方法执行时，它将输出文本“MyThread running”。

你还可以创建Thread的一个匿名子类，如下所示：

```java
  Thread thread = new Thread(){
    public void run(){
      System.out.println("Thread Running");
    }
  }
  thread.start();
```

这个例子将在新线程执行run（）方法，并输出文本“Thread running”。

## 实现Runnable接口

指定线程该运行什么代码的第二种方法，是创建一个实现java.lang.Runnable接口的类。实现Runnable接口的Java对象可以由Java Thread执行。本教程之后会演示这种实现方法。

Runnable接口是Java平台附带的标准Java接口。Runnable接口只有一个run（）方法。以下是Runnable接口的基本代码：

```java
public interface Runnable() {
    public void run();
}
```

无论线程在执行时应该做什么，都必须包含在run（）方法的实现中。有三种方法可以实现Runnable接口：

**1、** 创建一个实现Runnable接口的Java类；

**2、** 创建一个实现Runnable接口的匿名类；

**3、** 创建一个实现Runnable接口的JavaLambda；

这三个选项将在下面的章节中进行说明。

### Java类实现Runnable

实现Java Runnable接口的第一种方法是创建自己的Java类来实现Runnable接口。下面是实现Runnable接口的自定义Java类的示例：

```java
  public class MyRunnable implements Runnable {
    public void run(){
       System.out.println("MyRunnable running");
    }
  }
```

这个Runnable的实现所做的是打印出文本“MyRunnable running”。打印该文本后，run（）方法退出，运行run（）方法的线程也将停止。

### Runnable的匿名实现

你还可以创建Runnable的匿名实现。下面是实现Runnable接口的匿名Java类的示例：

```java
Runnable myRunnable =
    new Runnable(){
        public void run(){
            System.out.println("Runnable running");
        }
    }
```

除了是一个匿名类之外，这个示例与使用自定义类实现Runnable接口的示例非常相似。

### Runnable的Java Lambda实现

实现Runnable接口的第三种方法是创建Runnable接口的Java Lambda实现。之所以能这么做是因为Runnable接口只有一个未实现的方法，因此它实际上（尽管可能并非特意）是一个功能性Java接口。

下面是实现Runnable接口的Java lambda表达式的示例：

```java
Runnable runnable =
        () -> {
      System.out.println("Lambda Runnable running"); };
```

### 使用Runnable启动线程

要让run（）方法由线程执行，可以实现Runnable接口的类、匿名类或lambda表达式，并将它们的实例传递给Thread的构造函数。下面是具体做法：

```java
Runnable runnable = new MyRunnable(); // 或者是匿名类，Lambda...
Thread thread = new Thread(runnable);
thread.start();
```

当线程启动时，它将调用MyRunnable实例的run（）方法，而不是执行它自己的run（）方法。上面的例子会输出文本“MyRunnable running”。

## 用Thread子类还是用Runnable？

没人规定这两种方法中哪一种最好。两种方法都有效。不过，就我个人而言，我更喜欢实现一个Runnable，并将该实现的实例传给Thread实例。当线程池执行Runnable时，很容易将Runnable实例排队，直到池中的线程空闲。这对于Thread子类来说有点困难。

有时你可能既需要实现Runnable又需要实现Thread子类。例如，假如要创建可以执行多个Runnable的Thread子类。在实现线程池时通常会出现这种情况。

## 常见陷阱：调用run（）而不是start（）

创建和启动线程时，常见的错误是调用线程的run（）方法而不是start（），如下所示：

```java
  Thread newThread = new Thread(MyRunnable());
  newThread.run();  //应该是start();
```

起初，你可能不会察觉到有什么不对，因为Runnable的run（）方法执行的跟你预想的一样。但是，它不是由你刚刚创建的新线程执行的。相反，run（）方法由创建线程的线程执行，也就是执行上述两行代码的线程。要让新创建的线程newThread调用MyRunnable实例的run（）方法，必须调用newThread.start（）方法。

## 线程名称

当你创建一个Java线程时，你可以给它起个名字，用来帮助你区分不同的线程。例如，如果多个线程写入System.out，则可以方便地查看是哪个线程写入了文本。下面是一个例子：

```java
   Thread thread = new Thread("New Thread") {
      public void run(){
        System.out.println("run by: " + getName());
      }
   };
   thread.start();
   System.out.println(thread.getName());
```

注意字符串“New Thread”作为参数传递给Thread构造函数。此字符串是线程的名称。该名称可以通过线程的getName（）方法获得。用Runnable实现时，也可以将名称传递给线程。像这样：

```java
   MyRunnable runnable = new MyRunnable();
   Thread thread = new Thread(runnable, "New Thread");
   thread.start();
   System.out.println(thread.getName());
```

但是请注意，由于MyRunnable类不是线程的子类，因此它不能访问执行它的线程的getName（）方法。

## Thread.currentThread（）

Thread.currentThread（）方法返回一个引用，该引用指向在执行currentThread（）的线程实例。这样你就可以访问在执行特定代码块的Java线程对象。下面是使用Thread.currentThread（）的示例：

```java
Thread thread = Thread.currentThread();
```

一旦有了对线程对象的引用，就可以对其调用方法。例如，可以获取当前执行代码的线程的名称，如下所示：

```java
   String threadName = Thread.currentThread().getName();
```

## Java线程示例

这里有一个小例子。首先，它打印出执行main（）方法的线程的名称。该线程由JVM分配。然后启动10个线程，并给它们一个数字作为名称("" + i)。之后每个线程都会打印出其名称，然后停止执行。

```java
public class ThreadExample {
  public static void main(String[] args){
    System.out.println(Thread.currentThread().getName());
    for(int i=0; i<10; i++){
      new Thread("" + i){
        public void run(){
          System.out.println("Thread: " + getName() + " running");
        }
      }.start();
    }
  }
}
```

要注意的是，即使线程是按顺序（1、2、3等）启动的，它们也未必依次执行，也就是线程1未必是第一个将其名称写入System.out的线程。这是因为线程原则上是并行执行的，而不是顺序执行的。JVM和操作系统分别或共同决定线程的执行顺序。此顺序不必与它们启动时的顺序相同。

## 暂停线程

线程可以通过调用静态方法thread.sleep（）暂停自身。sleep（）以毫秒为参数。sleep（）方法将尝试休眠指定毫秒后恢复执行。Thread的sleep（）虽不是100%精确，但已经很好了。下面的示例通过调用Thread的sleep（）方法暂停Java线程3秒（3.000 millliseconds）：

**（译者注：原文错误，实际应是暂停10秒，即10，000毫秒）**

```java
try {
    Thread.sleep(10L * 1000L);
} catch (InterruptedException e) {
    e.printStackTrace();
}
```

执行上述Java代码的线程将休眠大约10秒（10.000毫秒）。

## 停止线程

想要停止Java线程，需要在线程的实现代码中做些准备工作。Java Thread类包含stop（）方法，但已弃用。原始的stop（）方法无法保证线程被停止后会处于何种状态。也就是说，线程在执行期间访问的所有Java对象都将处于未知状态。如果应用程序中的其他线程也访问了同样的对象，则应用程序可能会出现意料之外和不可预知的错误。

不要调用stop（）方法，你必须自己实现停止线程的代码。下面是一个实现Runnable的类的示例，该类包含一个额外方法doStop（），用于向Runnable发出停止的信号。Runnable将检查此信号，并在准备好时停止。

```java
public class MyRunnable implements Runnable {
    private boolean doStop = false;
    public synchronized void doStop() {
        this.doStop = true;
    }
    private synchronized boolean keepRunning() {
        return this.doStop == false;
    }
    @Override
    public void run() {
        while(keepRunning()) {
            // 持续做线程该做的工作
            System.out.println("Running");
            try {
                Thread.sleep(3L * 1000L);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        }
    }
}
```

注意doStop（）和keepRunning（）方法。doStop（）是用于给别的线程调用的，而不是由执行MyRunnable的run（）方法的线程调用。keepRunning（）方法由执行MyRunnable的run（）方法的线程在内部调用。只要没有调用doStop（），keep running（）方法就会返回true，这意味着执行run（）方法的线程将继续运行。

下面的示例启动了一个Java线程，该线程执行上述MyRunnable类的实例，并在延迟后停止线程：

```java
public class MyRunnableMain {
    public static void main(String[] args) {
        MyRunnable myRunnable = new MyRunnable();
        Thread thread = new Thread(myRunnable);
        thread.start();
        try {
            Thread.sleep(10L * 1000L);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        myRunnable.doStop();
    }
}
```

本例首先创建一个MyRunnable实例，然后将该实例传递给一个线程并启动该线程。之后执行main（）方法的线程（也就是主线程）休眠10秒，然后调用MyRunnable实例的doStop（）方法。这会让执行MyRunnable方法的线程停止，因为调用doStop（）后，keepRunning（）将返回true。

请记住，如果你的Runnable要实现的不仅仅是run（）方法（例如，还有stop（）或pause（）方法），那么你就不能再使用Java lambda表达式创建你的Runnable实现。Java lambda只能实现一个方法。相应的，你必须使用自定义类，或自定义一个继承Runnable的接口，该接口需要有额外的方法，并且由匿名类实现。
