# 12、Lombok 实战教程 - @Synchronized | 如何优雅的添加Synchronized锁
- 来源：https://ddkk.com/zhuanlan/tools/lombok/1/12.html
- 分类：开发工具
- 分组：教程目录
## 一、简介

`@Synchronized`是`synchronized`方法修饰语的一个更安全的变体。和`synchronized`一样，该注解只能用于静态和实例方法。它的操作与`synchronized`关键字类似，但它锁定的对象不同。关键字锁定了这个对象，但注解锁定了一个名为`$lock`的字段，它是私有的。

如果你愿意，你可以自己创建这些锁。如果你已经自己创建了`$lock`和`$LOCK`字段，当然就不会再生成它们。你也可以选择锁定另一个字段，通过指定它作为`@Synchronized`注释的参数。在这种用法的变体中，字段不会被自动创建，你必须自己明确地创建它们，否则会发出一个错误。

锁定此对象或您自己的类对象可能会产生不幸的副作用，因为您无法控制的其他代码也会锁定这些对象，这可能会导致竞争条件和其他与线程相关的严重错误。

## 二、示例比较

### 1. Lombok 写法

```java
import lombok.Synchronized;
public class SynchronizedExample {
  private final Object readLock = new Object();
  @Synchronized
  public static void hello() {
    System.out.println("world");
  }
  @Synchronized
  public int answerToLife() {
    return 42;
  }
  @Synchronized("readLock")
  public void foo() {
    System.out.println("bar");
  }
}
```

### 2. Java 标准写法

```java
public class SynchronizedExample {
  private static final Object $LOCK = new Object[0];
  private final Object $lock = new Object[0];
  private final Object readLock = new Object();
  public static void hello() {
    synchronized($LOCK) {
      System.out.println("world");
    }
  }
  public int answerToLife() {
    synchronized($lock) {
      return 42;
    }
  }
  public void foo() {
    synchronized(readLock) {
      System.out.println("bar");
    }
  }
}
```

## 三、支持的配置项

`lombok.synchronized.flagUsage` = [`warning` | `error`] (默认: `not set`)

`Lombok`会将`@Synchronized`的任何用法标记为警告或错误（如果已配置）。

## 四、附属说明

如果`$lock`或`$LOCK`是自动生成的，那么字段会用一个空的`Object[]`数组来初始化，而不是像大多数显示这种模式的代码段那样，只用一个`new Object()`。`Lombok`这样做是因为一个新的对象不是可序列化的，但`0`大小的数组是可序列化的。因此，使用`@Synchronized`将不会阻止你的对象被序列化。

在你的类中至少有一个`@Synchronized`方法意味着会有一个锁字段，但如果你后来删除了所有这样的方法，将不再有一个锁字段。这意味着你预先确定的`serialVersionUID`会发生变化。如果你打算通过java的序列化机制长期存储你的类，我们建议你总是给你的类添加一个`serialVersionUID`。如果你这样做了，从你的方法中移除所有的`@Synchronized`注解将不会破坏序列化。

为什么被锁定对象选择自己的名字时不会生成自动搜索结果：在字段名中打错字会导致一个非常难以发现的错误！
