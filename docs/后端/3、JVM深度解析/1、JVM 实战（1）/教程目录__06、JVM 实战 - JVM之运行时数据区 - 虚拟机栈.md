# 06、JVM 实战 - JVM之运行时数据区 - 虚拟机栈
- 来源：https://ddkk.com/zhuanlan/java/jvm/1/6.html
- 分类：JVM 实战
- 分组：教程目录
虚拟机栈是线程执行Java程序时，处理Java方法中内容的内存区域。虚拟机栈也是线程私有的区域，每个Java方法被调用的时候，都会在虚拟机栈中创建出一个栈帧。如图，栈帧又由局部变量表、操作数栈、动态链接和方法返回四部分组成，有些虚拟机的栈帧还包括了一些附加信息。

### 一、虚拟机栈运行原理

如图，线程执行Java方法时，从Java方法1开始依次调用，每调用一个方法，就会有入栈操作，向虚拟机栈中压入一个栈帧，线程当前正在执行的Java方法对应了栈顶栈帧（当前栈帧），当前方法执行完成后，当前方法的执行结果传给下一个栈帧，之后进行出栈操作，丢弃当前栈帧(无论方法有没有产生异常，都会丢弃)，下一个栈帧就会称为新的栈顶栈帧，从之前调用已执行完方法的位置继续执行。虚拟机栈是线程的私有区域，并且栈帧不允许被其他线程访问，所以不存在线程安全问题，栈帧弹出后就内存就会被系统回收，所以不也存在垃圾回收问题。

**栈结构处理Java方法的优势**

1、速度快，栈分配存储的速度仅次于程序计数器。

2、操作简便，线程执行Java方法时，只有入栈和出栈操作，调用时入栈，执行结束时出栈。

3、不存在垃圾回收问题。

### 二、虚拟机栈大小设置

#### 1、设置虚拟栈的参数

虚拟栈的大小可以通过-Xss参数设置，默认单位是byte，也可以使用不区分大小写k,m,g作为单位（如-Xss1m），如下不同系统下的-Xss默认值不同

- Linux： 1024k
- MacOs: 1024k
- Windows: 默认值依赖于虚拟机的内存。

#### 2、虚拟机栈的异常

**java.lang.StackOverflowError异常：**如果采用固定大小的Java虚拟机栈，那每一个线程的Java虚拟机栈容量可以在线程创建的时候独立选定。如果线程请求分配的栈容量超过Java虚拟机栈允许的最大容量，Java虚拟机将会抛出StackOverflowError异常，用下面代码可以验证异常。

```java
/**-
 *
 *  JVM参数: -Xss512k
 **/
public class StackOverflowErrorDemo {
    private static int i = 0; // 方法调用次数
    public static void main(String[] args) {
        method1();
    }
    public static void method1() {
        System.out.println(i++);
        method1();
    }
}
```

**java.lang.OutofMemoryError异常：**

1、如果Java虚拟机栈允许动态扩展，并且在尝试扩展的时候无法申请到足够的内存，就会抛出OutofMemoryError异常。《Java虚拟机规范》中允许虚拟机自行选择是否支持动态扩展，HotSpot虚拟机选择不支持，所以我们使用的openJDK去用-Xss参数设小栈内存或者创建大量的局部变量的方式去测试时，HotSpot虚拟机抛出的始终是StackOverflowError异常。并且栈容量最小值是有限制的，主要取决操作系统的内存分页。像早期的Classic虚拟机支持动态扩展栈内存，就会出现OOM异常。

2、不断创建新的线程，当创建线程时没有足够的内存去创建对应的虚拟机栈，那Java虚拟机将会抛出一个OutofMemoryError异常。原因是操作系统分配给JVM进程的内存是有限的，而这部分内存堆区和方法区占据大部分内存，当方法区和堆区所占内存越大，可供线程用来分配给虚拟机栈的内存就越少，每个线程都有私有的虚拟机栈，不断创建线程，当可用内存耗尽，新的线程无法申请到内存给虚拟机栈，就会出现OutofMemoryError异常。下面的验证代码摘抄自《深入理解Java虚拟机》，对系统压力较大，谨慎执行。

```java
/**
 *
 * VM args: -Xss2M (设置大一些，在32位系统下运行)
 **/
public class JavaVMStackOOM {
    private void dontStop() {
        while (true) {
        }
    }
    private void stackLeakByThread() {
        while (true) {
            Thread thread = new Thread(new Runnable() {
                @Override
                public void run() {
                    dontStop();
                }
            });
            thread.start();
        }
    }
    public static void main(String[] args) {
        JavaVMStackOOM oom = new JavaVMStackOOM();
        oom.stackLeakByThread();
    }
}
```
