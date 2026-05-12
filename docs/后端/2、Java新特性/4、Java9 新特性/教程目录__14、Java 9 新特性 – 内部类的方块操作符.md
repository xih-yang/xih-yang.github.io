# 14、Java 9 新特性 – 内部类的方块操作符
- 来源：https://ddkk.com/zhuanlan/java/java9/14.html
- 分类：Java新特性
- 分组：教程目录
方块操作符 ( `<>` ) 在 Java 7 中就引入了，目的是为了使代码更可读。

但是呢，这个操作符一直不能在匿名内部类中使用

Java 9 修正了这个问题，就是可以在匿名内部类中使用方块操作符了，在匿名类大行其道的今天，这才叫优化了阅读体验…

我们来看看一段 Java 9 之前的代码

#### DiamondOperatorTester.java

```java
public class DiamondOperatorTester {
   public static void main(String[] args) {
      Handler<Integer> intHandler = new Handler<Integer>(1) {
         @Override
         public void handle() {
            System.out.println(content);
         }
      };
      intHandler.handle();
      Handler<? extends Number> intHandler1 = new Handler<Number>(2) {
         @Override
         public void handle() {
            System.out.println(content);
         }
      };
      intHandler1.handle();
      Handler<?> handler = new Handler<Object>("test") {
         @Override
         public void handle() {
            System.out.println(content);
         }
      };
      handler.handle();    
   }  
}
abstract class Handler<T> {
   public T content;
   public Handler(T content) {
      this.content = content; 
   }
   abstract void handle();
}
```

运行结果如下

```java
[penglei@ddkk.com java9]$ javac DiamondOperatorTester.java && java DiamondOperatorTester
1
2
test
```

不知道你是否看出来了，对于下面这两条语句

```java
Handler<? extends Number> intHandler1 = new Handler<Number>(2)
Handler<?> handler = new Handler<Object>("test")
```

后面的匿名类中的那个 `` 和 Handler`` 中的尖括号的类型是可以推导出来的。

因为Java 是强类型语言，所以，对于匿名内部类来说，赋值的变量类型其实就是内部类的变量类型

如果使用了推导，就可以改成下面这样

```java
Handler<? extends Number> intHandler1 = new Handler<>(2)
Handler<?> handler = new Handler<>("test")
```

可读性是不是增强了，这样大家一眼就看出了匿名类的类型是它们赋值变量的类型

Java 9 也是这么做的，方块操作符 `<>` 的作用就是这个

因此，我们在 Java 9 以上的版本中，可以将范例改成下面这种方式

```java
public class DiamondOperatorTester {
   public static void main(String[] args) {
      Handler<Integer> intHandler = new Handler<>(1) {
         @Override
         public void handle() {
            System.out.println(content);
         }
      };
      intHandler.handle();
      Handler<? extends Number> intHandler1 = new Handler<>(2) {
         @Override
         public void handle() {
            System.out.println(content);
         }
      };
      intHandler1.handle();
      Handler<?> handler = new Handler<>("test") {
         @Override
         public void handle() {
            System.out.println(content);
         }
      };
      handler.handle();    
   }  
}
abstract class Handler<T> {
   public T content;
   public Handler(T content) {
      this.content = content; 
   }
   abstract void handle();
}
```

运行结果也是一样的

```java
[penglei@ddkk.com java9]$ javac DiamondOperatorTester.java && java DiamondOperatorTester
1
2
test
```
